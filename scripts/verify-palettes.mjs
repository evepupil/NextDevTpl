import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  applyPaletteToTokensCss,
  inspectPaletteContrast,
  loadPaletteSnapshot,
  normalizeStyleKitTheme,
  parseDefaultSkinTokens,
} from "../packages/create-nextdevtpl/dist/palettes/index.js";
import { STYLEKIT_LICENSE_SOURCE_URL } from "../packages/create-nextdevtpl/dist/palettes/types.js";

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = resolve(SCRIPT_DIRECTORY, "..");
const PALETTES_ROOT = resolve(
  WORKSPACE_ROOT,
  "packages/create-nextdevtpl/palettes"
);
const SNAPSHOT_ROOT = resolve(PALETTES_ROOT, "stylekit");
const LICENSE_SOURCE = resolve(
  PALETTES_ROOT,
  "licenses/stylekit-MIT.txt"
);
const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { fatal: true });

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function parseJson(bytes, label) {
  try {
    return JSON.parse(decoder.decode(bytes));
  } catch {
    throw new Error(`${label} 不是有效 UTF-8 JSON。`);
  }
}

async function main() {
  const snapshot = await loadPaletteSnapshot(SNAPSHOT_ROOT);
  if (
    snapshot.manifest.source.licenseSource !== STYLEKIT_LICENSE_SOURCE_URL
  ) {
    throw new Error("StyleKit 快照许可来源与固定来源不一致。");
  }

  const [licenseSource, tokensCss, skinText] = await Promise.all([
    readFile(LICENSE_SOURCE),
    readFile(resolve(WORKSPACE_ROOT, "src/skin/tokens.css"), "utf8"),
    readFile(resolve(WORKSPACE_ROOT, "src/skin/skin.json"), "utf8"),
  ]);
  if (!Buffer.from(encoder.encode(snapshot.license)).equals(licenseSource)) {
    throw new Error("StyleKit 快照许可与仓库内许可源不一致。");
  }

  const skin = JSON.parse(skinText);
  const defaults = parseDefaultSkinTokens(tokensCss, skin.customization.radius);
  const radiusPixels = [];
  const clampedThemes = new Set();
  let contrastWarnings = 0;
  let cssApplied = 0;

  for (const { name: slug } of snapshot.registry.items) {
    const rawBytes = await readFile(
      resolve(SNAPSHOT_ROOT, "themes", `${slug}.json`)
    );
    const normalizedBytes = await readFile(
      resolve(SNAPSHOT_ROOT, "normalized", `${slug}.json`)
    );
    const raw = parseJson(rawBytes, `themes/${slug}.json`);
    const result = normalizeStyleKitTheme(
      slug,
      raw,
      defaults,
      sha256(rawBytes)
    );
    const expected = encoder.encode(`${JSON.stringify(result.palette, null, 2)}\n`);
    if (!Buffer.from(expected).equals(Buffer.from(normalizedBytes))) {
      throw new Error(`主题 ${slug} 的归一化内容与原文重算结果不同。`);
    }

    const applied = applyPaletteToTokensCss(tokensCss, result.palette);
    if (applied.css.length === 0) {
      throw new Error(`主题 ${slug} 未生成 CSS 内容。`);
    }
    cssApplied++;
    contrastWarnings += inspectPaletteContrast(result.palette).warnings.length;

    for (const warning of result.warnings) clampedThemes.add(warning.id);
    const lightRadius = result.palette.light.radiusInfo;
    const darkRadius = result.palette.dark.radiusInfo;
    if (lightRadius.sourceUnit === "px" || darkRadius.sourceUnit === "px") {
      radiusPixels.push({
        id: slug,
        light: {
          clamped: lightRadius.clamped,
          convertedRem: lightRadius.convertedRem,
          effectiveRem: lightRadius.effectiveRem,
          sourceValue:
            lightRadius.sourceUnit === "px" ? lightRadius.sourceValue : null,
        },
        dark: {
          clamped: darkRadius.clamped,
          convertedRem: darkRadius.convertedRem,
          effectiveRem: darkRadius.effectiveRem,
          sourceValue:
            darkRadius.sourceUnit === "px" ? darkRadius.sourceValue : null,
        },
      });
    }
  }

  if (cssApplied !== snapshot.manifest.themeCount) {
    throw new Error("CSS 套用数量与快照主题数量不一致。");
  }
  console.log(
    JSON.stringify(
      {
        snapshotDate: snapshot.manifest.fetchedAt,
        themeCount: snapshot.manifest.themeCount,
        rawThemeFiles: snapshot.registry.items.length,
        normalizedThemeFiles: snapshot.registry.items.length,
        cssApplied,
        licenseBytes: licenseSource.byteLength,
        licenseSha256: snapshot.manifest.licenseSha256,
        registrySha256: snapshot.manifest.registrySha256,
        originalThemesSha256: snapshot.manifest.originalThemesSha256,
        normalizedThemesSha256: snapshot.manifest.normalizedThemesSha256,
        radiusClampedThemes: [...clampedThemes].sort(),
        radiusPixelInputs: radiusPixels,
        contrastWarnings,
        offline: true,
        verified: true,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "快照检查失败。");
  process.exitCode = 1;
});
