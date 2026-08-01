import { NextResponse } from "next/server";

import { createOperationsDailySnapshot } from "@/features/operations";
import { withApiLogging } from "@/lib/api-logger";
import { getRuntimeEnv } from "@/lib/runtime-config";

function isAuthorized(request: Request): boolean {
  const secret = getRuntimeEnv("CRON_SECRET");
  if (!secret) return false;
  const value = request.headers.get("authorization") ?? "";
  return value === `Bearer ${secret}` || value === secret;
}

export const POST = withApiLogging(async (request: Request) => {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const snapshot = await createOperationsDailySnapshot();
    return NextResponse.json({ generatedAt: snapshot.generatedAt, ok: true });
  } catch {
    return NextResponse.json(
      { error: "Snapshot generation failed" },
      { status: 500 }
    );
  }
});
