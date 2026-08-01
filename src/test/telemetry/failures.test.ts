import { describe, expect, it } from "vitest";

import {
  createActionFailureEvent,
  createApiFailureEvent,
  createJobFailureEvent,
} from "@/lib/telemetry/failures";

describe("failure telemetry events", () => {
  it("builds an API failure event with a request context", () => {
    expect(
      createApiFailureEvent({
        context: { identity: { anonymousId: "anon-1" } },
        durationMs: 12.6,
        failureClass: "authorization",
        method: "GET",
        path: "/api/profile?email=hidden",
        statusCode: 401,
      })
    ).toEqual({
      attributes: {
        durationMs: 13,
        failureClass: "authorization",
        method: "GET",
        path: "/api/profile",
        statusCode: 401,
      },
      context: { identity: { anonymousId: "anon-1" } },
      name: "api.request.failed",
      source: "server",
      version: 1,
    });
  });

  it("keeps action failures free of raw error details", () => {
    expect(
      createActionFailureEvent({
        action: "support.createTicket",
        durationMs: 4,
        failureClass: "validation",
      })
    ).toEqual({
      attributes: {
        action: "support.createTicket",
        durationMs: 4,
        failureClass: "validation",
      },
      name: "action.failed",
      source: "server",
      version: 1,
    });
  });

  it("records job phase and retryability without the payload", () => {
    expect(
      createJobFailureEvent({
        failureClass: "exception",
        jobName: "app/hello-world",
        phase: "dispatch",
        provider: "inngest",
        retryable: true,
      })
    ).toEqual({
      attributes: {
        failureClass: "exception",
        jobName: "app/hello-world",
        phase: "dispatch",
        provider: "inngest",
        retryable: true,
      },
      name: "job.failed",
      source: "system",
      version: 1,
    });
  });
});
