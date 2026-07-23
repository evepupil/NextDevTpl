export type DeploymentTarget = "cloudflare" | "docker" | "server" | "vercel";

export type PresetName = "ai-saas" | "custom" | "minimal" | "saas";

export type ServiceKind =
  | "ai"
  | "jobs"
  | "mail"
  | "payment"
  | "rate-limit"
  | "storage";

export interface CatalogModule {
  dependencies: readonly string[];
  env: readonly string[];
  kind: "core" | "optional";
  routes: readonly string[];
  schema: readonly string[];
  translations: readonly string[];
}

export interface CatalogAdapter {
  bindings: readonly string[];
  env: readonly string[];
  packages: readonly string[];
  runtime: "node" | "universal" | "worker";
  service: ServiceKind;
  source: string;
}

export interface CatalogPreset {
  adapters: Readonly<Partial<Record<ServiceKind, string>>>;
  modules: readonly string[];
  target: DeploymentTarget;
}

export interface RecipeCatalog {
  adapters: Readonly<Record<string, CatalogAdapter>>;
  modules: Readonly<Record<string, CatalogModule>>;
  presets: Readonly<Record<string, CatalogPreset>>;
  version: number;
}

export interface GeneratorOptions {
  adapterOverrides?: Readonly<Partial<Record<ServiceKind, string | null>>>;
  catalogPath?: string;
  install?: boolean;
  modules?: readonly string[];
  packageManager?: string;
  preset?: PresetName;
  target?: DeploymentTarget;
  targetDirectory: string;
  templateManifestPath?: string;
  templateRoot?: string;
}

export interface ProjectSelection {
  adapters: Readonly<Partial<Record<ServiceKind, string>>>;
  bindings: readonly string[];
  env: readonly string[];
  excludedModules: readonly string[];
  modules: readonly string[];
  packages: readonly string[];
  preset: PresetName;
  target: DeploymentTarget;
}

export interface GeneratedProjectManifest {
  adapters: Readonly<Partial<Record<ServiceKind, string>>>;
  bindings: readonly string[];
  catalogVersion: number;
  modules: readonly string[];
  preset: PresetName;
  target: DeploymentTarget;
}

export interface GeneratorAssets {
  catalogPath: string;
  templateManifestPath: string;
  templateRoot: string;
}
