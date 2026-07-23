import type { HealthCheckResult, HealthReport } from "./types";

const REQUIRED_ENVIRONMENT_KEYS = [
  "DATABASE_URL",
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "NEXT_PUBLIC_APP_URL",
] as const;

function isHttpUrl(value: string): boolean {
  try {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

function isPostgresUrl(value: string): boolean {
  try {
    const protocol = new URL(value).protocol;
    return protocol === "postgres:" || protocol === "postgresql:";
  } catch {
    return false;
  }
}

export function validateDeploymentEnvironment(
  environment: Readonly<Record<string, string | undefined>>
): readonly string[] {
  const invalid = REQUIRED_ENVIRONMENT_KEYS.filter(
    (key) => !environment[key]?.trim()
  );
  const databaseUrl = environment.DATABASE_URL?.trim();
  const authUrl = environment.BETTER_AUTH_URL?.trim();
  const appUrl = environment.NEXT_PUBLIC_APP_URL?.trim();

  if (databaseUrl && !isPostgresUrl(databaseUrl)) invalid.push("DATABASE_URL");
  if (authUrl && !isHttpUrl(authUrl)) invalid.push("BETTER_AUTH_URL");
  if (appUrl && !isHttpUrl(appUrl)) invalid.push("NEXT_PUBLIC_APP_URL");

  return [...new Set(invalid)];
}

export function createHealthReport(input: {
  checks: Readonly<Record<string, HealthCheckResult>>;
  now?: Date;
  version: string;
}): HealthReport {
  const healthy = Object.values(input.checks).every(
    (check) => check.status === "pass"
  );

  return {
    status: healthy ? "healthy" : "unhealthy",
    version: input.version,
    timestamp: (input.now ?? new Date()).toISOString(),
    checks: input.checks,
  };
}

export async function runHealthProbe(
  probe: () => Promise<void>,
  options: { now?: () => number; timeoutMs: number }
): Promise<HealthCheckResult> {
  const now = options.now ?? Date.now;
  const startedAt = now();
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    await Promise.race([
      probe(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("Health probe timed out")),
          options.timeoutMs
        );
      }),
    ]);
    return { status: "pass", durationMs: Math.max(0, now() - startedAt) };
  } catch {
    return { status: "fail", durationMs: Math.max(0, now() - startedAt) };
  } finally {
    if (timer) clearTimeout(timer);
  }
}
