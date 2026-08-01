import { z } from "zod";

import { redactValue } from "@/lib/redaction";

import type { AdapterDescriptor, JsonObject, JsonValue } from "./common";

export type TelemetryProvider = "logger" | "noop";
export type TelemetrySource = "client" | "server" | "system";
export type TelemetryEnvironment =
  | "development"
  | "preview"
  | "production"
  | "test";

export interface TelemetryCapabilities {
  clientEvents: boolean;
  identityLinking: boolean;
  query: boolean;
  serverEvents: boolean;
}

export interface TelemetryIdentity {
  anonymousId?: string;
  userId?: string;
}

export interface TelemetryUtm {
  campaign?: string;
  content?: string;
  medium?: string;
  source?: string;
  term?: string;
}

export interface TelemetryContext {
  identity?: TelemetryIdentity;
  initialSource?: string;
  latestSource?: string;
  locale?: string;
  requestId?: string;
  sessionId?: string;
  utm?: TelemetryUtm;
}

export interface TelemetryEventInput {
  attributes?: JsonObject;
  context?: TelemetryContext;
  name: string;
  source: TelemetrySource;
  version: number;
}

export interface TelemetryEvent {
  attributes: JsonObject;
  context: TelemetryContext;
  environment: TelemetryEnvironment;
  eventId: string;
  name: string;
  occurredAt: string;
  release?: string;
  source: TelemetrySource;
  version: number;
}

export interface TelemetryAdapter
  extends AdapterDescriptor<TelemetryProvider, TelemetryCapabilities> {
  track(event: TelemetryEvent): Promise<void>;
}

export interface TelemetryService {
  track(input: TelemetryEventInput): Promise<void>;
}

export interface TelemetryServiceOptions {
  clock?: () => Date;
  createEventId?: () => string;
  environment: TelemetryEnvironment;
  onAdapterError?: (error: unknown, event: TelemetryEvent) => void;
  release?: string;
}

const eventNamePattern = /^[a-z][a-z0-9_]*(?:\.[a-z0-9_]+)+$/;
const identifierSchema = z.string().min(1).max(128);

function isJsonValue(value: unknown): value is JsonValue {
  if (value === null) {
    return true;
  }
  if (
    typeof value === "string" ||
    typeof value === "boolean" ||
    (typeof value === "number" && Number.isFinite(value))
  ) {
    return true;
  }
  if (Array.isArray(value)) {
    return value.every(isJsonValue);
  }
  if (typeof value === "object") {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      return false;
    }
    return Object.values(value).every(isJsonValue);
  }

  return false;
}

const jsonValueSchema = z.custom<JsonValue>(isJsonValue, {
  message: "Value must be valid JSON",
});

const identitySchema = z
  .object({
    anonymousId: identifierSchema.optional(),
    userId: identifierSchema.optional(),
  })
  .strict();

const utmSchema = z
  .object({
    campaign: z.string().min(1).max(128).optional(),
    content: z.string().min(1).max(128).optional(),
    medium: z.string().min(1).max(128).optional(),
    source: z.string().min(1).max(128).optional(),
    term: z.string().min(1).max(128).optional(),
  })
  .strict();

const contextSchema = z
  .object({
    identity: identitySchema.optional(),
    initialSource: z.string().min(1).max(128).optional(),
    latestSource: z.string().min(1).max(128).optional(),
    locale: z.string().min(2).max(16).optional(),
    requestId: identifierSchema.optional(),
    sessionId: identifierSchema.optional(),
    utm: utmSchema.optional(),
  })
  .strict();

export const telemetryEventInputSchema = z
  .object({
    attributes: z.record(z.string().min(1).max(64), jsonValueSchema).optional(),
    context: contextSchema.optional(),
    name: z.string().regex(eventNamePattern),
    source: z.enum(["client", "server", "system"]),
    version: z.number().int().positive().max(100),
  })
  .strict();

export const telemetryEventSchema = z
  .object({
    attributes: z.record(z.string().min(1).max(64), jsonValueSchema),
    context: contextSchema,
    environment: z.enum(["development", "preview", "production", "test"]),
    eventId: identifierSchema,
    name: z.string().regex(eventNamePattern),
    occurredAt: z.string().datetime({ offset: true }),
    release: z.string().min(1).max(128).optional(),
    source: z.enum(["client", "server", "system"]),
    version: z.number().int().positive().max(100),
  })
  .strict();

export function parseTelemetryEventInput(input: unknown): TelemetryEventInput {
  const parsed = telemetryEventInputSchema.parse(input);

  return {
    name: parsed.name,
    source: parsed.source,
    version: parsed.version,
    ...(parsed.attributes
      ? { attributes: parsed.attributes as JsonObject }
      : {}),
    ...(parsed.context ? { context: parsed.context as TelemetryContext } : {}),
  };
}

export function sanitizeTelemetryAttributes(
  attributes: JsonObject
): JsonObject {
  return redactValue(attributes) as JsonObject;
}

export function createTelemetryEvent(
  input: TelemetryEventInput,
  options: TelemetryServiceOptions
): TelemetryEvent {
  const parsedInput = parseTelemetryEventInput(input);
  const clock = options.clock ?? (() => new Date());
  const createEventId = options.createEventId ?? (() => crypto.randomUUID());
  const occurredAt = clock().toISOString();
  const context = parsedInput.context ?? {};
  const attributes = sanitizeTelemetryAttributes(parsedInput.attributes ?? {});
  const event = {
    attributes,
    context,
    environment: options.environment,
    eventId: createEventId(),
    name: parsedInput.name,
    occurredAt,
    ...(options.release ? { release: options.release } : {}),
    source: parsedInput.source,
    version: parsedInput.version,
  } satisfies TelemetryEvent;

  return telemetryEventSchema.parse(event) as TelemetryEvent;
}

export function createTelemetryService(
  adapter: TelemetryAdapter,
  options: TelemetryServiceOptions
): TelemetryService {
  return {
    async track(input) {
      const event = createTelemetryEvent(input, options);

      try {
        await adapter.track(event);
      } catch (error) {
        try {
          options.onAdapterError?.(error, event);
        } catch {
          // 记录降级错误不能反过来阻塞业务请求。
        }
      }
    },
  };
}
