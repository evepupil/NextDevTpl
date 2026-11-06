import { createHash } from "node:crypto";

import { isNormalizedRgbCss } from "./color.js";
import { parseRadiusRem, parseStyleKitTheme } from "./normalize.js";
import {
  COLOR_RULES_VERSION,
  MODES,
  type Mode,
  type NormalizedPaletteMode,
  type NormalizedPaletteTheme,
  type NormalizedRadiusInfo,
  PALETTE_COLOR_KEYS,
  type PaletteColorKey,
  type PaletteInputKey,
  type PaletteSnapshotBytes,
  type PaletteSnapshotManifest,
  SNAPSHOT_SCHEMA_VERSION,
  type SnapshotThemeDigest,
  STYLEKIT_LICENSE_SOURCE_URL,
  STYLEKIT_REGISTRY_URL,
  STYLEKIT_SLUG_PATTERN,
  STYLEKIT_THEME_URL_TEMPLATE,
  type StyleKitRegistry,
  type StyleKitRegistryItem,
  type ValidatedPaletteSnapshot,
} from "./types.js";

const SHA256 = /^[a-f0-9]{64}$/u;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseJson(bytes: Uint8Array, context: string): unknown {
  try {
    return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
  } catch {
    throw new Error(`${context} 不是有效 JSON。`);
  }
}

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function aggregateSha256(entries: Readonly<Record<string, string>>): string {
  const source = Object.entries(entries)
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .map(([slug, digest]) => `${slug}\0${digest}\n`)
    .join("");
  return createHash("sha256").update(source, "utf8").digest("hex");
}

function sameKeys(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false;
  const sortedLeft = [...left].sort();
  const sortedRight = [...right].sort();
  return sortedLeft.every((key, index) => key === sortedRight[index]);
}

function digest(value: unknown, context: string): string {
  if (typeof value !== "string" || !SHA256.test(value)) {
    throw new Error(`${context} SHA-256 格式无效。`);
  }
  return value;
}

function parseManifest(value: unknown): PaletteSnapshotManifest {
  if (
    !isRecord(value) ||
    value.schemaVersion !== SNAPSHOT_SCHEMA_VERSION ||
    value.rulesVersion !== COLOR_RULES_VERSION ||
    typeof value.fetchedAt !== "string" ||
    !Number.isFinite(Date.parse(value.fetchedAt)) ||
    !isRecord(value.source) ||
    !isRecord(value.themes) ||
    !Number.isInteger(value.themeCount) ||
    (value.themeCount as number) < 1
  ) {
    throw new Error("StyleKit 快照清单结构无效。");
  }

  if (
    value.source.registryUrl !== STYLEKIT_REGISTRY_URL ||
    value.source.themeUrlTemplate !== STYLEKIT_THEME_URL_TEMPLATE ||
    value.source.licenseSource !== STYLEKIT_LICENSE_SOURCE_URL
  ) {
    throw new Error("StyleKit 快照来源不符合固定 HTTPS 来源。");
  }

  const themes: Record<string, SnapshotThemeDigest> = {};
  for (const [slug, entry] of Object.entries(value.themes)) {
    if (!STYLEKIT_SLUG_PATTERN.test(slug) || !isRecord(entry)) {
      throw new Error("StyleKit 快照清单含无效主题编号。");
    }
    themes[slug] = {
      normalizedSha256: digest(entry.normalizedSha256, `${slug} 规范化主题`),
      sourceSha256: digest(entry.sourceSha256, `${slug} 原主题`),
    };
  }

  return {
    fetchedAt: value.fetchedAt,
    licenseSha256: digest(value.licenseSha256, "StyleKit 许可"),
    normalizedThemesSha256: digest(
      value.normalizedThemesSha256,
      "全部规范化主题"
    ),
    originalThemesSha256: digest(value.originalThemesSha256, "全部原主题"),
    registrySha256: digest(value.registrySha256, "StyleKit 索引"),
    rulesVersion: COLOR_RULES_VERSION,
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    source: {
      licenseSource: value.source.licenseSource,
      registryUrl: STYLEKIT_REGISTRY_URL,
      themeUrlTemplate: STYLEKIT_THEME_URL_TEMPLATE,
    },
    themeCount: value.themeCount as number,
    themes,
  };
}

function parseRegistry(value: unknown): StyleKitRegistry {
  if (
    !isRecord(value) ||
    value.name !== "stylekit" ||
    !Array.isArray(value.items)
  ) {
    throw new Error("StyleKit registry.json 结构无效。");
  }

  const seen = new Set<string>();
  const items: StyleKitRegistryItem[] = [];
  for (const item of value.items) {
    if (
      !isRecord(item) ||
      typeof item.name !== "string" ||
      !STYLEKIT_SLUG_PATTERN.test(item.name) ||
      item.type !== "registry:theme" ||
      seen.has(item.name)
    ) {
      throw new Error("StyleKit registry.json 含无效或重复主题编号。");
    }
    seen.add(item.name);
    items.push({ name: item.name, type: "registry:theme" });
  }
  return { items, name: "stylekit" };
}

function parsePaletteInputKey(value: unknown): value is PaletteInputKey {
  return (
    value === "radius" ||
    (typeof value === "string" &&
      (PALETTE_COLOR_KEYS as readonly string[]).includes(value))
  );
}

function parseStringArray(value: unknown, context: string): readonly string[] {
  if (
    !Array.isArray(value) ||
    !value.every((entry) => typeof entry === "string")
  ) {
    throw new Error(`${context} 列表结构无效。`);
  }
  return value;
}

function parseNormalizedMode(
  value: unknown,
  slug: string,
  mode: Mode
): NormalizedPaletteMode {
  if (!isRecord(value) || typeof value.radius !== "string") {
    throw new Error(`主题 ${slug}/${mode} 规范化结构无效。`);
  }
  const rem = parseRadiusRem(value.radius, `${slug}/${mode}`);
  if (rem > 2) throw new Error(`主题 ${slug}/${mode} 圆角超出默认皮肤范围。`);
  const radiusInfo = parseRadiusInfo(value.radiusInfo, slug, mode, rem);
  if (!isRecord(value.colors)) {
    throw new Error(`主题 ${slug}/${mode} 缺少规范化颜色集合。`);
  }

  const colors = {} as Record<PaletteColorKey, string>;
  const actualKeys = Object.keys(value.colors);
  if (!sameKeys(actualKeys, PALETTE_COLOR_KEYS)) {
    throw new Error(`主题 ${slug}/${mode} 规范化颜色键不完整。`);
  }
  for (const key of PALETTE_COLOR_KEYS) {
    const color = value.colors[key];
    if (!isNormalizedRgbCss(color)) {
      throw new Error(`主题 ${slug}/${mode} 的 --${key} 颜色格式无效。`);
    }
    colors[key] = color;
  }
  return { colors, radius: value.radius, radiusInfo };
}

function parseRadiusInfo(
  value: unknown,
  slug: string,
  mode: Mode,
  effectiveValue: number
): NormalizedRadiusInfo {
  if (
    !isRecord(value) ||
    typeof value.clamped !== "boolean" ||
    typeof value.convertedRem !== "number" ||
    !Number.isFinite(value.convertedRem) ||
    value.convertedRem < 0 ||
    typeof value.effectiveRem !== "number" ||
    !Number.isFinite(value.effectiveRem) ||
    value.effectiveRem < 0 ||
    !["default", "unitless", "rem", "px"].includes(String(value.sourceUnit))
  ) {
    throw new Error(`主题 ${slug}/${mode} 圆角来源记录无效。`);
  }
  const converted = value.convertedRem;
  const recordedEffective = value.effectiveRem;
  if (recordedEffective !== effectiveValue) {
    throw new Error(`主题 ${slug}/${mode} 圆角来源记录与 CSS 值不一致。`);
  }

  const sourceUnit = value.sourceUnit as NormalizedRadiusInfo["sourceUnit"];
  const sourceValue = value.sourceValue;
  if (sourceUnit === "default") {
    if (
      sourceValue !== null ||
      value.clamped ||
      converted !== recordedEffective
    ) {
      throw new Error(`主题 ${slug}/${mode} 默认圆角来源记录无效。`);
    }
  } else if (
    typeof sourceValue !== "number" ||
    !Number.isFinite(sourceValue) ||
    sourceValue < 0
  ) {
    throw new Error(`主题 ${slug}/${mode} 上游圆角值无效。`);
  } else {
    const expectedRem =
      sourceUnit === "px"
        ? sourceValue / 16
        : sourceUnit === "rem"
          ? sourceValue
          : 0;
    if (Math.abs(expectedRem - converted) > 0.0000005) {
      throw new Error(`主题 ${slug}/${mode} 圆角单位换算记录无效。`);
    }
    const expectedEffective = Math.min(2, Math.max(0, expectedRem));
    if (
      Math.abs(expectedEffective - recordedEffective) > 0.0000005 ||
      value.clamped !== (expectedEffective !== expectedRem)
    ) {
      throw new Error(`主题 ${slug}/${mode} 圆角限制记录无效。`);
    }
  }
  return {
    clamped: value.clamped,
    convertedRem: value.convertedRem,
    effectiveRem: value.effectiveRem,
    sourceUnit,
    sourceValue: sourceValue as number | null,
  };
}

function parseNormalizedTheme(
  value: unknown,
  slug: string,
  sourceSha256: string
): NormalizedPaletteTheme {
  if (
    !isRecord(value) ||
    value.schemaVersion !== SNAPSHOT_SCHEMA_VERSION ||
    value.rulesVersion !== COLOR_RULES_VERSION ||
    value.id !== slug ||
    value.sourceSha256 !== sourceSha256 ||
    !isRecord(value.missingKeys)
  ) {
    throw new Error(`主题 ${slug} 规范化快照结构无效。`);
  }

  const missingKeys = {} as Record<Mode, readonly PaletteInputKey[]>;
  for (const mode of MODES) {
    const keys = parseStringArray(
      value.missingKeys[mode],
      `${slug}/${mode} 缺失键`
    );
    if (!keys.every(parsePaletteInputKey)) {
      throw new Error(`主题 ${slug}/${mode} 缺失键包含未允许字段。`);
    }
    missingKeys[mode] = keys;
  }

  const ignoredKeys = parseStringArray(value.ignoredKeys, `${slug} 忽略键`);
  const light = parseNormalizedMode(value.light, slug, "light");
  const dark = parseNormalizedMode(value.dark, slug, "dark");
  if (light.radiusInfo.convertedRem !== dark.radiusInfo.convertedRem) {
    throw new Error(`主题 ${slug} 原始明暗圆角不同，无法套用到全局变量。`);
  }
  if (
    parseRadiusRem(light.radius, `${slug}/light`) !==
    parseRadiusRem(dark.radius, `${slug}/dark`)
  ) {
    throw new Error(`主题 ${slug} 明暗圆角不同，无法套用到全局变量。`);
  }
  return {
    dark,
    id: slug,
    ignoredKeys,
    light,
    missingKeys,
    rulesVersion: COLOR_RULES_VERSION,
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    sourceSha256,
  };
}

function requireExactFileSet(
  expected: readonly string[],
  actual: readonly string[],
  context: string
): void {
  if (!sameKeys(expected, actual)) {
    throw new Error(`${context} 文件集合与索引不一致。`);
  }
}

export function validatePaletteSnapshot(
  files: PaletteSnapshotBytes
): ValidatedPaletteSnapshot {
  const manifest = parseManifest(
    parseJson(files.manifestBytes, "snapshot.json")
  );
  const registry = parseRegistry(
    parseJson(files.registryBytes, "registry.json")
  );
  const slugs = registry.items.map((item) => item.name);
  const originalSlugs = Object.keys(files.originalThemeBytes);
  const normalizedSlugs = Object.keys(files.normalizedThemeBytes);
  const manifestSlugs = Object.keys(manifest.themes);

  if (
    registry.items.length !== manifest.themeCount ||
    manifestSlugs.length !== manifest.themeCount
  ) {
    throw new Error("StyleKit 快照主题数量与索引不一致。");
  }
  requireExactFileSet(slugs, originalSlugs, "原主题");
  requireExactFileSet(slugs, normalizedSlugs, "规范化主题");
  requireExactFileSet(slugs, manifestSlugs, "清单主题");

  const registrySha256 = sha256(files.registryBytes);
  const licenseSha256 = sha256(files.licenseBytes);
  if (registrySha256 !== manifest.registrySha256) {
    throw new Error("StyleKit registry.json 摘要不匹配。");
  }
  if (licenseSha256 !== manifest.licenseSha256) {
    throw new Error("StyleKit MIT 许可摘要不匹配。");
  }
  if (files.licenseBytes.byteLength === 0) {
    throw new Error("StyleKit MIT 许可文件不能为空。");
  }
  const licenseText = new TextDecoder().decode(files.licenseBytes);
  if (
    !licenseText.includes("MIT License") ||
    !licenseText.includes("Copyright")
  ) {
    throw new Error("StyleKit 许可文件未包含 MIT 许可与版权声明。");
  }

  const originalDigests: Record<string, string> = {};
  const normalizedDigests: Record<string, string> = {};
  const themes: Record<string, NormalizedPaletteTheme> = {};
  for (const slug of slugs) {
    const originalBytes = files.originalThemeBytes[slug];
    const normalizedBytes = files.normalizedThemeBytes[slug];
    const expectedDigests = manifest.themes[slug];
    if (!originalBytes || !normalizedBytes || !expectedDigests) {
      throw new Error(`StyleKit 主题 ${slug} 的快照文件不完整。`);
    }

    const sourceSha256 = sha256(originalBytes);
    const normalizedSha256 = sha256(normalizedBytes);
    if (sourceSha256 !== expectedDigests.sourceSha256) {
      throw new Error(`StyleKit 原主题 ${slug} 摘要不匹配。`);
    }
    if (normalizedSha256 !== expectedDigests.normalizedSha256) {
      throw new Error(`StyleKit 规范化主题 ${slug} 摘要不匹配。`);
    }

    const rawTheme = parseJson(originalBytes, `themes/${slug}.json`);
    parseStyleKitTheme(rawTheme, slug);
    const normalizedTheme = parseJson(
      normalizedBytes,
      `normalized/${slug}.json`
    );
    themes[slug] = parseNormalizedTheme(normalizedTheme, slug, sourceSha256);
    originalDigests[slug] = sourceSha256;
    normalizedDigests[slug] = normalizedSha256;
  }

  if (
    aggregateSha256(originalDigests) !== manifest.originalThemesSha256 ||
    aggregateSha256(normalizedDigests) !== manifest.normalizedThemesSha256
  ) {
    throw new Error("StyleKit 主题集合摘要不匹配。");
  }
  return { manifest, registry, themes };
}
