import OpenAI from "openai";

import {
  AdapterError,
  executeAdapterOperation,
  type AIAdapter,
  type AIMessage,
} from "@/core/services";

interface OpenAICompatibleConfig {
  apiKey?: string;
  baseURL?: string;
  defaultHeaders?: Record<string, string>;
  model: string;
}

function toOpenAIMessages(
  messages: readonly AIMessage[]
): OpenAI.ChatCompletionMessageParam[] {
  return messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));
}

export function createOpenAICompatibleAdapter(
  config: OpenAICompatibleConfig
): AIAdapter {
  const provider = "openai-compatible" as const;
  let client: OpenAI | undefined;

  function getClient(): OpenAI {
    if (client) {
      return client;
    }
    if (!config.apiKey) {
      throw new AdapterError({
        code: "configuration",
        message: "AI provider API key is not configured",
        provider,
      });
    }
    client = new OpenAI({
      apiKey: config.apiKey,
      ...(config.baseURL ? { baseURL: config.baseURL } : {}),
      ...(config.defaultHeaders
        ? { defaultHeaders: config.defaultHeaders }
        : {}),
    });
    return client;
  }

  return {
    provider,
    capabilities: {
      jsonOutput: true,
      streaming: true,
      toolCalling: true,
    },

    async complete(input) {
      const response = await executeAdapterOperation({
        provider,
        fallbackMessage: "AI provider request failed",
        secrets: [config.apiKey],
        operation: () =>
          getClient().chat.completions.create({
            model: config.model,
            messages: toOpenAIMessages(input.messages),
            temperature: input.temperature ?? 0.7,
            max_tokens: input.maxTokens ?? 4096,
            ...(input.jsonMode
              ? { response_format: { type: "json_object" as const } }
              : {}),
          }),
      });
      const content = response.choices[0]?.message.content;
      if (!content) {
        throw new AdapterError({
          code: "remote_failure",
          message: "AI provider returned an empty response",
          provider,
        });
      }
      return { content, model: response.model || config.model };
    },
  };
}
