import type {
  JsonObject,
  TelemetryContext,
  TelemetryEventInput,
} from "@/core/services";
import { normalizeTelemetryValue } from "@/lib/telemetry/identity";
import { trackServerEvent } from "@/services/telemetry";

export type FailureClass =
  | "authorization"
  | "exception"
  | "http"
  | "rate_limited"
  | "validation";

export type JobFailurePhase = "dispatch" | "execution";

interface FailureEventBase {
  context?: TelemetryContext;
  durationMs?: number;
  failureClass: FailureClass;
}

export interface ApiFailureEventInput extends FailureEventBase {
  method: string;
  path: string;
  statusCode: number;
}

export interface ActionFailureEventInput extends FailureEventBase {
  action: string;
}

export interface JobFailureEventInput extends FailureEventBase {
  jobName: string;
  phase: JobFailurePhase;
  provider: string;
  retryable?: boolean;
}

function safeLabel(value: string, fallback: string, maxLength = 128): string {
  return normalizeTelemetryValue(value, maxLength) ?? fallback;
}

function safePath(value: string): string {
  const pathname = value.split(/[?#]/u, 1)[0] ?? value;
  return safeLabel(pathname, "/unknown");
}

function safeDuration(value: number | undefined): number | undefined {
  if (value === undefined || !Number.isFinite(value)) return undefined;
  return Math.max(0, Math.round(value));
}

function withDuration(
  attributes: JsonObject,
  durationMs: number | undefined
): JsonObject {
  const duration = safeDuration(durationMs);
  return duration === undefined
    ? attributes
    : { ...attributes, durationMs: duration };
}

export function createApiFailureEvent(
  input: ApiFailureEventInput
): TelemetryEventInput {
  return {
    attributes: withDuration(
      {
        failureClass: input.failureClass,
        method: safeLabel(input.method, "UNKNOWN", 16),
        path: safePath(input.path),
        statusCode: Number.isFinite(input.statusCode)
          ? Math.max(0, Math.round(input.statusCode))
          : 500,
      },
      input.durationMs
    ),
    ...(input.context ? { context: input.context } : {}),
    name: "api.request.failed",
    source: "server",
    version: 1,
  };
}

export function createActionFailureEvent(
  input: ActionFailureEventInput
): TelemetryEventInput {
  return {
    attributes: withDuration(
      {
        action: safeLabel(input.action, "server-action"),
        failureClass: input.failureClass,
      },
      input.durationMs
    ),
    ...(input.context ? { context: input.context } : {}),
    name: "action.failed",
    source: "server",
    version: 1,
  };
}

export function createJobFailureEvent(
  input: JobFailureEventInput
): TelemetryEventInput {
  return {
    attributes: withDuration(
      {
        failureClass: input.failureClass,
        jobName: safeLabel(input.jobName, "unknown-job"),
        phase: input.phase,
        provider: safeLabel(input.provider, "unknown"),
        ...(input.retryable === undefined
          ? {}
          : { retryable: input.retryable }),
      },
      input.durationMs
    ),
    ...(input.context ? { context: input.context } : {}),
    name: "job.failed",
    source: "system",
    version: 1,
  };
}

export function trackApiFailure(input: ApiFailureEventInput): void {
  trackServerEvent(createApiFailureEvent(input));
}

export function trackActionFailure(input: ActionFailureEventInput): void {
  trackServerEvent(createActionFailureEvent(input));
}

export function trackJobFailure(input: JobFailureEventInput): void {
  trackServerEvent(createJobFailureEvent(input));
}
