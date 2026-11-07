import { lstat, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import semver from "semver";
import { parseDocument } from "yaml";
import { failSkin } from "./errors.js";
import { isRecord, validatePosixRelativePath } from "./paths.js";
import type { SkinAsset, SkinManifest, SkinTheme } from "./types.js";

const ROOT_KEYS = [
  "schemaVersion",
  "id",
  "name",
  "version",
  "compatibility",
  "modules",
  "viewEntries",
  "uiOverrides",
  "customization",
  "supportsPalettes",
  "dependencies",
  "demo",
  "assets",
  "files",
] as const;

const THEMES = new Set<SkinTheme>(["system", "light", "dark"]);
const HASH_PATTERN = /^[a-f0-9]{64}$/u;
const PACKAGE_NAME_PATTERN =
  /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/u;
const MODULE_ID_PATTERN = /^[a-z][a-z0-9-]{0,63}$/u;
const ID_PATTERN = /^[a-z0-9][a-z0-9._-]{0,95}$/u;
const UI_FILE_PATTERN = /^[a-z0-9][a-z0-9._-]{0,127}\.(?:tsx?|jsx?)$/u;
const CSS_VARIABLE_PATTERN = /^--[a-z][a-z0-9-]{0,126}$/u;
const MAX_COLLECTION_SIZE = 512;
const MAX_STRING_LENGTH = 2048;

function knownKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
  label: string
): void {
  const allowed = new Set(expected);
  if (Object.keys(value).some((key) => !allowed.has(key))) {
    failSkin([`${label} contains an unknown field`]);
  }
}

function requireString(value: unknown, label: string, max = MAX_STRING_LENGTH) {
  if (typeof value !== "string" || value.length === 0 || value.length > max) {
    failSkin([
      `${label} must be a non-empty string of at most ${max} characters`,
    ]);
  }
  return value;
}

function requireArray(value: unknown, label: string): readonly unknown[] {
  if (!Array.isArray(value) || value.length > MAX_COLLECTION_SIZE) {
    failSkin([
      `${label} must be an array with at most ${MAX_COLLECTION_SIZE} entries`,
    ]);
  }
  return value;
}

function requireStrictVersion(value: unknown, label: string): string {
  const version = requireString(value, label, 128);
  const parsed = semver.parse(version);
  if (
    !parsed ||
    parsed.version !== version ||
    parsed.prerelease.length > 0 ||
    parsed.build.length > 0
  ) {
    failSkin([`${label} must be a strict released semantic version`]);
  }
  return version;
}

function requireExactPackageVersion(value: unknown, label: string): string {
  return requireStrictVersion(value, label);
}

function parseStringList(value: unknown, label: string): string[] {
  const items = requireArray(value, label).map((item, index) =>
    requireString(item, `${label}[${index}]`, 128)
  );
  if (new Set(items).size !== items.length) {
    failSkin([`${label} must not contain duplicates`]);
  }
  return items;
}

function parseStringMap(
  value: unknown,
  label: string,
  validateKey: (key: string) => void,
  validateValue: (value: unknown, key: string) => string
): Record<string, string> {
  if (!isRecord(value) || Object.keys(value).length > MAX_COLLECTION_SIZE) {
    failSkin([
      `${label} must be an object with at most ${MAX_COLLECTION_SIZE} entries`,
    ]);
  }
  const result: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value)) {
    validateKey(key);
    result[key] = validateValue(entry, key);
  }
  return result;
}

function parseCustomization(value: unknown): SkinManifest["customization"] {
  if (!isRecord(value)) failSkin(["customization must be an object"]);
  knownKeys(
    value,
    ["brandColor", "radius", "fonts", "defaultTheme"],
    "customization"
  );

  let brandColor: SkinManifest["customization"]["brandColor"] = null;
  if (value.brandColor !== null) {
    if (!isRecord(value.brandColor)) {
      failSkin(["customization.brandColor must be an object or null"]);
    }
    knownKeys(
      value.brandColor,
      ["variable", "foregroundVariable"],
      "customization.brandColor"
    );
    const variable = requireString(
      value.brandColor.variable,
      "customization.brandColor.variable",
      128
    );
    const foregroundVariable = requireString(
      value.brandColor.foregroundVariable,
      "customization.brandColor.foregroundVariable",
      128
    );
    if (
      !CSS_VARIABLE_PATTERN.test(variable) ||
      !CSS_VARIABLE_PATTERN.test(foregroundVariable)
    ) {
      failSkin(["customization.brandColor must name CSS variables"]);
    }
    brandColor = { variable, foregroundVariable };
  }

  let radius: SkinManifest["customization"]["radius"] = null;
  if (value.radius !== null) {
    if (!isRecord(value.radius)) {
      failSkin(["customization.radius must be an object or null"]);
    }
    knownKeys(
      value.radius,
      ["variable", "min", "max", "unit"],
      "customization.radius"
    );
    const variable = requireString(
      value.radius.variable,
      "customization.radius.variable",
      128
    );
    const min = value.radius.min;
    const max = value.radius.max;
    if (
      !CSS_VARIABLE_PATTERN.test(variable) ||
      typeof min !== "number" ||
      !Number.isFinite(min) ||
      typeof max !== "number" ||
      !Number.isFinite(max) ||
      min < 0 ||
      max < min ||
      value.radius.unit !== "rem"
    ) {
      failSkin(["customization.radius has an invalid variable or range"]);
    }
    radius = { variable, min, max, unit: "rem" };
  }

  let fonts: SkinManifest["customization"]["fonts"] = null;
  if (value.fonts !== null) {
    if (!isRecord(value.fonts))
      failSkin(["customization.fonts must be an object or null"]);
    knownKeys(value.fonts, ["body", "heading", "mono"], "customization.fonts");
    const parseOptions = (items: unknown, label: string) => {
      const options = requireArray(items, label).map((item, index) => {
        if (!isRecord(item)) failSkin([`${label}[${index}] must be an object`]);
        knownKeys(item, ["id", "label"], `${label}[${index}]`);
        return {
          id: requireString(item.id, `${label}[${index}].id`, 128),
          label: requireString(item.label, `${label}[${index}].label`, 256),
        };
      });
      if (
        options.length === 0 ||
        new Set(options.map(({ id }) => id)).size !== options.length
      ) {
        failSkin([`${label} must have unique font options`]);
      }
      return options;
    };
    fonts = {
      body: parseOptions(value.fonts.body, "customization.fonts.body"),
      heading: parseOptions(value.fonts.heading, "customization.fonts.heading"),
      mono: parseOptions(value.fonts.mono, "customization.fonts.mono"),
    };
  }

  const defaultTheme = parseStringList(
    value.defaultTheme,
    "customization.defaultTheme"
  );
  if (
    defaultTheme.length === 0 ||
    defaultTheme.some((theme) => !THEMES.has(theme as SkinTheme))
  ) {
    failSkin(["customization.defaultTheme contains an unsupported theme"]);
  }

  return {
    brandColor,
    radius,
    fonts,
    defaultTheme: defaultTheme as SkinTheme[],
  };
}

function hasCredentialLikeSource(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.username || url.password) return true;
    for (const key of url.searchParams.keys()) {
      if (/(?:token|secret|password|credential|api[-_]?key|auth)/iu.test(key)) {
        return true;
      }
    }
  } catch {
    return /(?:token|secret|password|credential|api[-_]?key)=/iu.test(value);
  }
  return false;
}

function parseAssets(value: unknown): SkinAsset[] {
  const assets = requireArray(value, "assets").map((asset, index) => {
    const label = `assets[${index}]`;
    if (!isRecord(asset)) failSkin([`${label} must be an object`]);
    const kind = asset.kind;
    if (kind !== "file" && kind !== "dependency" && kind !== "inline") {
      failSkin([`${label}.kind is unsupported`]);
    }
    knownKeys(
      asset,
      [
        "id",
        "kind",
        "author",
        "source",
        "license",
        "purpose",
        "files",
        "package",
      ],
      label
    );
    const id = requireString(asset.id, `${label}.id`, 128);
    if (!ID_PATTERN.test(id)) failSkin([`${label}.id has an invalid format`]);
    const author = requireString(asset.author, `${label}.author`, 256);
    const source = requireString(asset.source, `${label}.source`);
    if (hasCredentialLikeSource(source)) {
      failSkin([`${label}.source must not contain credentials`]);
    }
    const license = requireString(asset.license, `${label}.license`, 256);
    const purpose = asset.purpose;
    if (purpose !== "functional" && purpose !== "visual") {
      failSkin([`${label}.purpose is unsupported`]);
    }
    const files =
      asset.files === undefined
        ? undefined
        : parseStringList(asset.files, `${label}.files`).map((file) =>
            validatePosixRelativePath(file, `${label}.files`)
          );

    let packageInfo: SkinAsset["package"];
    if (asset.package !== undefined) {
      if (!isRecord(asset.package))
        failSkin([`${label}.package must be an object`]);
      knownKeys(asset.package, ["name", "version"], `${label}.package`);
      const name = requireString(
        asset.package.name,
        `${label}.package.name`,
        256
      );
      if (!PACKAGE_NAME_PATTERN.test(name)) {
        failSkin([`${label}.package.name has an invalid package name`]);
      }
      packageInfo = {
        name,
        version: requireExactPackageVersion(
          asset.package.version,
          `${label}.package.version`
        ),
      };
    }

    if (kind === "file" && (!files || files.length === 0 || packageInfo)) {
      failSkin([
        `${label} file assets require files and cannot name a package`,
      ]);
    }
    if (kind === "dependency" && (!packageInfo || files)) {
      failSkin([`${label} dependency assets require package metadata only`]);
    }
    if (kind === "inline" && packageInfo) {
      failSkin([`${label} inline assets cannot name a package`]);
    }

    return {
      id,
      kind,
      author,
      source,
      license,
      purpose,
      ...(files !== undefined ? { files } : {}),
      ...(packageInfo !== undefined ? { package: packageInfo } : {}),
    } satisfies SkinAsset;
  });
  if (new Set(assets.map(({ id }) => id)).size !== assets.length) {
    failSkin(["assets must have unique ids"]);
  }
  return assets;
}

export function parseSkinManifest(value: unknown): SkinManifest {
  if (!isRecord(value)) failSkin(["skin.json must contain an object"]);
  knownKeys(value, ROOT_KEYS, "skin.json");
  if (value.schemaVersion !== 1) {
    failSkin(["skin.json schemaVersion must be 1"]);
  }

  const id = requireString(value.id, "skin.json.id", 96);
  if (!ID_PATTERN.test(id)) failSkin(["skin.json.id has an invalid format"]);
  const name = requireString(value.name, "skin.json.name", 128);
  const version = requireStrictVersion(value.version, "skin.json.version");

  if (!isRecord(value.compatibility)) {
    failSkin(["skin.json.compatibility must be an object"]);
  }
  knownKeys(value.compatibility, ["template", "viewApi"], "compatibility");
  const templateRange = requireString(
    value.compatibility.template,
    "compatibility.template",
    128
  );
  if (!semver.validRange(templateRange)) {
    failSkin(["compatibility.template must be a valid semantic version range"]);
  }
  if (
    typeof value.compatibility.viewApi !== "number" ||
    !Number.isSafeInteger(value.compatibility.viewApi) ||
    value.compatibility.viewApi < 1
  ) {
    failSkin(["compatibility.viewApi must be a positive integer"]);
  }

  const modules = parseStringList(value.modules, "modules");
  if (modules.some((module) => !MODULE_ID_PATTERN.test(module))) {
    failSkin(["modules contains an invalid module id"]);
  }
  const viewEntries = parseStringMap(
    value.viewEntries,
    "viewEntries",
    (module) => {
      if (!MODULE_ID_PATTERN.test(module)) {
        failSkin(["viewEntries contains an invalid module id"]);
      }
    },
    (entry, module) => {
      const path = validatePosixRelativePath(
        requireString(entry, `viewEntries.${module}`, 256),
        `viewEntries.${module}`
      );
      if (!path.startsWith("views/") || !/\.tsx?$/u.test(path)) {
        failSkin([
          `viewEntries.${module} must point to a .ts or .tsx file under views/`,
        ]);
      }
      return path;
    }
  );
  if (
    Object.keys(viewEntries).some((module) => !modules.includes(module)) ||
    Object.keys(viewEntries).length !== new Set(Object.keys(viewEntries)).size
  ) {
    failSkin(["viewEntries keys must be unique supported module ids"]);
  }

  const uiOverrides = parseStringMap(
    value.uiOverrides,
    "uiOverrides",
    (component) => {
      if (!UI_FILE_PATTERN.test(component)) {
        failSkin(["uiOverrides keys must be stable component filenames"]);
      }
    },
    (entry, component) => {
      const path = validatePosixRelativePath(
        requireString(entry, `uiOverrides.${component}`, 256),
        `uiOverrides.${component}`
      );
      if (!path.startsWith("ui/") || !/\.(?:tsx?|jsx?)$/u.test(path)) {
        failSkin([
          `uiOverrides.${component} must point to a source file under ui/`,
        ]);
      }
      return path;
    }
  );

  if (typeof value.supportsPalettes !== "boolean") {
    failSkin(["supportsPalettes must be a boolean"]);
  }
  const dependencies = parseStringMap(
    value.dependencies,
    "dependencies",
    (name) => {
      if (!PACKAGE_NAME_PATTERN.test(name)) {
        failSkin(["dependencies contains an invalid package name"]);
      }
    },
    (entry, name) => requireExactPackageVersion(entry, `dependencies.${name}`)
  );
  const assets = parseAssets(value.assets);
  const files = parseStringMap(
    value.files,
    "files",
    (file) => {
      validatePosixRelativePath(file, "files path");
      if (file === "skin.json") failSkin(["files must exclude skin.json"]);
    },
    (hash, file) => {
      const result = requireString(hash, `files.${file}`, 64);
      if (!HASH_PATTERN.test(result)) {
        failSkin([`files.${file} must contain a lowercase SHA-256 hash`]);
      }
      return result;
    }
  );

  let demo: SkinManifest["demo"];
  if (value.demo !== undefined) {
    if (!isRecord(value.demo)) {
      failSkin(["demo must be an object"]);
    }
    knownKeys(value.demo, ["data"], "demo");
    const data = validatePosixRelativePath(
      requireString(value.demo.data, "demo.data", 512),
      "demo.data"
    );
    if (!data.startsWith("demo/") || !data.endsWith(".json")) {
      failSkin(["demo.data must point to a JSON file under demo/"]);
    }
    if (!Object.hasOwn(files, data)) {
      failSkin(["demo.data must be covered by files hashes"]);
    }
    demo = { data };
  }

  if (
    assets.some(
      (asset) =>
        asset.kind === "dependency" &&
        asset.package &&
        dependencies[asset.package.name] !== asset.package.version
    )
  ) {
    failSkin([
      "Dependency assets must match the exact declared package version",
    ]);
  }

  return {
    schemaVersion: 1,
    id,
    name,
    version,
    compatibility: {
      template: templateRange,
      viewApi: value.compatibility.viewApi,
    },
    modules,
    viewEntries,
    uiOverrides,
    customization: parseCustomization(value.customization),
    supportsPalettes: value.supportsPalettes,
    dependencies,
    ...(demo ? { demo } : {}),
    assets,
    files,
  };
}

export async function readSkinManifest(
  directory: string
): Promise<SkinManifest> {
  let source: string;
  try {
    const info = await lstat(resolve(directory, "skin.json"));
    if (!info.isFile() || info.isSymbolicLink()) {
      failSkin(["skin.json must be a regular file"]);
    }
    source = await readFile(resolve(directory, "skin.json"), "utf8");
  } catch {
    failSkin(["Could not read skin.json"]);
  }

  const document = parseDocument(source, {
    schema: "json",
    uniqueKeys: true,
  });
  if (document.errors.length > 0) {
    failSkin(["skin.json contains invalid JSON or duplicate keys"]);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(source) as unknown;
  } catch {
    failSkin(["skin.json contains invalid JSON"]);
  }
  return parseSkinManifest(parsed);
}

export function serializeSkinManifest(manifest: SkinManifest): string {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}
