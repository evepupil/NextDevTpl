import { createHash } from "node:crypto";
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { parseCliArguments } from "../../../packages/create-nextdevtpl/src/cli";
import { generateProject } from "../../../packages/create-nextdevtpl/src/generate";
import {
  loadPaletteSnapshot,
  type GeneratedPaletteRecord,
} from "../../../packages/create-nextdevtpl/src/palettes";
import { readSkinManifest } from "../../../packages/create-nextdevtpl/src/skins";
import { calculateSkinPackageHash } from "../../../packages/create-nextdevtpl/src/skins/hash";
import type { SkinManifest } from "../../../packages/create-nextdevtpl/src/skins/types";

const SNAPSHOT_DIRECTORY = fileURLToPath(
  new URL(
    "../../../packages/create-nextdevtpl/palettes/stylekit/",
    import.meta.url
  )
);
const SOURCE_SKIN_DIRECTORY = fileURLToPath(
  new URL("../../../src/skin/", import.meta.url)
);
const CONTRAST_SKIN_DIRECTORY = fileURLToPath(
  new URL("../../../tests/fixtures/skins/contrast/", import.meta.url)
);

interface GeneratedRecord {
  skin: {
    packageHash: string;
    palette?: GeneratedPaletteRecord;
  };
}

interface SkinFileManifest {
  files: Readonly<Record<string, string>>;
}

interface PackageManifest {
  dependencies: Readonly<Record<string, string>>;
}

let root: string;
let paletteId: string;
let otherPaletteId: string;
let sourceSkin: SkinManifest;
let sourcePackageHash: string;
let sourceTokens: Buffer;
let sourceTokenHash: string;
let sourceSha256: string;
let snapshotDate: string;

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

function sha256(value: Uint8Array | string): string {
  return createHash("sha256").update(value).digest("hex");
}

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), "nextdevtpl-palette-generation-"));
  const snapshot = await loadPaletteSnapshot(SNAPSHOT_DIRECTORY);
  const ids = Object.keys(snapshot.themes);
  paletteId = ids[0] ?? "";
  snapshotDate = snapshot.manifest.fetchedAt;
  otherPaletteId =
    ids.find((id) => id !== paletteId && id.length >= 12) ??
    ids.find((id) => id !== paletteId) ??
    "";
  const rawTheme = await readFile(
    join(SNAPSHOT_DIRECTORY, "themes", `${paletteId}.json`)
  );
  sourceSha256 = sha256(rawTheme);
  sourceSkin = await readSkinManifest(SOURCE_SKIN_DIRECTORY);
  sourcePackageHash = await calculateSkinPackageHash(
    SOURCE_SKIN_DIRECTORY,
    sourceSkin
  );
  sourceTokens = await readFile(join(SOURCE_SKIN_DIRECTORY, "tokens.css"));
  sourceTokenHash = sha256(sourceTokens);
});

afterAll(async () => {
  if (root) {
    await rm(root, { recursive: true, force: true });
  }
});

describe("palette generator selection", () => {
  it("accepts one palette slug and rejects a repeated option", () => {
    expect(parseCliArguments(["app", "--palette", "soft-grid"])).toMatchObject({
      palette: "soft-grid",
    });
    expect(() =>
      parseCliArguments([
        "app",
        "--palette",
        "soft-grid",
        "--palette",
        "quiet-forest",
      ])
    ).toThrow("Duplicate --palette option");
  });

  it("keeps the source CSS bytes and source package fingerprint without a palette", async () => {
    const target = join(root, "without-palette");
    const result = await generateProject({
      targetDirectory: target,
      install: false,
    });
    const generatedTokens = await readFile(
      join(target, "src", "skin", "tokens.css")
    );
    const generatedSkin = await readJson<SkinFileManifest>(
      join(target, "src", "skin", "skin.json")
    );
    const generatedRecord = await readJson<GeneratedRecord>(
      join(target, "nextdevtpl.generated.json")
    );

    expect(generatedTokens).toEqual(sourceTokens);
    expect(generatedSkin.files["tokens.css"]).toBe(sourceTokenHash);
    expect(result.manifest.skin.packageHash).toBe(sourcePackageHash);
    expect(generatedRecord.skin.packageHash).toBe(sourcePackageHash);
    expect(generatedRecord.skin.palette).toBeUndefined();
    expect(result.warnings).toEqual([]);
    expect(await exists(join(target, "STYLEKIT-LICENSE.txt"))).toBe(false);
  });

  it("records and applies only the selected palette without network access", async () => {
    const target = join(root, "with-palette");
    const fetch = vi.spyOn(globalThis, "fetch");
    try {
      const result = await generateProject({
        targetDirectory: target,
        install: false,
        palette: paletteId,
      });
      const generatedTokens = await readFile(
        join(target, "src", "skin", "tokens.css")
      );
      const generatedSkin = await readJson<SkinFileManifest>(
        join(target, "src", "skin", "skin.json")
      );
      const generatedRecord = await readJson<GeneratedRecord>(
        join(target, "nextdevtpl.generated.json")
      );
      const selectedPalette = generatedRecord.skin.palette;
      const generatedPackage = await readJson<PackageManifest>(
        join(target, "package.json")
      );
      const notice = await readFile(
        join(target, "STYLEKIT-LICENSE.txt"),
        "utf8"
      );
      const expectedEffectiveHash = await calculateSkinPackageHash(
        join(target, "src", "skin"),
        await readSkinManifest(join(target, "src", "skin"))
      );

      expect(fetch).not.toHaveBeenCalled();
      expect(generatedTokens.equals(sourceTokens)).toBe(false);
      expect(generatedSkin.files["tokens.css"]).toBe(sha256(generatedTokens));
      expect(generatedSkin.files["tokens.css"]).not.toBe(sourceTokenHash);
      expect(result.manifest.skin.packageHash).toBe(sourcePackageHash);
      expect(generatedRecord.skin.packageHash).toBe(sourcePackageHash);
      expect(selectedPalette).toEqual({
        id: paletteId,
        provider: "stylekit",
        snapshotDate,
        sourceSha256,
      });
      expect(expectedEffectiveHash).not.toBe(sourcePackageHash);
      expect(notice).toContain(`Theme: ${paletteId}`);
      expect(notice).toContain(
        `Source: https://www.stylekit.top/r/${paletteId}.json`
      );
      expect(notice).toContain(`Snapshot date: ${snapshotDate}`);
      expect(notice).toContain("MIT License");
      expect(notice.match(/^Theme:/gmu)).toHaveLength(1);
      if (otherPaletteId) expect(notice).not.toContain(otherPaletteId);
      expect(generatedPackage.dependencies).not.toHaveProperty("colorjs.io");
      expect(await exists(join(target, "palettes"))).toBe(false);
      expect(await exists(join(target, "src", "palettes"))).toBe(false);
      expect(
        result.warnings.every((warning) => warning.startsWith(`${paletteId} `))
      ).toBe(true);
    } finally {
      fetch.mockRestore();
    }
  });

  it("rejects unknown palettes and unsupported skins before target creation", async () => {
    const unknownTarget = join(root, "unknown-palette");
    const unsupportedSkinTarget = join(root, "unsupported-skin");
    let unknownPalette = "m4-test-palette-not-in-snapshot";
    const snapshot = await loadPaletteSnapshot(SNAPSHOT_DIRECTORY);
    while (Object.hasOwn(snapshot.themes, unknownPalette)) {
      unknownPalette += "-missing";
    }

    await expect(
      generateProject({
        targetDirectory: unknownTarget,
        install: false,
        palette: unknownPalette,
      })
    ).rejects.toThrow();
    expect(await exists(unknownTarget)).toBe(false);

    await expect(
      generateProject({
        targetDirectory: unsupportedSkinTarget,
        install: false,
        palette: paletteId,
        skin: { kind: "local", directory: CONTRAST_SKIN_DIRECTORY },
      })
    ).rejects.toThrow(/built-in default skin/u);
    expect(await exists(unsupportedSkinTarget)).toBe(false);
  });
});
