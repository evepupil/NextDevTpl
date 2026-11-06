import { createReadStream } from "node:fs";
import { mkdir, open } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createGunzip } from "node:zlib";
import { type ExtractEvents, extract, type Header } from "tar-stream";
import { failSkin, SkinValidationError } from "./errors.js";
import type { SkinSourceLimits } from "./limits.js";
import { resolvePackagePath, validatePosixRelativePath } from "./paths.js";

type ArchiveEntryStream = ExtractEvents["entry"][1];

const ROOT_FILES = new Set([
  "DESIGN.md",
  "config.ts",
  "fonts.ts",
  "skin.json",
  "tokens.css",
]);
const ROOT_DIRECTORIES = new Set([
  "assets",
  "demo",
  "layouts",
  "messages",
  "ui",
  "views",
]);

function countExpandedBytes(maximum: number): Transform {
  let bytes = 0;
  return new Transform({
    transform(chunk: Buffer | string, encoding, callback) {
      const size = Buffer.isBuffer(chunk)
        ? chunk.byteLength
        : Buffer.byteLength(chunk, encoding);
      bytes += size;
      if (bytes > maximum) {
        callback(new Error("Skin archive exceeds its expanded-size limit"));
        return;
      }
      callback(null, chunk);
    },
  });
}

function normalizedArchivePath(header: Header): string {
  let name = header.name;
  const rootMarker = name === "." || name === "./";

  if (rootMarker) {
    if (header.type !== "directory" || header.size !== 0) {
      failSkin(["Archive root marker must be an empty directory"]);
    }
    return "";
  }

  if (name.startsWith("./")) name = name.slice(2);
  if (header.type === "directory" && name.endsWith("/")) {
    name = name.slice(0, -1);
  }
  return validatePosixRelativePath(name, "Archive entry path");
}

function registerArchivePath(
  path: string,
  entries: Map<string, string>,
  spellings: Map<string, string>
): void {
  const foldedPath = path.toLowerCase();
  const priorEntry = entries.get(foldedPath);
  if (priorEntry !== undefined) {
    failSkin([
      priorEntry === path
        ? "Archive contains a duplicate path"
        : "Archive contains paths that differ only by case",
    ]);
  }
  entries.set(foldedPath, path);

  const segments = path.split("/");
  let prefix = "";
  for (const segment of segments) {
    prefix = prefix ? `${prefix}/${segment}` : segment;
    const foldedPrefix = prefix.toLowerCase();
    const priorSpelling = spellings.get(foldedPrefix);
    if (priorSpelling !== undefined && priorSpelling !== prefix) {
      failSkin(["Archive contains paths that differ only by case"]);
    }
    spellings.set(foldedPrefix, prefix);
  }
}

function validatePackageLayout(path: string, type: Header["type"]): void {
  const hasParent = path.includes("/");
  const rootName = path.split("/")[0] ?? "";
  if (
    (hasParent && !ROOT_DIRECTORIES.has(rootName)) ||
    (!hasParent &&
      (type === "directory"
        ? !ROOT_DIRECTORIES.has(path)
        : !ROOT_FILES.has(path)))
  ) {
    failSkin(["Package contains a file outside the skin package layout"]);
  }
}

async function consumeEntry(
  header: Header,
  entry: ArchiveEntryStream,
  outputDirectory: string,
  limits: SkinSourceLimits,
  entries: Map<string, string>,
  spellings: Map<string, string>,
  packageManifest: { seen: boolean }
): Promise<void> {
  if (header.type !== "file" && header.type !== "directory") {
    failSkin(["Archive may contain only regular files and directories"]);
  }
  if (!Number.isSafeInteger(header.size) || header.size < 0) {
    failSkin(["Archive entry has an invalid declared size"]);
  }
  if (header.type === "directory" && header.size !== 0) {
    failSkin(["Archive directory entry must be empty"]);
  }
  if (header.type === "file" && header.size > limits.maxFileBytes) {
    failSkin(["Archive file exceeds its size limit"]);
  }

  const path = normalizedArchivePath(header);
  if (path === "") {
    for await (const chunk of entry as AsyncIterable<Uint8Array>) {
      if (chunk.byteLength > 0) {
        failSkin(["Archive root marker must be empty"]);
      }
    }
    return;
  }

  validatePackageLayout(path, header.type);
  registerArchivePath(path, entries, spellings);
  if (entries.size > limits.maxEntries) {
    failSkin(["Archive contains too many entries"]);
  }
  if (path === "skin.json" && header.type === "file") {
    packageManifest.seen = true;
  }

  const destination = resolvePackagePath(outputDirectory, path);
  if (header.type === "directory") {
    await mkdir(destination, { recursive: true, mode: 0o700 });
    for await (const chunk of entry as AsyncIterable<Uint8Array>) {
      if (chunk.byteLength > 0) {
        failSkin(["Archive directory entry must be empty"]);
      }
    }
    return;
  }

  await mkdir(dirname(destination), { recursive: true, mode: 0o700 });
  const handle = await open(destination, "wx", 0o600);
  let fileBytes = 0;
  try {
    for await (const chunk of entry as AsyncIterable<Uint8Array>) {
      const data = Buffer.from(chunk);
      fileBytes += data.byteLength;
      if (fileBytes > limits.maxFileBytes) {
        failSkin(["Archive file exceeds its size limit"]);
      }
      let offset = 0;
      while (offset < data.byteLength) {
        const { bytesWritten } = await handle.write(
          data,
          offset,
          data.byteLength - offset,
          null
        );
        if (bytesWritten <= 0) {
          failSkin(["Archive file could not be written completely"]);
        }
        offset += bytesWritten;
      }
    }
  } finally {
    await handle.close();
  }

  if (fileBytes !== header.size) {
    failSkin(["Archive entry size does not match its declared size"]);
  }
}

export async function extractSkinArchive(
  archivePath: string,
  outputDirectory: string,
  limits: SkinSourceLimits
): Promise<void> {
  await mkdir(outputDirectory, { recursive: false, mode: 0o700 });

  // tar-stream 3.2.2 enforces its fixed 4 MiB PAX and long-path header limit.
  const extractor = extract();
  const expandedCounter = countExpandedBytes(limits.maxExtractedBytes);
  const input = pipeline(
    createReadStream(archivePath),
    createGunzip(),
    expandedCounter,
    extractor
  );
  input.catch(() => undefined);

  const entries = new Map<string, string>();
  const spellings = new Map<string, string>();
  const packageManifest = { seen: false };

  try {
    for await (const entry of extractor) {
      await consumeEntry(
        entry.header,
        entry,
        resolve(outputDirectory),
        limits,
        entries,
        spellings,
        packageManifest
      );
    }
    await input;
    if (!packageManifest.seen) {
      failSkin(["Package is missing root skin.json"]);
    }
  } catch (error) {
    extractor.destroy();
    await input.catch(() => undefined);
    if (error instanceof SkinValidationError) throw error;
    if (error instanceof Error && error.message === "Header exceeds max size") {
      failSkin(["Tar PAX and long-path metadata exceeds the 4 MiB limit"]);
    }
    failSkin(["Skin archive is invalid"]);
  }
}
