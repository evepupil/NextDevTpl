export const PLAN_IDS = ["free", "starter", "pro", "ultra"] as const;

export type PlanId = (typeof PLAN_IDS)[number];
export type PlanInterval = "month" | "year";
export type QueuePriority = "normal" | "priority" | "highest";

export const SUBSCRIPTION_HISTORY_EVENT_TYPES = [
  "created",
  "upgraded",
  "downgraded",
  "upgrade_requested",
  "upgrade_confirmed",
  "downgrade_requested",
  "downgrade_confirmed",
  "cancellation_requested",
  "cancellation_resumed",
  "canceled",
  "renewed",
  "changed",
] as const;

export type SubscriptionHistoryEventType =
  (typeof SUBSCRIPTION_HISTORY_EVENT_TYPES)[number];
