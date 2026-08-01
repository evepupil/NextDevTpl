import { describe, expect, it } from "vitest";

import { createProductTelemetryEventInput } from "@/lib/telemetry/events";

describe("product telemetry entry points", () => {
  it("creates explicit first-value and core-action event inputs", () => {
    expect(
      createProductTelemetryEventInput("first_value.completed", {
        action: "upload.completed",
        attributes: { fileType: "pdf" },
        context: { identity: { userId: "user-1" } },
      })
    ).toEqual({
      attributes: { action: "upload.completed", fileType: "pdf" },
      context: { identity: { userId: "user-1" } },
      name: "first_value.completed",
      source: "server",
      version: 1,
    });

    expect(
      createProductTelemetryEventInput("core_action.completed", {
        action: "document.exported",
      })
    ).toEqual({
      attributes: { action: "document.exported" },
      name: "core_action.completed",
      source: "server",
      version: 1,
    });
  });

  it("rejects an empty or oversized action", () => {
    expect(() =>
      createProductTelemetryEventInput("core_action.completed", { action: " " })
    ).toThrow();
    expect(() =>
      createProductTelemetryEventInput("core_action.completed", {
        action: "a".repeat(129),
      })
    ).toThrow();
  });
});
