import { NextResponse } from "next/server";
import { z } from "zod";

import {
  type JsonObject,
  type TelemetryEventInput,
  telemetryEventInputSchema,
} from "@/core/services";
import { withApiLogging } from "@/lib/api-logger";
import { readRequestBody, RequestBodyTooLargeError } from "@/lib/request-body";
import { getTelemetryContextFromRequest } from "@/lib/telemetry/identity";
import { telemetryService } from "@/services/telemetry";

const clientEventSchema = z
  .object({
    attributes: z.record(z.string().min(1).max(64), z.unknown()).optional(),
    name: z.string().regex(/^[a-z][a-z0-9_]*(?:\.[a-z0-9_]+)+$/u),
    version: z.number().int().positive().max(100),
  })
  .strict();

const MAX_TELEMETRY_BODY_BYTES = 16 * 1024;

function hasAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export const POST = withApiLogging(async (request: Request) => {
  if (!hasAllowedOrigin(request)) {
    return NextResponse.json(
      { error: "Invalid request origin" },
      { status: 403 }
    );
  }

  let payload: unknown;
  try {
    payload = JSON.parse(
      await readRequestBody(request, MAX_TELEMETRY_BODY_BYTES)
    ) as unknown;
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json(
        { error: "Telemetry payload is too large" },
        { status: 413 }
      );
    }
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = clientEventSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid telemetry event" },
      { status: 400 }
    );
  }

  const candidate: TelemetryEventInput = {
    ...(parsed.data.attributes
      ? { attributes: parsed.data.attributes as JsonObject }
      : {}),
    context: getTelemetryContextFromRequest(request),
    name: parsed.data.name,
    source: "client",
    version: parsed.data.version,
  };
  const event = telemetryEventInputSchema.safeParse(candidate);
  if (!event.success) {
    return NextResponse.json(
      { error: "Invalid telemetry attributes" },
      { status: 400 }
    );
  }

  await telemetryService.track(candidate);

  return NextResponse.json({ ok: true });
});
