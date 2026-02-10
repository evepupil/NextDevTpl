"use server";

/**
 * 获取当前用户订阅计划 Action
 */

import { getUserPlan } from "@/features/subscription/services/user-plan";
import { protectedAction } from "@/lib/safe-action";

/**
 * 获取当前用户的订阅计划
 */
export const getMyPlanAction = protectedAction
  .metadata({ action: "subscription.getMyPlan" })
  .action(async ({ ctx }) => {
    const userPlan = await getUserPlan(ctx.userId);

    return {
      plan: userPlan.plan,
      planName: userPlan.planName,
      hasActiveSubscription: userPlan.hasActiveSubscription,
      currentPeriodEnd: userPlan.currentPeriodEnd?.toISOString() ?? null,
      priceId: userPlan.priceId,
      cancelAtPeriodEnd: userPlan.cancelAtPeriodEnd,
    };
  });
