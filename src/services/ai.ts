import { createOpenAICompatibleAdapter } from "@/adapters/ai";

export type OpenAICompatibleProvider = "deepseek" | "mimo" | "openai";

export function getAIProvider(): OpenAICompatibleProvider {
  const provider = process.env.AI_PROVIDER;
  return provider === "deepseek" || provider === "mimo" ? provider : "openai";
}

export function getAIModel(): string {
  switch (getAIProvider()) {
    case "deepseek":
      return process.env.DEEPSEEK_MODEL ?? "deepseek-chat";
    case "mimo":
      return process.env.MIMO_MODEL ?? "mimo-v2-flash";
    case "openai":
      return process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  }
}

function createDefaultAIService() {
  const provider = getAIProvider();
  const gatewayBaseUrl = process.env.CF_AIG_BASE_URL;
  const gatewayToken = process.env.CF_AIG_TOKEN;
  const useGateway = Boolean(gatewayBaseUrl && gatewayToken);
  const apiKey =
    provider === "deepseek"
      ? process.env.DEEPSEEK_API_KEY
      : provider === "mimo"
        ? process.env.MIMO_API_KEY
        : process.env.OPENAI_API_KEY;

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
