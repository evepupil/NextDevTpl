import { getCloudflareContext } from "@opennextjs/cloudflare";

export function cleanRuntimeValue(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const cleaned = value.replace(/^\uFEFF/, "").trim();
  return cleaned || undefined;
}

export function getRuntimeEnv(name: string): string | undefined {
  let bindingValue: unknown;
  try {
    const environment = getCloudflareContext().env as Record<string, unknown>;
    bindingValue = environment[name];
  } catch {
    bindingValue = undefined;
  }
  const cleanedBinding = cleanRuntimeValue(bindingValue);
  if (cleanedBinding) return cleanedBinding;

  return cleanRuntimeValue(
    typeof process === "undefined" ? undefined : process.env[name]
  );
}

export function getRuntimeEnvironment(
  names: readonly string[]
): Readonly<Record<string, string | undefined>> {
  return Object.fromEntries(names.map((name) => [name, getRuntimeEnv(name)]));
}
