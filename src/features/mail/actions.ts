"use server";

/**
 * 邮件系统 Server Actions
 *
 * 提供邮件相关的服务端操作接口
 */

import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { newsletterSubscriber } from "@/db/schema";
import { actionClient } from "@/lib/safe-action";

const withMailAction = (name: string) =>
  actionClient.metadata({ action: `mail.${name}` });

// ============================================
// Newsletter 订阅 Actions
// ============================================

/**
 * 订阅 Newsletter
 *
 * 公开 Action - 任何人都可以订阅
 * 如果邮箱已存在但取消订阅过，会重新激活订阅
 */
export const subscribeNewsletter = withMailAction("subscribeNewsletter")
  .schema(
    z.object({
      email: z.string().email("请输入有效的邮箱地址"),
    })
  )
  .action(async ({ parsedInput }) => {
    const { email } = parsedInput;
    const normalizedEmail = email.toLowerCase().trim();

    // 检查是否已存在
    const [existing] = await db
      .select()
      .from(newsletterSubscriber)
      .where(eq(newsletterSubscriber.email, normalizedEmail))
      .limit(1);

    if (existing) {
      // 如果已存在且已订阅，返回提示
      if (existing.isSubscribed) {
        return {
          success: true,
          message: "You are already subscribed!",
          alreadySubscribed: true,
        };
      }

      // 如果曾经取消过订阅，重新激活
      await db
        .update(newsletterSubscriber)
        .set({
          isSubscribed: true,
          subscribedAt: new Date(),
          unsubscribedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(newsletterSubscriber.id, existing.id));

      return {
        success: true,
        message: "Welcome back! Your subscription has been reactivated.",
        reactivated: true,
      };
    }

    // 创建新订阅
    await db.insert(newsletterSubscriber).values({
      id: crypto.randomUUID(),
      email: normalizedEmail,
      isSubscribed: true,
    });

    return {
      success: true,
      message: "Thank you for subscribing!",
    };
  });

/**
 * 取消订阅 Newsletter
 *
 * 公开 Action - 通过邮箱取消订阅
 * 不会删除记录，只是标记为未订阅
 */
export const unsubscribeNewsletter = withMailAction("unsubscribeNewsletter")
  .schema(
    z.object({
      email: z.string().email("请输入有效的邮箱地址"),
    })
  )
  .action(async ({ parsedInput }) => {
    const { email } = parsedInput;
    const normalizedEmail = email.toLowerCase().trim();

    // 查找订阅记录
    const [existing] = await db
      .select()
      .from(newsletterSubscriber)
      .where(eq(newsletterSubscriber.email, normalizedEmail))
      .limit(1);

    if (!existing) {
      return {
        success: false,
        message: "Email not found in our subscriber list.",
      };
    }

    if (!existing.isSubscribed) {
      return {
        success: true,
        message: "You are already unsubscribed.",
        alreadyUnsubscribed: true,
      };
    }

    // 更新为取消订阅状态
    await db
      .update(newsletterSubscriber)
      .set({
        isSubscribed: false,
        unsubscribedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(newsletterSubscriber.id, existing.id));

    return {
      success: true,
      message: "You have been unsubscribed. We're sorry to see you go!",
    };
  });

/**
 * 检查邮箱订阅状态
 */
export const checkSubscriptionStatus = withMailAction("checkSubscriptionStatus")
  .schema(
    z.object({
      email: z.string().email(),
    })
  )
  .action(async ({ parsedInput }) => {
    const { email } = parsedInput;
    const normalizedEmail = email.toLowerCase().trim();

    const [subscriber] = await db
      .select({
        isSubscribed: newsletterSubscriber.isSubscribed,
        subscribedAt: newsletterSubscriber.subscribedAt,
      })
      .from(newsletterSubscriber)
      .where(eq(newsletterSubscriber.email, normalizedEmail))
      .limit(1);

    if (!subscriber) {
      return {
        found: false,
        isSubscribed: false,
      };
    }

    return {
      found: true,
      isSubscribed: subscriber.isSubscribed,
      subscribedAt: subscriber.subscribedAt,
    };
  });
