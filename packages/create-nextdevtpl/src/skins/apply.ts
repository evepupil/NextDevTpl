import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { removePath } from "../filesystem.js";
import { writeSelectedSkinViews } from "../view-composition.js";
import { failSkin } from "./errors.js";
import { sha256, stableSkinManifestJson } from "./hash.js";
import {
  parseSkinManifest,
  readSkinManifest,
  serializeSkinManifest,
} from "./manifest.js";
import { readPackageFile, validateSkinPackageFiles } from "./package-files.js";
import { analyzeSkinSources } from "./source-validation.js";
import type { ApplySkinOptions } from "./types.js";

const REQUIRED_ROOT_FILES = ["config.ts", "fonts.ts", "tokens.css"] as const;

export async function applySkinPackage(
  options: ApplySkinOptions
): Promise<void> {
  const { skin, targetDirectory, catalog, selectedModules } = options;
  for (const module of selectedModules) {
    if (
      catalog.modules[module]?.views?.length &&
      !skin.manifest.viewEntries[module]
    ) {
      failSkin(["Selected module has no matching skin view entry"]);
    }
  }
  const fileInfo = await validateSkinPackageFiles(
    skin.directory,
    skin.manifest,
    skin.templateDirectory
  );
  const currentManifest = await readSkinManifest(skin.directory);
  if (
    stableSkinManifestJson(currentManifest) !==
    stableSkinManifestJson(skin.manifest)
  ) {
    failSkin(["Skin package changed after validation"]);
  }

  const fileContents = new Map<string, Buffer>();
  const packageHash = createHash("sha256");
  const entries = Object.entries(currentManifest.files).sort(
    ([left], [right]) =>
      Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"))
  );
  for (const [path, declaredHash] of entries) {
    const content = await readPackageFile(skin.directory, path);
    if (sha256(content) !== declaredHash) {
      failSkin([`File hash mismatch for ${path}`]);
    }
    fileContents.set(path, content);
    packageHash.update(path, "utf8");
    packageHash.update(Buffer.from([0]));
    packageHash.update(declaredHash, "utf8");
    packageHash.update("\n", "utf8");
  }
  packageHash.update(stableSkinManifestJson(currentManifest), "utf8");
  if (packageHash.digest("hex") !== skin.packageHash) {
    failSkin(["Skin package changed after validation"]);
  }

  const analysis = await analyzeSkinSources({
    directory: skin.directory,
    templateDirectory: skin.templateDirectory,
    manifest: currentManifest,
    catalog,
    packageFiles: fileInfo.files,
    allowedModules: currentManifest.modules,
    rootModules: selectedModules,
    rootFiles: [
      "config.ts",
      "fonts.ts",
      "tokens.css",
      ...Object.values(currentManifest.uiOverrides),
    ],
    fileContents,
  });

  const selectedFiles = new Set<string>(REQUIRED_ROOT_FILES);
  for (const file of analysis.reachableFiles) selectedFiles.add(file);
  for (const file of fileInfo.files) {
    if (file === "DESIGN.md") selectedFiles.add(file);
  }
  if ([...selectedFiles].some((file) => !fileContents.has(file))) {
    failSkin(["Validated skin output is missing a required package file"]);
  }

  const skinRoot = resolve(targetDirectory, "src", "skin");
  await removePath(skinRoot);
  await mkdir(skinRoot, { recursive: true });
  for (const file of selectedFiles) {
    const content = fileContents.get(file);
    if (!content)
      failSkin(["Validated skin output is missing a required package file"]);
    const destination = resolve(skinRoot, ...file.split("/"));
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, content);
  }
  for (const [component, file] of Object.entries(currentManifest.uiOverrides)) {
    const destination = resolve(
      targetDirectory,
      "src",
      "components",
      "ui",
      component
    );
    const skinEntry = file
      .replace(/^ui\//u, "")
      .replace(/\/index\.tsx?$/u, "")
      .replace(/\.tsx?$/u, "");
    await writeFile(destination, `export * from "@/skin/ui/${skinEntry}";\n`);
  }
  await writeSelectedSkinViews(
    targetDirectory,
    selectedModules,
    catalog,
    currentManifest.viewEntries
  );

  const outputFiles = Object.fromEntries(
    [...selectedFiles]
      .sort((left, right) =>
        Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"))
      )
      .map((file) => [file, sha256(fileContents.get(file)!)])
  );
  const outputSet = new Set(selectedFiles);
  const outputAssets = currentManifest.assets.flatMap((asset) => {
    const files = asset.files?.filter((file) => outputSet.has(file));
    if (asset.kind !== "dependency" && (!files || files.length === 0)) {
      return [];
    }
    return [
      {
        ...asset,
        ...(files !== undefined ? { files } : {}),
      },
    ];
  });
  const outputManifest = parseSkinManifest({
    ...currentManifest,
    modules: selectedModules,
    viewEntries: Object.fromEntries(
      selectedModules.flatMap((module) =>
        currentManifest.viewEntries[module]
          ? [[module, currentManifest.viewEntries[module]]]
          : []
      )
    ),
    assets: outputAssets,
    files: outputFiles,
  });
  await writeFile(
    resolve(skinRoot, "skin.json"),
    serializeSkinManifest(outputManifest),
    "utf8"
  );
}
