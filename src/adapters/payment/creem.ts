import crypto from "node:crypto";

import {
  AdapterError,
  executeAdapterOperation,
  type JsonObject,
  type PaymentAdapter,
  type PaymentCheckout,
  type PaymentStatus,
  type PaymentSubscription,
  type PaymentWebhookEvent,
} from "@/core/services";

interface CreemConfig {
  apiKey?: string;
  fetch?: typeof globalThis.fetch;
  webhookSecret?: string;
}

interface CreemProduct {
  billing_type?: "onetime" | "recurring";
  id: string;
}

interface CreemCustomer {
  email?: string;
  id: string;
  name?: string;
}

interface CreemSubscription {
  cancel_at_period_end: boolean;
  current_period_end_date: string;
  current_period_start_date: string;
  customer: CreemCustomer | string;
  id: string;
  metadata?: Record<string, string>;
  product: CreemProduct | string;
  status: PaymentStatus;
}

interface CreemCheckout {
  customer: CreemCustomer;
  id: string;
  metadata?: Record<string, string>;
  mode?: "live" | "test";
  object: "checkout";
  order?: {
    product: string;
    type: "onetime" | "subscription";
  };
  product?: CreemProduct;
  status: string;
  subscription?: CreemSubscription;
}

interface CreemWebhookEvent {
  created_at: number;
  eventType: PaymentWebhookEvent["type"];
  id: string;
  object: CreemCheckout | CreemSubscription;
}

function productId(product: CreemProduct | string): string {
  return typeof product === "string" ? product : product.id;
}

function customerId(customer: CreemCustomer | string): string {
  return typeof customer === "string" ? customer : customer.id;
}

function normalizeSubscription(
  subscription: CreemSubscription
): PaymentSubscription {
  return {
    id: subscription.id,
    status: subscription.status,
    productId: productId(subscription.product),
    customerId: customerId(subscription.customer),
    currentPeriodStart: new Date(subscription.current_period_start_date),
    currentPeriodEnd: new Date(subscription.current_period_end_date),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    metadata: subscription.metadata ?? {},
  };
}

function normalizeCheckout(checkout: CreemCheckout): PaymentCheckout {
  const subscription = checkout.subscription
    ? normalizeSubscription(checkout.subscription)
    : null;

  return {
    id: checkout.id,
    mode:
      checkout.order?.type === "onetime" ||
      checkout.product?.billing_type === "onetime"
        ? "one-time"
        : "subscription",
    productId:
      checkout.product?.id ??
      checkout.order?.product ??
      subscription?.productId ??
      "",
    customer: checkout.customer,
    status: checkout.status,
    subscription,
    metadata: checkout.metadata ?? {},
  };
}

async function readJson<T>(response: Response, provider: string): Promise<T> {
  if (!response.ok) {
    throw new AdapterError({
      code:
        response.status === 401 || response.status === 403
          ? "authentication"
          : response.status === 429
            ? "rate_limited"
            : "remote_failure",
      message: `${provider} request failed with status ${response.status}`,
      provider,
      retryable: response.status === 429 || response.status >= 500,
    });
  }

  return (await response.json()) as T;
}

export function createCreemPaymentAdapter(
  config: CreemConfig = {}
): PaymentAdapter {
  const provider = "creem" as const;
  const request = config.fetch ?? globalThis.fetch;

  function getApiKey(): string {
    const apiKey = config.apiKey ?? process.env.CREEM_API_KEY;
    if (!apiKey) {
      throw new AdapterError({
        code: "configuration",
        message: "CREEM_API_KEY is not configured",
        provider,
      });
    }
    return apiKey;
  }

  function apiBase(apiKey: string): string {
    return apiKey.startsWith("creem_test_")
      ? "https://test-api.creem.io/v1"
      : "https://api.creem.io/v1";
  }

  async function requestCreem<T>(
    path: string,
    init: RequestInit = {}
  ): Promise<T> {
    const apiKey = getApiKey();
    return executeAdapterOperation({
      provider,
      fallbackMessage: "Creem request failed",
      secrets: [apiKey],
      operation: async () => {
        const response = await request(`${apiBase(apiKey)}${path}`, {
          ...init,
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            ...init.headers,
          },
        });
        return readJson<T>(response, provider);
      },
    });
  }

  return {
    provider,
    capabilities: {
      customerPortal: false,
      oneTimePayments: true,
      subscriptions: true,
      webhooks: true,
    },

    async createCheckout(input) {
      const result = await requestCreem<{
        checkout_url: string;
        id: string;
        status: string;
      }>("/checkouts", {
        method: "POST",
        body: JSON.stringify({
          product_id: input.productId,
          success_url: input.successUrl,
          ...(input.requestId ? { request_id: input.requestId } : {}),
          ...(input.metadata ? { metadata: input.metadata } : {}),
        }),
      });

      return { id: result.id, status: result.status, url: result.checkout_url };
    },

    async getSubscription(id) {
      const result = await requestCreem<CreemSubscription>(
        `/subscriptions/${encodeURIComponent(id)}`
      );
      return normalizeSubscription(result);
    },

    async cancelSubscription(id) {
      const result = await requestCreem<CreemSubscription>(
        `/subscriptions/${encodeURIComponent(id)}/cancel`,
        { method: "POST" }
      );
      return normalizeSubscription(result);
    },

    async verifyWebhook(input) {
      const secret =
        input.secret ??
        config.webhookSecret ??
        process.env.CREEM_WEBHOOK_SECRET;
      if (!secret) {
        throw new AdapterError({
          code: "configuration",
          message: "CREEM_WEBHOOK_SECRET is not configured",
          provider,
        });
      }

      const expected = crypto
        .createHmac("sha256", secret)
        .update(input.payload)
        .digest("hex");
      const suppliedBuffer = Buffer.from(input.signature);
      const expectedBuffer = Buffer.from(expected);
      const valid =
        suppliedBuffer.length === expectedBuffer.length &&
        crypto.timingSafeEqual(suppliedBuffer, expectedBuffer);

      if (!valid) {
        throw new AdapterError({
          code: "signature_invalid",
          message: "Invalid webhook signature",
          provider,
        });
      }

      const event = JSON.parse(input.payload) as CreemWebhookEvent;
      const checkout =
        event.eventType === "checkout.completed"
          ? normalizeCheckout(event.object as CreemCheckout)
          : null;
      const subscription =
        event.eventType === "checkout.completed"
          ? (checkout?.subscription ?? null)
          : normalizeSubscription(event.object as CreemSubscription);

      return {
        id: event.id,
        type: event.eventType,
        createdAt: new Date(event.created_at),
        checkout,
        subscription,
        rawMetadata: event as unknown as JsonObject,
      };
    },
  };
}
