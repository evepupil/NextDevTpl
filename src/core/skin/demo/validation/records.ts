import { CREDIT_TRANSACTION_TYPES } from "../../../credits/contracts.js";
import type { PlanId } from "../../../plans/contracts.js";
import {
  PLAN_IDS,
  SUBSCRIPTION_HISTORY_EVENT_TYPES,
} from "../../../plans/contracts.js";
import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
} from "../../../support/contracts.js";
import type {
  DemoBillingHistoryItem,
  DemoCreditBatch,
  DemoCredits,
  DemoCreditTransaction,
  DemoPlanState,
  DemoTicket,
  DemoTicketAuthor,
  DemoTicketMessage,
  DemoUser,
} from "../types.js";
import {
  assertUniqueIds,
  hasOwn,
  invalidDemoData,
  readArray,
  readBoolean,
  readEnum,
  readId,
  readPlanInterval,
  readRecord,
  readSafeInteger,
  readSkinImagePath,
  readString,
  readUtcTimestamp,
} from "./common.js";

const USER_KEYS = ["id", "name", "email", "image"] as const;
const PLAN_KEYS = [
  "id",
  "interval",
  "isActive",
  "cancelAtPeriodEnd",
  "currentPeriodEnd",
  "pendingPlanId",
  "pendingPriceEffectiveAt",
] as const;
const CREDIT_KEYS = [
  "balance",
  "totalEarned",
  "totalSpent",
  "batches",
  "transactions",
] as const;
const BILLING_KEYS = [
  "id",
  "eventType",
  "createdAt",
  "effectiveAt",
  "fromPlanId",
  "toPlanId",
] as const;
const TICKET_KEYS = [
  "id",
  "category",
  "priority",
  "status",
  "subject",
  "createdAt",
  "messages",
] as const;
const MESSAGE_KEYS = ["id", "content", "createdAt", "author"] as const;
const STAFF_AUTHOR_KEYS = ["kind", "id", "name", "image"] as const;
const CURRENT_USER_AUTHOR_KEYS = ["kind"] as const;
const BATCH_KEYS = ["remaining", "expiresAt"] as const;
const TRANSACTION_KEYS = [
  "id",
  "type",
  "amount",
  "description",
  "createdAt",
  "grant",
] as const;
const GRANT_KEYS = ["planId", "interval"] as const;

function parsePlanId(value: unknown, path: string): PlanId {
  return readEnum(value, PLAN_IDS, path);
}

function parseNullablePlanId(value: unknown, path: string): PlanId | null {
  return value === null ? null : parsePlanId(value, path);
}

function parseNullableTimestamp(value: unknown, path: string): string | null {
  return value === null ? null : readUtcTimestamp(value, path);
}

export function parseDemoUser(value: unknown, path: string): DemoUser {
  const record = readRecord(value, path, USER_KEYS);
  return {
    id: readId(record.id, `${path}.id`),
    name: readString(record.name, `${path}.name`, 1, 80),
    email: readString(record.email, `${path}.email`, 1, 254),
    image: readSkinImagePath(record.image, `${path}.image`),
  };
}

export function parseDemoUserPatch(
  value: unknown,
  path: string
): Partial<DemoUser> {
  const record = readRecord(value, path, USER_KEYS, []);
  return {
    ...(hasOwn(record, "id") ? { id: readId(record.id, `${path}.id`) } : {}),
    ...(hasOwn(record, "name")
      ? { name: readString(record.name, `${path}.name`, 1, 80) }
      : {}),
    ...(hasOwn(record, "email")
      ? { email: readString(record.email, `${path}.email`, 1, 254) }
      : {}),
    ...(hasOwn(record, "image")
      ? { image: readSkinImagePath(record.image, `${path}.image`) }
      : {}),
  };
}

export function parseDemoPlanState(
  value: unknown,
  path: string
): DemoPlanState {
  const record = readRecord(value, path, PLAN_KEYS);
  const plan: DemoPlanState = {
    id: parsePlanId(record.id, `${path}.id`),
    interval: readPlanInterval(record.interval, `${path}.interval`),
    isActive: readBoolean(record.isActive, `${path}.isActive`),
    cancelAtPeriodEnd: readBoolean(
      record.cancelAtPeriodEnd,
      `${path}.cancelAtPeriodEnd`
    ),
    currentPeriodEnd: parseNullableTimestamp(
      record.currentPeriodEnd,
      `${path}.currentPeriodEnd`
    ),
    pendingPlanId: parseNullablePlanId(
      record.pendingPlanId,
      `${path}.pendingPlanId`
    ),
    pendingPriceEffectiveAt: parseNullableTimestamp(
      record.pendingPriceEffectiveAt,
      `${path}.pendingPriceEffectiveAt`
    ),
  };

  if (
    plan.id === "free" &&
    (plan.interval !== "month" ||
      plan.isActive ||
      plan.cancelAtPeriodEnd ||
      plan.pendingPlanId !== null ||
      plan.pendingPriceEffectiveAt !== null)
  ) {
    return invalidDemoData(path, "free plan state is not allowed");
  }
  if (
    (plan.pendingPlanId === null) !==
    (plan.pendingPriceEffectiveAt === null)
  ) {
    return invalidDemoData(
      path,
      "pending plan and effective time must be paired"
    );
  }
  if (
    plan.cancelAtPeriodEnd &&
    (!plan.isActive || plan.currentPeriodEnd === null)
  ) {
    return invalidDemoData(
      path,
      "scheduled cancellation needs an active period"
    );
  }
  return plan;
}

export function parseDemoPlanStatePatch(
  value: unknown,
  path: string
): Partial<DemoPlanState> {
  const record = readRecord(value, path, PLAN_KEYS, []);
  return {
    ...(hasOwn(record, "id")
      ? { id: parsePlanId(record.id, `${path}.id`) }
      : {}),
    ...(hasOwn(record, "interval")
      ? { interval: readPlanInterval(record.interval, `${path}.interval`) }
      : {}),
    ...(hasOwn(record, "isActive")
      ? { isActive: readBoolean(record.isActive, `${path}.isActive`) }
      : {}),
    ...(hasOwn(record, "cancelAtPeriodEnd")
      ? {
          cancelAtPeriodEnd: readBoolean(
            record.cancelAtPeriodEnd,
            `${path}.cancelAtPeriodEnd`
          ),
        }
      : {}),
    ...(hasOwn(record, "currentPeriodEnd")
      ? {
          currentPeriodEnd: parseNullableTimestamp(
            record.currentPeriodEnd,
            `${path}.currentPeriodEnd`
          ),
        }
      : {}),
    ...(hasOwn(record, "pendingPlanId")
      ? {
          pendingPlanId: parseNullablePlanId(
            record.pendingPlanId,
            `${path}.pendingPlanId`
          ),
        }
      : {}),
    ...(hasOwn(record, "pendingPriceEffectiveAt")
      ? {
          pendingPriceEffectiveAt: parseNullableTimestamp(
            record.pendingPriceEffectiveAt,
            `${path}.pendingPriceEffectiveAt`
          ),
        }
      : {}),
  };
}

function parseDemoCreditBatch(value: unknown, path: string): DemoCreditBatch {
  const record = readRecord(value, path, BATCH_KEYS);
  return {
    remaining: readSafeInteger(record.remaining, `${path}.remaining`, 1),
    expiresAt: parseNullableTimestamp(record.expiresAt, `${path}.expiresAt`),
  };
}

function parseDemoCreditGrant(
  value: unknown,
  path: string
): {
  readonly planId: Exclude<PlanId, "free">;
  readonly interval: "month" | "year";
} {
  const record = readRecord(value, path, GRANT_KEYS);
  const planId = parsePlanId(record.planId, `${path}.planId`);
  if (planId === "free") {
    return invalidDemoData(`${path}.planId`, "must name a paid plan");
  }
  return {
    planId,
    interval: readPlanInterval(record.interval, `${path}.interval`),
  };
}

function parseDemoCreditTransaction(
  value: unknown,
  path: string
): DemoCreditTransaction {
  const record = readRecord(value, path, TRANSACTION_KEYS, [
    "id",
    "type",
    "amount",
    "description",
    "createdAt",
  ]);
  const type = readEnum(record.type, CREDIT_TRANSACTION_TYPES, `${path}.type`);
  const hasGrant = hasOwn(record, "grant");
  if (type === "monthly_grant" && !hasGrant) {
    return invalidDemoData(`${path}.grant`, "is required for monthly grants");
  }
  if (type !== "monthly_grant" && hasGrant) {
    return invalidDemoData(
      `${path}.grant`,
      "is not allowed for this transaction"
    );
  }

  const base = {
    id: readId(record.id, `${path}.id`),
    amount: readSafeInteger(record.amount, `${path}.amount`, 1),
    description:
      record.description === null
        ? null
        : readString(record.description, `${path}.description`, 0, 500),
    createdAt: readUtcTimestamp(record.createdAt, `${path}.createdAt`),
  };
  if (type === "monthly_grant") {
    return {
      ...base,
      type,
      grant: parseDemoCreditGrant(record.grant, `${path}.grant`),
    };
  }
  return { ...base, type };
}

export function parseDemoCredits(value: unknown, path: string): DemoCredits {
  const record = readRecord(value, path, CREDIT_KEYS);
  const batches = readArray(
    record.batches,
    `${path}.batches`,
    12,
    parseDemoCreditBatch
  );
  const transactions = readArray(
    record.transactions,
    `${path}.transactions`,
    100,
    parseDemoCreditTransaction
  );
  assertUniqueIds(transactions, `${path}.transactions`);
  return {
    balance: readSafeInteger(record.balance, `${path}.balance`, 0),
    totalEarned: readSafeInteger(record.totalEarned, `${path}.totalEarned`, 0),
    totalSpent: readSafeInteger(record.totalSpent, `${path}.totalSpent`, 0),
    batches,
    transactions,
  };
}

export function parseDemoCreditsPatch(
  value: unknown,
  path: string
): Partial<DemoCredits> {
  const record = readRecord(value, path, CREDIT_KEYS, []);
  let batches: readonly DemoCreditBatch[] | undefined;
  if (hasOwn(record, "batches")) {
    batches = readArray(
      record.batches,
      `${path}.batches`,
      12,
      parseDemoCreditBatch
    );
  }
  let transactions: readonly DemoCreditTransaction[] | undefined;
  if (hasOwn(record, "transactions")) {
    transactions = readArray(
      record.transactions,
      `${path}.transactions`,
      100,
      parseDemoCreditTransaction
    );
    assertUniqueIds(transactions, `${path}.transactions`);
  }
  return {
    ...(hasOwn(record, "balance")
      ? { balance: readSafeInteger(record.balance, `${path}.balance`, 0) }
      : {}),
    ...(hasOwn(record, "totalEarned")
      ? {
          totalEarned: readSafeInteger(
            record.totalEarned,
            `${path}.totalEarned`,
            0
          ),
        }
      : {}),
    ...(hasOwn(record, "totalSpent")
      ? {
          totalSpent: readSafeInteger(
            record.totalSpent,
            `${path}.totalSpent`,
            0
          ),
        }
      : {}),
    ...(batches !== undefined ? { batches } : {}),
    ...(transactions !== undefined ? { transactions } : {}),
  };
}

export function parseDemoCreditBatchList(
  value: unknown,
  path: string
): readonly DemoCreditBatch[] {
  return readArray(value, path, 12, parseDemoCreditBatch);
}

export function parseDemoCreditTransactionList(
  value: unknown,
  path: string
): readonly DemoCreditTransaction[] {
  const transactions = readArray(value, path, 100, parseDemoCreditTransaction);
  assertUniqueIds(transactions, path);
  return transactions;
}

function parseDemoBillingHistoryItem(
  value: unknown,
  path: string
): DemoBillingHistoryItem {
  const record = readRecord(value, path, BILLING_KEYS);
  return {
    id: readId(record.id, `${path}.id`),
    eventType: readEnum(
      record.eventType,
      SUBSCRIPTION_HISTORY_EVENT_TYPES,
      `${path}.eventType`
    ),
    createdAt: readUtcTimestamp(record.createdAt, `${path}.createdAt`),
    effectiveAt: readUtcTimestamp(record.effectiveAt, `${path}.effectiveAt`),
    fromPlanId: parseNullablePlanId(record.fromPlanId, `${path}.fromPlanId`),
    toPlanId: parseNullablePlanId(record.toPlanId, `${path}.toPlanId`),
  };
}

export function parseDemoBillingHistory(
  value: unknown,
  path: string
): readonly DemoBillingHistoryItem[] {
  const history = readArray(value, path, 50, parseDemoBillingHistoryItem);
  assertUniqueIds(history, path);
  return history;
}

function parseDemoTicketAuthor(value: unknown, path: string): DemoTicketAuthor {
  const discriminator = readRecord(value, path, STAFF_AUTHOR_KEYS, ["kind"]);
  const kind = readEnum(
    discriminator.kind,
    ["current-user", "staff"] as const,
    `${path}.kind`
  );
  if (kind === "current-user") {
    readRecord(value, path, CURRENT_USER_AUTHOR_KEYS);
    return { kind };
  }

  const record = readRecord(value, path, STAFF_AUTHOR_KEYS);
  return {
    kind,
    id: readId(record.id, `${path}.id`),
    name: readString(record.name, `${path}.name`, 1, 80),
    image: readSkinImagePath(record.image, `${path}.image`),
  };
}

function parseDemoTicketMessage(
  value: unknown,
  path: string
): DemoTicketMessage {
  const record = readRecord(value, path, MESSAGE_KEYS);
  return {
    id: readId(record.id, `${path}.id`),
    content: readString(record.content, `${path}.content`, 1, 5000),
    createdAt: readUtcTimestamp(record.createdAt, `${path}.createdAt`),
    author: parseDemoTicketAuthor(record.author, `${path}.author`),
  };
}

function parseDemoTicket(value: unknown, path: string): DemoTicket {
  const record = readRecord(value, path, TICKET_KEYS);
  const createdAt = readUtcTimestamp(record.createdAt, `${path}.createdAt`);
  const messages = readArray(
    record.messages,
    `${path}.messages`,
    50,
    parseDemoTicketMessage
  );
  assertUniqueIds(messages, `${path}.messages`);
  if (messages.some((message) => message.createdAt < createdAt)) {
    return invalidDemoData(path, "message time cannot precede ticket creation");
  }
  return {
    id: readId(record.id, `${path}.id`),
    category: readEnum(record.category, TICKET_CATEGORIES, `${path}.category`),
    priority: readEnum(record.priority, TICKET_PRIORITIES, `${path}.priority`),
    status: readEnum(record.status, TICKET_STATUSES, `${path}.status`),
    subject: readString(record.subject, `${path}.subject`, 5, 200),
    createdAt,
    messages,
  };
}

export function parseDemoTicketList(
  value: unknown,
  path: string
): readonly DemoTicket[] {
  const tickets = readArray(value, path, 50, parseDemoTicket);
  assertUniqueIds(tickets, path);
  return tickets;
}

export function assertCreditBalance(credits: DemoCredits, path: string): void {
  let batchTotal = 0;
  for (const batch of credits.batches) {
    if (batchTotal > Number.MAX_SAFE_INTEGER - batch.remaining) {
      invalidDemoData(
        `${path}.batches`,
        "total is outside the safe integer range"
      );
    }
    batchTotal += batch.remaining;
  }
  if (batchTotal !== credits.balance) {
    invalidDemoData(
      `${path}.batches`,
      "remaining credits must equal the balance"
    );
  }
}

export function assertUnexpiredCreditBatches(
  batches: readonly DemoCreditBatch[],
  snapshotAt: string,
  path: string
): void {
  if (
    batches.some(
      (batch) => batch.expiresAt !== null && batch.expiresAt <= snapshotAt
    )
  ) {
    invalidDemoData(path, "contains a batch expired at the snapshot time");
  }
}
