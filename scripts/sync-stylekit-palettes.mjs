import { createHash } from "node:crypto";
import {
  mkdir,
  lstat,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  inspectPaletteContrast,
  loadPaletteSnapshot,
  normalizeStyleKitTheme,
  parseDefaultSkinTokens,
  validatePaletteSnapshot,
} from "../packages/create-nextdevtpl/dist/palettes/index.js";
import {
  COLOR_RULES_VERSION,
  SNAPSHOT_SCHEMA_VERSION,
  STYLEKIT_LICENSE_SOURCE_URL,
  STYLEKIT_REGISTRY_URL,
  STYLEKIT_SLUG_PATTERN,
  STYLEKIT_THEME_URL_TEMPLATE,
} from "../packages/create-nextdevtpl/dist/palettes/types.js";

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
const REQUEST_TIMEOUT_MS = 20_000;
const MAX_JSON_BYTES = 1_000_000;
const MAX_LICENSE_BYTES = 100_000;
const DOWNLOAD_CONCURRENCY = 8;
const RETRIES = 2;
const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { fatal: true });

function ensureInside(parent, target) {
  const path = relative(parent, target);
  const parentPrefix = `..${process.platform === "win32" ? "\\" : "/"}`;
  if (
    !path ||
    path === ".." ||
    path.startsWith(parentPrefix) ||
    isAbsolute(path)
  ) {
    throw new Error("StyleKit 快照路径越界，拒绝写入。");
  }
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function aggregateSha256(entries) {
  const source = Object.entries(entries)
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .map(([slug, digest]) => `${slug}\0${digest}\n`)
    .join("");
  return createHash("sha256").update(source, "utf8").digest("hex");
}

function jsonBytes(value) {
  return encoder.encode(`${JSON.stringify(value, null, 2)}\n`);
}

function parseJson(bytes, label) {
  try {
    return JSON.parse(decoder.decode(bytes));
  } catch {
    throw new Error(`${label} 不是有效 UTF-8 JSON。`);
  }
}

async function readLimitedBody(response, maxBytes, url) {
  const headerLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(headerLength) && headerLength > maxBytes) {
    throw new Error(`响应超过字节上限：${url}`);
  }
  if (!response.body) throw new Error(`响应没有正文：${url}`);

  const chunks = [];
  let total = 0;
  for await (const chunk of response.body) {
    const bytes = Buffer.from(chunk);
    total += bytes.byteLength;
    if (total > maxBytes) throw new Error(`响应超过字节上限：${url}`);
    chunks.push(bytes);
  }
  return Buffer.concat(chunks, total);
}

async function fetchBytes(url, { contentType, maxBytes }) {
  const expectedUrl = new URL(url);
  let lastError;

  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { accept: contentType },
        redirect: "manual",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (response.status === 429 || response.status >= 500) {
        await response.body?.cancel();
        throw new Error(`上游暂时返回 HTTP ${response.status}。`);
      }
      if (response.status !== 200) {
        await response.body?.cancel();
        throw new Error(`上游返回 HTTP ${response.status}。`);
      }
      if (
        response.redirected ||
        new URL(response.url).origin !== expectedUrl.origin
      ) {
        await response.body?.cancel();
        throw new Error("上游发生跨源跳转，已拒绝响应。");
      }

      const actualType = response.headers.get("content-type") ?? "";
      const isJson =
        /^application\/(?:json|[a-z0-9.+-]+\+json)(?:\s*;|$)/iu.test(
          actualType
        );
      const isText = /^text\/plain(?:\s*;|$)/iu.test(actualType);
      if (contentType === "application/json" ? !isJson : !isText) {
        await response.body?.cancel();
        throw new Error(`上游响应类型不符合预期：${url}`);
      }
      return await readLimitedBody(response, maxBytes, url);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("未知网络错误。");
      const retryable =
        /HTTP (?:429|5\d\d)/u.test(lastError.message) ||
        /fetch|timeout|socket|network/u.test(lastError.message);
      if (!retryable || attempt === RETRIES) break;
      await new Promise((resolvePromise) =>
        setTimeout(resolvePromise, 250 * (attempt + 1))
      );
    }
  }
  throw new Error(`下载失败：${url}；${lastError?.message ?? "未知错误。"}`);
}

function parseRegistry(bytes) {
  const registry = parseJson(bytes, "registry.json");
  if (
    !registry ||
    typeof registry !== "object" ||
    registry.name !== "stylekit" ||
    !Array.isArray(registry.items)
  ) {
    throw new Error("StyleKit registry.json 结构无效。");
  }

  const seen = new Set();
  for (const item of registry.items) {
    if (
      !item ||
      typeof item !== "object" ||
      typeof item.name !== "string" ||
      !STYLEKIT_SLUG_PATTERN.test(item.name) ||
      item.type !== "registry:theme" ||
      seen.has(item.name)
    ) {
      throw new Error("StyleKit registry.json 含无效或重复主题编号。");
    }
    seen.add(item.name);
  }
  return { registry, slugs: registry.items.map((item) => item.name) };
}

async function downloadThemes(slugs) {
  const bytesBySlug = Object.create(null);
  const failures = [];
  let cursor = 0;

  async function worker() {
    while (cursor < slugs.length) {
      const index = cursor++;
      const slug = slugs[index];
      const url = STYLEKIT_THEME_URL_TEMPLATE.replace("{slug}", slug);
      try {
        const bytes = await fetchBytes(url, {
          contentType: "application/json",
          maxBytes: MAX_JSON_BYTES,
        });
        parseJson(bytes, `themes/${slug}.json`);
        bytesBySlug[slug] = bytes;
      } catch (error) {
        failures.push(
          `${slug}: ${error instanceof Error ? error.message : "未知错误。"}`
        );
      }
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(DOWNLOAD_CONCURRENCY, slugs.length) },
      worker
    )
  );
  if (failures.length > 0) {
    throw new Error(`主题下载未完整：\n${failures.sort().join("\n")}`);
  }
  return bytesBySlug;
}

function normalizeThemes(slugs, originalThemeBytes, defaults) {
  const normalizedThemeBytes = Object.create(null);
  const radiusClamps = [];
  const radiusPixels = [];
  const contrastWarnings = [];
  const ignoredKeys = new Set();

  for (const slug of slugs) {
    const rawBytes = originalThemeBytes[slug];
    const rawTheme = parseJson(rawBytes, `themes/${slug}.json`);
    const result = normalizeStyleKitTheme(
      slug,
      rawTheme,
      defaults,
      sha256(rawBytes)
    );
    normalizedThemeBytes[slug] = jsonBytes(result.palette);
    radiusClamps.push(...result.warnings);
    for (const key of result.palette.ignoredKeys) ignoredKeys.add(key);

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
    contrastWarnings.push(...inspectPaletteContrast(result.palette).warnings);
  }
  return {
    contrastWarnings,
    ignoredKeys: [...ignoredKeys].sort(),
    normalizedThemeBytes,
    radiusClamps,
    radiusPixels,
  };
}

function createManifest({
  fetchedAt,
  registryBytes,
  licenseBytes,
  originalThemeBytes,
  normalizedThemeBytes,
  slugs,
}) {
  const themes = {};
  const originalDigests = {};
  const normalizedDigests = {};
  for (const slug of [...slugs].sort()) {
    const sourceSha256 = sha256(originalThemeBytes[slug]);
    const normalizedSha256 = sha256(normalizedThemeBytes[slug]);
    themes[slug] = { normalizedSha256, sourceSha256 };
    originalDigests[slug] = sourceSha256;
    normalizedDigests[slug] = normalizedSha256;
  }
  return {
    fetchedAt,
    licenseSha256: sha256(licenseBytes),
    normalizedThemesSha256: aggregateSha256(normalizedDigests),
    originalThemesSha256: aggregateSha256(originalDigests),
    registrySha256: sha256(registryBytes),
    rulesVersion: COLOR_RULES_VERSION,
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    source: {
      licenseSource: STYLEKIT_LICENSE_SOURCE_URL,
      registryUrl: STYLEKIT_REGISTRY_URL,
      themeUrlTemplate: STYLEKIT_THEME_URL_TEMPLATE,
    },
    themeCount: slugs.length,
    themes,
  };
}

async function readThemeDirectory(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = Object.create(null);
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) {
      throw new Error(`快照目录中出现非主题 JSON 文件：${entry.name}`);
    }
    const slug = entry.name.slice(0, -5);
    if (!STYLEKIT_SLUG_PATTERN.test(slug) || files[slug]) {
      throw new Error(`快照目录中出现无效或重复主题文件：${entry.name}`);
    }
    files[slug] = await readFile(resolve(directory, entry.name));
  }
  return files;
}

async function verifySnapshotDirectory(directory, defaults, expectedFiles) {
  const licenseBytes = await readFile(resolve(directory, "LICENSE"));
  const snapshot = await loadPaletteSnapshot(directory);
  const originalThemeBytes = await readThemeDirectory(
    resolve(directory, "themes")
  );
  const normalizedThemeBytes = await readThemeDirectory(
    resolve(directory, "normalized")
  );
  if (!Buffer.from(licenseBytes).equals(Buffer.from(expectedFiles.licenseBytes))) {
    throw new Error("落盘的 MIT 许可与仓库内许可源不一致。");
  }
  for (const slug of snapshot.registry.items.map((item) => item.name)) {
    const raw = parseJson(originalThemeBytes[slug], `themes/${slug}.json`);
    const expected = normalizeStyleKitTheme(
      slug,
      raw,
      defaults,
      sha256(originalThemeBytes[slug])
    ).palette;
    if (
      !Buffer.from(jsonBytes(expected)).equals(
        Buffer.from(normalizedThemeBytes[slug])
      )
    ) {
      throw new Error(`主题 ${slug} 的归一化数据不能从原文重现。`);
    }
  }
  return snapshot;
}

async function writeSnapshot(directory, files, manifest) {
  await mkdir(resolve(directory, "themes"), { recursive: true });
  await mkdir(resolve(directory, "normalized"), { recursive: true });
  await writeFile(resolve(directory, "registry.json"), files.registryBytes, {
    flag: "wx",
  });
  await writeFile(resolve(directory, "snapshot.json"), jsonBytes(manifest), {
    flag: "wx",
  });
  await writeFile(resolve(directory, "LICENSE"), files.licenseBytes, {
    flag: "wx",
  });
  for (const slug of files.slugs) {
    await writeFile(
      resolve(directory, "themes", `${slug}.json`),
      files.originalThemeBytes[slug],
      { flag: "wx" }
    );
    await writeFile(
      resolve(directory, "normalized", `${slug}.json`),
      files.normalizedThemeBytes[slug],
      { flag: "wx" }
    );
  }
}

async function existingSnapshotIsOrdinaryDirectory(path) {
  try {
    const info = await lstat(path);
    if (!info.isDirectory() || info.isSymbolicLink()) {
      throw new Error("现有 StyleKit 快照不是普通目录，拒绝替换。");
    }
    return true;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

async function replaceSnapshot(stageRoot) {
  ensureInside(PALETTES_ROOT, SNAPSHOT_ROOT);
  const backupRoot = resolve(
    PALETTES_ROOT,
    `.stylekit-backup-${process.pid}-${Date.now()}`
  );
  ensureInside(PALETTES_ROOT, backupRoot);
  const hasExistingSnapshot = await existingSnapshotIsOrdinaryDirectory(
    SNAPSHOT_ROOT
  );

  if (hasExistingSnapshot) await rename(SNAPSHOT_ROOT, backupRoot);
  try {
    await rename(stageRoot, SNAPSHOT_ROOT);
  } catch (error) {
    if (hasExistingSnapshot) await rename(backupRoot, SNAPSHOT_ROOT);
    throw error;
  }
  if (hasExistingSnapshot) {
    try {
      await rm(backupRoot, { force: true, recursive: true });
    } catch {
      console.warn("旧快照备份未能自动清理：", backupRoot);
    }
  }
}

async function main() {
  ensureInside(PALETTES_ROOT, SNAPSHOT_ROOT);
  const tokensCss = await readFile(
    resolve(WORKSPACE_ROOT, "src/skin/tokens.css"),
    "utf8"
  );
  const skin = JSON.parse(
    await readFile(resolve(WORKSPACE_ROOT, "src/skin/skin.json"), "utf8")
  );
  const defaults = parseDefaultSkinTokens(tokensCss, skin.customization.radius);
  const licenseBytes = await readFile(LICENSE_SOURCE);
  const licenseText = decoder.decode(licenseBytes);
  if (
    licenseBytes.byteLength === 0 ||
    licenseBytes.byteLength > MAX_LICENSE_BYTES ||
    !licenseText.includes("MIT License") ||
    !licenseText.includes("Copyright (c) 2026 AnxForever")
  ) {
    throw new Error("仓库内 StyleKit MIT 许可源无效。");
  }

  const registryBytes = await fetchBytes(STYLEKIT_REGISTRY_URL, {
    contentType: "application/json",
    maxBytes: MAX_JSON_BYTES,
  });
  const { slugs } = parseRegistry(registryBytes);
  if (slugs.length === 0) throw new Error("StyleKit 索引没有主题。");

  console.log(
    `正在下载 ${slugs.length} 个 StyleKit 主题，最多并发 ${DOWNLOAD_CONCURRENCY} 个。`
  );
  const originalThemeBytes = await downloadThemes(slugs);
  const normalization = normalizeThemes(slugs, originalThemeBytes, defaults);
  const fetchedAt = new Date().toISOString();
  const manifest = createManifest({
    fetchedAt,
    licenseBytes,
    normalizedThemeBytes: normalization.normalizedThemeBytes,
    originalThemeBytes,
    registryBytes,
    slugs,
  });
  const files = {
    licenseBytes,
    manifestBytes: jsonBytes(manifest),
    normalizedThemeBytes: normalization.normalizedThemeBytes,
    originalThemeBytes,
    registryBytes,
    slugs,
  };
  validatePaletteSnapshot({
    licenseBytes,
    manifestBytes: files.manifestBytes,
    normalizedThemeBytes: files.normalizedThemeBytes,
    originalThemeBytes,
    registryBytes,
  });

  const stageRoot = resolve(
    PALETTES_ROOT,
    `.stylekit-stage-${process.pid}-${Date.now()}`
  );
  ensureInside(PALETTES_ROOT, stageRoot);
  await mkdir(PALETTES_ROOT, { recursive: true });
  await mkdir(stageRoot, { recursive: false });
  try {
    await writeSnapshot(stageRoot, files, manifest);
    const stagedSnapshot = await verifySnapshotDirectory(stageRoot, defaults, {
      licenseBytes,
    });
    if (stagedSnapshot.manifest.themeCount !== slugs.length) {
      throw new Error("落盘后的主题数量与下载索引不一致。");
    }
    await replaceSnapshot(stageRoot);
  } catch (error) {
    await rm(stageRoot, { force: true, recursive: true });
    throw error;
  }

  const clampedThemes = [
    ...new Set(normalization.radiusClamps.map((warning) => warning.id)),
  ].sort();
  console.log(
    JSON.stringify(
      {
        fetchedAt,
        themeCount: slugs.length,
        rawThemeFiles: Object.keys(originalThemeBytes).length,
        normalizedThemeFiles: Object.keys(normalization.normalizedThemeBytes)
          .length,
        licenseBytes: licenseBytes.byteLength,
        registrySha256: manifest.registrySha256,
        originalThemesSha256: manifest.originalThemesSha256,
        normalizedThemesSha256: manifest.normalizedThemesSha256,
        licenseSha256: manifest.licenseSha256,
        radiusClampedThemes: clampedThemes,
        radiusPixelInputs: normalization.radiusPixels,
        contrastWarnings: normalization.contrastWarnings.length,
        ignoredKeysSeen: normalization.ignoredKeys,
        destination: relative(WORKSPACE_ROOT, SNAPSHOT_ROOT),
        verified: true,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "同步失败。");
  process.exitCode = 1;
});
