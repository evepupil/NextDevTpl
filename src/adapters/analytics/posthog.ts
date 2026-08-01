import {
  AdapterError,
  executeAdapterOperation,
  type TelemetryAdapter,
  type TelemetryEvent,
} from "@/core/services";

export interface PostHogConfig {
  apiKey?: string;
  fetch?: typeof globalThis.fetch;
  host?: string;
}

function distinctId(event: TelemetryEvent): string {
  return (
    event.context.identity?.userId ??
    event.context.identity?.anonymousId ??
    event.eventId
  );
}

export function createPostHogTelemetryAdapter(
  config: PostHogConfig
): TelemetryAdapter {
  const provider = "posthog" as const;
  const request = config.fetch ?? globalThis.fetch;
  const host = (config.host ?? "https://us.i.posthog.com").replace(/\/$/u, "");

  return {
    provider,
    capabilities: {
      clientEvents: true,
      identityLinking: true,
      query: false,
      serverEvents: true,
    },
    async track(event) {
      if (!config.apiKey) {
        throw new AdapterError({
          code: "configuration",
          message: "POSTHOG_API_KEY is not configured",
          provider,
        });
      }

      const apiKey = config.apiKey;
      await executeAdapterOperation({
        provider,
        fallbackMessage: "PostHog event delivery failed",
        secrets: [apiKey],
        operation: async () => {
          const response = await request(`${host}/capture/`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              api_key: apiKey,
              event: event.name,
              distinct_id: distinctId(event),
              properties: {
                ...event.attributes,
                $lib: "nextdevtpl",
                $lib_version: event.version,
                environment: event.environment,
                source: event.source,
                ...(event.context.identity?.userId &&
                event.context.identity.anonymousId
                  ? {
                      $anon_distinct_id: event.context.identity.anonymousId,
                    }
                  : {}),
              },
              timestamp: event.occurredAt,
            }),
          });

          if (!response.ok) {
            throw new AdapterError({
              code: response.status === 429 ? "rate_limited" : "remote_failure",
              message: `PostHog request failed with status ${response.status}`,
              provider,
              retryable: response.status === 429 || response.status >= 500,
            });
          }
        },
      });
    },
  };
}
