import { NextResponse } from "next/server";

import { evaluateOperationsAlerts } from "@/features/operations";
import { withApiLogging } from "@/lib/api-logger";
import { getRuntimeEnv } from "@/lib/runtime-config";

function isAuthorized(request: Request): boolean {
  const secret = getRuntimeEnv("CRON_SECRET");
  if (!secret) return false;
  const value = request.headers.get("authorization") ?? "";
  return value === secret || value === `Bearer ${secret}`;
}

export const POST = withApiLogging(async (request: Request) => {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const results = await evaluateOperationsAlerts();
    return NextResponse.json({ ok: true, results });
  } catch {
    return NextResponse.json(
      { error: "Alert evaluation failed" },
      { status: 500 }
    );
  }
});
