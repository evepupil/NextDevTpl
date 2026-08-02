import type { DatabaseTransaction } from "@/db";
import {
  type NewSubscriptionHistory,
  subscriptionHistory,
} from "@/db/schema/subscription";

export type SubscriptionHistoryEventType =
  | "created"
  | "upgraded"
  | "downgraded"
  | "cancellation_requested"
  | "cancellation_resumed"
  | "canceled"
  | "renewed"
  | "changed";

export type RecordSubscriptionHistoryInput = Omit<
  NewSubscriptionHistory,
  "id"
> & {
  eventType: SubscriptionHistoryEventType;
};

export async function recordSubscriptionHistory(
  tx: DatabaseTransaction,
  input: RecordSubscriptionHistoryInput
): Promise<void> {
  await tx
    .insert(subscriptionHistory)
    .values({ id: crypto.randomUUID(), ...input })
    .onConflictDoNothing();
}
