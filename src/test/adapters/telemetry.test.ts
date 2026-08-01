import { describe, expect, it, vi } from "vitest";

import {
  createLoggerTelemetryAdapter,
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
});
