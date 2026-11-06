import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  applyPaletteToTokensCss,
  loadPaletteSelection,
  loadPaletteSnapshot,
  parseDefaultSkinTokens,
  validatePaletteSnapshot,
} from "../../../packages/create-nextdevtpl/src/palettes";
import type {
  PaletteSnapshotBytes,
  RadiusRange,
} from "../../../packages/create-nextdevtpl/src/palettes";

const SNAPSHOT_DIRECTORY = fileURLToPath(
  new URL(
    "../../../packages/create-nextdevtpl/palettes/stylekit/",
    import.meta.url
  )
);
const RADIUS_RANGE: RadiusRange = { min: 0, max: 2, unit: "rem" };

async function readSnapshotBytes(
  directory: string
): Promise<PaletteSnapshotBytes> {
  const manifestBytes = await readFile(join(directory, "snapshot.json"));
  const registryBytes = await readFile(join(directory, "registry.json"));
  const licenseBytes = await readFile(join(directory, "LICENSE"));
  const registry = JSON.parse(registryBytes.toString("utf8")) as {
    items: readonly { name: string }[];
  };
  const originalThemeBytes: Record<string, Uint8Array> = {};
  const normalizedThemeBytes: Record<string, Uint8Array> = {};
  await Promise.all(
    registry.items.map(async ({ name }) => {
      const [original, normalized] = await Promise.all([
        readFile(join(directory, "themes", `${name}.json`)),
        readFile(join(directory, "normalized", `${name}.json`)),
      ]);
      originalThemeBytes[name] = original;
      normalizedThemeBytes[name] = normalized;
    })
  );
  return {
    licenseBytes,
    manifestBytes,
    normalizedThemeBytes,
    originalThemeBytes,
    registryBytes,
  };
}

function appendBytes(bytes: Uint8Array, suffix: string): Uint8Array {
  return Buffer.concat([Buffer.from(bytes), Buffer.from(suffix, "utf8")]);
}

describe("StyleKit snapshot validation and application", () => {
  it("loads every committed theme and applies every normalized palette", async () => {
    const snapshot = await loadPaletteSnapshot(SNAPSHOT_DIRECTORY);
    const tokensCss = await readFile(
      new URL("../../../src/skin/tokens.css", import.meta.url),
      "utf8"
    );
    const ids = snapshot.registry.items.map(({ name }) => name);

    expect(snapshot.manifest.themeCount).toBe(ids.length);
    expect(Object.keys(snapshot.themes).sort()).toEqual([...ids].sort());
    expect(snapshot.license).toContain("MIT License");
    expect(snapshot.license).toContain("Copyright");

    for (const id of ids) {
      const palette = snapshot.themes[id];
      expect(palette, `validated theme ${id}`).toBeDefined();
      if (!palette) {
        throw new Error(`Snapshot omitted validated theme ${id}`);
      }
      const applied = applyPaletteToTokensCss(tokensCss, palette);
      expect(applied.changed, `changed CSS for ${id}`).toBe(true);

      const parsed = parseDefaultSkinTokens(applied.css, RADIUS_RANGE);
      expect(parsed.colors.light, `${id} light tokens`).toEqual(
        palette.light.colors
      );
      expect(parsed.colors.dark, `${id} dark tokens`).toEqual(
        palette.dark.colors
      );
      expect(parsed.radius.light, `${id} light radius`).toBe(
        palette.light.radius
      );
      expect(parsed.radius.dark, `${id} dark radius`).toBe(palette.dark.radius);
    }
  });

  it("preserves the full submitted collection and each theme's source digest", async () => {
    const bytes = await readSnapshotBytes(SNAPSHOT_DIRECTORY);
    const snapshot = validatePaletteSnapshot(bytes);
    const slug = Object.keys(snapshot.themes)[0];
    expect(slug).toBeDefined();
    if (!slug) return;

    expect(snapshot.manifest.themeCount).toBe(
      Object.keys(snapshot.manifest.themes).length
    );
    expect(snapshot.themes[slug]?.sourceSha256).toBe(
      createHash("sha256").update(bytes.originalThemeBytes[slug]!).digest("hex")
    );
  });

  it("rejects modified source, normalized, and license bytes", async () => {
    const bytes = await readSnapshotBytes(SNAPSHOT_DIRECTORY);
    const slug = Object.keys(bytes.originalThemeBytes)[0];
    expect(slug).toBeDefined();
    if (!slug) return;

    expect(() =>
      validatePaletteSnapshot({
        ...bytes,
        originalThemeBytes: {
          ...bytes.originalThemeBytes,
          [slug]: appendBytes(bytes.originalThemeBytes[slug]!, " "),
        },
      })
    ).toThrow();
    expect(() =>
      validatePaletteSnapshot({
        ...bytes,
        normalizedThemeBytes: {
          ...bytes.normalizedThemeBytes,
          [slug]: appendBytes(bytes.normalizedThemeBytes[slug]!, " "),
        },
      })
    ).toThrow();
    expect(() =>
      validatePaletteSnapshot({
        ...bytes,
        licenseBytes: appendBytes(bytes.licenseBytes, " "),
      })
    ).toThrow();
  });

  it("rejects unlisted theme files and an unsafe theme path", async () => {
    const bytes = await readSnapshotBytes(SNAPSHOT_DIRECTORY);
    const sourceSlug = Object.keys(bytes.originalThemeBytes)[0];
    expect(sourceSlug).toBeDefined();
    if (!sourceSlug) return;
    const extraSlug = "codex-fixture-extra";

    expect(() =>
      validatePaletteSnapshot({
        ...bytes,
        originalThemeBytes: {
          ...bytes.originalThemeBytes,
          [extraSlug]: bytes.originalThemeBytes[sourceSlug]!,
        },
        normalizedThemeBytes: {
          ...bytes.normalizedThemeBytes,
          [extraSlug]: bytes.normalizedThemeBytes[sourceSlug]!,
        },
      })
    ).toThrow(/文件集合/u);

    await expect(
      loadPaletteSelection(join(SNAPSHOT_DIRECTORY, "missing"), "../escape")
    ).rejects.toThrow(/编号无效/u);
  });
});
