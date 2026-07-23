import {
  AdapterError,
  executeAdapterOperation,
  type AIAdapter,
} from "@/core/services";

export interface WorkersAIBindingPort {
  run(model: string, input: Record<string, unknown>): Promise<unknown>;
}

interface WorkersAIConfig {
  binding: WorkersAIBindingPort;
  model: string;
}

export function createWorkersAIAdapter(config: WorkersAIConfig): AIAdapter {
  const provider = "workers-ai" as const;

  return {
    provider,
    capabilities: {
      jsonOutput: false,
      streaming: true,
      toolCalling: true,
    },

    async complete(input) {
      if (input.jsonMode) {
        throw new AdapterError({
          code: "unsupported",
          message: "Workers AI adapter does not guarantee JSON mode",
          provider,
        });
      }

      const result = await executeAdapterOperation({
        provider,
        fallbackMessage: "Workers AI inference failed",
        operation: () =>
          config.binding.run(config.model, {
            messages: input.messages,
            temperature: input.temperature ?? 0.7,
            max_tokens: input.maxTokens ?? 4096,
          }),
      });
      const content =
        typeof result === "object" &&
        result !== null &&
        "response" in result &&
        typeof result.response === "string"
          ? result.response
          : undefined;
      if (!content) {
        throw new AdapterError({
          code: "remote_failure",
          message: "Workers AI returned an empty response",
          provider,
        });
      }
      return { content, model: config.model };
    },
  };
}
