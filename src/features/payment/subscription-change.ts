import { PlanInterval } from "./types";

export type SubscriptionChangeDirection = "upgrade" | "downgrade" | "unchanged";

export interface SubscriptionPriceComparison {
  currentAmount: number;
  currentInterval: PlanInterval;
  currentPlanId: string;
  targetAmount: number;
  targetInterval: PlanInterval;
  targetPlanId: string;
}

const PLAN_RANK: Record<string, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  ultra: 3,
};

function monthlyEquivalent(amount: number, interval: PlanInterval): number {
  return interval === PlanInterval.YEAR ? amount / 12 : amount;
}

export function compareSubscriptionPrices(
  input: SubscriptionPriceComparison
): SubscriptionChangeDirection {
  if (input.currentPlanId !== input.targetPlanId) {
    const currentRank = PLAN_RANK[input.currentPlanId] ?? 0;
    const targetRank = PLAN_RANK[input.targetPlanId] ?? 0;
    return targetRank > currentRank ? "upgrade" : "downgrade";
  }

  if (input.currentInterval !== input.targetInterval) {
    return input.targetInterval === PlanInterval.YEAR ? "upgrade" : "downgrade";
  }

  const currentMonthly = monthlyEquivalent(
    input.currentAmount,
    input.currentInterval
  );
  const targetMonthly = monthlyEquivalent(
    input.targetAmount,
    input.targetInterval
  );

  if (targetMonthly === currentMonthly) return "unchanged";
  return targetMonthly > currentMonthly ? "upgrade" : "downgrade";
}

export interface IncomingSubscriptionPriceState {
  currentPeriodEnd: Date | null;
  currentPeriodStart: Date | null;
  currentPriceId: string;
  incomingPeriodStart: Date | null;
  incomingPriceId: string;
  pendingPriceId: string | null;
  pendingPriceEffectiveAt: Date | null;
}

export interface ResolvedSubscriptionPriceState {
  appliedPendingPrice: boolean;
  pendingPriceEffectiveAt: Date | null;
  pendingPriceId: string | null;
  priceId: string;
}

/**
 * 供应商可能在当前周期内先推送待降级价格；本地权益要等下一周期再切换。
 */
export function resolveIncomingSubscriptionPrice(
  input: IncomingSubscriptionPriceState
): ResolvedSubscriptionPriceState {
  const isNextPeriod = Boolean(
    input.pendingPriceId &&
      input.currentPeriodEnd &&
      input.incomingPeriodStart &&
      input.incomingPeriodStart >= input.currentPeriodEnd
  );

  if (isNextPeriod) {
    return {
      appliedPendingPrice: true,
      pendingPriceEffectiveAt: null,
      pendingPriceId: null,
      priceId: input.pendingPriceId as string,
    };
  }

  if (input.pendingPriceId) {
    return {
      appliedPendingPrice: false,
      pendingPriceEffectiveAt: input.pendingPriceEffectiveAt,
      pendingPriceId: input.pendingPriceId,
      priceId: input.currentPriceId,
    };
  }

  return {
    appliedPendingPrice: false,
    pendingPriceEffectiveAt: null,
    pendingPriceId: null,
    priceId: input.incomingPriceId,
  };
}
