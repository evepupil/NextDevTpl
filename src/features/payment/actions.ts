"use server";

import { and, desc, eq } from "drizzle-orm";
import { getLocale } from "next-intl/server";
import { z } from "zod";

import {
  findPlanByPriceId,
  getSafePaymentCallbackUrl,
  paymentConfig,
} from "@/config/payment";
import { db } from "@/db";
import {
  subscription,
  subscriptionCheckout,
  subscriptionHistory,
} from "@/db/schema/subscription";
import { logEvent } from "@/lib/logger";
import { protectedAction } from "@/lib/safe-action";
import { paymentService } from "@/services/payment";
import { trackServerEvent } from "@/services/telemetry";

import {
  compareSubscriptionPrices,
  type SubscriptionChangeDirection,
} from "./subscription-change";
import { recordSubscriptionHistory } from "./subscription-history";
import { PaymentType } from "./types";

const ACTIVE_SUBSCRIPTION_STATUSES = ["active", "trialing", "lifetime"];
const CHECKOUT_LOCK_TTL_MS = 30 * 60 * 1000;

function hasCurrentSubscriptionAccess(input: {
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date | null;
  status: string;
}): boolean {
  if (ACTIVE_SUBSCRIPTION_STATUSES.includes(input.status)) return true;

  return Boolean(
    (input.status === "canceled" || input.cancelAtPeriodEnd) &&
      input.currentPeriodEnd &&
      input.currentPeriodEnd > new Date()
  );
}

function getSubscriptionPriceChange(
  currentPriceId: string,
  targetPriceId: string
): {
  currentPrice: NonNullable<ReturnType<typeof findPlanByPriceId>["price"]>;
  currentPlanId: string;
  direction: SubscriptionChangeDirection;
  targetPrice: NonNullable<ReturnType<typeof findPlanByPriceId>["price"]>;
  targetPlanId: string;
} {
  const current = findPlanByPriceId(currentPriceId);
  const target = findPlanByPriceId(targetPriceId);

  if (!current.plan || !current.price) {
    throw new Error("当前订阅价格未注册");
  }
  if (!target.plan || !target.price) {
    throw new Error("目标订阅价格未注册");
  }
  if (
    current.price.type !== PaymentType.SUBSCRIPTION ||
    target.price.type !== PaymentType.SUBSCRIPTION
  ) {
    throw new Error("只能变更周期订阅计划");
  }
  if (!current.price.interval || !target.price.interval) {
    throw new Error("订阅价格缺少计费周期");
  }

  return {
    currentPrice: current.price,
    currentPlanId: current.plan.id,
    direction: compareSubscriptionPrices({
      currentAmount: current.price.amount,
      currentInterval: current.price.interval,
      currentPlanId: current.plan.id,
      targetAmount: target.price.amount,
      targetInterval: target.price.interval,
      targetPlanId: target.plan.id,
    }),
    targetPrice: target.price,
    targetPlanId: target.plan.id,
  };
}

interface SubscriptionCheckoutClaim {
  lockId: string;
  requestId: string;
}

async function claimSubscriptionCheckout(
  userId: string,
  priceId: string
): Promise<SubscriptionCheckoutClaim | { url: string }> {
  await db
    .insert(subscriptionCheckout)
    .values({
      id: crypto.randomUUID(),
      userId,
      requestId: `subscription_checkout_${crypto.randomUUID()}`,
      priceId,
      status: "idle",
      expiresAt: new Date(0),
    })
    .onConflictDoNothing();

  return db.transaction(async (tx) => {
    const [currentSubscription] = await tx
      .select({
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        currentPeriodEnd: subscription.currentPeriodEnd,
        status: subscription.status,
      })
      .from(subscription)
      .where(eq(subscription.userId, userId))
      .for("update");

    if (
      currentSubscription &&
      hasCurrentSubscriptionAccess(currentSubscription)
    ) {
      throw new Error("已有订阅，请使用计划变更功能");
    }

    const [lock] = await tx
      .select()
      .from(subscriptionCheckout)
      .where(eq(subscriptionCheckout.userId, userId))
      .for("update");

    if (!lock) {
      throw new Error("无法创建订阅 Checkout 锁");
    }

    const now = new Date();
    const isUnexpired = lock.expiresAt > now;
    if (isUnexpired && lock.status === "ready" && lock.checkoutUrl) {
      if (lock.priceId !== priceId) {
        throw new Error("已有另一个待完成的订阅 Checkout");
      }
      return { url: lock.checkoutUrl };
    }
    if (isUnexpired && lock.status === "creating") {
      throw new Error("订阅 Checkout 正在创建，请稍后重试");
    }

    const requestId = `subscription_checkout_${crypto.randomUUID()}`;
    const expiresAt = new Date(now.getTime() + CHECKOUT_LOCK_TTL_MS);
    await tx
      .update(subscriptionCheckout)
      .set({
        checkoutId: null,
        checkoutUrl: null,
        expiresAt,
        priceId,
        requestId,
        status: "creating",
        updatedAt: now,
      })
      .where(eq(subscriptionCheckout.id, lock.id));

    return { lockId: lock.id, requestId };
  });
}

async function finishSubscriptionCheckout(
  claim: SubscriptionCheckoutClaim,
  checkout: { id: string; url: string }
): Promise<void> {
  await db
    .update(subscriptionCheckout)
    .set({
      checkoutId: checkout.id,
      checkoutUrl: checkout.url,
      status: "ready",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(subscriptionCheckout.id, claim.lockId),
        eq(subscriptionCheckout.requestId, claim.requestId)
      )
    );
}

async function failSubscriptionCheckout(
  claim: SubscriptionCheckoutClaim
): Promise<void> {
  await db
    .update(subscriptionCheckout)
    .set({
      expiresAt: new Date(0),
      status: "failed",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(subscriptionCheckout.id, claim.lockId),
        eq(subscriptionCheckout.requestId, claim.requestId)
      )
    )
    .catch(() => undefined);
}

export const createCheckoutSession = protectedAction
  .metadata({ action: "payment.createCheckoutSession" })
  .schema(
    z.object({
      priceId: z.string().min(1, "价格 ID 不能为空"),
      type: z.nativeEnum(PaymentType).optional(),
      successUrl: z.string().optional(),
      cancelUrl: z.string().optional(),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { cancelUrl, priceId, successUrl, type } = parsedInput;
    const { userId } = ctx;
    const locale = (await getLocale()) as "en" | "zh";

    const { plan, price } = findPlanByPriceId(priceId);
    if (!plan || !price) {
      throw new Error("未注册的价格 ID");
    }
    const paymentType = type ?? price.type;
    if (paymentType !== price.type) {
      throw new Error("支付类型与价格配置不匹配");
    }

    let checkoutRequestId = `checkout_${crypto.randomUUID()}`;
    let checkoutClaim: SubscriptionCheckoutClaim | undefined;
    if (paymentType === PaymentType.SUBSCRIPTION) {
      const claim = await claimSubscriptionCheckout(userId, priceId);
      if ("url" in claim) return { url: claim.url };
      checkoutClaim = claim;
      checkoutRequestId = claim.requestId;
    }

    logEvent("payment.checkout.started", {
      userId,
      priceId,
      planId: plan.id,
      provider: paymentService.provider,
    });
    trackServerEvent({
      attributes: {
        checkoutType:
          paymentType === PaymentType.ONE_TIME ? "one-time" : "subscription",
        planId: plan.id,
        priceId,
        provider: paymentService.provider,
      },
      context: { identity: { userId } },
      name: "payment.checkout.started",
      source: "server",
      version: 1,
    });

    try {
      const checkout = await paymentService.createCheckout({
        productId: priceId,
        mode:
          paymentType === PaymentType.ONE_TIME ? "one-time" : "subscription",
        successUrl: getSafePaymentCallbackUrl(
          successUrl,
          `/${locale}${paymentConfig.redirectAfterCheckout}?success=true`
        ),
        cancelUrl: getSafePaymentCallbackUrl(
          cancelUrl,
          `/${locale}${paymentConfig.redirectAfterCancel}`
        ),
        requestId: checkoutRequestId,
        metadata: {
          productId: priceId,
          type: paymentType,
          userId,
          planId: plan.id,
        },
      });

      if (checkoutClaim) {
        await finishSubscriptionCheckout(checkoutClaim, checkout);
      }

      return { url: checkout.url };
    } catch (error) {
      if (checkoutClaim) {
        await failSubscriptionCheckout(checkoutClaim);
      }
      throw error;
    }
  });

export const changeSubscriptionPlan = protectedAction
  .metadata({ action: "payment.changeSubscriptionPlan" })
  .schema(z.object({ priceId: z.string().min(1, "价格 ID 不能为空") }))
  .action(async ({ parsedInput, ctx }) => {
    const { priceId } = parsedInput;
    const { userId } = ctx;

    const result = await db.transaction(async (tx) => {
      const [current] = await tx
        .select()
        .from(subscription)
        .where(eq(subscription.userId, userId))
        .for("update");

      if (!current || !hasCurrentSubscriptionAccess(current)) {
        throw new Error("当前没有可变更的有效订阅");
      }
      if (current.status === "lifetime") {
        throw new Error("终身计划不能变更为周期订阅");
      }
      if (!current.currentPeriodEnd) {
        throw new Error("当前订阅缺少周期结束时间");
      }

      const change = getSubscriptionPriceChange(current.priceId, priceId);
      if (
        change.direction === "unchanged" &&
        current.pendingPriceId !== priceId
      ) {
        throw new Error("目标计划与当前计划相同");
      }
      if (current.cancelAtPeriodEnd) {
        throw new Error("订阅已计划取消，请先恢复订阅");
      }

      if (current.pendingPriceId === priceId) {
        return {
          direction: "downgrade" as const,
          effectiveAt: current.pendingPriceEffectiveAt,
          priceId,
        };
      }

      const now = new Date();
      const providerSubscription = await paymentService.updateSubscription(
        current.subscriptionId,
        {
          productId: priceId,
          updateBehavior:
            change.direction === "upgrade"
              ? "proration-charge-immediately"
              : "proration-none",
        }
      );

      if (change.direction === "downgrade") {
        await tx
          .update(subscription)
          .set({
            currentPeriodEnd:
              providerSubscription.currentPeriodEnd ?? current.currentPeriodEnd,
            currentPeriodStart:
              providerSubscription.currentPeriodStart ??
              current.currentPeriodStart,
            pendingPriceEffectiveAt: current.currentPeriodEnd,
            pendingPriceId: priceId,
            updatedAt: now,
          })
          .where(eq(subscription.id, current.id));
      } else {
        await tx
          .update(subscription)
          .set({
            cancelAtPeriodEnd: providerSubscription.cancelAtPeriodEnd,
            currentPeriodEnd:
              providerSubscription.currentPeriodEnd ?? current.currentPeriodEnd,
            currentPeriodStart:
              providerSubscription.currentPeriodStart ??
              current.currentPeriodStart,
            pendingPriceEffectiveAt: null,
            pendingPriceId: null,
            priceId,
            status: providerSubscription.status,
            updatedAt: now,
          })
          .where(eq(subscription.id, current.id));
      }

      await recordSubscriptionHistory(tx, {
        effectiveAt:
          change.direction === "upgrade" ? now : current.currentPeriodEnd,
        eventType: change.direction === "upgrade" ? "upgraded" : "downgraded",
        fromPriceId: current.priceId,
        metadata: {
          provider: paymentService.provider,
          updateBehavior:
            change.direction === "upgrade"
              ? "proration-charge-immediately"
              : "proration-none",
        },
        subscriptionId: current.subscriptionId,
        toPriceId: priceId,
        userId,
      });

      return {
        direction: change.direction,
        effectiveAt:
          change.direction === "upgrade" ? now : current.currentPeriodEnd,
        priceId,
      };
    });

    logEvent("payment.subscription.plan_changed", {
      direction: result.direction,
      effectiveAt: result.effectiveAt?.toISOString(),
      priceId: result.priceId,
      provider: paymentService.provider,
      userId,
    });
    return {
      direction: result.direction,
      effectiveAt: result.effectiveAt?.toISOString() ?? null,
      priceId: result.priceId,
      success: true,
    };
  });

export const cancelSubscription = protectedAction
  .metadata({ action: "payment.cancelSubscription" })
  .action(async ({ ctx }) => {
    const { userId } = ctx;

    const result = await db.transaction(async (tx) => {
      const [current] = await tx
        .select()
        .from(subscription)
        .where(eq(subscription.userId, userId))
        .for("update");

      if (!current?.subscriptionId || !current.currentPeriodEnd) {
        throw new Error("您还没有可以取消的周期订阅");
      }
      if (current.status === "lifetime") {
        throw new Error("终身计划不能取消");
      }
      if (current.cancelAtPeriodEnd) {
        return {
          periodEnd: current.currentPeriodEnd,
          subscriptionId: current.subscriptionId,
        };
      }

      await paymentService.cancelSubscription(current.subscriptionId, {
        mode: "scheduled",
      });

      await tx
        .update(subscription)
        .set({
          cancelAtPeriodEnd: true,
          pendingPriceEffectiveAt: null,
          pendingPriceId: null,
          status: current.status === "canceled" ? "active" : current.status,
          updatedAt: new Date(),
        })
        .where(eq(subscription.id, current.id));

      await recordSubscriptionHistory(tx, {
        effectiveAt: current.currentPeriodEnd,
        eventType: "cancellation_requested",
        fromPriceId: current.priceId,
        subscriptionId: current.subscriptionId,
        userId,
      });

      return {
        periodEnd: current.currentPeriodEnd,
        subscriptionId: current.subscriptionId,
      };
    });

    logEvent("payment.subscription.cancel_requested", {
      userId,
      subscriptionId: result.subscriptionId,
      periodEnd: result.periodEnd.toISOString(),
    });
    trackServerEvent({
      attributes: {
        periodEnd: result.periodEnd.toISOString(),
        provider: paymentService.provider,
        subscriptionId: result.subscriptionId,
      },
      context: { identity: { userId } },
      name: "payment.subscription.cancel_requested",
      source: "server",
      version: 1,
    });

    return { periodEnd: result.periodEnd.toISOString(), success: true };
  });

export const resumeSubscription = protectedAction
  .metadata({ action: "payment.resumeSubscription" })
  .action(async ({ ctx }) => {
    const { userId } = ctx;

    const result = await db.transaction(async (tx) => {
      const [current] = await tx
        .select()
        .from(subscription)
        .where(eq(subscription.userId, userId))
        .for("update");

      if (!current?.subscriptionId || !current.currentPeriodEnd) {
        throw new Error("当前没有可以恢复的订阅");
      }
      if (!current.cancelAtPeriodEnd && current.status !== "canceled") {
        return {
          periodEnd: current.currentPeriodEnd,
          subscriptionId: current.subscriptionId,
        };
      }
      if (current.currentPeriodEnd <= new Date()) {
        throw new Error("当前订阅周期已经结束，无法恢复");
      }

      const providerSubscription = await paymentService.resumeSubscription(
        current.subscriptionId
      );
      await tx
        .update(subscription)
        .set({
          cancelAtPeriodEnd: false,
          currentPeriodEnd:
            providerSubscription.currentPeriodEnd ?? current.currentPeriodEnd,
          currentPeriodStart:
            providerSubscription.currentPeriodStart ??
            current.currentPeriodStart,
          status: providerSubscription.status,
          updatedAt: new Date(),
        })
        .where(eq(subscription.id, current.id));

      await recordSubscriptionHistory(tx, {
        effectiveAt: new Date(),
        eventType: "cancellation_resumed",
        fromPriceId: current.priceId,
        subscriptionId: current.subscriptionId,
        userId,
      });

      return {
        periodEnd:
          providerSubscription.currentPeriodEnd ?? current.currentPeriodEnd,
        subscriptionId: current.subscriptionId,
      };
    });

    logEvent("payment.subscription.resumed", {
      periodEnd: result.periodEnd.toISOString(),
      provider: paymentService.provider,
      subscriptionId: result.subscriptionId,
      userId,
    });
    return { periodEnd: result.periodEnd.toISOString(), success: true };
  });

export const getUserSubscription = protectedAction
  .metadata({ action: "payment.getUserSubscription" })
  .action(async ({ ctx }) => {
    const { userId } = ctx;
    const [userSubscription] = await db
      .select()
      .from(subscription)
      .where(eq(subscription.userId, userId))
      .limit(1);

    if (!userSubscription) {
      return { subscription: null };
    }

    const isActive = hasCurrentSubscriptionAccess(userSubscription);
    const isTrialing = userSubscription.status === "trialing";

    return {
      subscription: {
        id: userSubscription.id,
        status: userSubscription.status,
        priceId: userSubscription.priceId,
        pendingPriceId: userSubscription.pendingPriceId,
        pendingPriceEffectiveAt: userSubscription.pendingPriceEffectiveAt,
        currentPeriodStart: userSubscription.currentPeriodStart,
        currentPeriodEnd: userSubscription.currentPeriodEnd,
        cancelAtPeriodEnd: userSubscription.cancelAtPeriodEnd,
        isActive,
        isTrialing,
      },
    };
  });

export const getSubscriptionHistory = protectedAction
  .metadata({ action: "payment.getSubscriptionHistory" })
  .action(async ({ ctx }) => {
    const history = await db
      .select()
      .from(subscriptionHistory)
      .where(eq(subscriptionHistory.userId, ctx.userId))
      .orderBy(desc(subscriptionHistory.createdAt))
      .limit(50);

    return {
      history: history.map((item) => ({
        id: item.id,
        eventType: item.eventType,
        fromPriceId: item.fromPriceId,
        toPriceId: item.toPriceId,
        effectiveAt: item.effectiveAt.toISOString(),
        createdAt: item.createdAt.toISOString(),
      })),
    };
  });

export const hasActiveSubscription = protectedAction
  .metadata({ action: "payment.hasActiveSubscription" })
  .action(async ({ ctx }) => {
    const { userId } = ctx;
    const [userSubscription] = await db
      .select({
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        currentPeriodEnd: subscription.currentPeriodEnd,
        status: subscription.status,
      })
      .from(subscription)
      .where(eq(subscription.userId, userId))
      .limit(1);

    if (!userSubscription) {
      return { hasSubscription: false, status: null };
    }

    return {
      hasSubscription: hasCurrentSubscriptionAccess(userSubscription),
      status: userSubscription.status,
    };
  });
