import { and, desc, eq, inArray } from "drizzle-orm";

import type { DatabaseTransaction } from "@/db";
import {
  type NewSubscriptionHistory,
  type SubscriptionHistory,
  subscriptionHistory,
} from "@/db/schema/subscription";

export type SubscriptionHistoryEventType =
  | "created"
  | "upgraded"
  | "downgraded"
  | "upgrade_requested"
  | "upgrade_confirmed"
  | "downgrade_requested"
  | "downgrade_confirmed"
  | "cancellation_requested"
  | "cancellation_resumed"
  | "canceled"
  | "renewed"
  | "changed";

export type SubscriptionHistorySourceType = "action" | "system" | "webhook";

export type RecordSubscriptionHistoryInput = Omit<
  NewSubscriptionHistory,
  "id" | "sourceType"
> & {
  eventType: SubscriptionHistoryEventType;
  sourceType?: SubscriptionHistorySourceType;
};

export type FindPendingPlanChangeRequestResult = {
  latestRequest: SubscriptionHistory | undefined;
  latestRequestCorrelationId: string | undefined;
  pendingRequest: SubscriptionHistory | undefined;
  pendingCorrelationId: string | undefined;
};

/**
 * 查找事件价格对应的最新站内改套餐请求及其确认状态。
 * 只看最新请求，较早请求不再参与判定；已确认或没有关联编号的最新请求也不再
 * 待确认。前者避免旧请求反复命中，后者避免重复写入无法由唯一索引去重的确认。
 */
export async function findPendingPlanChangeRequest(
  tx: DatabaseTransaction,
  subscriptionId: string,
  priceId: string
): Promise<FindPendingPlanChangeRequestResult> {
  const [latestRequest] = await tx
    .select()
    .from(subscriptionHistory)
    .where(
      and(
        eq(subscriptionHistory.subscriptionId, subscriptionId),
        eq(subscriptionHistory.sourceType, "action"),
        inArray(subscriptionHistory.eventType, [
          "upgrade_requested",
          "downgrade_requested",
        ]),
        eq(subscriptionHistory.toPriceId, priceId)
      )
    )
    .orderBy(desc(subscriptionHistory.createdAt))
    .limit(1);

  if (!latestRequest) {
    return {
      latestRequest: undefined,
      latestRequestCorrelationId: undefined,
      pendingRequest: undefined,
      pendingCorrelationId: undefined,
    };
  }

  const latestRequestCorrelationId =
    latestRequest.correlationId ?? latestRequest.sourceEventId ?? undefined;
  const confirmedEventType =
    latestRequest.eventType === "upgrade_requested"
      ? "upgrade_confirmed"
      : "downgrade_confirmed";

  // 确认记录存在时必须忽略旧请求，避免后续续费或改价重复命中并被唯一索引吞掉。
  const [confirmation] = latestRequestCorrelationId
    ? await tx
        .select({ id: subscriptionHistory.id })
        .from(subscriptionHistory)
        .where(
          and(
            eq(subscriptionHistory.subscriptionId, subscriptionId),
            eq(subscriptionHistory.eventType, confirmedEventType),
            eq(subscriptionHistory.correlationId, latestRequestCorrelationId)
          )
        )
        .limit(1)
    : [];

  const pendingRequest =
    latestRequestCorrelationId && !confirmation ? latestRequest : undefined;

  return {
    latestRequest,
    latestRequestCorrelationId,
    pendingRequest,
    pendingCorrelationId: pendingRequest
      ? latestRequestCorrelationId
      : undefined,
  };
}

export async function recordSubscriptionHistory(
  tx: DatabaseTransaction,
  input: RecordSubscriptionHistoryInput
): Promise<void> {
  await tx
    .insert(subscriptionHistory)
    .values({
      id: crypto.randomUUID(),
      sourceType: input.sourceType ?? "webhook",
      ...input,
    })
    .onConflictDoNothing();
}
