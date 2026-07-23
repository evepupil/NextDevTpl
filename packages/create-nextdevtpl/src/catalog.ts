import { access, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type {
  CatalogAdapter,
  CatalogModule,
  CatalogPreset,
  GeneratorAssets,
  RecipeCatalog,
} from "./types.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

function parseModule(id: string, value: unknown): CatalogModule {
  if (
    !isRecord(value) ||
    (value.kind !== "core" && value.kind !== "optional") ||
    !isStringArray(value.dependencies) ||
    !isStringArray(value.routes) ||
    !isStringArray(value.schema) ||
    !isStringArray(value.translations) ||
    !isStringArray(value.env)
  ) {
    throw new Error(`Invalid module recipe: ${id}`);
  }
  return {
    kind: value.kind,
    dependencies: value.dependencies,
    routes: value.routes,
    schema: value.schema,
    translations: value.translations,
    env: value.env,
  };
}

function parseAdapter(id: string, value: unknown): CatalogAdapter {
  const services = ["ai", "jobs", "mail", "payment", "rate-limit", "storage"];
  const runtimes = ["node", "universal", "worker"];
  if (
    !isRecord(value) ||
    typeof value.service !== "string" ||
    !services.includes(value.service) ||
    typeof value.source !== "string" ||
    typeof value.runtime !== "string" ||
    !runtimes.includes(value.runtime) ||
    !isStringArray(value.packages) ||
    !isStringArray(value.env) ||
    !isStringArray(value.bindings)
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
    typeof value.target !== "string"
  ) {
    throw new Error(`Invalid preset recipe: ${id}`);
  }
  return value as unknown as CatalogPreset;
}

export async function loadCatalog(path: string): Promise<RecipeCatalog> {
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

  return {
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
