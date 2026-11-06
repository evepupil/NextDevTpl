/**
 * 种子：积分账户、批次和交易记录
 *
 * 不手写余额，而是把“发放 / 消耗 / 过期”这些事件按时间顺序列出来，
 * 再用项目真实的记账规则推演一遍，得到批次剩余、累计获得、累计消耗和最终余额：
 *
 * - 复式记账：每笔交易都有借方、贷方账户，发放时借方是来源（系统 / 支付 / 订阅），
 *   消耗和过期时借方是用户钱包（与 src/features/credits 里的写法一致）。
 * - 先进先出：消耗时先扣最早过期的批次，永不过期的批次排在最后，同一过期时间按发放时间先后。
 * - 余额 = 累计获得 - 累计消耗 - 累计过期，且等于所有有效批次剩余之和。
 *
 * 推演结果必须正好等于下面的目标值，对不上就直接报错，避免页面上出现自相矛盾的数字。
 *
 * 这些交易恰好 12 条，设置页“用量”标签的交易表（每页 10 条）因此会出现第二页；
 * 2026-10-20 到期的 Pro 月度批次会让“积分即将过期”横幅出现
 * （横幅取最早到期的有效批次，没有时间窗口限制）。
 *
 * 不能让“懒发注册积分”被触发：getMyCreditsBalance 发现用户没有任何交易才会补发 200，
 * 这里一定有交易记录，所以不会再多出一笔。
 */

import {
  creditsBalance,
  creditsBatch,
  creditsTransaction,
} from "../../../../src/db/schema/index";
import { VISUAL_USER } from "../../constants";
import { VISUAL_PROVIDER } from "../../fixtures";
import { USER_REGISTERED_AT } from "./identity";
import { at, type SeedTransaction } from "./types";

/** 推演必须得到的结果（任务书规定的数值） */
const EXPECTED = {
  activeRemaining: {
    visual_batch_bonus: 200,
    visual_batch_pack_september: 1200,
    visual_batch_pro_october: 1080,
  },
  balance: 2480,
  totalEarned: 28_400,
  totalExpired: 2000,
  totalSpent: 23_920,
} as const;

type BatchSource = "bonus" | "purchase" | "subscription";
type GrantType = "monthly_grant" | "purchase" | "registration_bonus";

interface GrantEvent {
  amount: number;
  batchId: string;
  /** 借方账户：钱从哪里来 */
  debitAccount: string;
  description: string;
  expiresAt: string | null;
  issuedAt: string;
  kind: "grant";
  metadata: Record<string, unknown>;
  sourceRef: string;
  sourceType: BatchSource;
  transactionId: string;
  type: GrantType;
}

interface ConsumeEvent {
  amount: number;
  description: string;
  kind: "consume";
  occurredAt: string;
  serviceName: string;
  transactionId: string;
}

interface ExpireEvent {
  batchId: string;
  description: string;
  kind: "expire";
  occurredAt: string;
  transactionId: string;
}

type LedgerEvent = ConsumeEvent | ExpireEvent | GrantEvent;

/** 事件的发生时间 */
function eventTime(event: LedgerEvent): string {
  return event.kind === "grant" ? event.issuedAt : event.occurredAt;
}

const WALLET = `WALLET:${VISUAL_USER.id}`;
const SUBSCRIPTION_ACCOUNT = `SUBSCRIPTION:${VISUAL_PROVIDER.subscriptionId}`;

/** 订阅每期发放的批次：来源标识沿用项目的“订阅编号:周期开始时间” */
function subscriptionGrant(input: {
  amount: number;
  batchId: string;
  expiresAt: string;
  issuedAt: string;
  periodEnd: string;
  periodStart: string;
  plan: "pro" | "starter";
  transactionId: string;
}): GrantEvent {
  const sourceRef = `${VISUAL_PROVIDER.subscriptionId}:${input.periodStart}`;
  return {
    amount: input.amount,
    batchId: input.batchId,
    debitAccount: SUBSCRIPTION_ACCOUNT,
    description: `${input.plan === "pro" ? "Pro" : "Starter"} monthly credits`,
    expiresAt: input.expiresAt,
    issuedAt: input.issuedAt,
    kind: "grant",
    metadata: {
      billingReason: "subscription_cycle",
      interval: "month",
      periodEnd: input.periodEnd,
      periodStart: input.periodStart,
      planType: input.plan,
      subscriptionId: VISUAL_PROVIDER.subscriptionId,
    },
    sourceRef,
    sourceType: "subscription",
    transactionId: input.transactionId,
    type: "monthly_grant",
  };
}

/** 按时间先后排列的全部事件，共 12 条交易 */
const LEDGER: readonly LedgerEvent[] = [
  {
    amount: 200,
    batchId: "visual_batch_bonus",
    debitAccount: "SYSTEM:registration_bonus",
    description: "Welcome bonus",
    expiresAt: null,
    issuedAt: USER_REGISTERED_AT,
    kind: "grant",
    metadata: { bonusType: "registration" },
    sourceRef: `registration:${VISUAL_USER.id}`,
    sourceType: "bonus",
    transactionId: "visual_transaction_01",
    type: "registration_bonus",
  },
  subscriptionGrant({
    amount: 3000,
    batchId: "visual_batch_starter_july",
    expiresAt: "2026-07-20T00:00:00.000Z",
    issuedAt: "2026-07-01T00:05:12.000Z",
    periodEnd: "2026-08-01T00:00:00.000Z",
    periodStart: "2026-07-01T00:00:00.000Z",
    plan: "starter",
    transactionId: "visual_transaction_02",
  }),
  {
    amount: 3000,
    description: "Generated deck from lecture notes",
    kind: "consume",
    occurredAt: "2026-07-18T15:42:09.000Z",
    serviceName: "deck-generation",
    transactionId: "visual_transaction_03",
  },
  subscriptionGrant({
    amount: 8000,
    batchId: "visual_batch_pro_august",
    expiresAt: "2026-08-20T00:00:00.000Z",
    issuedAt: "2026-08-01T00:05:31.000Z",
    periodEnd: "2026-09-01T00:00:00.000Z",
    periodStart: "2026-08-01T00:00:00.000Z",
    plan: "pro",
    transactionId: "visual_transaction_04",
  }),
  {
    amount: 6000,
    description: "Generated deck from PDF textbook",
    kind: "consume",
    occurredAt: "2026-08-12T10:15:44.000Z",
    serviceName: "deck-generation",
    transactionId: "visual_transaction_05",
  },
  {
    batchId: "visual_batch_pro_august",
    description: "Expired Pro monthly credits",
    kind: "expire",
    occurredAt: "2026-08-20T00:00:03.000Z",
    transactionId: "visual_transaction_06",
  },
  subscriptionGrant({
    amount: 8000,
    batchId: "visual_batch_pro_september",
    expiresAt: "2026-09-20T00:00:00.000Z",
    issuedAt: "2026-09-01T00:05:27.000Z",
    periodEnd: "2026-10-01T00:00:00.000Z",
    periodStart: "2026-09-01T00:00:00.000Z",
    plan: "pro",
    transactionId: "visual_transaction_07",
  }),
  {
    amount: 8000,
    description: "Generated decks from course slides",
    kind: "consume",
    occurredAt: "2026-09-14T19:03:51.000Z",
    serviceName: "deck-generation",
    transactionId: "visual_transaction_08",
  },
  {
    amount: 1200,
    batchId: "visual_batch_pack_september",
    debitAccount: "PAYMENT:visual_checkout_credit_pack",
    description: "Credit pack (1,200 credits)",
    expiresAt: "2027-09-18T00:00:00.000Z",
    issuedAt: "2026-09-18T11:20:36.000Z",
    kind: "grant",
    metadata: {
      checkoutId: "visual_checkout_credit_pack",
      packageId: "pack-1200",
    },
    sourceRef: "checkout:visual_checkout_credit_pack",
    sourceType: "purchase",
    transactionId: "visual_transaction_09",
    type: "purchase",
  },
  subscriptionGrant({
    amount: 8000,
    batchId: "visual_batch_pro_october",
    expiresAt: "2026-10-20T00:00:00.000Z",
    issuedAt: "2026-10-01T00:05:19.000Z",
    periodEnd: "2026-11-01T00:00:00.000Z",
    periodStart: "2026-10-01T00:00:00.000Z",
    plan: "pro",
    transactionId: "visual_transaction_10",
  }),
  {
    amount: 4000,
    description: "Generated deck from research papers",
    kind: "consume",
    occurredAt: "2026-10-06T13:27:15.000Z",
    serviceName: "deck-generation",
    transactionId: "visual_transaction_11",
  },
  {
    amount: 2920,
    description: "Generated deck from exam review notes",
    kind: "consume",
    occurredAt: "2026-10-14T21:48:02.000Z",
    serviceName: "deck-generation",
    transactionId: "visual_transaction_12",
  },
];

interface BatchState {
  amount: number;
  createdAt: string;
  expiresAt: string | null;
  id: string;
  remaining: number;
  sourceRef: string;
  sourceType: BatchSource;
  status: "active" | "consumed" | "expired";
  updatedAt: string;
}

interface TransactionRow {
  amount: number;
  createdAt: string;
  creditAccount: string;
  debitAccount: string;
  description: string;
  id: string;
  metadata: Record<string, unknown>;
  type: "consumption" | "expiration" | GrantType;
}

interface LedgerResult {
  balance: number;
  batches: BatchState[];
  lastEventAt: string;
  totalEarned: number;
  totalExpired: number;
  totalSpent: number;
  transactions: TransactionRow[];
}

/** 先进先出的取用顺序：先过期的在前，永不过期的在后，同一过期时间看发放先后 */
function compareForConsumption(left: BatchState, right: BatchState): number {
  if (left.expiresAt !== right.expiresAt) {
    if (left.expiresAt === null) return 1;
    if (right.expiresAt === null) return -1;
    return Date.parse(left.expiresAt) - Date.parse(right.expiresAt);
  }
  return Date.parse(left.createdAt) - Date.parse(right.createdAt);
}

/** 按时间顺序执行所有事件，得到每个批次的最终状态和每笔交易的明细 */
function runLedger(events: readonly LedgerEvent[]): LedgerResult {
  const batches = new Map<string, BatchState>();
  const transactions: TransactionRow[] = [];
  let balance = 0;
  let totalEarned = 0;
  let totalSpent = 0;
  let totalExpired = 0;
  let previousTime = Number.NEGATIVE_INFINITY;

  for (const event of events) {
    const time = Date.parse(eventTime(event));
    // 交易列表按时间倒序展示，时间重复会让顺序不确定，所以要求严格递增
    if (!(time > previousTime)) {
      throw new Error(`积分事件的时间必须严格递增：${event.transactionId}`);
    }
    previousTime = time;

    if (event.kind === "grant") {
      batches.set(event.batchId, {
        amount: event.amount,
        createdAt: event.issuedAt,
        expiresAt: event.expiresAt,
        id: event.batchId,
        remaining: event.amount,
        sourceRef: event.sourceRef,
        sourceType: event.sourceType,
        status: "active",
        updatedAt: event.issuedAt,
      });
      balance += event.amount;
      totalEarned += event.amount;
      transactions.push({
        amount: event.amount,
        createdAt: event.issuedAt,
        creditAccount: WALLET,
        debitAccount: event.debitAccount,
        description: event.description,
        id: event.transactionId,
        metadata: {
          ...event.metadata,
          batchId: event.batchId,
          sourceRef: event.sourceRef,
        },
        type: event.type,
      });
      continue;
    }

    if (event.kind === "consume") {
      const usable = [...batches.values()]
        .filter(
          (batch) =>
            batch.status === "active" &&
            batch.remaining > 0 &&
            (batch.expiresAt === null || Date.parse(batch.expiresAt) > time)
        )
        .sort(compareForConsumption);
      let toConsume = event.amount;
      const consumedBatches: Array<{
        batchId: string;
        consumedFromBatch: number;
      }> = [];
      for (const batch of usable) {
        if (toConsume <= 0) break;
        const taken = Math.min(batch.remaining, toConsume);
        batch.remaining -= taken;
        batch.status = batch.remaining === 0 ? "consumed" : "active";
        batch.updatedAt = event.occurredAt;
        consumedBatches.push({ batchId: batch.id, consumedFromBatch: taken });
        toConsume -= taken;
      }
      if (toConsume > 0) {
        throw new Error(`积分余额不足以消耗：${event.transactionId}`);
      }
      balance -= event.amount;
      totalSpent += event.amount;
      transactions.push({
        amount: event.amount,
        createdAt: event.occurredAt,
        creditAccount: `SERVICE:${event.serviceName}`,
        debitAccount: WALLET,
        description: event.description,
        id: event.transactionId,
        metadata: { consumedBatches, serviceName: event.serviceName },
        type: "consumption",
      });
      continue;
    }

    const batch = batches.get(event.batchId);
    if (!batch || batch.status !== "active" || batch.remaining <= 0) {
      throw new Error(`过期事件指向的批次不存在或已无剩余：${event.batchId}`);
    }
    const expiredAmount = batch.remaining;
    // 与 processExpiredBatches 一致：批次只改状态，剩余数量保留用于对账
    batch.status = "expired";
    batch.updatedAt = event.occurredAt;
    balance -= expiredAmount;
    totalExpired += expiredAmount;
    transactions.push({
      amount: expiredAmount,
      createdAt: event.occurredAt,
      creditAccount: "SYSTEM:expired",
      debitAccount: WALLET,
      description: event.description,
      id: event.transactionId,
      metadata: {
        batchId: batch.id,
        expiredAmount,
        expiresAt: batch.expiresAt,
        originalAmount: batch.amount,
      },
      type: "expiration",
    });
  }

  const lastEvent = events.at(-1);
  if (!lastEvent) {
    throw new Error("积分事件列表不能为空");
  }

  return {
    balance,
    batches: [...batches.values()],
    lastEventAt: eventTime(lastEvent),
    totalEarned,
    totalExpired,
    totalSpent,
    transactions,
  };
}

/** 推演结果和任务书规定的数值逐项核对 */
function assertExpected(result: LedgerResult): void {
  const mismatches: string[] = [];
  const check = (name: string, actual: number, expected: number) => {
    if (actual !== expected) {
      mismatches.push(`${name}：实际 ${actual}，应为 ${expected}`);
    }
  };

  check("余额", result.balance, EXPECTED.balance);
  check("累计获得", result.totalEarned, EXPECTED.totalEarned);
  check("累计消耗", result.totalSpent, EXPECTED.totalSpent);
  check("累计过期", result.totalExpired, EXPECTED.totalExpired);
  check("交易条数", result.transactions.length, 12);

  const active = result.batches.filter((batch) => batch.status === "active");
  check("有效批次个数", active.length, 3);
  for (const [batchId, expected] of Object.entries(EXPECTED.activeRemaining)) {
    const batch = result.batches.find((item) => item.id === batchId);
    check(`批次 ${batchId} 剩余`, batch?.remaining ?? -1, expected);
  }
  check(
    "有效批次剩余之和",
    active.reduce((sum, batch) => sum + batch.remaining, 0),
    result.balance
  );

  if (mismatches.length > 0) {
    throw new Error(`积分种子推演结果与目标不一致：\n${mismatches.join("\n")}`);
  }
}

export async function seedCredits(tx: SeedTransaction): Promise<void> {
  const result = runLedger(LEDGER);
  assertExpected(result);

  await tx.insert(creditsBalance).values({
    balance: result.balance,
    createdAt: at(USER_REGISTERED_AT),
    id: "visual_credits_balance",
    status: "active",
    totalEarned: result.totalEarned,
    totalSpent: result.totalSpent,
    updatedAt: at(result.lastEventAt),
    userId: VISUAL_USER.id,
  });

  await tx.insert(creditsBatch).values(
    result.batches.map((batch) => ({
      amount: batch.amount,
      createdAt: at(batch.createdAt),
      expiresAt: batch.expiresAt === null ? null : at(batch.expiresAt),
      id: batch.id,
      issuedAt: at(batch.createdAt),
      remaining: batch.remaining,
      sourceRef: batch.sourceRef,
      sourceType: batch.sourceType,
      status: batch.status,
      updatedAt: at(batch.updatedAt),
      userId: VISUAL_USER.id,
    }))
  );

  await tx.insert(creditsTransaction).values(
    result.transactions.map((row) => ({
      amount: row.amount,
      createdAt: at(row.createdAt),
      creditAccount: row.creditAccount,
      debitAccount: row.debitAccount,
      description: row.description,
      id: row.id,
      metadata: row.metadata,
      type: row.type,
      userId: VISUAL_USER.id,
    }))
  );
}
