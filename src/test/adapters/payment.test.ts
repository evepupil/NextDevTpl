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
          items: { data: [{ price: { id: "price_1" } }] },
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
});
