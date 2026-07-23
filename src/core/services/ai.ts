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
  jsonMode?: boolean;
  maxTokens?: number;
  messages: readonly AIMessage[];
  temperature?: number;
}

export interface AICompletionResult {
  content: string;
  model: string;
}

export interface AIAdapter
  extends AdapterDescriptor<AIProviderName, AICapabilities> {
  complete(input: AICompletionInput): Promise<AICompletionResult>;
}
