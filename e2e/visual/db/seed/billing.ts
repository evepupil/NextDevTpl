/**
 * 种子：订阅和订阅历史
 *
 * 故事线：2026-07-01 开通 Starter 月付 -> 2026-08-01 站内升级到 Pro ->
 * 2026-09-01、2026-10-01 两次自动续费。当前订阅是 Pro 月付，状态有效，
 * 当前周期 2026-10-01 ~ 2026-11-01，没有设置周期末取消，也没有待生效的价格变更。
 *
 * 订阅状态用 "active"：src/features/subscription/services/user-plan.ts 只认
 * active / trialing / lifetime（或已取消但周期未结束），其它值会被当成免费用户。
 *
 * 升级只记一条 "upgraded"，不记 "upgrade_requested" + "upgrade_confirmed" 两条：
 * 账单页给每条历史按事件类型查文案（Settings.billing.history.events.*），
 * 而语言包里只有 created / upgraded / downgraded / cancellation_* / canceled / renewed / changed，
 * 写入请求 / 确认两种类型会触发 MISSING_MESSAGE 控制台错误，开发模式下弹出 Next 错误遮罩，
 * 页面上还会显示原始的文案路径。这是产品侧的文案缺口，种子不去触发它。
 */

import {
  subscription,
  subscriptionHistory,
} from "../../../../src/db/schema/index";
import { VISUAL_USER } from "../../constants";
import { VISUAL_PRICE_IDS, VISUAL_PROVIDER } from "../../fixtures";
import { at, type SeedTransaction } from "./types";

/** 站内升级的请求编号，同时作为这条历史的关联编号 */
const UPGRADE_REQUEST_ID = "visual_request_upgrade_pro";

export async function seedBilling(tx: SeedTransaction): Promise<void> {
  await tx.insert(subscription).values({
    cancelAtPeriodEnd: false,
    createdAt: at("2026-07-01T00:00:00.000Z"),
    currentPeriodEnd: at("2026-11-01T00:00:00.000Z"),
    currentPeriodStart: at("2026-10-01T00:00:00.000Z"),
    id: "visual_subscription",
    pendingPriceEffectiveAt: null,
    pendingPriceId: null,
    priceId: VISUAL_PRICE_IDS.proMonthly,
    status: "active",
    subscriptionId: VISUAL_PROVIDER.subscriptionId,
    updatedAt: at("2026-10-01T00:00:08.000Z"),
    userId: VISUAL_USER.id,
  });

  await tx.insert(subscriptionHistory).values([
    {
      createdAt: at("2026-07-01T00:00:06.000Z"),
      effectiveAt: at("2026-07-01T00:00:00.000Z"),
      eventType: "created",
      fromPriceId: null,
      id: "visual_history_created",
      sourceEventId: "visual_event_created_starter",
      sourceType: "webhook",
      subscriptionId: VISUAL_PROVIDER.subscriptionId,
      toPriceId: VISUAL_PRICE_IDS.starterMonthly,
      userId: VISUAL_USER.id,
    },
    {
      correlationId: UPGRADE_REQUEST_ID,
      createdAt: at("2026-08-01T00:00:09.000Z"),
      effectiveAt: at("2026-08-01T00:00:00.000Z"),
      eventType: "upgraded",
      fromPriceId: VISUAL_PRICE_IDS.starterMonthly,
      id: "visual_history_upgraded",
      metadata: {
        provider: "creem",
        updateBehavior: "proration-charge-immediately",
      },
      sourceEventId: UPGRADE_REQUEST_ID,
      sourceType: "action",
      subscriptionId: VISUAL_PROVIDER.subscriptionId,
      toPriceId: VISUAL_PRICE_IDS.proMonthly,
      userId: VISUAL_USER.id,
    },
    {
      createdAt: at("2026-09-01T00:00:07.000Z"),
      effectiveAt: at("2026-09-01T00:00:00.000Z"),
      eventType: "renewed",
      id: "visual_history_renewed_september",
      sourceEventId: "visual_event_renewed_september",
      sourceType: "webhook",
      subscriptionId: VISUAL_PROVIDER.subscriptionId,
      toPriceId: VISUAL_PRICE_IDS.proMonthly,
      userId: VISUAL_USER.id,
    },
    {
      createdAt: at("2026-10-01T00:00:08.000Z"),
      effectiveAt: at("2026-10-01T00:00:00.000Z"),
      eventType: "renewed",
      id: "visual_history_renewed_october",
      sourceEventId: "visual_event_renewed_october",
      sourceType: "webhook",
      subscriptionId: VISUAL_PROVIDER.subscriptionId,
      toPriceId: VISUAL_PRICE_IDS.proMonthly,
      userId: VISUAL_USER.id,
    },
  ]);
}
