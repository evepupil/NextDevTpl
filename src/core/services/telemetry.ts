import { z } from "zod";

import { redactValue } from "@/lib/redaction";
import type { TelemetryEventName } from "../modules/telemetry-events";
import type { AdapterDescriptor, JsonObject, JsonValue } from "./common";

export type { TelemetryEventName } from "../modules/telemetry-events";

export type TelemetryProvider = "ga4" | "logger" | "noop" | "posthog" | "umami";
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
  name: TelemetryEventName;
  source: TelemetrySource;
  version: number;
}

export interface TelemetryEvent {
  attributes: JsonObject;
  context: TelemetryContext;
  environment: TelemetryEnvironment;
  eventId: string;
  name: TelemetryEventName;
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

const labelSchema = z.string().min(1).max(128);
const providerSchema = z.string().min(1).max(64);
const pathSchema = z.string().min(1).max(256);
const authMethodSchema = z.enum(["email", "social", "unknown"]);
const emptyAttributesSchema = z.object({}).strict();

const productAttributesSchema = z
  .object({
    action: labelSchema,
    properties: z.record(z.string().min(1).max(64), jsonValueSchema).optional(),
  })
  .strict();

const checkoutStartedAttributesSchema = z
  .object({
    checkoutType: z.enum(["credits", "one-time", "subscription"]),
    credits: z.number().int().positive().optional(),
    packageId: labelSchema.optional(),
    planId: labelSchema.optional(),
    priceId: labelSchema.optional(),
    provider: providerSchema,
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.checkoutType === "credits") {
      if (!value.packageId || value.credits === undefined) {
        ctx.addIssue({
          code: "custom",
          message: "Credit checkout events require packageId and credits",
          path: ["packageId"],
        });
      }
      return;
    }

    if (!value.planId || !value.priceId) {
      ctx.addIssue({
        code: "custom",
        message: "Subscription checkout events require planId and priceId",
        path: ["priceId"],
      });
    }
  });

export const telemetryEventRegistry = {
  "landing.viewed": {
    versions: {
      1: {
        attributes: z.object({ path: pathSchema }).strict(),
        sources: ["client"],
      },
    },
  },
  "page.viewed": {
    versions: {
      1: {
        attributes: z.object({ path: pathSchema }).strict(),
        sources: ["client"],
      },
    },
  },
  "signup.completed": {
    versions: {
      1: {
        attributes: z.object({ authMethod: authMethodSchema }).strict(),
        sources: ["server"],
      },
    },
  },
  "login.completed": {
    versions: {
      1: {
        attributes: z.object({ authMethod: authMethodSchema }).strict(),
        sources: ["server"],
      },
    },
  },
  "identity.linked": {
    versions: {
      1: {
        attributes: z
          .object({ authMethod: authMethodSchema, provider: providerSchema })
          .strict(),
        sources: ["server"],
      },
    },
  },
  "first_value.completed": {
    versions: {
      1: { attributes: productAttributesSchema, sources: ["server"] },
    },
  },
  "core_action.completed": {
    versions: {
      1: { attributes: productAttributesSchema, sources: ["server"] },
    },
  },
  "api.request.failed": {
    versions: {
      1: {
        attributes: z
          .object({
            durationMs: z.number().int().nonnegative().optional(),
            failureClass: z.enum([
              "authorization",
              "exception",
              "http",
              "rate_limited",
              "validation",
            ]),
            method: z.string().min(1).max(16),
            path: pathSchema,
            statusCode: z.number().int().nonnegative(),
          })
          .strict(),
        sources: ["server"],
      },
    },
  },
  "action.failed": {
    versions: {
      1: {
        attributes: z
          .object({
            action: labelSchema,
            durationMs: z.number().int().nonnegative().optional(),
            failureClass: z.enum([
              "authorization",
              "exception",
              "http",
              "rate_limited",
              "validation",
            ]),
          })
          .strict(),
        sources: ["server"],
      },
    },
  },
  "job.failed": {
    versions: {
      1: {
        attributes: z
          .object({
            durationMs: z.number().int().nonnegative().optional(),
            failureClass: z.enum([
              "authorization",
              "exception",
              "http",
              "rate_limited",
              "validation",
            ]),
            jobName: labelSchema,
            phase: z.enum(["dispatch", "execution"]),
            provider: providerSchema,
            retryable: z.boolean().optional(),
          })
          .strict(),
        sources: ["system"],
      },
    },
  },
  "payment.checkout.started": {
    versions: {
      1: { attributes: checkoutStartedAttributesSchema, sources: ["server"] },
    },
  },
  "payment.checkout.completed": {
    versions: {
      1: {
        attributes: z
          .object({
            checkoutType: labelSchema,
            customerId: labelSchema,
            productId: labelSchema,
            provider: providerSchema,
            subscriptionId: labelSchema.optional(),
          })
          .strict(),
        sources: ["server"],
      },
    },
  },
  "credits.purchased": {
    versions: {
      1: {
        attributes: z
          .object({
            amount: z.number().int().positive(),
            granted: z.boolean(),
            packageId: labelSchema,
            productId: labelSchema,
            provider: providerSchema,
          })
          .strict(),
        sources: ["server"],
      },
    },
  },
  "credits.consumed": {
    versions: {
      1: {
        attributes: z
          .object({
            amount: z.number().int().positive(),
            serviceName: labelSchema,
          })
          .strict(),
        sources: ["server"],
      },
    },
  },
  "credits.expired": {
    versions: {
      1: {
        attributes: z
          .object({
            count: z.number().int().nonnegative(),
            totalExpired: z.number().int().nonnegative(),
          })
          .strict(),
        sources: ["system"],
      },
    },
  },
  "payment.subscription.created": {
    versions: {
      1: {
        attributes: z
          .object({
            priceId: labelSchema,
            provider: providerSchema,
            status: labelSchema,
            subscriptionId: labelSchema,
          })
          .strict(),
        sources: ["server"],
      },
    },
  },
  "payment.subscription.canceled": {
    versions: {
      1: {
        attributes: z
          .object({
            cancelAtPeriodEnd: z.boolean(),
            periodEnd: z.string().datetime({ offset: true }).nullable(),
            provider: providerSchema,
            subscriptionId: labelSchema,
          })
          .strict(),
        sources: ["server"],
      },
    },
  },
  "payment.subscription.cancel_requested": {
    versions: {
      1: {
        attributes: z
          .object({
            periodEnd: z.string().datetime({ offset: true }),
            provider: providerSchema,
            subscriptionId: labelSchema,
          })
          .strict(),
        sources: ["server"],
      },
    },
  },
  "payment.subscription.past_due": {
    versions: {
      1: {
        attributes: z
          .object({
            provider: providerSchema,
            status: z.literal("past_due"),
            subscriptionId: labelSchema,
          })
          .strict(),
        sources: ["server"],
      },
    },
  },
  "payment.subscription.paused": {
    versions: {
      1: {
        attributes: z
          .object({
            provider: providerSchema,
            status: z.literal("paused"),
            subscriptionId: labelSchema,
          })
          .strict(),
        sources: ["server"],
      },
    },
  },
  "payment.subscription.upserted": {
    versions: {
      1: {
        attributes: z
          .object({ provider: providerSchema, subscriptionId: labelSchema })
          .strict(),
        sources: ["server"],
      },
    },
  },
  "payment.credits.already_granted": {
    versions: {
      1: {
        attributes: z.object({ periodKey: labelSchema }).strict(),
        sources: ["server"],
      },
    },
  },
  "payment.credits.grant_success": {
    versions: {
      1: {
        attributes: z
          .object({
            batchId: labelSchema,
            credits: z.number().int().positive(),
            granted: z.boolean(),
            planType: labelSchema,
          })
          .strict(),
        sources: ["server"],
      },
    },
  },
  "subscription.activated": {
    versions: {
      1: { attributes: emptyAttributesSchema, sources: ["server"] },
    },
  },
} as const satisfies Record<TelemetryEventName, unknown>;

function addEventDefinitionIssues(
  value: {
    attributes?: unknown;
    name: string;
    source: TelemetrySource;
    version: number;
  },
  ctx: z.RefinementCtx
): void {
  const definition = telemetryEventRegistry[value.name as TelemetryEventName];
  if (!definition) {
    ctx.addIssue({
      code: "custom",
      message: `Telemetry event is not registered: ${value.name}`,
      path: ["name"],
    });
    return;
  }

  const versionDefinition = (
    definition.versions as Readonly<
      Record<
        number,
        { attributes: z.ZodType; sources: readonly TelemetrySource[] }
      >
    >
  )[value.version];
  if (!versionDefinition) {
    ctx.addIssue({
      code: "custom",
      message: `Telemetry event version is not registered: ${value.name}@${value.version}`,
      path: ["version"],
    });
    return;
  }

  if (!versionDefinition.sources.includes(value.source)) {
    ctx.addIssue({
      code: "custom",
      message: `Telemetry event source is not allowed: ${value.name}`,
      path: ["source"],
    });
  }

  const attributes = versionDefinition.attributes.safeParse(
    value.attributes ?? {}
  );
  if (!attributes.success) {
    for (const issue of attributes.error.issues) {
      ctx.addIssue({
        code: "custom",
        message: issue.message,
        path: ["attributes", ...issue.path],
      });
    }
  }
}

const telemetryEventInputBaseSchema = z
  .object({
    attributes: z.record(z.string().min(1).max(64), jsonValueSchema).optional(),
    context: contextSchema.optional(),
    name: z.string(),
    source: z.enum(["client", "server", "system"]),
    version: z.number().int().positive().max(100),
  })
  .strict();

export const telemetryEventInputSchema =
  telemetryEventInputBaseSchema.superRefine(addEventDefinitionIssues);

const telemetryEventBaseSchema = z
  .object({
    attributes: z.record(z.string().min(1).max(64), jsonValueSchema),
    context: contextSchema,
    environment: z.enum(["development", "preview", "production", "test"]),
    eventId: identifierSchema,
    name: z.string(),
    occurredAt: z.string().datetime({ offset: true }),
    release: z.string().min(1).max(128).optional(),
    source: z.enum(["client", "server", "system"]),
    version: z.number().int().positive().max(100),
  })
  .strict();

export const telemetryEventSchema = telemetryEventBaseSchema.superRefine(
  addEventDefinitionIssues
);

export function parseTelemetryEventInput(input: unknown): TelemetryEventInput {
  const parsed = telemetryEventInputSchema.parse(input);

  return {
    name: parsed.name as TelemetryEventName,
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
