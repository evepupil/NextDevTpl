import { describe, expect, it } from "vitest";

import {
  createServiceAdapterSelection,
  defaultServiceAdapters,
  serviceAdapterRegistry,
  type ServiceAdapterChoices,
} from "@/adapters";
import {
  createAnthropicAdapter,
  createOpenAICompatibleAdapter,
  createWorkersAIAdapter,
} from "@/adapters/ai";
import {
  createCloudflareWorkflowsAdapter,
  createInngestJobAdapter,
} from "@/adapters/jobs";
import {
  createCloudflareEmailAdapter,
  createResendMailAdapter,
  createSmtpMailAdapter,
} from "@/adapters/mail";
import {
  createCreemPaymentAdapter,
  createStripePaymentAdapter,
} from "@/adapters/payment";
import {
  createCloudflareRateLimitAdapter,
  createUpstashServices,
} from "@/adapters/rate-limit";
import {
  createR2BindingStorageAdapter,
  createS3CompatibleStorageAdapter,
} from "@/adapters/storage";
import {
  executeAdapterOperation,
  sanitizeAdapterMessage,
  validateServiceAdapterManifests,
} from "@/core/services";

describe("service adapter registry", () => {
  it("registers unique adapters with valid service prefixes", () => {
    expect(validateServiceAdapterManifests(serviceAdapterRegistry)).toEqual([]);
    expect(new Set(serviceAdapterRegistry.map(({ id }) => id)).size).toBe(
      serviceAdapterRegistry.length
    );
  });

  it("exposes the shared descriptor and operations for every adapter", () => {
    const adapters = [
      { id: "payment:creem", adapter: createCreemPaymentAdapter() },
      { id: "payment:stripe", adapter: createStripePaymentAdapter() },
      {
        id: "storage:s3-compatible",
        adapter: createS3CompatibleStorageAdapter(),
      },
      {
        id: "storage:r2-binding",
        adapter: createR2BindingStorageAdapter({}),
      },
      { id: "mail:resend", adapter: createResendMailAdapter() },
      { id: "mail:smtp", adapter: createSmtpMailAdapter() },
      {
        id: "mail:cloudflare-email",
        adapter: createCloudflareEmailAdapter({
          async send() {
            return { messageId: "unused" };
          },
        }),
      },
      {
        id: "ai:openai-compatible",
        adapter: createOpenAICompatibleAdapter({ model: "unused" }),
      },
      {
        id: "ai:anthropic",
        adapter: createAnthropicAdapter({ model: "unused" }),
      },
      {
        id: "ai:workers-ai",
        adapter: createWorkersAIAdapter({
          model: "unused",
          binding: { async run() {} },
        }),
      },
      { id: "jobs:inngest", adapter: createInngestJobAdapter() },
      {
        id: "jobs:cloudflare-workflows",
        adapter: createCloudflareWorkflowsAdapter({}),
      },
      {
        id: "rate-limit:upstash",
        adapter: createUpstashServices({
          url: "https://example.upstash.io",
          token: "unused",
        }).rateLimit,
      },
      {
        id: "rate-limit:cloudflare-rate-limit",
        adapter: createCloudflareRateLimitAdapter({}),
      },
    ];

    expect(adapters.map(({ id }) => id)).toEqual(
      serviceAdapterRegistry.map(({ id }) => id)
    );
    for (const { id, adapter } of adapters) {
      expect(id.endsWith(`:${adapter.provider}`)).toBe(true);
      expect(Object.keys(adapter.capabilities).length).toBeGreaterThan(0);
      expect(
        Object.values(adapter).some((value) => typeof value === "function")
      ).toBe(true);
    }
  });

  it("resolves the complete default adapter selection", () => {
    const selection = createServiceAdapterSelection(defaultServiceAdapters);

    expect(selection.manifests).toHaveLength(6);
    expect(selection.packages).toEqual(
      expect.arrayContaining([
        "@aws-sdk/client-s3",
        "resend",
        "openai",
        "inngest",
        "@upstash/ratelimit",
      ])
    );
    expect(selection.bindings).toEqual([]);
  });

  it("resolves a Workers-native adapter selection", () => {
    const choices: ServiceAdapterChoices = {
      payment: "payment:stripe",
      storage: "storage:r2-binding",
      mail: "mail:cloudflare-email",
      ai: "ai:workers-ai",
      jobs: "jobs:cloudflare-workflows",
      "rate-limit": "rate-limit:cloudflare-rate-limit",
    };

    const selection = createServiceAdapterSelection(choices);

    expect(selection.packages).toEqual([]);
    expect(selection.bindings).toEqual([
      "R2Bucket",
      "SendEmail",
      "Ai",
      "Workflow",
      "RateLimit",
    ]);
    expect(selection.env).toEqual(
      expect.arrayContaining([
        "STRIPE_SECRET_KEY",
        "STRIPE_WEBHOOK_SECRET",
        "EMAIL_FROM",
        "WORKERS_AI_MODEL",
      ])
    );
  });
});

describe("adapter errors", () => {
  it("redacts every configured secret from error messages", () => {
    expect(
      sanitizeAdapterMessage("token-a then token-b then token-a", [
        "token-a",
        "token-b",
      ])
    ).toBe("[REDACTED] then [REDACTED] then [REDACTED]");
  });

  it("wraps provider failures in the shared error model", async () => {
    await expect(
      executeAdapterOperation({
        provider: "example",
        fallbackMessage: "Example request failed",
        secrets: ["secret-value"],
        operation: async () => {
          throw new Error("remote rejected secret-value");
        },
      })
    ).rejects.toMatchObject({
      name: "AdapterError",
      code: "remote_failure",
      message: "remote rejected [REDACTED]",
      provider: "example",
    });
  });
});
