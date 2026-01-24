"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { subscription, user } from "@/db/schema";
import { protectedAction } from "@/lib/safe-action";

import { getBaseUrl } from "./config";
import { stripe } from "./stripe";

/**
 * 创建 Stripe Checkout Session
 *
 * 用于用户订阅新计划
 * 如果用户没有 Stripe Customer ID，会先创建一个
 */
export const createCheckoutSession = protectedAction
  .schema(
    z.object({
      priceId: z.string().min(1, "价格 ID 不能为空"),
    })
  )
  .action(async ({ parsedInput: { priceId }, ctx }) => {
    const { userId, user: currentUser } = ctx;

    // 查询用户的 Stripe Customer ID
    const [dbUser] = await db
      .select({ stripeCustomerId: user.stripeCustomerId })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    let stripeCustomerId = dbUser?.stripeCustomerId;

    // 如果用户没有 Stripe Customer ID，创建一个
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: currentUser.email,
        name: currentUser.name,
        metadata: {
          userId,
        },
      });

      stripeCustomerId = customer.id;

      // 保存 Stripe Customer ID 到数据库
      await db
        .update(user)
        .set({ stripeCustomerId })
        .where(eq(user.id, userId));
    }

    // 创建 Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${getBaseUrl()}/dashboard?success=true`,
      cancel_url: `${getBaseUrl()}/pricing?canceled=true`,
      metadata: {
        userId,
      },
    });

    return { url: session.url };
  });

/**
 * 创建 Stripe Customer Portal Session
 *
 * 用于用户管理现有订阅（升级、降级、取消等）
 */
export const createCustomerPortal = protectedAction.action(
  async ({ ctx }) => {
    const { userId } = ctx;

    // 查询用户的 Stripe Customer ID
    const [dbUser] = await db
      .select({ stripeCustomerId: user.stripeCustomerId })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!dbUser?.stripeCustomerId) {
      throw new Error("您还没有订阅任何计划");
    }

    // 创建 Customer Portal Session
    const session = await stripe.billingPortal.sessions.create({
      customer: dbUser.stripeCustomerId,
      return_url: `${getBaseUrl()}/dashboard`,
    });

    return { url: session.url };
  }
);

/**
 * 获取用户当前订阅状态
 *
 * 用于在前端显示用户的订阅信息
 */
export const getUserSubscription = protectedAction.action(
  async ({ ctx }) => {
    const { userId } = ctx;

    // 查询用户的订阅信息
    const [userSubscription] = await db
      .select()
      .from(subscription)
      .where(eq(subscription.userId, userId))
      .limit(1);

    if (!userSubscription) {
      return { subscription: null };
    }

    return {
      subscription: {
        id: userSubscription.id,
        status: userSubscription.status,
        priceId: userSubscription.stripePriceId,
        currentPeriodEnd: userSubscription.currentPeriodEnd,
        cancelAtPeriodEnd: userSubscription.cancelAtPeriodEnd,
      },
    };
  }
);
