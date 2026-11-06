import type { RecipeCatalog } from "../types.js";

export type SkinTheme = "system" | "light" | "dark";

export interface SkinFontOption {
  id: string;
  label: string;
}

export interface SkinCustomization {
  brandColor: {
    variable: string;
    foregroundVariable: string;
  } | null;
  radius: {
    variable: string;
    min: number;
    max: number;
    unit: "rem";
  } | null;
  fonts: {
    body: readonly SkinFontOption[];
    heading: readonly SkinFontOption[];
    mono: readonly SkinFontOption[];
  } | null;
  defaultTheme: readonly SkinTheme[];
}

export interface SkinAsset {
  id: string;
  kind: "file" | "dependency" | "inline";
  author: string;
  source: string;
  license: string;
  purpose: "functional" | "visual";
  files?: readonly string[];
  package?: {
    name: string;
    version: string;
  };
}

export interface SkinManifest {
  schemaVersion: 1;
  id: string;
  name: string;
  version: string;
  compatibility: {
    template: string;
    viewApi: number;
  };
  modules: readonly string[];
  viewEntries: Readonly<Record<string, string>>;
  uiOverrides: Readonly<Record<string, string>>;
  customization: SkinCustomization;
  supportsPalettes: boolean;
  dependencies: Readonly<Record<string, string>>;
  assets: readonly SkinAsset[];
  files: Readonly<Record<string, string>>;
}

export interface ValidateSkinOptions {
  directory: string;
  templateDirectory: string;
  catalog: RecipeCatalog;
  selectedModules: readonly string[];
}

export interface ValidatedSkin {
  directory: string;
  templateDirectory: string;
  manifest: SkinManifest;
  packageHash: string;
}

export interface ApplySkinOptions {
  skin: ValidatedSkin;
  targetDirectory: string;
  catalog: RecipeCatalog;
  selectedModules: readonly string[];
}
