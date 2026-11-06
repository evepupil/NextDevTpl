import { access, readFile, stat } from "node:fs/promises";
import {
  basename,
  dirname,
  isAbsolute,
  relative,
  resolve,
  sep,
} from "node:path";
import { fileURLToPath } from "node:url";

import type {
  CatalogAdapter,
  CatalogModule,
  CatalogPreset,
  CatalogView,
  GeneratorAssets,
  RecipeCatalog,
} from "./types.js";

const SERVICE_KINDS = new Set([
  "ai",
  "alerts",
  "analytics",
  "jobs",
  "mail",
  "payment",
  "rate-limit",
  "storage",
]);
const DEPLOYMENT_TARGETS = new Set([
  "cloudflare",
  "docker",
  "server",
  "vercel",
]);
const RUNTIMES = new Set(["node", "universal", "worker"]);
const CLOUDFLARE_BINDINGS = new Set([
  "Ai",
  "R2Bucket",
  "RateLimit",
  "SendEmail",
  "Workflow",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

function parseViews(value: unknown): CatalogView[] | undefined {
  if (value === undefined) return undefined;
  if (
    !Array.isArray(value) ||
    value.some(
      (item) =>
        !isRecord(item) ||
        typeof item.id !== "string" ||
        (item.kind !== "page" && item.kind !== "layout")
    )
  ) {
    return undefined;
  }
  return value as CatalogView[];
}

function isRelativePath(value: string): boolean {
  return (
    value.length > 0 &&
    !value.startsWith("/") &&
    !/^[A-Za-z]:[\\/]/u.test(value) &&
    !value.split(/[\\/]/u).includes("..")
  );
}

function isWithinPath(base: string, candidate: string): boolean {
  const relativePath = relative(resolve(base), resolve(candidate));
  return (
    relativePath === "" ||
    (!isAbsolute(relativePath) &&
      relativePath !== ".." &&
      !relativePath.startsWith(`..${sep}`))
  );
}

function allowedExtraSkinSources(moduleId: string): readonly string[] {
  switch (moduleId) {
    case "auth":
      return ["src/skin/layouts/auth.tsx"];
    case "marketing":
      return ["src/skin/layouts/marketing.tsx"];
    case "shared":
      return ["src/skin/layouts/dashboard.tsx"];
    default:
      return [];
  }
}

function validateModuleViewMetadata(
  id: string,
  module: CatalogModule
): string[] {
  const errors: string[] = [];
  const views = module.views ?? [];
  const hasEntries =
    module.viewContract !== undefined ||
    module.skinEntry !== undefined ||
    module.skinSources !== undefined;
  if (views.length === 0) {
    if (hasEntries) errors.push(`模块 ${id} 的视图入口缺少 views 登记`);
    return errors;
  }

  if (
    module.viewContract !== `src/features/${id}/view/index.ts` ||
    module.skinEntry !== `src/skin/views/${id}/index.ts` ||
    !module.skinSources ||
    module.skinSources.length === 0
  ) {
    errors.push(`模块 ${id} 的视图契约、皮肤入口和来源目录必须成套登记`);
  }

  const viewIds = new Set<string>();
  for (const view of views) {
    if (
      !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*\.[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u.test(
        view.id
      ) ||
      !view.id.startsWith(`${id}.`)
    ) {
      errors.push(`模块 ${id} 登记了格式错误或归属不符的视图编号 ${view.id}`);
    }
    if (viewIds.has(view.id)) {
      errors.push(`模块 ${id} 重复登记视图 ${view.id}`);
    }
    viewIds.add(view.id);
  }

  if (!module.skinSources) return errors;
  const sourcePaths = new Set<string>();
  const viewRoot = `src/skin/views/${id}`;
  const allowedExtras = allowedExtraSkinSources(id);
  for (const source of module.skinSources) {
    if (!isRelativePath(source)) {
      errors.push(`模块 ${id} 包含无效皮肤来源路径 ${source}`);
      continue;
    }
    const normalizedSource = resolve(source);
    const normalizedViewRoot = resolve(viewRoot);
    if (
      !isWithinPath(normalizedViewRoot, normalizedSource) &&
      !allowedExtras.some((allowed) => resolve(allowed) === normalizedSource)
    ) {
      errors.push(`模块 ${id} 无权裁剪皮肤来源 ${source}`);
    }
    if (sourcePaths.has(normalizedSource)) {
      errors.push(`模块 ${id} 重复登记皮肤来源 ${source}`);
    }
    sourcePaths.add(normalizedSource);
  }
  if (!sourcePaths.has(resolve(viewRoot))) {
    errors.push(`模块 ${id} 的皮肤来源必须包含 ${viewRoot}`);
  }
  if (
    module.skinEntry &&
    !module.skinSources.some((source) =>
      isWithinPath(resolve(source), resolve(module.skinEntry!))
    )
  ) {
    errors.push(`模块 ${id} 的皮肤入口未包含在 skinSources 中`);
  }
  return errors;
}

function parseModule(id: string, value: unknown): CatalogModule {
  const views = isRecord(value) ? parseViews(value.views) : undefined;
  if (
    !isRecord(value) ||
    (value.kind !== "core" && value.kind !== "optional") ||
    !isStringArray(value.dependencies) ||
    !isStringArray(value.routes) ||
    !isStringArray(value.schema) ||
    !isStringArray(value.telemetryEvents) ||
    !isStringArray(value.translations) ||
    !isStringArray(value.env) ||
    (value.views !== undefined && views === undefined) ||
    (value.viewContract !== undefined &&
      typeof value.viewContract !== "string") ||
    (value.skinEntry !== undefined && typeof value.skinEntry !== "string") ||
    (value.skinSources !== undefined && !isStringArray(value.skinSources))
  ) {
    throw new Error(`Invalid module recipe: ${id}`);
  }
  return {
    kind: value.kind,
    dependencies: value.dependencies,
    routes: value.routes,
    schema: value.schema,
    telemetryEvents: value.telemetryEvents,
    translations: value.translations,
    env: value.env,
    ...(views !== undefined ? { views } : {}),
    ...(typeof value.viewContract === "string"
      ? { viewContract: value.viewContract }
      : {}),
    ...(typeof value.skinEntry === "string"
      ? { skinEntry: value.skinEntry }
      : {}),
    ...(isStringArray(value.skinSources)
      ? { skinSources: value.skinSources }
      : {}),
  };
}

function parseAdapter(id: string, value: unknown): CatalogAdapter {
  if (
    !isRecord(value) ||
    typeof value.service !== "string" ||
    !SERVICE_KINDS.has(value.service) ||
    typeof value.source !== "string" ||
    typeof value.runtime !== "string" ||
    !RUNTIMES.has(value.runtime) ||
    !isStringArray(value.packages) ||
    !isStringArray(value.env) ||
    !isStringArray(value.bindings) ||
    !id.startsWith(`${value.service}:`)
  ) {
    throw new Error(`Invalid adapter recipe: ${id}`);
  }
  return value as unknown as CatalogAdapter;
}

function parsePreset(id: string, value: unknown): CatalogPreset {
  if (
    !isRecord(value) ||
    !isStringArray(value.modules) ||
    !isRecord(value.adapters) ||
    typeof value.target !== "string" ||
    !DEPLOYMENT_TARGETS.has(value.target) ||
    Object.entries(value.adapters).some(
      ([service, adapter]) =>
        !SERVICE_KINDS.has(service) || typeof adapter !== "string"
    )
  ) {
    throw new Error(`Invalid preset recipe: ${id}`);
  }
  return value as unknown as CatalogPreset;
}

export interface CatalogValidationOptions {
  templateRoot?: string;
}

async function isFileOrDirectory(path: string): Promise<boolean> {
  try {
    const result = await stat(path);
    return result.isFile() || result.isDirectory();
  } catch {
    return false;
  }
}

async function isFile(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

async function readAvailableEnvironmentNames(
  templateRoot: string
): Promise<Set<string>> {
  const source = await readFile(resolve(templateRoot, ".env.example"), "utf8");
  const names = new Set<string>();
  const pattern = /^\s*#?\s*(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=/gmu;
  for (const match of source.matchAll(pattern)) {
    const name = match[1];
    if (name) names.add(name);
  }
  return names;
}

async function readAvailablePackages(
  templateRoot: string
): Promise<Set<string>> {
  const packageJson = JSON.parse(
    await readFile(resolve(templateRoot, "package.json"), "utf8")
  ) as Record<string, unknown>;
  const packageNames = new Set<string>();
  for (const field of [
    "dependencies",
    "devDependencies",
    "optionalDependencies",
    "peerDependencies",
  ]) {
    const dependencies = packageJson[field];
    if (!isRecord(dependencies)) continue;
    for (const name of Object.keys(dependencies)) packageNames.add(name);
  }
  return packageNames;
}

function inferTemplateRoot(catalogPath: string): string | undefined {
  const directory = dirname(resolve(catalogPath));
  if (basename(directory) === "recipes") {
    return resolve(directory, "..");
  }
  if (basename(directory) === "create-nextdevtpl") {
    return resolve(directory, "template");
  }
  return undefined;
}

export async function validateCatalog(
  catalog: RecipeCatalog,
  options: CatalogValidationOptions = {}
): Promise<string[]> {
  const errors: string[] = [];
  const moduleIds = new Set(Object.keys(catalog.modules));
  const adapterIds = new Set(Object.keys(catalog.adapters));
  const schemaOwners = new Map<string, string>();
  const translationOwners = new Map<string, string>();
  const routeOwners = new Map<string, string>();
  const adapterSourceOwners = new Map<string, string>();
  const viewOwners = new Map<string, string>();

  for (const [id, module] of Object.entries(catalog.modules)) {
    errors.push(...validateModuleViewMetadata(id, module));
    for (const view of module.views ?? []) {
      const owner = viewOwners.get(view.id);
      if (owner && owner !== id) {
        errors.push(`视图 ${view.id} 同时属于 ${owner} 和 ${id}`);
      } else {
        viewOwners.set(view.id, id);
      }
    }
    for (const dependency of module.dependencies) {
      if (!moduleIds.has(dependency)) {
        errors.push(`模块 ${id} 依赖未注册模块 ${dependency}`);
      }
    }
    for (const route of module.routes) {
      if (!isRelativePath(route)) {
        errors.push(`模块 ${id} 包含无效路由源码路径 ${route}`);
      }
      const owner = routeOwners.get(route);
      if (owner && owner !== id) {
        errors.push(`路由源码 ${route} 同时属于 ${owner} 和 ${id}`);
      } else {
        routeOwners.set(route, id);
      }
    }
    for (const schema of module.schema) {
      const owner = schemaOwners.get(schema);
      if (owner && owner !== id) {
        errors.push(`Schema ${schema} 同时属于 ${owner} 和 ${id}`);
      } else {
        schemaOwners.set(schema, id);
      }
    }
    for (const translation of module.translations) {
      const owner = translationOwners.get(translation);
      if (owner && owner !== id) {
        errors.push(`翻译命名空间 ${translation} 同时属于 ${owner} 和 ${id}`);
      } else {
        translationOwners.set(translation, id);
      }
    }
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visitModule = (id: string, path: readonly string[]) => {
    if (visiting.has(id)) {
      errors.push(`模块依赖存在循环：${[...path, id].join(" -> ")}`);
      return;
    }
    if (visited.has(id)) return;
    const module = catalog.modules[id];
    if (!module) return;
    visiting.add(id);
    for (const dependency of module.dependencies) {
      visitModule(dependency, [...path, id]);
    }
    visiting.delete(id);
    visited.add(id);
  };
  for (const id of moduleIds) visitModule(id, []);

  for (const [id, adapter] of Object.entries(catalog.adapters)) {
    if (!isRelativePath(adapter.source)) {
      errors.push(`适配器 ${id} 包含无效源码路径 ${adapter.source}`);
    }
    const owner = adapterSourceOwners.get(adapter.source);
    if (owner && owner !== id) {
      errors.push(`适配器源码 ${adapter.source} 同时属于 ${owner} 和 ${id}`);
    } else {
      adapterSourceOwners.set(adapter.source, id);
    }
    for (const binding of adapter.bindings) {
      if (!CLOUDFLARE_BINDINGS.has(binding)) {
        errors.push(`适配器 ${id} 使用未注册 Binding ${binding}`);
      }
    }
  }

  for (const [id, preset] of Object.entries(catalog.presets)) {
    for (const module of preset.modules) {
      if (!moduleIds.has(module)) {
        errors.push(`预设 ${id} 引用未注册模块 ${module}`);
      }
    }
    for (const [service, adapterId] of Object.entries(preset.adapters)) {
      if (!adapterIds.has(adapterId)) {
        errors.push(`预设 ${id} 引用未注册适配器 ${adapterId}`);
        continue;
      }
      const adapter = catalog.adapters[adapterId];
      if (adapter && adapter.service !== service) {
        errors.push(`预设 ${id} 将 ${adapterId} 配置给错误能力 ${service}`);
      }
      if (
        adapter &&
        ((preset.target === "cloudflare" && adapter.runtime === "node") ||
          (preset.target !== "cloudflare" && adapter.runtime === "worker"))
      ) {
        errors.push(
          `预设 ${id} 的适配器 ${adapterId} 与目标 ${preset.target} 不兼容`
        );
      }
    }
  }

  const templateRoot = options.templateRoot;
  if (!templateRoot) return errors;

  let environmentNames: Set<string>;
  let packageNames: Set<string>;
  try {
    [environmentNames, packageNames] = await Promise.all([
      readAvailableEnvironmentNames(templateRoot),
      readAvailablePackages(templateRoot),
    ]);
  } catch (error) {
    errors.push(
      `无法读取模板环境变量或依赖清单：${
        error instanceof Error ? error.message : String(error)
      }`
    );
    return errors;
  }

  for (const [id, module] of Object.entries(catalog.modules)) {
    for (const env of module.env) {
      if (!environmentNames.has(env)) {
        errors.push(`模块 ${id} 引用未登记环境变量 ${env}`);
      }
    }
    for (const schema of module.schema) {
      if (
        !(await isFile(
          resolve(templateRoot, "src", "db", "schema", `${schema}.ts`)
        ))
      ) {
        errors.push(`模块 ${id} 引用不存在的 Schema 文件 ${schema}`);
      }
    }
    for (const route of module.routes) {
      if (!(await isFile(resolve(templateRoot, route)))) {
        errors.push(`模块 ${id} 引用不存在的路由源码 ${route}`);
      }
    }
    if (
      module.viewContract &&
      !(await isFile(resolve(templateRoot, module.viewContract)))
    ) {
      errors.push(`模块 ${id} 引用不存在的视图契约 ${module.viewContract}`);
    }
    if (
      module.skinEntry &&
      !(await isFile(resolve(templateRoot, module.skinEntry)))
    ) {
      errors.push(`模块 ${id} 引用不存在的皮肤入口 ${module.skinEntry}`);
    }
    for (const source of module.skinSources ?? []) {
      if (!(await isFileOrDirectory(resolve(templateRoot, source)))) {
        errors.push(`模块 ${id} 引用不存在的皮肤来源 ${source}`);
      }
    }
    for (const translation of module.translations) {
      for (const locale of ["en", "zh"]) {
        try {
          const messages = JSON.parse(
            await readFile(
              resolve(templateRoot, "messages", `${locale}.json`),
              "utf8"
            )
          ) as Record<string, unknown>;
          if (!(translation in messages)) {
            errors.push(
              `模块 ${id} 的翻译命名空间 ${translation} 不存在于 ${locale}.json`
            );
          }
        } catch {
          errors.push(`无法读取 ${locale}.json 以验证翻译命名空间`);
        }
      }
    }
  }

  for (const [id, adapter] of Object.entries(catalog.adapters)) {
    if (!(await isFileOrDirectory(resolve(templateRoot, adapter.source)))) {
      errors.push(`适配器 ${id} 引用不存在的源码 ${adapter.source}`);
    }
    for (const packageName of adapter.packages) {
      if (!packageNames.has(packageName)) {
        errors.push(`适配器 ${id} 引用未登记依赖包 ${packageName}`);
      }
    }
    for (const env of adapter.env) {
      if (!environmentNames.has(env)) {
        errors.push(`适配器 ${id} 引用未登记环境变量 ${env}`);
      }
    }
  }

  return errors;
}

export async function loadCatalog(
  path: string,
  options: CatalogValidationOptions = {}
): Promise<RecipeCatalog> {
  const value: unknown = JSON.parse(await readFile(path, "utf8"));
  if (
    !isRecord(value) ||
    typeof value.version !== "number" ||
    !isRecord(value.modules) ||
    !isRecord(value.adapters) ||
    !isRecord(value.presets)
  ) {
    throw new Error("Invalid recipe catalog");
  }

  const catalog = {
    version: value.version,
    modules: Object.fromEntries(
      Object.entries(value.modules).map(([id, recipe]) => [
        id,
        parseModule(id, recipe),
      ])
    ),
    adapters: Object.fromEntries(
      Object.entries(value.adapters).map(([id, recipe]) => [
        id,
        parseAdapter(id, recipe),
      ])
    ),
    presets: Object.fromEntries(
      Object.entries(value.presets).map(([id, recipe]) => [
        id,
        parsePreset(id, recipe),
      ])
    ),
  };
  const templateRoot = options.templateRoot ?? inferTemplateRoot(path);
  const errors = await validateCatalog(
    catalog,
    templateRoot ? { templateRoot } : {}
  );
  if (errors.length > 0) {
    throw new Error(`Invalid recipe catalog:\n${errors.join("\n")}`);
  }
  return catalog;
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function findGeneratorAssets(): Promise<GeneratorAssets> {
  const current = dirname(fileURLToPath(import.meta.url));
  const packageRoot = resolve(current, "..");
  const repositoryRoot = resolve(current, "..", "..", "..");
  const candidates: GeneratorAssets[] = [
    {
      catalogPath: resolve(repositoryRoot, "recipes", "catalog.json"),
      templateManifestPath: resolve(
        repositoryRoot,
        "templates",
        "base",
        "manifest.json"
      ),
      templateRoot: repositoryRoot,
    },
    {
      catalogPath: resolve(packageRoot, "catalog.json"),
      templateManifestPath: resolve(packageRoot, "template", "manifest.json"),
      templateRoot: resolve(packageRoot, "template"),
    },
  ];

  for (const candidate of candidates) {
    if (
      (await exists(candidate.catalogPath)) &&
      (await exists(candidate.templateManifestPath))
    ) {
      return candidate;
    }
  }
  throw new Error("Cannot locate the NextDevTpl catalog and template assets");
}
