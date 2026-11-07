import { extname, posix } from "node:path";
import ts from "typescript";
import { failSkin } from "../skins/errors.js";
import { sha256 } from "../skins/hash.js";
import { readPackageFile } from "../skins/package-files.js";
import { analyzeSkinSources } from "../skins/source-validation.js";
import type { ValidatedSkin } from "../skins/types.js";
import type { RecipeCatalog } from "../types.js";
import {
  isServerOnlySpecifier,
  isSourcePath,
  localImportBase,
  packageCandidates,
  runtimeModuleSpecifiers,
  sourceKind,
} from "./syntax.js";

export const DEMO_DYNAMIC_ROOT_MODULES = [
  "dashboard",
  "settings",
  "support",
  "shared",
] as const;

export interface DemoClientAnalysis {
  readonly packageFiles: ReadonlySet<string>;
  readonly fileContents: ReadonlyMap<string, Buffer>;
  readonly sourceFiles: ReadonlyMap<string, ts.SourceFile>;
  readonly runtimeReachableFiles: ReadonlySet<string>;
  readonly rootModules: readonly string[];
}

export function resolveSkinPackagePath(
  importer: string,
  specifier: string,
  packageFiles: ReadonlySet<string>,
  skin: ValidatedSkin
): string | undefined {
  const base = localImportBase(importer, specifier);
  if (base !== undefined) {
    return packageCandidates(base).find((candidate) =>
      packageFiles.has(candidate)
    );
  }
  if (!specifier.startsWith("@/components/ui/")) return undefined;

  const requested = posix.basename(specifier.slice("@/components/ui/".length));
  const requestedName = requested.replace(/\.[^.]+$/u, "");
  return Object.entries(skin.manifest.uiOverrides).find(
    ([component]) => component.replace(/\.[^.]+$/u, "") === requestedName
  )?.[1];
}

export async function analyzeDemoClientSources(
  skin: ValidatedSkin,
  catalog: RecipeCatalog
): Promise<DemoClientAnalysis> {
  const packageFiles = new Set([
    "skin.json",
    ...Object.keys(skin.manifest.files),
  ]);
  const fileContents = new Map<string, Buffer>();
  for (const path of packageFiles) {
    if (!isSourcePath(path) && extname(path).toLowerCase() !== ".css") {
      continue;
    }
    const content = await readPackageFile(skin.directory, path);
    const expectedHash = skin.manifest.files[path];
    if (!expectedHash || sha256(content) !== expectedHash) {
      failSkin([`File hash mismatch for ${path}`]);
    }
    fileContents.set(path, content);
  }

  const rootModules = DEMO_DYNAMIC_ROOT_MODULES.filter(
    (moduleId) =>
      catalog.modules[moduleId]?.views?.length &&
      skin.manifest.viewEntries[moduleId]
  );
  const analysis = await analyzeSkinSources({
    directory: skin.directory,
    templateDirectory: skin.templateDirectory,
    manifest: skin.manifest,
    catalog,
    packageFiles: [...packageFiles],
    allowedModules: skin.manifest.modules,
    rootModules,
    fileContents,
  });

  const sourceFiles = new Map<string, ts.SourceFile>();
  for (const [path, content] of fileContents) {
    if (!isSourcePath(path)) continue;
    sourceFiles.set(
      path,
      ts.createSourceFile(
        path,
        content.toString("utf8"),
        ts.ScriptTarget.Latest,
        true,
        sourceKind(path)
      )
    );
  }

  const runtimeReachableFiles = new Set<string>();
  const visitRuntimeModule = (path: string) => {
    if (runtimeReachableFiles.has(path) || !analysis.reachableFiles.has(path)) {
      return;
    }
    const source = sourceFiles.get(path);
    if (!source) return;
    runtimeReachableFiles.add(path);
    for (const specifier of runtimeModuleSpecifiers(source)) {
      if (isServerOnlySpecifier(specifier)) {
        failSkin([`Demo view imports a server-only module: ${path}`]);
      }
      const dependency = resolveSkinPackagePath(
        path,
        specifier,
        packageFiles,
        skin
      );
      if (dependency) visitRuntimeModule(dependency);
    }
  };

  for (const moduleId of rootModules) {
    const entryPath = skin.manifest.viewEntries[moduleId];
    if (entryPath) visitRuntimeModule(entryPath);
  }

  return {
    packageFiles,
    fileContents,
    sourceFiles,
    runtimeReachableFiles,
    rootModules,
  };
}
