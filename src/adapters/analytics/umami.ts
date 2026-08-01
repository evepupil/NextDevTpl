import {
  AdapterError,
  executeAdapterOperation,
  type TelemetryAdapter,
  type TelemetryEvent,
} from "@/core/services";

export interface UmamiConfig {
  apiKey?: string;
  fetch?: typeof globalThis.fetch;
  host?: string;
  websiteId?: string;
}

function distinctId(event: TelemetryEvent): string {
  return (
    event.context.identity?.userId ??
    event.context.identity?.anonymousId ??
    event.eventId
  );
}

export function createUmamiTelemetryAdapter(
  config: UmamiConfig
): TelemetryAdapter {
  const provider = "umami" as const;
  const request = config.fetch ?? globalThis.fetch;
  const host = (config.host ?? "https://analytics.umami.is").replace(
    /\/$/u,
    ""
  );

  return {
    provider,
    capabilities: {
      clientEvents: true,
      identityLinking: true,
      query: false,
      serverEvents: true,
    },
    async track(event) {
      if (!config.websiteId) {
        throw new AdapterError({
          code: "configuration",
          message: "UMAMI_WEBSITE_ID is not configured",
          provider,
        });
      }

      const apiKey = config.apiKey;
      await executeAdapterOperation({
        provider,
        fallbackMessage: "Umami event delivery failed",
        secrets: [apiKey],
        operation: async () => {
          const response = await request(`${host}/api/send`, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              ...(apiKey ? { "x-umami-api-key": apiKey } : {}),
            },
            body: JSON.stringify({
              type: "event",
              payload: {
                website: config.websiteId,
                hostname: "nextdevtpl",
                url: "/",
                name: event.name,
                eventData: {
                  ...event.attributes,
                  environment: event.environment,
                  source: event.source,
                  telemetry_version: event.version,
                  distinct_id: distinctId(event),
                },
              },
            }),
          });

          if (!response.ok) {
            throw new AdapterError({
              code: response.status === 429 ? "rate_limited" : "remote_failure",
              message: `Umami request failed with status ${response.status}`,
              provider,
              retryable: response.status === 429 || response.status >= 500,
            });
          }
        },
      });
    },
  };
}
