import {
  AdapterError,
  type AIAdapter,
  executeAdapterOperation,
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
      const startedAt = Date.now();
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
      const usage = readWorkersUsage(result);
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
      return {
        content,
        latencyMs: Date.now() - startedAt,
        model: config.model,
        provider,
        usage,
      };
    },
  };
}

function readWorkersUsage(value: unknown) {
  if (typeof value !== "object" || value === null || !("usage" in value)) {
    return {
      inputTokens: null,
      outputTokens: null,
      status: "unavailable" as const,
      totalTokens: null,
    };
  }
  const usage = value.usage;
  if (typeof usage !== "object" || usage === null) {
    return {
      inputTokens: null,
      outputTokens: null,
      status: "unavailable" as const,
      totalTokens: null,
    };
  }
  const inputTokens = readNumber(usage, ["input_tokens", "prompt_tokens"]);
  const outputTokens = readNumber(usage, [
    "completion_tokens",
    "output_tokens",
  ]);
  const totalTokens = readNumber(usage, ["total_tokens"]);
  return {
    inputTokens,
    outputTokens,
    status:
      inputTokens !== null || outputTokens !== null
        ? ("actual" as const)
        : ("unavailable" as const),
    totalTokens,
  };
}

function readNumber(value: object, keys: readonly string[]): number | null {
  for (const key of keys) {
    const candidate = Reflect.get(value, key);
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return candidate;
    }
  }
  return null;
}
