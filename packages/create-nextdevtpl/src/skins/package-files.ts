import { access, lstat, readdir, readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { failSkin } from "./errors.js";
import { listPackageFiles, resolvePackagePath } from "./paths.js";
import type { SkinManifest } from "./types.js";

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
const MAX_DEMO_DATA_BYTES = 262_144;

export interface SkinPackageFiles {
  files: readonly string[];
  uiFiles: ReadonlySet<string>;
}

async function existsAsRegularFile(path: string): Promise<boolean> {
  try {
    return (await lstat(path)).isFile();
  } catch {
    return false;
  }
}

export async function validateSkinPackageFiles(
  directory: string,
  manifest: SkinManifest,
  templateDirectory: string
): Promise<SkinPackageFiles> {
  const files = await listPackageFiles(directory);
  const actual = new Set(files);
  if (!actual.has("skin.json")) failSkin(["Package is missing skin.json"]);

  for (const file of files) {
    const firstSegment = file.split("/")[0];
    if (
      file.includes("/")
        ? !ROOT_DIRECTORIES.has(firstSegment ?? "")
        : !ROOT_FILES.has(file)
    ) {
      failSkin(["Package contains a file outside the skin package layout"]);
    }
  }

  if (manifest.demo) {
    const demoPath = resolvePackagePath(directory, manifest.demo.data);
    const demoStat = await lstat(demoPath);
    if (
      !demoStat.isFile() ||
      demoStat.isSymbolicLink() ||
      demoStat.size > MAX_DEMO_DATA_BYTES
    ) {
      failSkin([
        "demo.data must be a regular JSON file no larger than 256 KiB",
      ]);
    }
  }

  for (const required of ["tokens.css", "fonts.ts", "config.ts"]) {
    if (!actual.has(required)) failSkin([`Package is missing ${required}`]);
  }

  const declared = new Set(Object.keys(manifest.files));
  const actualFiles = new Set(files.filter((file) => file !== "skin.json"));
  for (const file of declared) {
    if (!actualFiles.has(file))
      failSkin([`Manifest declares a missing file: ${file}`]);
  }
  for (const file of actualFiles) {
    if (!declared.has(file))
      failSkin([`Package file is not declared in skin.json: ${file}`]);
  }

  const componentDirectory = join(templateDirectory, "src", "components", "ui");
  let coreComponents: string[];
  try {
    coreComponents = (
      await readdir(componentDirectory, { withFileTypes: true })
    )
      .filter((entry) => entry.isFile() && /\.tsx?$/u.test(extname(entry.name)))
      .map((entry) => entry.name)
      .filter((name) => name !== "index.ts");
  } catch {
    failSkin(["Template is missing its core UI component directory"]);
  }
  const uiFiles = new Set(coreComponents);
  for (const [component, file] of Object.entries(manifest.uiOverrides)) {
    if (!uiFiles.has(component)) {
      failSkin([`UI override targets an unknown core component: ${component}`]);
    }
    if (!actual.has(file)) failSkin([`UI override file is missing: ${file}`]);
  }

  for (const entry of Object.values(manifest.viewEntries)) {
    if (!actual.has(entry)) failSkin([`View entry file is missing: ${entry}`]);
  }

  const listedAssetFiles = new Set(
    manifest.assets.flatMap((asset) => asset.files ?? [])
  );
  for (const assetFile of listedAssetFiles) {
    if (!actual.has(assetFile)) {
      failSkin(["An asset declaration refers to a missing package file"]);
    }
  }
  for (const file of files) {
    if (file.startsWith("assets/") && !listedAssetFiles.has(file)) {
      failSkin([`Asset file is not declared in skin.json: ${file}`]);
    }
    if (/\.(?:woff2?|ttf|otf|eot|png|jpe?g|webp|avif|gif|ico)$/iu.test(file)) {
      if (!listedAssetFiles.has(file)) {
        failSkin([`Media file is not declared in skin.json: ${file}`]);
      }
    }
  }

  const manifestStat = await lstat(resolvePackagePath(directory, "skin.json"));
  if (!manifestStat.isFile()) failSkin(["skin.json must be a regular file"]);
  if (
    !(await existsAsRegularFile(resolvePackagePath(directory, "tokens.css")))
  ) {
    failSkin(["tokens.css must be a regular file"]);
  }
  return { files, uiFiles };
}

export async function readPackageFile(
  directory: string,
  relativePath: string
): Promise<Buffer> {
  try {
    return await readFile(resolvePackagePath(directory, relativePath));
  } catch {
    failSkin([`Could not read package file ${relativePath}`]);
  }
}

export async function assertPackageFileExists(
  directory: string,
  relativePath: string
): Promise<void> {
  try {
    await access(resolvePackagePath(directory, relativePath));
  } catch {
    failSkin([`Package file is unavailable: ${relativePath}`]);
  }
}
