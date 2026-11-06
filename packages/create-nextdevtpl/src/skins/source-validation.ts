import { access, readFile } from "node:fs/promises";
import { builtinModules } from "node:module";
import { extname, join, posix } from "node:path";
import ts from "typescript";

import type { CatalogModule, RecipeCatalog } from "../types.js";
import { failSkin } from "./errors.js";
import {
  isRecord,
  resolvePackagePath,
  validatePosixRelativePath,
} from "./paths.js";
import { inspectSkinCss } from "./skin-css-validation.js";
import {
  exportedSkinViews,
  skinModuleSpecifiers,
  validateStaticSkinConfig,
} from "./skin-source-static.js";
import type { SkinManifest } from "./types.js";

const BUILTIN_MODULES = new Set(
  builtinModules.flatMap((name) => [name, `node:${name}`])
);
const FORBIDDEN_PACKAGES = new Set([
  "@neondatabase/serverless",
  "@sentry/nextjs",
  "better-auth",
  "drizzle-orm",
  "inngest",
  "mysql",
  "mysql2",
  "next-safe-action",
  "next/server",
  "next/headers",
  "nodemailer",
  "openai",
  "pg",
  "prisma",
  "react-dom/server",
  "resend",
  "sqlite3",
  "better-sqlite3",
]);
const SOURCE_EXTENSIONS = [
  ".ts",
  ".tsx",
  ".mts",
  ".cts",
  ".js",
  ".jsx",
] as const;
const CSS_EXTENSIONS = [".css"] as const;
const ASSET_EXTENSIONS = [
  ".avif",
  ".gif",
  ".ico",
  ".jpeg",
  ".jpg",
  ".png",
  ".svg",
  ".webp",
  ".woff",
  ".woff2",
  ".ttf",
  ".otf",
  ".eot",
] as const;

export interface SkinSourceAnalysis {
  readonly reachableFiles: ReadonlySet<string>;
  readonly viewFiles: ReadonlyMap<string, string>;
  readonly viewIds: ReadonlyMap<string, readonly string[]>;
}

interface ScanContext {
  directory: string;
  templateDirectory: string;
  manifest: SkinManifest;
  catalog: RecipeCatalog;
  packageFiles: ReadonlySet<string>;
  allowedModules: ReadonlySet<string>;
  templateDependencies: Readonly<Record<string, string>>;
  edges: Map<string, Set<string>>;
}

function moduleRoot(specifier: string): string {
  if (specifier.startsWith("@"))
    return specifier.split("/").slice(0, 2).join("/");
  return specifier.split("/")[0] ?? specifier;
}

function isDeniedPackage(packageName: string): boolean {
  return (
    FORBIDDEN_PACKAGES.has(packageName) ||
    packageName.startsWith("@aws-sdk/") ||
    packageName.startsWith("@anthropic-ai/") ||
    packageName.startsWith("@upstash/") ||
    packageName.startsWith("@prisma/") ||
    packageName.startsWith("@supabase/") ||
    packageName === "server-only"
  );
}

function resolvePackageCandidates(
  importer: string,
  specifier: string
): string[] {
  const base = specifier.startsWith("/")
    ? specifier.slice(1)
    : posix.normalize(posix.join(posix.dirname(importer), specifier));
  validatePosixRelativePath(base, "Skin import path");
  const extension = extname(base);
  if (extension) return [base];
  return [
    ...SOURCE_EXTENSIONS.map((candidate) => `${base}${candidate}`),
    ...CSS_EXTENSIONS.map((candidate) => `${base}${candidate}`),
    ...ASSET_EXTENSIONS.map((candidate) => `${base}${candidate}`),
    ...SOURCE_EXTENSIONS.map((candidate) => `${base}/index${candidate}`),
  ];
}

function resolveCoreSourceCandidates(
  templateDirectory: string,
  sourcePath: string
): string[] {
  const root = join(templateDirectory, "src", ...sourcePath.split("/"));
  const extension = extname(root);
  if (extension) return [root];
  return [
    ...SOURCE_EXTENSIONS.map((candidate) => `${root}${candidate}`),
    ...SOURCE_EXTENSIONS.map((candidate) => join(root, `index${candidate}`)),
  ];
}

async function firstExisting(paths: readonly string[]): Promise<string | null> {
  for (const path of paths) {
    try {
      await access(path);
      return path;
    } catch {
      // Try the next static resolution candidate.
    }
  }
  return null;
}

function skinAliasPath(specifier: string): string | null {
  if (specifier === "@/skin") return "";
  if (!specifier.startsWith("@/skin/")) return null;
  return specifier.slice("@/skin/".length);
}

async function resolveCoreAlias(
  context: ScanContext,
  specifier: string
): Promise<{ corePath: string; packagePath?: string }> {
  const skinPath = skinAliasPath(specifier);
  if (skinPath !== null) {
    if (!skinPath) failSkin(["Skin code must not import its package root"]);
    const candidates = resolvePackageCandidates("", skinPath);
    const match = candidates.find((candidate) =>
      context.packageFiles.has(candidate)
    );
    if (!match)
      failSkin(["Skin alias does not resolve to a declared package file"]);
    return { corePath: match, packagePath: match };
  }

  if (specifier === "@/components/ui-utils") {
    const corePath = await firstExisting(
      resolveCoreSourceCandidates(
        context.templateDirectory,
        "components/ui-utils"
      )
    );
    if (!corePath)
      failSkin(["Template is missing the stable UI utility entry"]);
    return {
      corePath: corePath
        .slice(context.templateDirectory.length + 1)
        .replaceAll("\\", "/"),
    };
  }
  if (specifier.startsWith("@/components/ui/")) {
    const componentPath = specifier.slice("@/components/ui/".length);
    const candidates = resolveCoreSourceCandidates(
      context.templateDirectory,
      `components/ui/${componentPath}`
    );
    const coreFile = await firstExisting(candidates);
    if (!coreFile) failSkin(["Skin imports an unknown core UI component"]);
    const componentFile = coreFile.split(/[\\/]/u).at(-1) ?? "";
    const packageOverride = context.manifest.uiOverrides[componentFile];
    if (packageOverride) {
      return { corePath: packageOverride, packagePath: packageOverride };
    }
    return {
      corePath: coreFile
        .slice(context.templateDirectory.length + 1)
        .replaceAll("\\", "/"),
    };
  }

  if (specifier === "@/core/skin") {
    const corePath = await firstExisting(
      resolveCoreSourceCandidates(context.templateDirectory, "core/skin")
    );
    if (!corePath) failSkin(["Template is missing the skin contract entry"]);
    return {
      corePath: corePath
        .slice(context.templateDirectory.length + 1)
        .replaceAll("\\", "/"),
    };
  }
  if (
    specifier === "@/modules/view-runtime" ||
    specifier === "@/i18n/routing"
  ) {
    const sourcePath =
      specifier === "@/modules/view-runtime"
        ? "modules/view-runtime"
        : "i18n/routing";
    const corePath = await firstExisting(
      resolveCoreSourceCandidates(context.templateDirectory, sourcePath)
    );
    if (!corePath) failSkin(["Skin imports an unavailable public core entry"]);
    return {
      corePath: corePath
        .slice(context.templateDirectory.length + 1)
        .replaceAll("\\", "/"),
    };
  }

  const viewMatch = /^@\/features\/([a-z][a-z0-9-]*)\/view$/u.exec(specifier);
  if (viewMatch) {
    const moduleId = viewMatch[1] ?? "";
    if (!context.allowedModules.has(moduleId)) {
      failSkin(["Skin imports a view controller for an unsupported module"]);
    }
    const sourcePath = `features/${moduleId}/view`;
    const corePath = await firstExisting(
      resolveCoreSourceCandidates(context.templateDirectory, sourcePath)
    );
    if (!corePath)
      failSkin(["Skin imports a view entry missing from the template"]);
    return {
      corePath: corePath
        .slice(context.templateDirectory.length + 1)
        .replaceAll("\\", "/"),
    };
  }

  if (specifier.startsWith("@/") && specifier.includes("/view/")) {
    failSkin(["Skin may import only a feature module's public /view entry"]);
  }
  if (specifier.startsWith("@/")) {
    failSkin(["Skin imports a private core path"]);
  }
  return { corePath: specifier };
}

function addEdge(context: ScanContext, from: string, to: string) {
  const edges = context.edges.get(from) ?? new Set<string>();
  edges.add(to);
  context.edges.set(from, edges);
}

async function resolveModuleSpecifier(
  context: ScanContext,
  importer: string,
  specifier: string
): Promise<void> {
  if (BUILTIN_MODULES.has(specifier)) {
    failSkin(["Skin code must not import Node.js built-in modules"]);
  }
  if (specifier.startsWith("node:")) {
    failSkin(["Skin code must not import Node.js built-in modules"]);
  }

  if (specifier.startsWith("@/")) {
    const resolved = await resolveCoreAlias(context, specifier);
    if (resolved.packagePath) addEdge(context, importer, resolved.packagePath);
    return;
  }

  if (specifier.startsWith("./") || specifier.startsWith("../")) {
    const candidates = resolvePackageCandidates(importer, specifier);
    const match = candidates.find((candidate) =>
      context.packageFiles.has(candidate)
    );
    if (!match)
      failSkin([
        "Relative skin import does not resolve to a declared package file",
      ]);
    addEdge(context, importer, match);
    return;
  }

  if (specifier.startsWith("/") || specifier.includes("\\")) {
    failSkin(["Skin import paths must be relative or use an approved alias"]);
  }
  const packageName = moduleRoot(specifier);
  if (isDeniedPackage(packageName)) {
    failSkin(["Skin code imports a prohibited server or provider package"]);
  }
  const declaredVersion = context.manifest.dependencies[packageName];
  const templateVersion = context.templateDependencies[packageName];
  if (!declaredVersion && !templateVersion) {
    failSkin(["Skin imports an undeclared UI dependency"]);
  }
}

function resolveCssLocalPath(
  context: ScanContext,
  importer: string,
  specifier: string
): string {
  let decoded: string;
  try {
    decoded = decodeURIComponent(specifier);
  } catch {
    failSkin(["CSS URL contains an invalid escape"]);
  }
  if (decoded !== specifier && /%(?:2e|2f|5c|3a)/iu.test(specifier)) {
    failSkin(["CSS URL uses an encoded path separator or traversal segment"]);
  }
  if (
    decoded.startsWith("/") ||
    decoded.startsWith("\\") ||
    /^[A-Za-z]:/u.test(decoded) ||
    /^[A-Za-z][A-Za-z0-9+.-]*:/u.test(decoded)
  ) {
    failSkin(["CSS URLs must be local package paths"]);
  }
  const candidates = resolvePackageCandidates(importer, decoded);
  const match = candidates.find((candidate) =>
    context.packageFiles.has(candidate)
  );
  if (!match) failSkin(["CSS URL does not resolve to a declared package file"]);
  addEdge(context, importer, match);
  return match;
}

function packageDependencies(
  templateDirectory: string
): Promise<Record<string, string>> {
  return readFile(join(templateDirectory, "package.json"), "utf8")
    .then((source) => JSON.parse(source) as unknown)
    .then((value) => {
      if (!isRecord(value)) failSkin(["Template package.json is invalid"]);
      const dependencies = isRecord(value.dependencies)
        ? value.dependencies
        : {};
      return Object.fromEntries(
        Object.entries(dependencies).filter(
          (entry): entry is [string, string] => typeof entry[1] === "string"
        )
      );
    })
    .catch(() => failSkin(["Could not read template package dependencies"]));
}

export async function analyzeSkinSources(input: {
  directory: string;
  templateDirectory: string;
  manifest: SkinManifest;
  catalog: RecipeCatalog;
  packageFiles: readonly string[];
  allowedModules: readonly string[];
  rootModules?: readonly string[];
  rootFiles?: readonly string[];
  fileContents?: ReadonlyMap<string, Buffer>;
}): Promise<SkinSourceAnalysis> {
  const readSkinFile = async (path: string): Promise<Buffer> => {
    const inMemory = input.fileContents?.get(path);
    return inMemory ?? readFile(resolvePackagePath(input.directory, path));
  };
  const context: ScanContext = {
    directory: input.directory,
    templateDirectory: input.templateDirectory,
    manifest: input.manifest,
    catalog: input.catalog,
    packageFiles: new Set(input.packageFiles),
    allowedModules: new Set(input.allowedModules),
    templateDependencies: await packageDependencies(input.templateDirectory),
    edges: new Map(),
  };

  for (const relativePath of input.packageFiles) {
    const extension = extname(relativePath).toLowerCase();
    if (
      ![...SOURCE_EXTENSIONS].includes(
        extension as (typeof SOURCE_EXTENSIONS)[number]
      )
    ) {
      if (extension === ".css") {
        const content = (await readSkinFile(relativePath))
          .toString("utf8")
          .replace(/^\uFEFF/u, "");
        await inspectSkinCss({
          content,
          manifest: context.manifest,
          relativePath,
          templateDependencies: context.templateDependencies,
          moduleRoot,
          isDeniedPackage,
          resolveLocalPath: async (importer, specifier) =>
            resolveCssLocalPath(context, importer, specifier),
        });
      }
      continue;
    }

    const content = (await readSkinFile(relativePath)).toString("utf8");
    const source = ts.createSourceFile(
      relativePath,
      content,
      ts.ScriptTarget.Latest,
      true,
      extension === ".tsx" || extension === ".jsx"
        ? ts.ScriptKind.TSX
        : ts.ScriptKind.TS
    );
    const parsedSource = source as ts.SourceFile & {
      parseDiagnostics?: readonly ts.Diagnostic[];
    };
    if ((parsedSource.parseDiagnostics?.length ?? 0) > 0) {
      failSkin([`Skin source has a syntax error: ${relativePath}`]);
    }
    if (relativePath === "config.ts") {
      validateStaticSkinConfig(source, context.manifest, relativePath);
    }
    for (const specifier of skinModuleSpecifiers(source, relativePath)) {
      await resolveModuleSpecifier(context, relativePath, specifier);
    }
  }

  const viewFiles = new Map<string, string>();
  const viewIds = new Map<string, readonly string[]>();
  for (const [moduleId, entryPath] of Object.entries(
    input.manifest.viewEntries
  )) {
    const module = input.catalog.modules[moduleId] as CatalogModule | undefined;
    const expectedIds = module?.views?.map(({ id }) => id) ?? [];
    if (expectedIds.length === 0) {
      failSkin([
        `viewEntries declares a module without registered views: ${moduleId}`,
      ]);
    }
    const sourceText = (await readSkinFile(entryPath)).toString("utf8");
    const source = ts.createSourceFile(
      entryPath,
      sourceText,
      ts.ScriptTarget.Latest,
      true,
      entryPath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );
    const ids = exportedSkinViews(source, entryPath);
    if (
      ids.length !== expectedIds.length ||
      expectedIds.some((id) => !ids.includes(id))
    ) {
      failSkin([
        `View entry does not match the core view registry: ${moduleId}`,
      ]);
    }
    viewFiles.set(moduleId, entryPath);
    viewIds.set(moduleId, ids);
  }

  const reachableFiles = new Set<string>();
  const visit = (file: string) => {
    if (reachableFiles.has(file)) return;
    reachableFiles.add(file);
    for (const child of context.edges.get(file) ?? []) visit(child);
  };
  for (const moduleId of input.rootModules ?? input.allowedModules) {
    const entry = input.manifest.viewEntries[moduleId];
    if (entry) visit(entry);
  }
  for (const file of input.rootFiles ?? []) visit(file);
  return { reachableFiles, viewFiles, viewIds };
}
