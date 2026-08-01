import {
  AdapterError,
  type AlertAdapter,
  executeAdapterOperation,
} from "@/core/services";

export interface WebhookAlertConfig {
  fetch?: typeof globalThis.fetch;
  secret?: string;
  url: string;
}

export function createWebhookAlertAdapter(
  config: WebhookAlertConfig
): AlertAdapter {
  const request = config.fetch ?? globalThis.fetch;
  return {
    provider: "webhook",
    capabilities: { email: false, signedWebhook: Boolean(config.secret) },
    async notify(message) {
      const payload = JSON.stringify({
        alert: message,
        version: 1,
      });
      const signature = config.secret
        ? await hmacHex(config.secret, payload)
        : undefined;
      return executeAdapterOperation({
        operation: async () => {
          const response = await request(config.url, {
            body: payload,
            headers: {
              "Content-Type": "application/json",
              ...(signature ? { "X-NextDevTpl-Signature": signature } : {}),
            },
            method: "POST",
          });
          if (!response.ok) {
            throw new AdapterError({
              code:
                response.status >= 500 ? "remote_failure" : "invalid_request",
              message: `Alert webhook failed with status ${response.status}`,
              provider: "webhook",
              retryable: response.status >= 500,
            });
          }
          return { queued: true };
        },
        provider: "webhook",
        fallbackMessage: "Alert webhook failed",
        secrets: [config.url, config.secret],
      });
    },
  };
}

async function hmacHex(secret: string, value: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { hash: "SHA-256", name: "HMAC" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(value)
  );
  return [...new Uint8Array(signature)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
