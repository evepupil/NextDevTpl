import type {
  DeploymentTarget,
  GeneratorOptions,
  ProjectSelection,
  RecipeCatalog,
  ServiceKind,
} from "./types.js";

const SERVICE_KINDS: readonly ServiceKind[] = [
  "payment",
  "storage",
  "mail",
  "ai",
  "jobs",
  "rate-limit",
];

const CUSTOM_DEFAULTS: Readonly<Partial<Record<ServiceKind, string>>> = {
  mail: "mail:disabled",
  "rate-limit": "rate-limit:noop",
};

function resolveModules(
  catalog: RecipeCatalog,
  requested: readonly string[]
): string[] {
  const resolved = new Set<string>();
  const visiting = new Set<string>();

  const add = (id: string) => {
    if (resolved.has(id)) return;
    const recipe = catalog.modules[id];
    if (!recipe) throw new Error(`Unknown module: ${id}`);
    if (visiting.has(id)) throw new Error(`Circular module dependency: ${id}`);
    visiting.add(id);
    for (const dependency of recipe.dependencies) add(dependency);
    visiting.delete(id);
    resolved.add(id);
  };

  for (const id of requested) add(id);
  return [...resolved];
}

function validateTarget(
  target: DeploymentTarget,
  adapters: Readonly<Partial<Record<ServiceKind, string>>>,
  catalog: RecipeCatalog
): void {
  for (const id of Object.values(adapters)) {
    if (!id) continue;
    const adapter = catalog.adapters[id];
    if (!adapter) throw new Error(`Unknown adapter: ${id}`);
    if (target === "cloudflare" && adapter.runtime === "node") {
      throw new Error(`Adapter ${id} cannot run on the Cloudflare target`);
    }
    if (target !== "cloudflare" && adapter.runtime === "worker") {
      throw new Error(`Adapter ${id} requires the Cloudflare target`);
    }
  }
}

export function createProjectSelection(
  catalog: RecipeCatalog,
  options: Omit<GeneratorOptions, "targetDirectory">
): ProjectSelection {
  const preset = options.preset ?? "minimal";
  const presetRecipe =
    preset === "custom" ? undefined : catalog.presets[preset];
  if (preset !== "custom" && !presetRecipe) {
    throw new Error(`Unknown preset: ${preset}`);
  }

  const requestedModules =
    preset === "custom"
      ? (options.modules ?? ["auth", "dashboard"])
      : presetRecipe!.modules;
  const modules = resolveModules(catalog, requestedModules);
  const moduleSet = new Set(modules);
  const target = options.target ?? presetRecipe?.target ?? "server";
  const adapters: Partial<Record<ServiceKind, string>> = {
    ...(preset === "custom" ? CUSTOM_DEFAULTS : presetRecipe?.adapters),
  };

  for (const [service, id] of Object.entries(options.adapterOverrides ?? {})) {
    const kind = service as ServiceKind;
    if (id === null) delete adapters[kind];
    else if (id) adapters[kind] = id;
  }

  for (const kind of SERVICE_KINDS) {
    const id = adapters[kind];
    if (!id) continue;
    const adapter = catalog.adapters[id];
    if (!adapter) throw new Error(`Unknown adapter: ${id}`);
    if (adapter.service !== kind) {
      throw new Error(`Adapter ${id} does not provide ${kind}`);
    }
  }

  for (const required of ["mail", "payment", "storage"] as const) {
    if (moduleSet.has(required) && !adapters[required]) {
      throw new Error(`Module ${required} requires a ${required} adapter`);
    }
  }
  if (!adapters["rate-limit"]) {
    throw new Error(
      "A rate-limit adapter is required by the request middleware"
    );
  }

  validateTarget(target, adapters, catalog);
  const selectedAdapters = Object.values(adapters)
    .filter((id): id is string => Boolean(id))
    .map((id) => catalog.adapters[id]!);
  const moduleRecipes = modules.map((id) => catalog.modules[id]!);

  return {
    preset,
    target,
    modules,
    excludedModules: Object.keys(catalog.modules).filter(
      (id) => !moduleSet.has(id)
    ),
    adapters,
    packages: [...new Set(selectedAdapters.flatMap((item) => item.packages))],
    env: [
      ...new Set([
        ...moduleRecipes.flatMap((item) => item.env),
        ...selectedAdapters.flatMap((item) => item.env),
      ]),
    ],
    bindings: [...new Set(selectedAdapters.flatMap((item) => item.bindings))],
  };
}
