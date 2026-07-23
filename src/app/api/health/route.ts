import { withApiLogging } from "@/lib/api-logger";
import type { HealthCheckResult } from "@/lib/health";
import {
  createHealthReport,
  probeDatabase,
  runHealthProbe,
  validateDeploymentEnvironment,
} from "@/lib/health";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DATABASE_TIMEOUT_MS = 5_000;
const PASS: HealthCheckResult = { status: "pass", durationMs: 0 };
const FAIL: HealthCheckResult = { status: "fail", durationMs: 0 };

function getVersion(): string {
  return (
    process.env.APP_VERSION?.trim() ||
    process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ||
    "unknown"
  );
}

export const GET = withApiLogging(async (request: Request) => {
  const mode = new URL(request.url).searchParams.get("mode");
  const checks: Record<string, HealthCheckResult> = { application: PASS };

  if (mode !== "live") {
    const configurationValid =
      validateDeploymentEnvironment(process.env).length === 0;
    checks.configuration = configurationValid ? PASS : FAIL;
    checks.database = configurationValid
      ? await runHealthProbe(probeDatabase, {
          timeoutMs: DATABASE_TIMEOUT_MS,
        })
      : FAIL;
  }

  const report = createHealthReport({ checks, version: getVersion() });
  return Response.json(report, {
    status: report.status === "healthy" ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
});
