export const MODULE_IDS = [
  "admin",
  "analytics",
  "auth",
  "blog",
  "credits",
  "dashboard",
  "mail",
  "marketing",
  "payment",
  "pseo",
  "settings",
  "shared",
  "storage",
  "subscription",
  "support",
] as const;

export type ModuleId = (typeof MODULE_IDS)[number];
export type ModuleKind = "core" | "optional";
export type ModuleNavigationArea = "dashboard" | "admin";
export type ModuleNavigationIcon =
  | "coins"
  | "dashboard"
  | "headset"
  | "settings"
  | "ticket"
  | "users";
export type ModuleSchemaGroup =
  | "auth"
  | "credits"
  | "mail"
  | "subscription"
  | "support";

export interface ModuleNavigationItem {
  area: ModuleNavigationArea;
  group: string;
  groupTranslationKey: string;
  translationKey: string;
  href: string;
  icon: ModuleNavigationIcon;
  order: number;
}

export interface ModuleRoute {
  path: string;
  source: string;
}

export interface ModuleManifest {
  id: ModuleId;
  name: string;
  description: string;
  kind: ModuleKind;
  dependencies: readonly ModuleId[];
  routes: readonly ModuleRoute[];
  navigation: readonly ModuleNavigationItem[];
  translations: readonly string[];
  schema: readonly ModuleSchemaGroup[];
}

export interface ModuleRegistry {
  manifests: readonly ModuleManifest[];
  byId: ReadonlyMap<ModuleId, ModuleManifest>;
}

export function defineModule<const T extends ModuleManifest>(manifest: T): T {
  return manifest;
}

export function validateModuleManifests(
  manifests: readonly ModuleManifest[]
): string[] {
  const errors: string[] = [];
  const byId = new Map<ModuleId, ModuleManifest>();
  const routeOwners = new Map<string, ModuleId>();
  const routeSourceOwners = new Map<string, ModuleId>();
  const navigationOwners = new Map<string, ModuleId>();
  const schemaOwners = new Map<ModuleSchemaGroup, ModuleId>();
  const translationOwners = new Map<string, ModuleId>();

  for (const manifest of manifests) {
    if (byId.has(manifest.id)) {
      errors.push(`模块 ID 重复：${manifest.id}`);
      continue;
    }
    byId.set(manifest.id, manifest);

    for (const route of manifest.routes) {
      const owner = routeOwners.get(route.path);
      if (owner) {
        errors.push(`路由 ${route.path} 同时属于 ${owner} 和 ${manifest.id}`);
      } else {
        routeOwners.set(route.path, manifest.id);
      }

      const sourceOwner = routeSourceOwners.get(route.source);
      if (sourceOwner) {
        errors.push(
          `路由文件 ${route.source} 同时属于 ${sourceOwner} 和 ${manifest.id}`
        );
      } else {
        routeSourceOwners.set(route.source, manifest.id);
      }
    }

    for (const item of manifest.navigation) {
      const key = `${item.area}:${item.href}`;
      const owner = navigationOwners.get(key);
      if (owner) {
        errors.push(`菜单 ${key} 同时属于 ${owner} 和 ${manifest.id}`);
      } else {
        navigationOwners.set(key, manifest.id);
      }
    }

    for (const group of manifest.schema) {
      const owner = schemaOwners.get(group);
      if (owner) {
        errors.push(`Schema ${group} 同时属于 ${owner} 和 ${manifest.id}`);
      } else {
        schemaOwners.set(group, manifest.id);
      }
    }

    for (const namespace of manifest.translations) {
      const owner = translationOwners.get(namespace);
      if (owner) {
        errors.push(
          `翻译命名空间 ${namespace} 同时属于 ${owner} 和 ${manifest.id}`
        );
      } else {
        translationOwners.set(namespace, manifest.id);
      }
    }
  }

  for (const manifest of manifests) {
    for (const dependency of manifest.dependencies) {
      if (dependency === manifest.id) {
        errors.push(`模块 ${manifest.id} 不能依赖自身`);
      } else if (!byId.has(dependency)) {
        errors.push(`模块 ${manifest.id} 依赖未注册模块 ${dependency}`);
      } else if (
        manifest.kind === "core" &&
        byId.get(dependency)?.kind === "optional"
      ) {
        errors.push(`核心模块 ${manifest.id} 不能依赖可选模块 ${dependency}`);
      }
    }
  }

  const visiting = new Set<ModuleId>();
  const visited = new Set<ModuleId>();

  const visit = (id: ModuleId, path: readonly ModuleId[]) => {
    if (visiting.has(id)) {
      errors.push(`模块依赖存在循环：${[...path, id].join(" -> ")}`);
      return;
    }
    if (visited.has(id)) {
      return;
    }

    const manifest = byId.get(id);
    if (!manifest) {
      return;
    }

    visiting.add(id);
    for (const dependency of manifest.dependencies) {
      visit(dependency, [...path, id]);
    }
    visiting.delete(id);
    visited.add(id);
  };

  for (const id of byId.keys()) {
    visit(id, []);
  }

  return errors;
}

export function createModuleRegistry(
  manifests: readonly ModuleManifest[]
): ModuleRegistry {
  const errors = validateModuleManifests(manifests);
  if (errors.length > 0) {
    throw new Error(`模块注册失败：\n${errors.join("\n")}`);
  }

  return {
    manifests,
    byId: new Map(manifests.map((manifest) => [manifest.id, manifest])),
  };
}

export function resolveModuleClosure(
  registry: ModuleRegistry,
  selectedIds: readonly ModuleId[]
): ModuleId[] {
  const resolved = new Set<ModuleId>();

  const add = (id: ModuleId) => {
    if (resolved.has(id)) {
      return;
    }
    const manifest = registry.byId.get(id);
    if (!manifest) {
      throw new Error(`模块未注册：${id}`);
    }
    for (const dependency of manifest.dependencies) {
      add(dependency);
    }
    resolved.add(id);
  };

  for (const id of selectedIds) {
    add(id);
  }

  return [...resolved];
}
