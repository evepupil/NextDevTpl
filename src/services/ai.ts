import { createOpenAICompatibleAdapter } from "@/adapters/ai";
import { getRuntimeEnv } from "@/lib/runtime-config";

export type OpenAICompatibleProvider = "deepseek" | "mimo" | "openai";

export function getAIProvider(): OpenAICompatibleProvider {
  const provider = getRuntimeEnv("AI_PROVIDER");
  return provider === "deepseek" || provider === "mimo" ? provider : "openai";
}

export function getAIModel(): string {
  switch (getAIProvider()) {
    case "deepseek":
      return getRuntimeEnv("DEEPSEEK_MODEL") ?? "deepseek-chat";
    case "mimo":
      return getRuntimeEnv("MIMO_MODEL") ?? "mimo-v2-flash";
    case "openai":
      return getRuntimeEnv("OPENAI_MODEL") ?? "gpt-4o-mini";
  }
}

function createDefaultAIService() {
  const provider = getAIProvider();
  const gatewayBaseUrl = getRuntimeEnv("CF_AIG_BASE_URL");
  const gatewayToken = getRuntimeEnv("CF_AIG_TOKEN");
  const useGateway = Boolean(gatewayBaseUrl && gatewayToken);
  const apiKey =
    provider === "deepseek"
      ? getRuntimeEnv("DEEPSEEK_API_KEY")
      : provider === "mimo"
        ? getRuntimeEnv("MIMO_API_KEY")
        : getRuntimeEnv("OPENAI_API_KEY");

  return createOpenAICompatibleAdapter({
    model: getAIModel(),
    ...(apiKey ? { apiKey } : {}),
    ...(provider === "deepseek"
      ? { baseURL: "https://api.deepseek.com/v1" }
      : provider === "mimo" && !useGateway
        ? { baseURL: "https://api.xiaomimimo.com/v1" }
        : gatewayBaseUrl
          ? { baseURL: gatewayBaseUrl }
          : {}),
    ...(useGateway && gatewayToken
      ? { defaultHeaders: { "cf-aig-authorization": `Bearer ${gatewayToken}` } }
      : {}),
  });
}

export const aiService = createDefaultAIService();
