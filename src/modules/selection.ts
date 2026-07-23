import type { ModuleId, ModuleSchemaGroup } from "@/core/modules";

import { moduleRegistry } from "./registry";
import { type ModulePresetName, modulePresets } from "./presets";
import { resolveModuleClosure } from "@/core/modules";

export interface ModuleSelection {
  modules: readonly ModuleId[];
  excludedModules: readonly ModuleId[];
  routeSources: readonly string[];
  schema: readonly ModuleSchemaGroup[];
  translations: readonly string[];
}

export function createModuleSelection(
  selectedIds: readonly ModuleId[]
): ModuleSelection {
  const modules = resolveModuleClosure(moduleRegistry, selectedIds);
  const selected = new Set(modules);
  const manifests = modules.map((id) => {
    const manifest = moduleRegistry.byId.get(id);
    if (!manifest) {
      throw new Error(`模块未注册：${id}`);
    }
    return manifest;
  });

  return {
    modules,
    excludedModules: moduleRegistry.manifests
      .map((manifest) => manifest.id)
      .filter((id) => !selected.has(id)),
    routeSources: manifests.flatMap((manifest) =>
      manifest.routes.map((route) => route.source)
    ),
    schema: manifests.flatMap((manifest) => manifest.schema),
    translations: manifests.flatMap((manifest) => manifest.translations),
  };
}

export function createPresetSelection(
  preset: ModulePresetName
): ModuleSelection {
  return createModuleSelection(modulePresets[preset]);
}
