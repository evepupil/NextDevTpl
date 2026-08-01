import {
  AdapterError,
  executeAdapterOperation,
  type TelemetryAdapter,
  type TelemetryEvent,
} from "@/core/services";

export interface Ga4Config {
  apiSecret?: string;
  fetch?: typeof globalThis.fetch;
  measurementId?: string;
}

function eventName(name: string): string {
  return name.replaceAll(".", "_").slice(0, 40);
}

function clientId(event: TelemetryEvent): string {
  return (
    event.context.identity?.anonymousId ??
    event.context.identity?.userId ??
    event.eventId
  );
}

export function createGa4TelemetryAdapter(config: Ga4Config): TelemetryAdapter {
  const provider = "ga4" as const;
  const request = config.fetch ?? globalThis.fetch;

  return {
    provider,
    capabilities: {
      clientEvents: true,
      identityLinking: true,
      query: false,
      serverEvents: true,
    },
    async track(event) {
      if (!config.measurementId || !config.apiSecret) {
        throw new AdapterError({
          code: "configuration",
          message: "GA4_MEASUREMENT_ID and GA4_API_SECRET are required",
          provider,
        });
      }

      const measurementId = config.measurementId;
      const apiSecret = config.apiSecret;
      await executeAdapterOperation({
        provider,
        fallbackMessage: "GA4 event delivery failed",
        secrets: [apiSecret],
        operation: async () => {
          const response = await request(
            `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`,
            {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                client_id: clientId(event),
                ...(event.context.identity?.userId
                  ? { user_id: event.context.identity.userId }
                  : {}),
                events: [
                  {
                    name: eventName(event.name),
                    params: {
                      ...event.attributes,
                      environment: event.environment,
                      source: event.source,
                      telemetry_version: event.version,
                    },
                  },
                ],
              }),
            }
          );

          if (!response.ok) {
            throw new AdapterError({
              code: response.status === 429 ? "rate_limited" : "remote_failure",
              message: `GA4 request failed with status ${response.status}`,
              provider,
              retryable: response.status === 429 || response.status >= 500,
            });
          }
        },
      });
    },
  };
}
