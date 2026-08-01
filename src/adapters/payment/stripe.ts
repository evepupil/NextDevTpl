import {
  AdapterError,
  executeAdapterOperation,
  type JsonObject,
  type PaymentAdapter,
  type PaymentCheckout,
  type PaymentStatus,
  type PaymentSubscription,
  type PaymentTransaction,
  type PaymentWebhookType,
} from "@/core/services";
import { getRuntimeEnv } from "@/lib/runtime-config";

interface StripeConfig {
  apiKey?: string;
  fetch?: typeof globalThis.fetch;
  webhookSecret?: string;
  webhookToleranceSeconds?: number;
}

interface StripeSubscription {
  cancel_at_period_end: boolean;
  current_period_end: number;
  current_period_start: number;
  customer: string | { id: string };
  id: string;
  items: { data: Array<{ price: { id: string } }> };
  metadata?: Record<string, string>;
  status: PaymentStatus;
}

interface StripeCheckout {
  amount_total?: number | null;
  customer: string | { id: string } | null;
  customer_details?: { email?: string; name?: string };
  currency?: string | null;
  id: string;
  metadata?: Record<string, string>;
  mode: "payment" | "setup" | "subscription";
  status: string;
  subscription?: StripeSubscription | string | null;
  url?: string | null;
}

interface StripeWebhookEvent {
  created: number;
  data: {
    object:
      | StripeCheckout
      | StripeSubscription
      | StripePaymentIntent
      | StripeCharge;
  };
  id: string;
  type: string;
}

interface StripePaymentIntent {
  amount: number;
  currency: string;
  customer?: string | null;
  metadata?: Record<string, string>;
  subscription?: string | null;
}

interface StripeCharge {
  amount: number;
  currency: string;
  customer?: string | null;
  metadata?: Record<string, string>;
  subscription?: string | null;
}

function formBody(values: Record<string, string | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) {
      params.set(key, value);
    }
  }
  return params.toString();
}

function mapSubscription(value: StripeSubscription): PaymentSubscription {
  return {
    id: value.id,
    status: value.status,
    productId: value.items.data[0]?.price.id ?? "",
    customerId:
      typeof value.customer === "string" ? value.customer : value.customer.id,
    currentPeriodStart: new Date(value.current_period_start * 1000),
    currentPeriodEnd: new Date(value.current_period_end * 1000),
    cancelAtPeriodEnd: value.cancel_at_period_end,
    metadata: value.metadata ?? {},
  };
}

function mapPayment(
  value: StripePaymentIntent | StripeCharge
): PaymentTransaction {
  return {
    amountMinor: value.amount,
    currency: value.currency.toUpperCase(),
    ...(value.customer ? { customerId: value.customer } : {}),
    metadata: value.metadata ?? {},
    ...(value.subscription ? { subscriptionId: value.subscription } : {}),
  };
}

function mapCheckout(value: StripeCheckout): PaymentCheckout {
  const subscription =
    value.subscription && typeof value.subscription !== "string"
      ? mapSubscription(value.subscription)
      : null;
  const customerId =
    typeof value.customer === "string"
      ? value.customer
      : (value.customer?.id ?? subscription?.customerId ?? "");

  return {
    ...(typeof value.amount_total === "number"
      ? { amountMinor: value.amount_total }
      : {}),
    id: value.id,
    ...(value.currency ? { currency: value.currency } : {}),
    mode: value.mode === "payment" ? "one-time" : "subscription",
    productId: subscription?.productId ?? value.metadata?.productId ?? "",
    customer: {
      id: customerId,
      ...(value.customer_details?.email
        ? { email: value.customer_details.email }
        : {}),
      ...(value.customer_details?.name
        ? { name: value.customer_details.name }
        : {}),
    },
    status: value.status,
    subscription,
    metadata: value.metadata ?? {},
  };
}

function mapWebhookType(event: StripeWebhookEvent): PaymentWebhookType {
  switch (event.type) {
    case "checkout.session.completed":
      return "checkout.completed";
    case "payment_intent.payment_failed":
      return "payment.failed";
    case "charge.refunded":
      return "payment.refunded";
    case "customer.subscription.created":
      return "subscription.active";
    case "customer.subscription.deleted":
      return "subscription.canceled";
    case "customer.subscription.updated": {
      const subscription = event.data.object as StripeSubscription;
      if (subscription.status === "past_due") return "subscription.past_due";
      if (subscription.status === "paused") return "subscription.paused";
      if (subscription.status === "canceled") return "subscription.canceled";
      return "subscription.renewed";
    }
    default:
      throw new AdapterError({
        code: "unsupported",
        message: `Unsupported Stripe webhook type ${event.type}`,
        provider: "stripe",
      });
  }
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

export function createStripePaymentAdapter(
  config: StripeConfig = {}
): PaymentAdapter {
  const provider = "stripe" as const;
  const request = config.fetch ?? globalThis.fetch;

  function apiKey(): string {
    const key = config.apiKey ?? getRuntimeEnv("STRIPE_SECRET_KEY");
    if (!key) {
      throw new AdapterError({
        code: "configuration",
        message: "STRIPE_SECRET_KEY is not configured",
        provider,
      });
    }
    return key;
  }

  async function stripeRequest<T>(
    path: string,
    init: RequestInit = {}
  ): Promise<T> {
    const key = apiKey();
    return executeAdapterOperation({
      provider,
      fallbackMessage: "Stripe request failed",
      secrets: [key],
      operation: async () => {
        const response = await request(`https://api.stripe.com/v1${path}`, {
          ...init,
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/x-www-form-urlencoded",
            ...init.headers,
          },
        });
        if (!response.ok) {
          throw new AdapterError({
            code: response.status === 429 ? "rate_limited" : "remote_failure",
            message: `Stripe request failed with status ${response.status}`,
            provider,
            retryable: response.status === 429 || response.status >= 500,
          });
        }
        return (await response.json()) as T;
      },
    });
  }

  return {
    provider,
    capabilities: {
      customerPortal: true,
      oneTimePayments: true,
      subscriptions: true,
      webhooks: true,
    },

    async createCheckout(input) {
      const metadata = Object.fromEntries(
        Object.entries(input.metadata ?? {}).map(([key, value]) => [
          `metadata[${key}]`,
          value,
        ])
      );
      const subscriptionMetadata = Object.fromEntries(
        Object.entries(input.metadata ?? {}).map(([key, value]) => [
          `subscription_data[metadata][${key}]`,
          value,
        ])
      );
      const result = await stripeRequest<StripeCheckout>("/checkout/sessions", {
        method: "POST",
        body: formBody({
          mode: input.mode === "one-time" ? "payment" : "subscription",
          "line_items[0][price]": input.productId,
          "line_items[0][quantity]": "1",
          success_url: input.successUrl,
          cancel_url: input.cancelUrl ?? input.successUrl,
          client_reference_id: input.requestId,
          ...metadata,
          ...(input.mode === "subscription" ? subscriptionMetadata : {}),
        }),
      });
      if (!result.url) {
        throw new AdapterError({
          code: "remote_failure",
          message: "Stripe returned a checkout without a URL",
          provider,
        });
      }
      return { id: result.id, status: result.status, url: result.url };
    },

    async getSubscription(id) {
      return mapSubscription(
        await stripeRequest<StripeSubscription>(
          `/subscriptions/${encodeURIComponent(id)}`
        )
      );
    },

    async cancelSubscription(id) {
      return mapSubscription(
        await stripeRequest<StripeSubscription>(
          `/subscriptions/${encodeURIComponent(id)}`,
          { method: "DELETE" }
        )
      );
    },

    async verifyWebhook(input) {
      const secret =
        input.secret ??
        config.webhookSecret ??
        getRuntimeEnv("STRIPE_WEBHOOK_SECRET");
      if (!secret) {
        throw new AdapterError({
          code: "configuration",
          message: "STRIPE_WEBHOOK_SECRET is not configured",
          provider,
        });
      }
      const parts = Object.fromEntries(
        input.signature.split(",").map((part) => {
          const [key, value] = part.split("=", 2);
          return [key ?? "", value ?? ""];
        })
      );
      const timestamp = Number(parts.t);
      const signature = parts.v1;
      const tolerance = config.webhookToleranceSeconds ?? 300;
      if (
        !Number.isFinite(timestamp) ||
        !signature ||
        Math.abs(Date.now() / 1000 - timestamp) > tolerance ||
        (await hmacHex(secret, `${timestamp}.${input.payload}`)) !== signature
      ) {
        throw new AdapterError({
          code: "signature_invalid",
          message: "Invalid webhook signature",
          provider,
        });
      }

      const event = JSON.parse(input.payload) as StripeWebhookEvent;
      const type = mapWebhookType(event);
      const checkout =
        type === "checkout.completed"
          ? mapCheckout(event.data.object as StripeCheckout)
          : null;
      const payment =
        type === "payment.failed"
          ? mapPayment(event.data.object as unknown as StripePaymentIntent)
          : type === "payment.refunded"
            ? mapPayment(event.data.object as unknown as StripeCharge)
            : null;
      const subscription =
        type === "checkout.completed" || payment
          ? (checkout?.subscription ?? null)
          : mapSubscription(event.data.object as StripeSubscription);
      return {
        id: event.id,
        type,
        createdAt: new Date(event.created * 1000),
        checkout,
        payment,
        subscription,
        rawMetadata: event as unknown as JsonObject,
      };
    },
  };
}
