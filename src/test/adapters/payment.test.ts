import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";

import {
  createCreemPaymentAdapter,
  createStripePaymentAdapter,
} from "@/adapters/payment";

describe("Creem payment adapter", () => {
  it("creates a checkout through the normalized contract", async () => {
    let requestUrl = "";
    let requestInit: RequestInit | undefined;
    const request: typeof globalThis.fetch = async (input, init) => {
      requestUrl = String(input);
      requestInit = init;
      return Response.json({
        id: "checkout_1",
        status: "pending",
        checkout_url: "https://checkout.example/1",
      });
    };
    const adapter = createCreemPaymentAdapter({
      apiKey: "creem_test_key",
      fetch: request,
    });

    const result = await adapter.createCheckout({
      productId: "price_1",
      successUrl: "https://app.example/success",
      cancelUrl: "https://app.example/cancel",
      requestId: "request_1",
      metadata: { userId: "user_1" },
    });

    expect(result).toEqual({
      id: "checkout_1",
      status: "pending",
      url: "https://checkout.example/1",
    });
    expect(requestUrl).toBe("https://test-api.creem.io/v1/checkouts");
    expect(new Headers(requestInit?.headers).get("x-api-key")).toBe(
      "creem_test_key"
    );
    expect(JSON.parse(String(requestInit?.body))).toMatchObject({
      product_id: "price_1",
      success_url: "https://app.example/success",
      cancel_url: "https://app.example/cancel",
      request_id: "request_1",
      metadata: { userId: "user_1" },
    });
  });

  it("verifies and normalizes checkout webhooks", async () => {
    const secret = "webhook_secret";
    const createdAt = Date.now();
    const payload = JSON.stringify({
      id: "event_1",
      eventType: "checkout.completed",
      created_at: createdAt,
      object: {
        id: "checkout_1",
        object: "checkout",
        customer: { id: "customer_1", email: "user@example.com" },
        product: { id: "price_1", billing_type: "recurring" },
        status: "completed",
        metadata: { userId: "user_1" },
        subscription: {
          id: "subscription_1",
          status: "active",
          product: "price_1",
          customer: "customer_1",
          current_period_start_date: "2026-07-01T00:00:00.000Z",
          current_period_end_date: "2026-08-01T00:00:00.000Z",
          cancel_at_period_end: false,
          metadata: { userId: "user_1" },
        },
      },
    });
    const signature = createHmac("sha256", secret)
      .update(payload)
      .digest("hex");
    const adapter = createCreemPaymentAdapter({ webhookSecret: secret });

    const event = await adapter.verifyWebhook({ payload, signature });

    expect(event).toMatchObject({
      id: "event_1",
      type: "checkout.completed",
      checkout: {
        id: "checkout_1",
        mode: "subscription",
        productId: "price_1",
        metadata: { userId: "user_1" },
      },
      subscription: {
        id: "subscription_1",
        productId: "price_1",
        customerId: "customer_1",
      },
    });
    expect(event.createdAt).toEqual(new Date(createdAt));
  });

  it("updates, schedules cancellation, and resumes a subscription", async () => {
    const requests: Array<{ url: string; init: RequestInit | undefined }> = [];
    const request: typeof globalThis.fetch = async (input, init) => {
      requests.push({ url: String(input), init });
      return Response.json({
        cancel_at_period_end: false,
        current_period_end_date: "2026-09-01T00:00:00.000Z",
        current_period_start_date: "2026-08-01T00:00:00.000Z",
        customer: "customer_1",
        id: "subscription_1",
        product: "price_2",
        status: "active",
      });
    };
    const adapter = createCreemPaymentAdapter({
      apiKey: "creem_test_key",
      fetch: request,
    });

    await adapter.updateSubscription("subscription_1", {
      productId: "price_2",
      updateBehavior: "proration-none",
    });
    await adapter.cancelSubscription("subscription_1", { mode: "scheduled" });
    await adapter.resumeSubscription("subscription_1");

    expect(requests.map((item) => item.url)).toEqual([
      "https://test-api.creem.io/v1/subscriptions/subscription_1/upgrade",
      "https://test-api.creem.io/v1/subscriptions/subscription_1/cancel",
      "https://test-api.creem.io/v1/subscriptions/subscription_1/resume",
    ]);
    expect(JSON.parse(String(requests[0]?.init?.body))).toEqual({
      product_id: "price_2",
      update_behavior: "proration-none",
    });
    expect(JSON.parse(String(requests[1]?.init?.body))).toEqual({
      mode: "scheduled",
      onExecute: "cancel",
    });
  });
});

describe("Stripe payment adapter", () => {
  it("maps checkout inputs to Stripe form fields", async () => {
    let body = "";
    const request: typeof globalThis.fetch = async (_input, init) => {
      body = String(init?.body);
      return Response.json({
        id: "cs_1",
        customer: null,
        mode: "payment",
        status: "open",
        url: "https://checkout.stripe.test/cs_1",
      });
    };
    const adapter = createStripePaymentAdapter({
      apiKey: "sk_test_key",
      fetch: request,
    });

    await expect(
      adapter.createCheckout({
        mode: "one-time",
        productId: "price_1",
        successUrl: "https://app.example/success",
        cancelUrl: "https://app.example/cancel",
        metadata: { userId: "user_1" },
      })
    ).resolves.toEqual({
      id: "cs_1",
      status: "open",
      url: "https://checkout.stripe.test/cs_1",
    });

    const form = new URLSearchParams(body);
    expect(form.get("mode")).toBe("payment");
    expect(form.get("line_items[0][price]")).toBe("price_1");
    expect(form.get("cancel_url")).toBe("https://app.example/cancel");
    expect(form.get("metadata[userId]")).toBe("user_1");
  });

  it("verifies and normalizes subscription webhooks", async () => {
    const secret = "whsec_test";
    const timestamp = Math.floor(Date.now() / 1000);
    const payload = JSON.stringify({
      id: "evt_1",
      type: "customer.subscription.updated",
      created: timestamp,
      data: {
        object: {
          id: "sub_1",
          status: "past_due",
          customer: "cus_1",
          current_period_start: timestamp - 3600,
          current_period_end: timestamp + 3600,
          cancel_at_period_end: false,
          items: { data: [{ id: "si_1", price: { id: "price_1" } }] },
          metadata: { userId: "user_1" },
        },
      },
    });
    const signature = createHmac("sha256", secret)
      .update(`${timestamp}.${payload}`)
      .digest("hex");
    const adapter = createStripePaymentAdapter({ webhookSecret: secret });

    const event = await adapter.verifyWebhook({
      payload,
      signature: `t=${timestamp},v1=${signature}`,
    });

    expect(event).toMatchObject({
      id: "evt_1",
      type: "subscription.past_due",
      subscription: {
        id: "sub_1",
        productId: "price_1",
        customerId: "cus_1",
        status: "past_due",
      },
    });
  });

  it("updates a subscription item and supports scheduled cancel and resume", async () => {
    const requests: Array<{ url: string; init: RequestInit | undefined }> = [];
    const subscription = {
      cancel_at_period_end: false,
      current_period_end: 1_700_086_400,
      current_period_start: 1_700_000_000,
      customer: "cus_1",
      id: "sub_1",
      items: { data: [{ id: "si_1", price: { id: "price_2" } }] },
      status: "active" as const,
    };
    const request: typeof globalThis.fetch = async (input, init) => {
      requests.push({ url: String(input), init });
      return Response.json(subscription);
    };
    const adapter = createStripePaymentAdapter({
      apiKey: "sk_test_key",
      fetch: request,
    });

    await adapter.updateSubscription("sub_1", {
      productId: "price_2",
      updateBehavior: "proration-charge-immediately",
    });
    await adapter.cancelSubscription("sub_1", { mode: "scheduled" });
    await adapter.resumeSubscription("sub_1");

    expect(requests.map((item) => item.url)).toEqual([
      "https://api.stripe.com/v1/subscriptions/sub_1",
      "https://api.stripe.com/v1/subscriptions/sub_1",
      "https://api.stripe.com/v1/subscriptions/sub_1",
      "https://api.stripe.com/v1/subscriptions/sub_1",
    ]);
    const updateForm = new URLSearchParams(String(requests[1]?.init?.body));
    expect(updateForm.get("items[0][id]")).toBe("si_1");
    expect(updateForm.get("items[0][price]")).toBe("price_2");
    expect(updateForm.get("proration_behavior")).toBe("always_invoice");
    expect(
      new URLSearchParams(String(requests[2]?.init?.body)).get(
        "cancel_at_period_end"
      )
    ).toBe("true");
    expect(
      new URLSearchParams(String(requests[3]?.init?.body)).get(
        "cancel_at_period_end"
      )
    ).toBe("false");
  });

  it("normalizes failed payments and refunds without exposing payload content", async () => {
    const secret = "whsec_test";
    const timestamp = Math.floor(Date.now() / 1000);
    const payload = JSON.stringify({
      id: "evt_failed_1",
      type: "payment_intent.payment_failed",
      created: timestamp,
      data: {
        object: {
          amount: 900,
          currency: "usd",
          customer: "cus_1",
          metadata: { userId: "user_1" },
          subscription: "sub_1",
        },
      },
    });
    const signature = createHmac("sha256", secret)
      .update(`${timestamp}.${payload}`)
      .digest("hex");
    const adapter = createStripePaymentAdapter({ webhookSecret: secret });

    await expect(
      adapter.verifyWebhook({
        payload,
        signature: `t=${timestamp},v1=${signature}`,
      })
    ).resolves.toMatchObject({
      id: "evt_failed_1",
      payment: {
        amountMinor: 900,
        currency: "USD",
        metadata: { userId: "user_1" },
        subscriptionId: "sub_1",
      },
      type: "payment.failed",
    });
  });
});
