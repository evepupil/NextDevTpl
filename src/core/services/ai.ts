import type { AdapterDescriptor } from "./common";

export type AIProviderName = "anthropic" | "openai-compatible" | "workers-ai";

export interface AICapabilities {
  jsonOutput: boolean;
  streaming: boolean;
  toolCalling: boolean;
}

export interface AIMessage {
  content: string;
  role: "assistant" | "system" | "user";
}

export interface AICompletionInput {
  creditsConsumed?: number;
  feature?: string;
  jsonMode?: boolean;
  maxTokens?: number;
  messages: readonly AIMessage[];
  temperature?: number;
  userId?: string;
}

export type AIUsageStatus = "actual" | "estimated" | "unavailable";

export interface AIUsage {
  inputTokens: number | null;
  outputTokens: number | null;
  status: AIUsageStatus;
  totalTokens: number | null;
}

export interface AICompletionResult {
  content: string;
  model: string;
  latencyMs: number;
  provider: AIProviderName;
  usage: AIUsage;
}

export interface AIAdapter
  extends AdapterDescriptor<AIProviderName, AICapabilities> {
  complete(input: AICompletionInput): Promise<AICompletionResult>;
}
