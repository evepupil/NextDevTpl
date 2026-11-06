/**
 * 订阅历史 × 支付 Webhook 集成测试（复现 P1-028）
 *
 * 缺陷：用户在站内改过一次套餐后，那条站内请求记录会被之后每一次 Webhook 反复命中，
 * 重复的“确认”被唯一索引静默吞掉，续费、降级生效、供应商侧改价从此写不进订阅历史。
 *
 * 做法：直接调用生产路由 POST /api/webhooks/payment，连真实测试数据库。
 * 只替换外部边界：next/headers 的 headers()（取签名头）和支付服务的 verifyWebhook
 * （返回测试构造的统一事件）。数据库、订阅写入、历史写入、待生效价格解析都走生产代码。
 *
 * 用例写的是“修好后应该怎样”：
 * - S1、S4 描述现在就成立的行为。
 * - S2、S3、S3b、S5 在修复前会因为缺少对应的订阅历史而失败。
 * - S6 守住修复不能引入的新问题：没有关联 ID 的旧请求无法判断是否已确认，
 *   不能当作待确认请求，否则续费永远记不到。
 * - S7 待生效的降级到期而供应商仍报旧价时，这次价格变化属于降级请求，
 *   不能被事件里的旧价带到更早已完成的升级请求上。
 *
 * 前置：测试库要有事件领取表 payment_webhook_event，由全局 setup 里的
 * syncLegacyTestSchema 补建；缺表时路由领取事件就会 500，与订阅历史无关。
 */

import { asc, eq, inArray } from "drizzle-orm";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { POST } from "@/app/api/webhooks/payment/route";
import { findPlanByPriceId, PRICE_IDS } from "@/config/payment";
import { getPlanFromPriceId } from "@/config/subscription-plan";
import type { PaymentWebhookEvent } from "@/core/services";
import { paymentWebhookEvent, revenueEvent } from "@/db/schema/payment";
import {
  type SubscriptionHistory,
  subscription,
  subscriptionHistory,
} from "@/db/schema/subscription";
import { paymentService } from "@/services/payment";
import {
  cleanupTestUsers,
  createTestSubscription,
  createTestUser,
  getUserSubscription,
  testDb,
} from "../utils";

// ============================================
// 测试环境准备（必须赶在被测模块加载之前）
// ============================================

/**
 * 档位价格的登记来自环境变量，@/config/payment 首次加载时读取一次。
 * 测试环境（.env.test）没有登记任何档位价格，这里只在本测试进程里补上两个；
 * 环境里已有真实登记时原样沿用。不改任何环境文件。
 */
vi.hoisted(() => {
  const fallbackPrices: Record<string, string> = {
    NEXT_PUBLIC_PRICE_PRO_MONTHLY: "price_p1028_pro_monthly",
    NEXT_PUBLIC_PRICE_STARTER_MONTHLY: "price_p1028_starter_monthly",
  };
  for (const [name, value] of Object.entries(fallbackPrices)) {
    if (!process.env[name]) {
      vi.stubEnv(name, value);
    }
  }
});

/** 路由用 headers() 取签名头；验签本身由被替换的 verifyWebhook 承担，这里给固定值即可 */
vi.mock("next/headers", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  headers: async () =>
    new Headers({ "creem-signature": "p1028-test-signature" }),
}));

// ============================================
// 常量与时间线
// ============================================

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;
/** 每个计费周期固定 30 天，保证“上一周期结束 = 下一周期开始”精确相等 */
const PERIOD_MS = 30 * DAY_MS;
const FIRST_PERIOD_START_MS = Date.UTC(2026, 0, 1);
const WEBHOOK_URL = "http://localhost/api/webhooks/payment";
/** 远端测试库每次往返都慢，单个用例要连发多个 Webhook，超时放宽 */
const TEST_TIMEOUT_MS = 180_000;

/** 高档价：升级后的价格，也是降级前的价格 */
const HIGH_PRICE = PRICE_IDS.PRO_MONTHLY;
/** 低档价 */
const LOW_PRICE = PRICE_IDS.STARTER_MONTHLY;

interface Period {
  start: Date;
  end: Date;
}

/** 第 index 个计费周期（0 起算）；周期 n 的结束时间就是周期 n+1 的开始时间 */
function period(index: number): Period {
  return {
    start: new Date(FIRST_PERIOD_START_MS + index * PERIOD_MS),
    end: new Date(FIRST_PERIOD_START_MS + (index + 1) * PERIOD_MS),
  };
}

/** 用户在站内改套餐的时刻：第一个周期开始后的第 1 天 */
const ACTION_AT = new Date(FIRST_PERIOD_START_MS + DAY_MS);

/** 站内改套餐之后过了 minutes 分钟 */
function afterAction(minutes: number): Date {
  return new Date(ACTION_AT.getTime() + minutes * MINUTE_MS);
}

// ============================================
// 测试数据的登记与清理
// ============================================

/** verifyWebhook 的替身按事件 ID 从这里取出测试构造的统一事件 */
const queuedEvents = new Map<string, PaymentWebhookEvent>();
const createdUserIds: string[] = [];
const usedSubscriptionIds: string[] = [];
const usedEventIds: string[] = [];

/**
 * 删除本文件建的全部数据。
 * 订阅历史随用户级联删除；收入记录的用户外键是“置空”而不是删除，
 * 事件领取记录没有外键，这两类要按本文件用到的 ID 单独删。
 */
async function cleanupCreatedData(): Promise<void> {
  queuedEvents.clear();
  const userIds = createdUserIds.splice(0);
  const subscriptionIds = usedSubscriptionIds.splice(0);
  const eventIds = usedEventIds.splice(0);

  try {
    if (subscriptionIds.length > 0) {
      await testDb
        .delete(revenueEvent)
        .where(inArray(revenueEvent.subscriptionId, subscriptionIds));
    }
    if (userIds.length > 0) {
      await testDb
        .delete(revenueEvent)
        .where(inArray(revenueEvent.userId, userIds));
    }
    if (eventIds.length > 0) {
      await testDb
        .delete(paymentWebhookEvent)
        .where(inArray(paymentWebhookEvent.id, eventIds));
    }
  } finally {
    // 上面任何一步出错，用户和订阅也必须删掉，不能残留在共享测试库里
    await cleanupTestUsers(userIds);
  }
}

// ============================================
// 场景搭建：用户、订阅、站内改套餐留下的请求
// ============================================

interface Scenario {
  userId: string;
  /** 供应商侧的订阅 ID（随机） */
  subscriptionId: string;
  /** 站内改套餐动作的请求 ID，也是请求与确认之间的关联 ID */
  requestId: string;
}

interface ScenarioInput {
  currentPrice: string;
  /** 已经排好、等周期结束才生效的价格 */
  pending?: { priceId: string; effectiveAt: Date };
}

/** 建用户和订阅：订阅停在第一个周期，随机的供应商订阅 ID */
async function createScenario(input: ScenarioInput): Promise<Scenario> {
  const user = await createTestUser();
  createdUserIds.push(user.id);
  const subscriptionId = `sub_p1028_${crypto.randomUUID()}`;
  usedSubscriptionIds.push(subscriptionId);

  const first = period(0);
  await createTestSubscription({
    userId: user.id,
    subscriptionId,
    priceId: input.currentPrice,
    status: "active",
    currentPeriodStart: first.start,
    currentPeriodEnd: first.end,
  });
  // 共享夹具不支持待生效价格，这里补写
  if (input.pending) {
    await testDb
      .update(subscription)
      .set({
        pendingPriceEffectiveAt: input.pending.effectiveAt,
        pendingPriceId: input.pending.priceId,
      })
      .where(eq(subscription.userId, user.id));
  }

  return {
    userId: user.id,
    subscriptionId,
    requestId: crypto.randomUUID(),
  };
}

/**
 * 照站内动作的写法留下一条改套餐请求：来源是站内动作，请求 ID 同时当事件 ID 和关联 ID。
 * withoutAuditIds 模拟早期没有审计列时留下的旧数据：事件 ID 和关联 ID 都是空的。
 */
async function seedActionRequest(
  scenario: Scenario,
  request: {
    eventType: "upgrade_requested" | "downgrade_requested";
    fromPriceId: string;
    toPriceId: string;
    effectiveAt: Date;
    updateBehavior: string;
    withoutAuditIds?: boolean;
    /** 请求 ID，默认取场景自己的请求 ID */
    requestId?: string;
    /** 请求写入的时刻，默认是站内改套餐的时刻 */
    createdAt?: Date;
  }
): Promise<void> {
  const auditId = request.withoutAuditIds
    ? null
    : (request.requestId ?? scenario.requestId);
  await testDb.insert(subscriptionHistory).values({
    id: crypto.randomUUID(),
    userId: scenario.userId,
    subscriptionId: scenario.subscriptionId,
    eventType: request.eventType,
    fromPriceId: request.fromPriceId,
    toPriceId: request.toPriceId,
    effectiveAt: request.effectiveAt,
    sourceType: "action",
    sourceEventId: auditId,
    correlationId: auditId,
    metadata: { provider: "creem", updateBehavior: request.updateBehavior },
    createdAt: request.createdAt ?? ACTION_AT,
  });
}

/** 留下一条早已完成的升级确认：Webhook 来源，关联到对应的升级请求 */
async function seedUpgradeConfirmation(
  scenario: Scenario,
  requestId: string
): Promise<void> {
  await testDb.insert(subscriptionHistory).values({
    id: crypto.randomUUID(),
    userId: scenario.userId,
    subscriptionId: scenario.subscriptionId,
    eventType: "upgrade_confirmed",
    fromPriceId: LOW_PRICE,
    toPriceId: HIGH_PRICE,
    effectiveAt: period(0).start,
    sourceType: "webhook",
    sourceEventId: `evt_p1028_${crypto.randomUUID()}`,
    correlationId: requestId,
    createdAt: afterAction(1),
  });
}

/** 前置：用户已在站内升级。本地订阅立即换成高档价，历史里留下升级请求 */
async function createUpgradedScenario(
  options: { withoutAuditIds?: boolean } = {}
): Promise<Scenario> {
  const scenario = await createScenario({ currentPrice: HIGH_PRICE });
  await seedActionRequest(scenario, {
    eventType: "upgrade_requested",
    fromPriceId: LOW_PRICE,
    toPriceId: HIGH_PRICE,
    effectiveAt: ACTION_AT,
    updateBehavior: "proration-charge-immediately",
    ...options,
  });
  return scenario;
}

/** 前置：用户已在站内降级。当前周期仍是高档价，低档价排到周期结束才生效 */
async function createDowngradingScenario(): Promise<Scenario> {
  const periodEnd = period(0).end;
  const scenario = await createScenario({
    currentPrice: HIGH_PRICE,
    pending: { priceId: LOW_PRICE, effectiveAt: periodEnd },
  });
  await seedActionRequest(scenario, {
    eventType: "downgrade_requested",
    fromPriceId: HIGH_PRICE,
    toPriceId: LOW_PRICE,
    effectiveAt: periodEnd,
    updateBehavior: "proration-none",
  });
  return scenario;
}

interface UpgradedThenDowngradingScenario extends Scenario {
  /** 更早那次已完成的站内升级的请求 ID；降级请求用场景自己的请求 ID */
  upgradeRequestId: string;
}

/**
 * 前置：先有一次已完成的站内升级（升级请求加对应的升级确认），
 * 之后用户又在站内降级，降级请求还没被确认。
 * 当前周期仍是高档价，低档价排到周期结束才生效。
 */
async function createUpgradedThenDowngradingScenario(): Promise<UpgradedThenDowngradingScenario> {
  const periodEnd = period(0).end;
  const scenario = await createScenario({
    currentPrice: HIGH_PRICE,
    pending: { priceId: LOW_PRICE, effectiveAt: periodEnd },
  });

  const upgradeRequestId = crypto.randomUUID();
  await seedActionRequest(scenario, {
    requestId: upgradeRequestId,
    eventType: "upgrade_requested",
    fromPriceId: LOW_PRICE,
    toPriceId: HIGH_PRICE,
    effectiveAt: ACTION_AT,
    updateBehavior: "proration-charge-immediately",
  });
  await seedUpgradeConfirmation(scenario, upgradeRequestId);

  // 降级发生在升级之后 10 天
  await seedActionRequest(scenario, {
    eventType: "downgrade_requested",
    fromPriceId: HIGH_PRICE,
    toPriceId: LOW_PRICE,
    effectiveAt: periodEnd,
    updateBehavior: "proration-none",
    createdAt: afterAction(10 * 24 * 60),
  });
  return { ...scenario, upgradeRequestId };
}

// ============================================
// 投递 Webhook
// ============================================

interface Delivery {
  /** 供应商此刻在事件里报的价格 */
  priceId: string;
  /** 事件里的订阅周期 */
  window: Period;
  /** 事件发生时间，默认取周期开始时间 */
  occurredAt?: Date;
  /** 重投同一个事件时指定事件 ID，默认每次生成新的 */
  eventId?: string;
}

function buildEvent(
  scenario: Scenario,
  eventId: string,
  delivery: Delivery
): PaymentWebhookEvent {
  return {
    id: eventId,
    // Stripe 适配器把周期内的更新和周期续费都归一成这个类型
    type: "subscription.renewed",
    createdAt: delivery.occurredAt ?? delivery.window.start,
    checkout: null,
    payment: null,
    subscription: {
      id: scenario.subscriptionId,
      status: "active",
      productId: delivery.priceId,
      customerId: `cus_p1028_${scenario.userId}`,
      currentPeriodStart: delivery.window.start,
      currentPeriodEnd: delivery.window.end,
      cancelAtPeriodEnd: false,
      metadata: { userId: scenario.userId },
    },
    rawMetadata: {},
  };
}

function postWebhook(eventId: string): Promise<Response> {
  // 请求体就是事件 ID，verifyWebhook 的替身按它取出事件
  return POST(
    new Request(WEBHOOK_URL, {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: eventId,
    })
  );
}

/** 投递一个事件并确认路由正常处理、订阅周期被推进到事件的周期 */
async function deliver(
  step: string,
  scenario: Scenario,
  delivery: Delivery
): Promise<string> {
  const eventId = delivery.eventId ?? `evt_p1028_${crypto.randomUUID()}`;
  usedEventIds.push(eventId);
  queuedEvents.set(eventId, buildEvent(scenario, eventId, delivery));

  const response = await postWebhook(eventId);
  const body: unknown = await response.json();
  expect(
    response.status,
    `${step}：响应码（响应体 ${JSON.stringify(body)}）`
  ).toBe(200);
  expect(body, `${step}：响应体`).toEqual({ received: true });

  // 事件被订阅接受（不是被当成旧周期事件忽略），失败原因才不会混进别的因素
  const current = await getUserSubscription(scenario.userId);
  expect(
    current?.currentPeriodStart?.toISOString(),
    `${step}：订阅周期应推进到事件的周期`
  ).toBe(delivery.window.start.toISOString());
  return eventId;
}

// ============================================
// 断言：订阅历史与订阅当前价
// ============================================

interface ExpectedHistory {
  eventType: string;
  effectiveAt?: Date;
  fromPriceId?: string | null;
  toPriceId?: string | null;
  correlationId?: string | null;
}

/** 站内升级请求（前置数据） */
function upgradeRequested(scenario: Scenario): ExpectedHistory {
  return {
    eventType: "upgrade_requested",
    effectiveAt: ACTION_AT,
    fromPriceId: LOW_PRICE,
    toPriceId: HIGH_PRICE,
    correlationId: scenario.requestId,
  };
}

/** 早期没有审计列时留下的旧升级请求（前置数据）：没有事件 ID，也没有关联 ID */
function legacyUpgradeRequested(): ExpectedHistory {
  return {
    eventType: "upgrade_requested",
    effectiveAt: ACTION_AT,
    fromPriceId: LOW_PRICE,
    toPriceId: HIGH_PRICE,
    correlationId: null,
  };
}

/** 供应商确认升级：关联到站内请求，生效时间取确认事件所在周期的开始 */
function upgradeConfirmed(scenario: Scenario, window: Period): ExpectedHistory {
  return {
    eventType: "upgrade_confirmed",
    effectiveAt: window.start,
    toPriceId: HIGH_PRICE,
    correlationId: scenario.requestId,
  };
}

/** 站内降级请求（前置数据） */
function downgradeRequested(scenario: Scenario): ExpectedHistory {
  return {
    eventType: "downgrade_requested",
    effectiveAt: period(0).end,
    fromPriceId: HIGH_PRICE,
    toPriceId: LOW_PRICE,
    correlationId: scenario.requestId,
  };
}

/** 供应商确认降级：高档价 -> 低档价，关联到站内请求 */
function downgradeConfirmed(
  scenario: Scenario,
  effectiveAt: Date
): ExpectedHistory {
  return {
    eventType: "downgrade_confirmed",
    effectiveAt,
    fromPriceId: HIGH_PRICE,
    toPriceId: LOW_PRICE,
    correlationId: scenario.requestId,
  };
}

/** 降级真正生效：高档价 -> 低档价，关联到站内请求 */
function downgraded(scenario: Scenario, effectiveAt: Date): ExpectedHistory {
  return {
    eventType: "downgraded",
    effectiveAt,
    fromPriceId: HIGH_PRICE,
    toPriceId: LOW_PRICE,
    correlationId: scenario.requestId,
  };
}

/** 续费：生效时间是新周期的开始 */
function renewed(window: Period): ExpectedHistory {
  return { eventType: "renewed", effectiveAt: window.start };
}

/** 供应商侧改价：没有站内请求，所以没有关联 ID */
function changed(fromPriceId: string, toPriceId: string): ExpectedHistory {
  return { eventType: "changed", fromPriceId, toPriceId, correlationId: null };
}

async function readHistory(scenario: Scenario): Promise<SubscriptionHistory[]> {
  return testDb
    .select()
    .from(subscriptionHistory)
    .where(eq(subscriptionHistory.subscriptionId, scenario.subscriptionId))
    .orderBy(
      asc(subscriptionHistory.createdAt),
      asc(subscriptionHistory.effectiveAt)
    );
}

function countByType(eventTypes: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const eventType of eventTypes) {
    counts[eventType] = (counts[eventType] ?? 0) + 1;
  }
  return counts;
}

/**
 * 断言订阅历史恰好是 expected（按写入先后排列）。
 * 先比各类型条数，缺哪种历史一眼可见；再逐条比事件类型、价格、关联 ID 和生效时间。
 */
async function expectHistory(
  step: string,
  scenario: Scenario,
  expected: ExpectedHistory[]
): Promise<void> {
  const rows = await readHistory(scenario);

  expect(
    countByType(rows.map((row) => row.eventType)),
    `${step}：订阅历史各类型条数`
  ).toEqual(countByType(expected.map((item) => item.eventType)));

  expect(
    rows.map((row) => ({
      eventType: row.eventType,
      fromPriceId: row.fromPriceId,
      toPriceId: row.toPriceId,
      correlationId: row.correlationId,
      effectiveAt: row.effectiveAt.toISOString(),
    })),
    `${step}：订阅历史明细`
  ).toMatchObject(
    expected.map(({ effectiveAt, ...rest }) =>
      effectiveAt ? { ...rest, effectiveAt: effectiveAt.toISOString() } : rest
    )
  );
}

/** 断言订阅当前价；pendingPriceId 传了才断言待生效价格（null 表示已清空） */
async function expectSubscriptionState(
  step: string,
  scenario: Scenario,
  expected: { priceId: string; pendingPriceId?: string | null }
): Promise<void> {
  const current = await getUserSubscription(scenario.userId);
  expect(current?.priceId, `${step}：订阅当前价`).toBe(expected.priceId);
  if (expected.pendingPriceId !== undefined) {
    expect(current?.pendingPriceId ?? null, `${step}：待生效价格`).toBe(
      expected.pendingPriceId
    );
  }
}

/**
 * 断言订阅历史里没有任何升级确认。
 * 没有关联 ID 的旧请求无法判断是否已经确认过，不能当作待确认请求；
 * 否则每个事件都会写一条不带关联 ID 的确认（空值不触发唯一索引），续费永远记不到。
 */
async function expectNoUpgradeConfirmed(
  step: string,
  scenario: Scenario
): Promise<void> {
  const rows = await readHistory(scenario);
  expect(
    rows.filter((row) => row.eventType === "upgrade_confirmed"),
    `${step}：没有关联 ID 的旧请求不应产生升级确认`
  ).toHaveLength(0);
}

// ============================================
// 用例
// ============================================

describe("支付 Webhook 写订阅历史（P1-028）", () => {
  beforeAll(() => {
    // 路由靠价格登记校验价格：两个价格都得已登记，且不能是同一个
    expect(HIGH_PRICE).not.toBe(LOW_PRICE);
    for (const priceId of [HIGH_PRICE, LOW_PRICE]) {
      expect(
        findPlanByPriceId(priceId).price,
        `价格 ${priceId} 未登记`
      ).not.toBe(null);
      expect(
        getPlanFromPriceId(priceId),
        `价格 ${priceId} 无对应套餐`
      ).not.toBe(null);
    }

    // 验签换成直接返回测试构造的事件，其余支付服务能力原样保留
    vi.spyOn(paymentService, "verifyWebhook").mockImplementation(
      async ({ payload }) => {
        const event = queuedEvents.get(payload);
        if (!event) {
          throw new Error(`测试里没有登记过的 Webhook 事件：${payload}`);
        }
        return event;
      }
    );
  });

  afterEach(cleanupCreatedData);

  afterAll(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it(
    "S1 基线：从未改过套餐的订阅下周期续费，记一条续费",
    async () => {
      const scenario = await createScenario({ currentPrice: LOW_PRICE });
      const next = period(1);

      await deliver("S1 下周期续费", scenario, {
        priceId: LOW_PRICE,
        window: next,
      });

      await expectHistory("S1 续费之后", scenario, [renewed(next)]);
    },
    TEST_TIMEOUT_MS
  );

  it(
    "S2 升级后续费：升级确认只记一条，之后每个周期的续费都要记",
    async () => {
      const scenario = await createUpgradedScenario();
      const p0 = period(0);
      const p1 = period(1);
      const p2 = period(2);

      // E1：升级当天供应商推来更新事件（同一周期、高档价）
      await deliver("S2 E1 同一周期、高档价", scenario, {
        priceId: HIGH_PRICE,
        window: p0,
        occurredAt: afterAction(1),
      });
      await expectHistory("S2 E1 之后", scenario, [
        upgradeRequested(scenario),
        upgradeConfirmed(scenario, p0),
      ]);

      // E2：下一周期自然续费
      await deliver("S2 E2 下周期续费", scenario, {
        priceId: HIGH_PRICE,
        window: p1,
      });
      await expectHistory("S2 E2 之后", scenario, [
        upgradeRequested(scenario),
        upgradeConfirmed(scenario, p0),
        renewed(p1),
      ]);

      // E3：再下一周期续费
      await deliver("S2 E3 再下周期续费", scenario, {
        priceId: HIGH_PRICE,
        window: p2,
      });
      await expectHistory("S2 E3 之后", scenario, [
        upgradeRequested(scenario),
        upgradeConfirmed(scenario, p0),
        renewed(p1),
        renewed(p2),
      ]);
    },
    TEST_TIMEOUT_MS
  );

  it(
    "S3 降级生效：当场确认一次，下周期价格切换记降级生效，再下周期记续费",
    async () => {
      const scenario = await createDowngradingScenario();
      const p0 = period(0);
      const p1 = period(1);
      const p2 = period(2);

      // E1：降级当天供应商当场把价格改成低档价；本地权益仍是高档价，要等周期结束
      await deliver("S3 E1 同一周期、低档价", scenario, {
        priceId: LOW_PRICE,
        window: p0,
        occurredAt: afterAction(1),
      });
      await expectSubscriptionState("S3 E1 之后", scenario, {
        priceId: HIGH_PRICE,
      });
      await expectHistory("S3 E1 之后", scenario, [
        downgradeRequested(scenario),
        downgradeConfirmed(scenario, p0.end),
      ]);

      // E2：下一周期开始，低档价真正生效，待生效价格随之清空
      await deliver("S3 E2 下周期、低档价", scenario, {
        priceId: LOW_PRICE,
        window: p1,
      });
      await expectSubscriptionState("S3 E2 之后", scenario, {
        priceId: LOW_PRICE,
        pendingPriceId: null,
      });
      await expectHistory("S3 E2 之后", scenario, [
        downgradeRequested(scenario),
        downgradeConfirmed(scenario, p0.end),
        downgraded(scenario, p1.start),
      ]);

      // E3：再下一周期续费
      await deliver("S3 E3 再下周期续费", scenario, {
        priceId: LOW_PRICE,
        window: p2,
      });
      await expectHistory("S3 E3 之后", scenario, [
        downgradeRequested(scenario),
        downgradeConfirmed(scenario, p0.end),
        downgraded(scenario, p1.start),
        renewed(p2),
      ]);
    },
    TEST_TIMEOUT_MS
  );

  it(
    "S3b 降级时供应商当场仍报旧价：当场不记历史，下周期价格切换记降级确认，再下周期记续费",
    async () => {
      const scenario = await createDowngradingScenario();
      const p0 = period(0);
      const p1 = period(1);
      const p2 = period(2);

      // E1：同一周期，供应商还报高档价，什么历史都不该写
      await deliver("S3b E1 同一周期、仍报高档价", scenario, {
        priceId: HIGH_PRICE,
        window: p0,
        occurredAt: afterAction(1),
      });
      await expectSubscriptionState("S3b E1 之后", scenario, {
        priceId: HIGH_PRICE,
      });
      await expectHistory("S3b E1 之后", scenario, [
        downgradeRequested(scenario),
      ]);

      // E2：下一周期开始，低档价第一次出现，这时才确认降级
      await deliver("S3b E2 下周期、低档价", scenario, {
        priceId: LOW_PRICE,
        window: p1,
      });
      await expectSubscriptionState("S3b E2 之后", scenario, {
        priceId: LOW_PRICE,
      });
      await expectHistory("S3b E2 之后", scenario, [
        downgradeRequested(scenario),
        downgradeConfirmed(scenario, p1.start),
      ]);

      // E3：再下一周期续费
      await deliver("S3b E3 再下周期续费", scenario, {
        priceId: LOW_PRICE,
        window: p2,
      });
      await expectHistory("S3b E3 之后", scenario, [
        downgradeRequested(scenario),
        downgradeConfirmed(scenario, p1.start),
        renewed(p2),
      ]);
    },
    TEST_TIMEOUT_MS
  );

  it(
    "S4 同一事件重投：第二次被识别为重复，升级确认仍只有一条",
    async () => {
      const scenario = await createUpgradedScenario();
      const p0 = period(0);

      const eventId = await deliver("S4 第一次投递", scenario, {
        priceId: HIGH_PRICE,
        window: p0,
        occurredAt: afterAction(1),
      });

      const replay = await postWebhook(eventId);
      expect(replay.status, "S4 重投：响应码").toBe(200);
      expect(await replay.json(), "S4 重投：应识别为重复").toEqual({
        received: true,
        duplicate: true,
      });

      await expectHistory("S4 重投之后", scenario, [
        upgradeRequested(scenario),
        upgradeConfirmed(scenario, p0),
      ]);
    },
    TEST_TIMEOUT_MS
  );

  it(
    "S5 供应商侧来回改价：每次改价都记一条变更，不被旧的升级请求吞掉",
    async () => {
      const scenario = await createUpgradedScenario();
      const p0 = period(0);

      // 先让升级确认落地
      await deliver("S5 E1 同一周期、高档价", scenario, {
        priceId: HIGH_PRICE,
        window: p0,
        occurredAt: afterAction(1),
      });
      const expected: ExpectedHistory[] = [
        upgradeRequested(scenario),
        upgradeConfirmed(scenario, p0),
      ];
      await expectHistory("S5 E1 之后", scenario, expected);

      // 同一周期内用户在供应商后台来回改价：低、高、低、高，没有任何站内请求
      let previousPrice = HIGH_PRICE;
      const flips = [LOW_PRICE, HIGH_PRICE, LOW_PRICE, HIGH_PRICE];
      for (const [index, priceId] of flips.entries()) {
        const step = `S5 第 ${index + 1} 次改价（改成${priceId === HIGH_PRICE ? "高" : "低"}档价）`;
        await deliver(step, scenario, {
          priceId,
          window: p0,
          occurredAt: afterAction(60 * (index + 1)),
        });
        expected.push(changed(previousPrice, priceId));
        previousPrice = priceId;

        await expectSubscriptionState(`${step}之后`, scenario, { priceId });
        await expectHistory(`${step}之后`, scenario, expected);
      }
    },
    TEST_TIMEOUT_MS
  );

  it(
    "S6 旧数据请求没有关联编号：不当作待确认请求，同周期不写历史，之后每个周期的续费照常记",
    async () => {
      // 前置同 S2，只是那条升级请求的事件 ID 和关联 ID 都是空的
      const scenario = await createUpgradedScenario({ withoutAuditIds: true });
      const p0 = period(0);
      const p1 = period(1);
      const p2 = period(2);

      // E1：同一周期、高档价。没有关联 ID，无从确认，什么历史都不该写
      await deliver("S6 E1 同一周期、高档价", scenario, {
        priceId: HIGH_PRICE,
        window: p0,
        occurredAt: afterAction(1),
      });
      await expectNoUpgradeConfirmed("S6 E1 之后", scenario);
      await expectHistory("S6 E1 之后", scenario, [legacyUpgradeRequested()]);

      // E2：下一周期自然续费，记一条续费
      await deliver("S6 E2 下周期续费", scenario, {
        priceId: HIGH_PRICE,
        window: p1,
      });
      await expectNoUpgradeConfirmed("S6 E2 之后", scenario);
      await expectHistory("S6 E2 之后", scenario, [
        legacyUpgradeRequested(),
        renewed(p1),
      ]);

      // E3：再下一周期续费，再记一条续费
      await deliver("S6 E3 再下周期续费", scenario, {
        priceId: HIGH_PRICE,
        window: p2,
      });
      await expectNoUpgradeConfirmed("S6 E3 之后", scenario);
      await expectHistory("S6 E3 之后", scenario, [
        legacyUpgradeRequested(),
        renewed(p1),
        renewed(p2),
      ]);
    },
    TEST_TIMEOUT_MS
  );

  it(
    "S7 待生效降级到期时供应商仍报旧价：本地待生效价格生效，降级确认关联降级请求，不再误写升级确认，再下周期记续费",
    async () => {
      const scenario = await createUpgradedThenDowngradingScenario();
      // 更早那次升级的请求和确认，按它自己的请求 ID 取期望行
      const earlierUpgrade: Scenario = {
        ...scenario,
        requestId: scenario.upgradeRequestId,
      };
      const p0 = period(0);
      const p1 = period(1);
      const p2 = period(2);
      const beforeDue = [
        upgradeRequested(earlierUpgrade),
        upgradeConfirmed(earlierUpgrade, p0),
        downgradeRequested(scenario),
      ];

      // 前置自检：先有一次已确认的升级，之后有一次尚未确认的降级
      await expectHistory("S7 前置", scenario, beforeDue);

      // E1：下周期开始，供应商仍报高档价；本地排好的低档价到期生效。
      // 这次变化属于降级请求，升级确认只能保留更早的那一条
      await deliver("S7 E1 下周期、供应商仍报高档价", scenario, {
        priceId: HIGH_PRICE,
        window: p1,
      });
      await expectSubscriptionState("S7 E1 之后", scenario, {
        priceId: LOW_PRICE,
        pendingPriceId: null,
      });
      await expectHistory("S7 E1 之后", scenario, [
        ...beforeDue,
        downgradeConfirmed(scenario, p1.start),
      ]);

      // E2：再下一周期续费，供应商这次报低档价
      await deliver("S7 E2 再下周期续费、低档价", scenario, {
        priceId: LOW_PRICE,
        window: p2,
      });
      await expectHistory("S7 E2 之后", scenario, [
        ...beforeDue,
        downgradeConfirmed(scenario, p1.start),
        renewed(p2),
      ]);
    },
    TEST_TIMEOUT_MS
  );
});
