import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { failSkin } from "./errors.js";
import {
  parseSkinManifest,
  readSkinManifest,
  serializeSkinManifest,
} from "./manifest.js";
import { listPackageFiles, resolvePackagePath } from "./paths.js";
import type { SkinManifest } from "./types.js";

export const SKIN_MANIFEST_FILENAME = "skin.json";

export function sha256(content: Uint8Array | string): string {
  return createHash("sha256").update(content).digest("hex");
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (typeof value !== "object" || value === null) return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) =>
        Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"))
      )
      .map(([key, item]) => [key, stableValue(item)])
  );
}

export function stableSkinManifestJson(manifest: SkinManifest): string {
  return JSON.stringify(stableValue(manifest));
}

export async function calculateSkinFileHashes(
  directory: string
): Promise<Readonly<Record<string, string>>> {
  const hashes: Record<string, string> = {};
  for (const relativePath of await listPackageFiles(directory)) {
    if (relativePath === SKIN_MANIFEST_FILENAME) continue;
    const content = await readFile(resolvePackagePath(directory, relativePath));
    hashes[relativePath] = sha256(content);
  }
  return hashes;
}

export async function calculateSkinPackageHash(
  directory: string,
  manifest: SkinManifest
): Promise<string> {
  const hash = createHash("sha256");
  const entries = Object.entries(manifest.files).sort(([left], [right]) =>
    Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"))
  );
  for (const [relativePath, fileHash] of entries) {
    const actualHash = sha256(
      await readFile(resolvePackagePath(directory, relativePath))
    );
    if (actualHash !== fileHash) {
      failSkin([`File hash mismatch for ${relativePath}`]);
    }
    hash.update(relativePath, "utf8");
    hash.update(Buffer.from([0]));
    hash.update(fileHash, "utf8");
    hash.update("\n", "utf8");
  }
  hash.update(stableSkinManifestJson(manifest), "utf8");
  return hash.digest("hex");
}

export async function refreshSkinFileHashes(
  directory: string
): Promise<SkinManifest> {
  const manifestPath = resolve(directory, SKIN_MANIFEST_FILENAME);
  const manifest = await readSkinManifest(directory);
  const files = await calculateSkinFileHashes(directory);
  const updated = parseSkinManifest({ ...manifest, files });
  await writeFile(manifestPath, serializeSkinManifest(updated), "utf8");
  return updated;
}
