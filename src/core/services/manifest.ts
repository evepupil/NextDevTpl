export const SERVICE_KINDS = [
  "ai",
  "jobs",
  "mail",
  "payment",
  "rate-limit",
  "storage",
] as const;

export type ServiceKind = (typeof SERVICE_KINDS)[number];
export type AdapterRuntime = "node" | "universal" | "worker";

export interface ServiceAdapterManifest {
  bindings: readonly string[];
  env: readonly string[];
  id: string;
  packages: readonly string[];
  runtime: AdapterRuntime;
  service: ServiceKind;
  source: string;
}

export function defineServiceAdapter<const T extends ServiceAdapterManifest>(
  manifest: T
): T {
  return manifest;
}

export function validateServiceAdapterManifests(
  manifests: readonly ServiceAdapterManifest[]
): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const sources = new Set<string>();

  for (const manifest of manifests) {
    if (ids.has(manifest.id)) {
      errors.push(`适配器 ID 重复：${manifest.id}`);
    }
    if (sources.has(manifest.source)) {
      errors.push(`适配器源码重复登记：${manifest.source}`);
    }
    if (!manifest.id.startsWith(`${manifest.service}:`)) {
      errors.push(`适配器 ${manifest.id} 必须使用 ${manifest.service}: 前缀`);
    }
    ids.add(manifest.id);
    sources.add(manifest.source);
  }

  return errors;
}
