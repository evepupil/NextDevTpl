import type { TelemetryAdapter, TelemetryEvent } from "@/core/services";
import { logger } from "@/lib/logger";

export interface TelemetryLogSink {
  info(payload: Record<string, unknown>, message: string): void;
}

export function createLoggerTelemetryAdapter(
  sink: TelemetryLogSink = logger
): TelemetryAdapter {
  return {
    provider: "logger",
    capabilities: {
      clientEvents: false,
      identityLinking: false,
      query: false,
      serverEvents: true,
    },
    async track(event: TelemetryEvent) {
      sink.info({ telemetry: event }, "telemetry.event");
    },
  };
}
