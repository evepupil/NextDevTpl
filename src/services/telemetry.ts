import { createLoggerTelemetryAdapter } from "@/adapters/analytics";
import {
  createTelemetryService,
  type TelemetryEnvironment,
  type TelemetryEventInput,
} from "@/core/services";
import { logError } from "@/lib/logger";
import { getRuntimeEnv } from "@/lib/runtime-config";

function getTelemetryEnvironment(): TelemetryEnvironment {
  switch (getRuntimeEnv("NODE_ENV")) {
    case "production":
      return "production";
    case "test":
      return "test";
    case "preview":
      return "preview";
    default:
      return "development";
  }
}

const release = getRuntimeEnv("APP_VERSION");

export const telemetryService = createTelemetryService(
  createLoggerTelemetryAdapter(),
  {
    environment: getTelemetryEnvironment(),
    ...(release ? { release } : {}),
    onAdapterError(error, event) {
      logError(error, {
        eventId: event.eventId,
        eventName: event.name,
        provider: "logger",
        source: "telemetry-adapter",
      });
    },
  }
);

export function trackServerEvent(input: TelemetryEventInput): void {
  void telemetryService.track(input).catch(() => {
    // 埋点失败不能影响原始业务请求。
  });
}
