import type {
  JsonObject,
  TelemetryContext,
  TelemetryEventInput,
} from "@/core/services";
import { trackServerEvent } from "@/services/telemetry";

export interface ProductTelemetryEventInput {
  action: string;
  attributes?: JsonObject;
  context?: TelemetryContext;
}

export function createProductTelemetryEventInput(
  name: "core_action.completed" | "first_value.completed",
  input: ProductTelemetryEventInput
): TelemetryEventInput {
  const action = input.action.trim();
  if (!action || action.length > 128) {
    throw new Error("Telemetry action must contain 1 to 128 characters");
  }

  return {
    attributes: {
      ...(input.attributes ?? {}),
      action,
    },
    ...(input.context ? { context: input.context } : {}),
    name,
    source: "server",
    version: 1,
  };
}

export function trackFirstValueCompleted(
  input: ProductTelemetryEventInput
): void {
  trackServerEvent(
    createProductTelemetryEventInput("first_value.completed", input)
  );
}

export function trackCoreActionCompleted(
  input: ProductTelemetryEventInput
): void {
  trackServerEvent(
    createProductTelemetryEventInput("core_action.completed", input)
  );
}
