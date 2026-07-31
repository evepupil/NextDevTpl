/**
 * 统一读取运行时配置，兼容本地环境变量与 Cloudflare Secret。
 */
export function cleanRuntimeValue(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const cleaned = value.replace(/^\uFEFF/, "").trim();
  return cleaned || undefined;
}

export function getRuntimeEnv(name: string): string | undefined {
  return cleanRuntimeValue(
    typeof process === "undefined" ? undefined : process.env[name]
  );
}

export function getRuntimeEnvironment(
  names: readonly string[]
): Readonly<Record<string, string | undefined>> {
  return Object.fromEntries(names.map((name) => [name, getRuntimeEnv(name)]));
}
