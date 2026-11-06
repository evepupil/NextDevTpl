export const MODES = ["light", "dark"] as const;

export const STYLEKIT_COLOR_KEYS = [
  "accent",
  "accent-foreground",
  "background",
  "border",
  "card",
  "card-foreground",
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "destructive",
  "destructive-foreground",
  "foreground",
  "input",
  "muted",
  "muted-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "ring",
  "secondary",
  "secondary-foreground",
  "sidebar",
  "sidebar-accent",
  "sidebar-accent-foreground",
  "sidebar-border",
  "sidebar-foreground",
  "sidebar-primary",
  "sidebar-primary-foreground",
  "sidebar-ring",
] as const;

export const EXTENDED_COLOR_KEYS = [
  "success",
  "warning",
  "grid-line",
  "glow-1",
  "glow-2",
] as const;

export const DEFAULT_SKIN_COLOR_KEYS = [
  "accent",
  "accent-foreground",
  "background",
  "border",
  "card",
  "card-foreground",
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "destructive",
  "foreground",
  "input",
  "muted",
  "muted-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "ring",
  "secondary",
  "secondary-foreground",
  "sidebar",
  "sidebar-accent",
  "sidebar-accent-foreground",
  "sidebar-border",
  "sidebar-foreground",
  "sidebar-primary",
  "sidebar-primary-foreground",
  "sidebar-ring",
] as const;

/* StyleKit 多出的 destructive-foreground 不在默认皮肤白名单中。 */
export const PALETTE_COLOR_KEYS = [
  ...DEFAULT_SKIN_COLOR_KEYS,
  ...EXTENDED_COLOR_KEYS,
] as const;

export const STYLEKIT_REGISTRY_URL = "https://www.stylekit.top/registry.json";
export const STYLEKIT_THEME_URL_TEMPLATE =
  "https://www.stylekit.top/r/{slug}.json";
export const STYLEKIT_LICENSE_SOURCE_URL =
  "https://github.com/AnxForever/stylekit/blob/main/LICENSE";
export const STYLEKIT_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
export const SNAPSHOT_SCHEMA_VERSION = 1 as const;
export const COLOR_RULES_VERSION = 1 as const;

export type Mode = (typeof MODES)[number];
export type StyleKitColorKey = (typeof STYLEKIT_COLOR_KEYS)[number];
export type DefaultSkinColorKey = (typeof DEFAULT_SKIN_COLOR_KEYS)[number];
export type ExtendedColorKey = (typeof EXTENDED_COLOR_KEYS)[number];
export type PaletteColorKey = (typeof PALETTE_COLOR_KEYS)[number];
export type PaletteInputKey = PaletteColorKey | "radius";
export type PaletteColorMap = Record<PaletteColorKey, string>;

export interface RadiusRange {
  min: number;
  max: number;
  unit: "rem";
}

export interface DefaultSkinTokens {
  colors: Record<Mode, PaletteColorMap>;
  radius: Record<Mode, string>;
  radiusRange: RadiusRange;
}

export interface StyleKitRegistryItem {
  name: string;
  type: "registry:theme";
}

export interface StyleKitRegistry {
  name: "stylekit";
  items: readonly StyleKitRegistryItem[];
}

export interface StyleKitTheme {
  name: string;
  type: "registry:theme";
  cssVars: Record<Mode, Record<string, unknown>>;
}

export interface NormalizedPaletteMode {
  colors: PaletteColorMap;
  radiusInfo: NormalizedRadiusInfo;
  radius: string;
}

export interface NormalizedRadiusInfo {
  clamped: boolean;
  convertedRem: number;
  effectiveRem: number;
  sourceUnit: "default" | "unitless" | "rem" | "px";
  sourceValue: number | null;
}

export interface NormalizedPaletteTheme {
  schemaVersion: typeof SNAPSHOT_SCHEMA_VERSION;
  rulesVersion: typeof COLOR_RULES_VERSION;
  id: string;
  sourceSha256: string;
  missingKeys: Record<Mode, readonly PaletteInputKey[]>;
  ignoredKeys: readonly string[];
  light: NormalizedPaletteMode;
  dark: NormalizedPaletteMode;
}

export interface SnapshotThemeDigest {
  sourceSha256: string;
  normalizedSha256: string;
}

export interface PaletteSnapshotManifest {
  schemaVersion: typeof SNAPSHOT_SCHEMA_VERSION;
  rulesVersion: typeof COLOR_RULES_VERSION;
  fetchedAt: string;
  source: {
    registryUrl: string;
    themeUrlTemplate: string;
    licenseSource: string;
  };
  themeCount: number;
  registrySha256: string;
  licenseSha256: string;
  originalThemesSha256: string;
  normalizedThemesSha256: string;
  themes: Record<string, SnapshotThemeDigest>;
}

export interface PaletteSnapshotBytes {
  manifestBytes: Uint8Array;
  registryBytes: Uint8Array;
  licenseBytes: Uint8Array;
  originalThemeBytes: Readonly<Record<string, Uint8Array>>;
  normalizedThemeBytes: Readonly<Record<string, Uint8Array>>;
}

export interface ValidatedPaletteSnapshot {
  manifest: PaletteSnapshotManifest;
  registry: StyleKitRegistry;
  themes: Readonly<Record<string, NormalizedPaletteTheme>>;
}

export interface GeneratedPaletteRecord {
  provider: "stylekit";
  id: string;
  snapshotDate: string;
  sourceSha256: string;
}

export interface LoadedPalette {
  palette: NormalizedPaletteTheme;
  license: string;
  snapshotDate: string;
  warnings: readonly string[];
}

export type PaletteWarning =
  | {
      kind: "radius-clamped";
      id: string;
      mode: Mode;
      sourceUnit: "unitless" | "rem" | "px";
      sourceValue: number;
      convertedRem: number;
      effectiveRem: number;
    }
  | {
      kind: "contrast";
      id: string;
      mode: Mode;
      foreground: PaletteColorKey;
      background: PaletteColorKey;
      ratio: number;
    };

export interface NormalizedPaletteResult {
  palette: NormalizedPaletteTheme;
  warnings: readonly PaletteWarning[];
}

export interface ContrastMeasurement {
  mode: Mode;
  foreground: PaletteColorKey;
  background: PaletteColorKey;
  ratio: number;
}

export interface ContrastResult {
  measurements: readonly ContrastMeasurement[];
  warnings: readonly PaletteWarning[];
}
