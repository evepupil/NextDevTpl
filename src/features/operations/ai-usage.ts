import type { AIUsage, AIUsageStatus } from "@/core/services";
import { db } from "@/db";
import { aiUsageEvent } from "@/db/schema/operations";

export interface AIPriceConfig {
  currency: string;
  effectiveFrom: Date;
  inputMinorPerMillion: number;
  model: string;
  outputMinorPerMillion: number;
  provider: string;
  source: string;
}

export interface AICostEstimate {
  amountMinor: number | null;
  currency: string;
  source?: string;
  status: "estimated" | "unavailable";
}

export interface RecordAIUsageInput {
  creditsConsumed?: number;
  feature?: string;
  id?: string;
  latencyMs: number;
  model: string;
  occurredAt?: Date;
  provider: string;
  success?: boolean;
  usage: AIUsage;
  userId?: string;
}

const AI_PRICES: readonly AIPriceConfig[] = [
  {
    currency: "USD",
    effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
    inputMinorPerMillion: 15,
    model: "gpt-4o-mini",
    outputMinorPerMillion: 60,
    provider: "openai-compatible",
    source: "OpenAI published pricing, configured 2026-08-02",
  },
  {
    currency: "USD",
    effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
    inputMinorPerMillion: 14,
    model: "deepseek-chat",
    outputMinorPerMillion: 28,
    provider: "openai-compatible",
    source: "DeepSeek published pricing, configured 2026-08-02",
  },
  {
    currency: "USD",
    effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
    inputMinorPerMillion: 300,
    model: "claude-sonnet",
    outputMinorPerMillion: 1500,
    provider: "anthropic",
    source: "Anthropic published pricing, configured 2026-08-02",
  },
];

export function findAIPrice(
  provider: string,
  model: string,
  occurredAt = new Date()
): AIPriceConfig | null {
  return (
    AI_PRICES.filter(
      (price) =>
        price.provider === provider &&
        price.effectiveFrom <= occurredAt &&
        (price.model === model || model.startsWith(`${price.model}-`))
    ).sort(
      (left, right) =>
        right.effectiveFrom.getTime() - left.effectiveFrom.getTime()
    )[0] ?? null
  );
}

export function estimateAICost(input: {
  model: string;
  occurredAt?: Date;
  provider: string;
  usage: AIUsage;
}): AICostEstimate {
  const price = findAIPrice(input.provider, input.model, input.occurredAt);
  const hasTokens =
    input.usage.inputTokens !== null || input.usage.outputTokens !== null;
  if (!price || !hasTokens || input.usage.status === "unavailable") {
    return {
      amountMinor: null,
      currency: price?.currency ?? "USD",
      status: "unavailable",
    };
  }

  const inputCost =
    ((input.usage.inputTokens ?? 0) * price.inputMinorPerMillion) / 1_000_000;
  const outputCost =
    ((input.usage.outputTokens ?? 0) * price.outputMinorPerMillion) / 1_000_000;
  return {
    amountMinor: Math.round(inputCost + outputCost),
    currency: price.currency,
    source: price.source,
    status: "estimated",
  };
}

export function calculateAIGrossMargin(input: {
  costMinor: number;
  revenueMinor: number;
}): { marginMinor: number; rate: number | null } {
  return {
    marginMinor: input.revenueMinor - input.costMinor,
    rate:
      input.revenueMinor > 0
        ? Math.round(
            ((input.revenueMinor - input.costMinor) / input.revenueMinor) *
              10000
          ) / 100
        : null,
  };
}

export async function recordAIUsage(input: RecordAIUsageInput): Promise<void> {
  await db.insert(aiUsageEvent).values({
    id: input.id ?? `ai-usage-${crypto.randomUUID()}`,
    provider: input.provider,
    model: input.model,
    feature: input.feature ?? "unknown",
    ...(input.userId ? { userId: input.userId } : {}),
    inputTokens: input.usage.inputTokens,
    outputTokens: input.usage.outputTokens,
    totalTokens: input.usage.totalTokens,
    usageStatus: input.usage.status,
    latencyMs: Math.max(0, Math.round(input.latencyMs)),
    ...(input.creditsConsumed !== undefined
      ? { creditsConsumed: input.creditsConsumed }
      : {}),
    success: input.success ?? true,
    occurredAt: input.occurredAt ?? new Date(),
  });
}

export function usageCoverageStatus(
  statuses: readonly AIUsageStatus[]
): number {
  if (statuses.length === 0) return 0;
  const covered = statuses.filter((status) => status === "actual").length;
  return Math.round((covered / statuses.length) * 10000) / 100;
}
