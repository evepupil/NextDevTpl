import type { AICompletionInput, AIMessage } from "@/core/services";
import { aiService, getAIModel, getAIProvider } from "@/services/ai";

export type { AIMessage };
export { getAIModel, getAIProvider };

export async function chatCompletion(
  messages: readonly AIMessage[],
  options?: Omit<AICompletionInput, "messages">
): Promise<string> {
  const result = await aiService.complete({
    messages,
    ...options,
  });
  return result.content;
}
