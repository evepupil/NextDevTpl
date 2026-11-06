import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import semver from "semver";
import { failSkin } from "./errors.js";
import { calculateSkinPackageHash, sha256 } from "./hash.js";
import { readSkinManifest } from "./manifest.js";
import { readPackageFile, validateSkinPackageFiles } from "./package-files.js";
import { analyzeSkinSources } from "./source-validation.js";
import type {
  SkinManifest,
  ValidatedSkin,
  ValidateSkinOptions,
} from "./types.js";

async function readTemplateSkinVersion(
  directory: string
): Promise<{ templateVersion: string; viewApiVersion: number }> {
  try {
    const value: unknown = JSON.parse(
      await readFile(resolve(directory, "src/core/skin/version.json"), "utf8")
    );
    if (typeof value !== "object" || value === null || Array.isArray(value))
      throw new Error();
    const record = value as Record<string, unknown>;
    if (
      typeof record.templateVersion !== "string" ||
      typeof record.viewApiVersion !== "number"
    )
      throw new Error();
    return {
      templateVersion: record.templateVersion,
      viewApiVersion: record.viewApiVersion,
    };
  } catch {
    failSkin(["Template skin version metadata is unavailable"]);
  }
}

async function validateDependencyMajors(
  directory: string,
  manifest: SkinManifest
): Promise<void> {
  let dependencies: Record<string, unknown>;
  try {
    const value: unknown = JSON.parse(
      await readFile(resolve(directory, "package.json"), "utf8")
    );
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      throw new Error();
    }
    const packageJson = value as Record<string, unknown>;
    const production = packageJson.dependencies;
    const development = packageJson.devDependencies;
    dependencies = {
      ...(typeof production === "object" && production !== null
        ? production
        : {}),
      ...(typeof development === "object" && development !== null
        ? development
        : {}),
    };
  } catch {
    failSkin(["Template dependency metadata is unavailable"]);
  }
  for (const [name, skinVersion] of Object.entries(manifest.dependencies)) {
    const templateRange = dependencies[name];
    if (typeof templateRange !== "string") continue;
    const templateMinimum = semver.minVersion(templateRange);
    const templateMajor = templateMinimum?.major;
    const skinMajor = semver.major(skinVersion);
    if (templateMajor !== undefined && templateMajor !== skinMajor) {
      failSkin([
        "Skin dependency conflicts with a template dependency major version",
      ]);
    }
  }
}

function validateModuleSelection(
  manifest: SkinManifest,
  options: ValidateSkinOptions
): void {
  const known = new Set(Object.keys(options.catalog.modules));
  if (manifest.modules.some((id) => !known.has(id)))
    failSkin(["Skin declares an unknown module"]);
  if (options.selectedModules.some((id) => !manifest.modules.includes(id))) {
    failSkin(["Selected modules are not supported by this skin"]);
  }
  for (const id of manifest.modules) {
    const module = options.catalog.modules[id];
    const hasViews = Boolean(module?.views?.length);
    if (hasViews !== Boolean(manifest.viewEntries[id])) {
      failSkin(["Skin view entries must match its declared modules"]);
    }
  }
}

export async function validateSkinPackage(
  options: ValidateSkinOptions
): Promise<ValidatedSkin> {
  const manifest = await readSkinManifest(options.directory);
  const version = await readTemplateSkinVersion(options.templateDirectory);
  if (
    manifest.compatibility.viewApi !== version.viewApiVersion ||
    !semver.satisfies(
      version.templateVersion,
      manifest.compatibility.template,
      { includePrerelease: false }
    )
  ) {
    failSkin(["Skin is incompatible with this template version"]);
  }
  validateModuleSelection(manifest, options);
  await validateDependencyMajors(options.templateDirectory, manifest);
  const packageInfo = await validateSkinPackageFiles(
    options.directory,
    manifest,
    options.templateDirectory
  );
  for (const [relativePath, declaredHash] of Object.entries(manifest.files)) {
    if (
      sha256(await readPackageFile(options.directory, relativePath)) !==
      declaredHash
    ) {
      failSkin([`File hash mismatch for ${relativePath}`]);
    }
  }
  const analysis = await analyzeSkinSources({
    directory: options.directory,
    templateDirectory: options.templateDirectory,
    manifest,
    catalog: options.catalog,
    packageFiles: packageInfo.files,
    allowedModules: manifest.modules,
    rootModules: options.selectedModules,
    rootFiles: [
      "config.ts",
      "fonts.ts",
      "tokens.css",
      ...Object.values(manifest.uiOverrides),
    ],
  });
  for (const module of options.selectedModules) {
    const entry = manifest.viewEntries[module];
    if (entry && !analysis.reachableFiles.has(entry))
      failSkin(["A selected view entry is not reachable"]);
  }
  const packageHash = await calculateSkinPackageHash(
    options.directory,
    manifest
  );
  return {
    directory: options.directory,
    templateDirectory: options.templateDirectory,
    manifest,
    packageHash,
  };
}
