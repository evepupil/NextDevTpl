import { noopTelemetryAdapter } from "@/adapters/analytics";
import {
  createTelemetryService,
  type TelemetryEnvironment,
} from "@/core/services";
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

export const telemetryService = createTelemetryService(noopTelemetryAdapter, {
  environment: getTelemetryEnvironment(),
  ...(release ? { release } : {}),
});
