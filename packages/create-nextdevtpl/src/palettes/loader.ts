import type { Dirent, Stats } from "node:fs";
import { lstat, readdir, readFile, realpath } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";

import { formatPaletteWarning, inspectPaletteContrast } from "./contrast.js";
import { validatePaletteSnapshot } from "./snapshot.js";
import {
  type LoadedPalette,
  type NormalizedPaletteTheme,
  type PaletteWarning,
  STYLEKIT_SLUG_PATTERN,
  type ValidatedPaletteSnapshot,
} from "./types.js";

const decoder = new TextDecoder("utf-8", { fatal: true });
const ROOT_ENTRIES = [
  "LICENSE",
  "normalized",
  "registry.json",
  "snapshot.json",
  "themes",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isInside(root: string, candidate: string): boolean {
  const relativePath = relative(root, candidate);
  return (
    relativePath !== "" &&
    relativePath !== ".." &&
    !relativePath.startsWith(`..${sep}`) &&
    !isAbsolute(relativePath)
  );
}

function parseJson(bytes: Uint8Array, label: string): unknown {
  try {
    return JSON.parse(decoder.decode(bytes)) as unknown;
  } catch {
    throw new Error(`StyleKit 快照中的 ${label} 不是有效 UTF-8 JSON。`);
  }
}

function parseRegistrySlugs(bytes: Uint8Array): string[] {
  const value = parseJson(bytes, "registry.json");
  if (
    !isRecord(value) ||
    value.name !== "stylekit" ||
    !Array.isArray(value.items)
  ) {
    throw new Error("StyleKit 快照索引结构无效。");
  }

  const slugs: string[] = [];
  const seen = new Set<string>();
  for (const item of value.items) {
    if (
      !isRecord(item) ||
      typeof item.name !== "string" ||
      !STYLEKIT_SLUG_PATTERN.test(item.name) ||
      item.type !== "registry:theme" ||
      seen.has(item.name)
    ) {
      throw new Error("StyleKit 快照索引包含无效或重复编号。");
    }
    seen.add(item.name);
    slugs.push(item.name);
  }
  return slugs;
}

async function requireDirectory(path: string, label: string): Promise<string> {
  let info: Stats;
  try {
    info = await lstat(path);
  } catch {
    throw new Error(`StyleKit 快照缺少${label}目录。`);
  }
  if (!info.isDirectory() || info.isSymbolicLink()) {
    throw new Error(`StyleKit 快照${label}必须是普通目录。`);
  }
  return realpath(path);
}

async function readPlainFile(
  path: string,
  rootRealPath: string,
  label: string
): Promise<Uint8Array> {
  let info: Stats;
  try {
    info = await lstat(path);
  } catch {
    throw new Error(`StyleKit 快照缺少${label}文件。`);
  }
  if (!info.isFile() || info.isSymbolicLink()) {
    throw new Error(`StyleKit 快照${label}必须是普通文件。`);
  }

  const actualPath = await realpath(path);
  if (!isInside(rootRealPath, actualPath)) {
    throw new Error(`StyleKit 快照${label}越出快照目录。`);
  }
  return readFile(path);
}

async function requireExactEntries(
  directory: string,
  expectedNames: readonly string[],
  label: string
): Promise<Map<string, Dirent>> {
  let entries: Dirent[];
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    throw new Error(`StyleKit 快照无法读取${label}目录。`);
  }
  const actualNames = entries.map((entry) => entry.name);
  if (
    actualNames.length !== expectedNames.length ||
    expectedNames.some((name) => !actualNames.includes(name))
  ) {
    throw new Error(`StyleKit 快照${label}文件集合与索引不一致。`);
  }
  return new Map(entries.map((entry) => [entry.name, entry]));
}

async function readThemeFiles(
  directory: string,
  rootRealPath: string,
  slugs: readonly string[],
  label: string
): Promise<Record<string, Uint8Array>> {
  const expectedNames = slugs.map((slug) => `${slug}.json`);
  const entries = await requireExactEntries(directory, expectedNames, label);
  const files: Record<string, Uint8Array> = {};
  for (const slug of slugs) {
    const fileName = `${slug}.json`;
    const entry = entries.get(fileName);
    if (!entry?.isFile() || entry.isSymbolicLink()) {
      throw new Error(`StyleKit 快照${label}主题必须是普通文件。`);
    }
    files[slug] = await readPlainFile(
      resolve(directory, fileName),
      rootRealPath,
      `${label}主题`
    );
  }
  return files;
}

function warningFromRadius(
  id: string,
  mode: "light" | "dark",
  warning: NormalizedPaletteTheme["light"]["radiusInfo"]
): PaletteWarning | undefined {
  if (!warning.clamped) return undefined;
  if (warning.sourceUnit === "default" || warning.sourceValue === null) {
    throw new Error("StyleKit 快照圆角来源记录无效。");
  }
  return {
    convertedRem: warning.convertedRem,
    effectiveRem: warning.effectiveRem,
    id,
    kind: "radius-clamped",
    mode,
    sourceUnit: warning.sourceUnit,
    sourceValue: warning.sourceValue,
  };
}

function warningsForPalette(
  palette: ValidatedPaletteSnapshot["themes"][string]
): readonly string[] {
  const warnings: PaletteWarning[] = [];
  const lightRadius = warningFromRadius(
    palette.id,
    "light",
    palette.light.radiusInfo
  );
  const darkRadius = warningFromRadius(
    palette.id,
    "dark",
    palette.dark.radiusInfo
  );
  if (lightRadius) warnings.push(lightRadius);
  if (darkRadius) warnings.push(darkRadius);

  const contrast = inspectPaletteContrast(palette);
  warnings.push(...contrast.warnings);
  return warnings.map(formatPaletteWarning);
}

export async function loadPaletteSnapshot(
  directory: string
): Promise<ValidatedPaletteSnapshot & { license: string }> {
  const rootPath = resolve(directory);
  await requireDirectory(rootPath, "根");
  const rootRealPath = await realpath(rootPath);
  const rootEntries = await requireExactEntries(rootPath, ROOT_ENTRIES, "根");
  for (const name of ["LICENSE", "registry.json", "snapshot.json"] as const) {
    const entry = rootEntries.get(name);
    if (!entry?.isFile() || entry.isSymbolicLink()) {
      throw new Error(`StyleKit 快照 ${name} 必须是普通文件。`);
    }
  }
  for (const name of ["themes", "normalized"] as const) {
    const entry = rootEntries.get(name);
    if (!entry?.isDirectory() || entry.isSymbolicLink()) {
      throw new Error(`StyleKit 快照 ${name} 必须是普通目录。`);
    }
  }

  const licenseBytes = await readPlainFile(
    resolve(rootPath, "LICENSE"),
    rootRealPath,
    "MIT 许可"
  );
  const registryBytes = await readPlainFile(
    resolve(rootPath, "registry.json"),
    rootRealPath,
    "索引"
  );
  const manifestBytes = await readPlainFile(
    resolve(rootPath, "snapshot.json"),
    rootRealPath,
    "快照清单"
  );
  const slugs = parseRegistrySlugs(registryBytes);
  const originalThemeBytes = await readThemeFiles(
    resolve(rootPath, "themes"),
    rootRealPath,
    slugs,
    "原主题"
  );
  const normalizedThemeBytes = await readThemeFiles(
    resolve(rootPath, "normalized"),
    rootRealPath,
    slugs,
    "规范化"
  );

  let license: string;
  try {
    license = decoder.decode(licenseBytes);
  } catch {
    throw new Error("StyleKit MIT 许可不是有效 UTF-8 文本。");
  }
  const snapshot = validatePaletteSnapshot({
    licenseBytes,
    manifestBytes,
    normalizedThemeBytes,
    originalThemeBytes,
    registryBytes,
  });
  return { ...snapshot, license };
}

export async function loadPaletteSelection(
  directory: string,
  id: string
): Promise<LoadedPalette> {
  if (!STYLEKIT_SLUG_PATTERN.test(id)) {
    throw new Error("StyleKit 配色编号无效。");
  }
  const snapshot = await loadPaletteSnapshot(directory);
  const palette = snapshot.themes[id];
  if (!Object.hasOwn(snapshot.themes, id) || !palette) {
    throw new Error("StyleKit 配色不存在于当前快照。");
  }
  return {
    license: snapshot.license,
    palette,
    snapshotDate: snapshot.manifest.fetchedAt,
    warnings: warningsForPalette(palette),
  };
}
