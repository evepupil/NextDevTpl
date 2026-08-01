import { findPlanByPriceId, paymentConfig } from "@/config/payment";
import type { PaymentProvider } from "@/core/services";
import { db } from "@/db";
import { revenueEvent } from "@/db/schema/payment";

export type RevenueEventKind =
  | "payment_failed"
  | "payment_succeeded"
  | "refund"
  | "subscription_canceled";

export interface RecordRevenueEventInput {
  amountMajor?: number;
  amountMinor?: number;
  currency?: string;
  externalEventId: string;
  kind: RevenueEventKind;
  occurredAt?: Date;
  priceId?: string;
  provider: PaymentProvider;
  subscriptionId?: string;
  userId?: string;
  interval?: string;
}

function toMinorUnits(amountMajor: number | undefined): number {
  if (amountMajor === undefined || !Number.isFinite(amountMajor)) return 0;
  return Math.round(amountMajor * 100);
}

export async function recordRevenueEvent(
  input: RecordRevenueEventInput
): Promise<void> {
  const price = input.priceId ? findPlanByPriceId(input.priceId).price : null;
  const amountMajor = input.amountMajor ?? price?.amount;
  const amountMinor =
    input.amountMinor ??
    (amountMajor === undefined ? 0 : toMinorUnits(amountMajor));
  await db
    .insert(revenueEvent)
    .values({
      id: `${input.externalEventId}:${input.kind}`,
      externalEventId: input.externalEventId,
      provider: input.provider,
      kind: input.kind,
      ...(input.userId ? { userId: input.userId } : {}),
      ...(input.subscriptionId ? { subscriptionId: input.subscriptionId } : {}),
      ...(input.priceId ? { priceId: input.priceId } : {}),
      currency: input.currency ?? paymentConfig.currency,
      amountMinor,
      ...((input.interval ?? price?.interval)
        ? { interval: input.interval ?? price?.interval }
        : {}),
      occurredAt: input.occurredAt ?? new Date(),
    })
    .onConflictDoNothing();
}
