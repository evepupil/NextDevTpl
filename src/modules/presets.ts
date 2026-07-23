import { MODULE_IDS, type ModuleId } from "@/core/modules";

export const modulePresets = {
  minimal: ["auth", "dashboard"],
  full: MODULE_IDS,
} as const satisfies Record<string, readonly ModuleId[]>;

export type ModulePresetName = keyof typeof modulePresets;
