import {
  AdapterError,
  type CancelSubscriptionInput,
  executeAdapterOperation,
  type JsonObject,
  type PaymentAdapter,
  type PaymentCheckout,
  type PaymentStatus,
  type PaymentSubscription,
  type PaymentWebhookEvent,
  type UpdateSubscriptionInput,
} from "@/core/services";
import { getRuntimeEnv } from "@/lib/runtime-config";

interface CreemConfig {
  apiKey?: string;
  fetch?: typeof globalThis.fetch;
  webhookSecret?: string;
}

interface CreemProduct {
  billing_type?: "onetime" | "recurring";
  id: string;
}

async function hmacHex(secret: string, value: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(value)
  );
  return [...new Uint8Array(signature)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function timingSafeHexEqual(
  left: string,
  right: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const [leftHash, rightHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(left)),
    crypto.subtle.digest("SHA-256", encoder.encode(right)),
  ]);
  const leftBytes = new Uint8Array(leftHash);
  const rightBytes = new Uint8Array(rightHash);
  let difference = leftBytes.length ^ rightBytes.length;
  for (let index = 0; index < leftBytes.length; index += 1) {
    difference |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }
  return difference === 0;
}

interface CreemCustomer {
  email?: string;
  id: string;
  name?: string;
}

interface CreemSubscription {
  cancel_at_period_end?: boolean;
  current_period_end_date: string;
  current_period_start_date: string;
  customer: CreemCustomer | string;
  id: string;
  metadata?: Record<string, string>;
  product: CreemProduct | string;
  status: PaymentStatus;
}

interface CreemCheckout {
  amount?: number;
  customer: CreemCustomer;
  currency?: string;
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

interface CreemPayment {
  amount?: number;
  currency?: string;
  customer?: CreemCustomer | string;
  metadata?: Record<string, string>;
  product?: CreemProduct | string;
  subscription?: CreemSubscription | string;
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
    cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
    metadata: subscription.metadata ?? {},
  };
}

function normalizeCheckout(checkout: CreemCheckout): PaymentCheckout {
  const subscription = checkout.subscription
    ? normalizeSubscription(checkout.subscription)
    : null;

  return {
    ...(typeof checkout.amount === "number"
      ? { amountMinor: checkout.amount }
      : {}),
    id: checkout.id,
    ...(checkout.currency ? { currency: checkout.currency } : {}),
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

function normalizePayment(payment: CreemPayment) {
  return {
    amountMinor: typeof payment.amount === "number" ? payment.amount : 0,
    ...(payment.currency ? { currency: payment.currency } : {}),
    ...(payment.customer ? { customerId: customerId(payment.customer) } : {}),
    metadata: payment.metadata ?? {},
    ...(payment.product ? { productId: productId(payment.product) } : {}),
    ...(typeof payment.subscription === "string"
      ? { subscriptionId: payment.subscription }
      : payment.subscription
        ? { subscriptionId: payment.subscription.id }
        : {}),
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
    const apiKey = config.apiKey ?? getRuntimeEnv("CREEM_API_KEY");
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
          cancel_url: input.cancelUrl ?? input.successUrl,
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

    async updateSubscription(id, input: UpdateSubscriptionInput) {
      const result = await requestCreem<CreemSubscription>(
        `/subscriptions/${encodeURIComponent(id)}/upgrade`,
        {
          body: JSON.stringify({
            product_id: input.productId,
            update_behavior: input.updateBehavior,
          }),
          method: "POST",
        }
      );
      return normalizeSubscription(result);
    },

    async cancelSubscription(
      id,
      input: CancelSubscriptionInput = { mode: "scheduled" }
    ) {
      const result = await requestCreem<CreemSubscription>(
        `/subscriptions/${encodeURIComponent(id)}/cancel`,
        {
          body: JSON.stringify({
            mode: input.mode ?? "scheduled",
            onExecute: "cancel",
          }),
          method: "POST",
        }
      );
      return normalizeSubscription(result);
    },

    async resumeSubscription(id) {
      const result = await requestCreem<CreemSubscription>(
        `/subscriptions/${encodeURIComponent(id)}/resume`,
        { method: "POST" }
      );
      return normalizeSubscription(result);
    },

    async verifyWebhook(input) {
      const secret =
        input.secret ??
        config.webhookSecret ??
        getRuntimeEnv("CREEM_WEBHOOK_SECRET");
      if (!secret) {
        throw new AdapterError({
          code: "configuration",
          message: "CREEM_WEBHOOK_SECRET is not configured",
          provider,
        });
      }

      const expected = await hmacHex(secret, input.payload);
      const valid = await timingSafeHexEqual(input.signature.trim(), expected);

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
      const payment =
        event.eventType === "payment.failed" ||
        event.eventType === "payment.refunded"
          ? normalizePayment(event.object as CreemPayment)
          : null;
      const subscription =
        event.eventType === "checkout.completed" || payment
          ? (checkout?.subscription ?? null)
          : normalizeSubscription(event.object as CreemSubscription);

      return {
        id: event.id,
        type: event.eventType,
        createdAt: new Date(event.created_at),
        checkout,
        payment,
        subscription,
        rawMetadata: event as unknown as JsonObject,
      };
    },
  };
}
