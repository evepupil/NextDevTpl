import {
  AdapterError,
  executeAdapterOperation,
  type AIAdapter,
  type AIMessage,
} from "@/core/services";

interface AnthropicConfig {
  apiKey?: string;
  fetch?: typeof globalThis.fetch;
  model: string;
}

interface AnthropicResponse {
  content?: Array<{ text?: string; type: string }>;
  model?: string;
}

function buildAnthropicMessages(messages: readonly AIMessage[]) {
  return {
    system: messages
      .filter((message) => message.role === "system")
      .map((message) => message.content)
      .join("\n\n"),
    messages: messages
      .filter((message) => message.role !== "system")
      .map((message) => ({ role: message.role, content: message.content })),
  };
}

export function createAnthropicAdapter(config: AnthropicConfig): AIAdapter {
  const provider = "anthropic" as const;
  const request = config.fetch ?? globalThis.fetch;

  return {
    provider,
    capabilities: {
      jsonOutput: false,
      streaming: true,
      toolCalling: true,
    },

    async complete(input) {
      if (!config.apiKey) {
        throw new AdapterError({
          code: "configuration",
          message: "ANTHROPIC_API_KEY is not configured",
          provider,
        });
      }
      const apiKey = config.apiKey;
      if (input.jsonMode) {
        throw new AdapterError({
          code: "unsupported",
          message: "Anthropic adapter does not guarantee JSON mode",
          provider,
        });
      }

      const normalized = buildAnthropicMessages(input.messages);
      const result = await executeAdapterOperation({
        provider,
        fallbackMessage: "Anthropic request failed",
        secrets: [apiKey],
        operation: async () => {
          const response = await request(
            "https://api.anthropic.com/v1/messages",
            {
              method: "POST",
              headers: {
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
                "x-api-key": apiKey,
              },
              body: JSON.stringify({
                model: config.model,
                max_tokens: input.maxTokens ?? 4096,
                messages: normalized.messages,
                ...(normalized.system ? { system: normalized.system } : {}),
                ...(input.temperature === undefined
                  ? {}
                  : { temperature: input.temperature }),
              }),
            }
          );

          if (!response.ok) {
            throw new AdapterError({
              code: response.status === 429 ? "rate_limited" : "remote_failure",
              message: `Anthropic request failed with status ${response.status}`,
              provider,
              retryable: response.status === 429 || response.status >= 500,
            });
          }

          return (await response.json()) as AnthropicResponse;
        },
      });
      const content = result.content
        ?.filter((block) => block.type === "text")
        .map((block) => block.text ?? "")
        .join("");
      if (!content) {
        throw new AdapterError({
          code: "remote_failure",
          message: "Anthropic returned an empty response",
          provider,
        });
      }
      return { content, model: result.model ?? config.model };
    },
  };
}
