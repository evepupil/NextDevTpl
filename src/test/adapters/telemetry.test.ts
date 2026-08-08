import { describe, expect, it, vi } from "vitest";

import {
  createGa4TelemetryAdapter,
  createLoggerTelemetryAdapter,
  createPostHogTelemetryAdapter,
  createUmamiTelemetryAdapter,
  noopTelemetryAdapter,
} from "@/adapters/analytics";
import {
  createTelemetryEvent,
  createTelemetryService,
  type TelemetryAdapter,
} from "@/core/services";

const eventOptions = {
  clock: () => new Date("2026-08-01T00:00:00.000Z"),
  createEventId: () => "event-1",
  environment: "test" as const,
  release: "test-release",
};

describe("telemetry event contract", () => {
  it("builds a stable envelope and removes sensitive attributes", () => {
    const event = createTelemetryEvent(
      {
        attributes: {
          feature: "upload",
          nested: {
            authorization: "Bearer secret",
            safe: true,
          },
          password: "hidden",
          prompt: "private prompt",
          uploadContent: "private file",
        },
        context: {
          identity: { anonymousId: "anon-1", userId: "user-1" },
          locale: "zh-CN",
          sessionId: "session-1",
        },
        name: "first_value.completed",
        source: "server",
        version: 1,
      },
      eventOptions
    );

    expect(event).toEqual({
      attributes: {
        feature: "upload",
        nested: { safe: true },
      },
      context: {
        identity: { anonymousId: "anon-1", userId: "user-1" },
        locale: "zh-CN",
        sessionId: "session-1",
      },
      environment: "test",
      eventId: "event-1",
      name: "first_value.completed",
      occurredAt: "2026-08-01T00:00:00.000Z",
      release: "test-release",
      source: "server",
      version: 1,
    });
  });

  it("rejects invalid event names and unknown context fields", () => {
    expect(() =>
      createTelemetryEvent(
        {
          name: "invalid event",
          source: "server",
          version: 1,
        },
        eventOptions
      )
    ).toThrow();

    expect(() =>
      createTelemetryEvent(
        {
          context: { email: "not-allowed@example.com" } as never,
          name: "signup.completed",
          source: "server",
          version: 1,
        },
        eventOptions
      )
    ).toThrow();
  });
});

describe("telemetry adapters", () => {
  it("keeps noop available without doing external work", async () => {
    await expect(
      noopTelemetryAdapter.track(
        createTelemetryEvent(
          { name: "signup.completed", source: "server", version: 1 },
          eventOptions
        )
      )
    ).resolves.toBeUndefined();
  });

  it("writes the complete event envelope to the structured logger", async () => {
    const records: Array<{
      message: string;
      payload: Record<string, unknown>;
    }> = [];
    const adapter = createLoggerTelemetryAdapter({
      info(payload, message) {
        records.push({ message, payload });
      },
    });
    const event = createTelemetryEvent(
      { name: "signup.completed", source: "server", version: 1 },
      eventOptions
    );

    await adapter.track(event);

    expect(records).toHaveLength(1);
    expect(records[0]).toEqual({
      message: "telemetry.event",
      payload: { telemetry: event },
    });
  });

  it("swallows adapter failures and reports them through the hook", async () => {
    const error = new Error("sink unavailable");
    const onAdapterError = vi.fn();
    const adapter: TelemetryAdapter = {
      provider: "logger",
      capabilities: {
        clientEvents: false,
        identityLinking: false,
        query: false,
        serverEvents: true,
      },
      async track() {
        throw error;
      },
    };
    const service = createTelemetryService(adapter, {
      ...eventOptions,
      onAdapterError,
    });

    await expect(
      service.track({ name: "signup.completed", source: "server", version: 1 })
    ).resolves.toBeUndefined();
    expect(onAdapterError).toHaveBeenCalledWith(
      error,
      expect.objectContaining({ name: "signup.completed" })
    );
  });

  it("sends a redacted event to PostHog and links the anonymous identity", async () => {
    const requests: RequestInit[] = [];
    const adapter = createPostHogTelemetryAdapter({
      apiKey: "phc-test",
      fetch: async (_input, init) => {
        requests.push(init ?? {});
        return new Response("ok", { status: 200 });
      },
    });
    const event = createTelemetryEvent(
      {
        attributes: { password: "hidden", plan: "pro" },
        context: { identity: { anonymousId: "anon-1", userId: "user-1" } },
        name: "subscription.activated",
        source: "server",
        version: 1,
      },
      eventOptions
    );

    await adapter.track(event);

    expect(requests).toHaveLength(1);
    const body = JSON.parse(String(requests[0]?.body)) as {
      distinct_id: string;
      properties: Record<string, unknown>;
    };
    expect(body.distinct_id).toBe("user-1");
    expect(body.properties.$anon_distinct_id).toBe("anon-1");
    expect(body.properties.password).toBeUndefined();
  });

  it("uses the GA4 Measurement Protocol contract", async () => {
    const requests: Array<{ input: string; init: RequestInit }> = [];
    const adapter = createGa4TelemetryAdapter({
      apiSecret: "secret",
      fetch: async (input, init) => {
        requests.push({ input: String(input), init: init ?? {} });
        return new Response(null, { status: 204 });
      },
      measurementId: "G-TEST",
    });

    await adapter.track(
      createTelemetryEvent(
        { name: "landing.viewed", source: "client", version: 1 },
        eventOptions
      )
    );

    expect(requests[0]?.input).toContain("measurement_id=G-TEST");
    expect(requests[0]?.input).toContain("api_secret=secret");
    const body = JSON.parse(String(requests[0]?.init.body)) as {
      events: Array<{ name: string }>;
    };
    expect(body.events[0]?.name).toBe("landing_viewed");
  });

  it("sends Umami events without exposing the API key in the payload", async () => {
    const requests: RequestInit[] = [];
    const adapter = createUmamiTelemetryAdapter({
      apiKey: "umami-secret",
      fetch: async (_input, init) => {
        requests.push(init ?? {});
        return new Response(null, { status: 200 });
      },
      siteUrl: "https://app.example.test",
      websiteId: "website-1",
    });

    await adapter.track(
      createTelemetryEvent(
        {
          attributes: { path: "/zh/pricing" },
          name: "core_action.completed",
          source: "server",
          version: 1,
        },
        eventOptions
      )
    );

    expect(requests).toHaveLength(1);
    expect(requests[0]?.headers).toMatchObject({
      "x-umami-api-key": "umami-secret",
    });
    expect(String(requests[0]?.body)).not.toContain("umami-secret");
    const body = JSON.parse(String(requests[0]?.body)) as {
      payload: { hostname: string; url: string };
    };
    expect(body.payload.hostname).toBe("app.example.test");
    expect(body.payload.url).toBe("https://app.example.test/zh/pricing");
  });
});
