import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { CREDITS_EXPIRY_DAYS } from "@/features/credits/config";
import { grantCredits } from "@/features/credits/core";
import { db } from "@/db";
import { subscription } from "@/db/schema";
import { PaymentType } from "@/features/payment/types";
import { stripe } from "@/features/payment/stripe";

/**
 * Stripe Webhook 处理器
 *
 * 处理来自 Stripe 的事件通知
 * 支持订阅支付和一次性支付
 */
export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    // 验证 Webhook 签名
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET ?? ""
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error(`Webhook signature verification failed: ${errorMessage}`);
    return NextResponse.json(
      { error: `Webhook Error: ${errorMessage}` },
      { status: 400 }
    );
  }

  try {
    // 处理不同类型的事件
    switch (event.type) {
      // ============================================
      // Checkout 完成事件
      // ============================================
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const paymentType = session.metadata?.paymentType;
        const purchaseType = session.metadata?.type;

        // 检查是否为积分购买
        if (purchaseType === "credit_purchase") {
          await handleCreditPurchaseCompleted(session);
        } else if (paymentType === PaymentType.ONE_TIME) {
          // 一次性支付（Lifetime 计划）
          await handleOneTimePaymentCompleted(session);
        } else {
          // 订阅支付
          await handleCheckoutSessionCompleted(session);
        }
        break;
      }

      // ============================================
      // 订阅相关事件
      // ============================================
      case "customer.subscription.created": {
        await handleSubscriptionCreated(
          event.data.object as Stripe.Subscription
        );
        break;
      }

      case "invoice.payment_succeeded": {
        await handleInvoicePaymentSucceeded(
          event.data.object as Stripe.Invoice
        );
        break;
      }

      case "customer.subscription.updated": {
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        );
        break;
      }

      case "customer.subscription.deleted": {
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

// ============================================
// 一次性支付处理
// ============================================

/**
 * 处理一次性支付完成事件（Lifetime 计划）
 *
 * 创建一个永久有效的订阅记录
 */
async function handleOneTimePaymentCompleted(
  session: Stripe.Checkout.Session
) {
  const userId = session.metadata?.userId;
  const planId = session.metadata?.planId;

  if (!userId) {
    console.error("Missing userId in checkout session metadata");
    return;
  }

  // 获取支付信息
  const paymentIntentId = session.payment_intent as string;

  // 检查是否已存在订阅记录
  const [existingSubscription] = await db
    .select()
    .from(subscription)
    .where(eq(subscription.userId, userId))
    .limit(1);

  if (existingSubscription) {
    // 更新现有记录为 Lifetime
    await db
      .update(subscription)
      .set({
        stripeSubscriptionId: `lifetime_${paymentIntentId}`,
        stripePriceId: planId ?? "lifetime",
        status: "lifetime",
        currentPeriodStart: new Date(),
        currentPeriodEnd: null, // Lifetime 没有结束时间
        cancelAtPeriodEnd: false,
        updatedAt: new Date(),
      })
      .where(eq(subscription.userId, userId));
  } else {
    // 创建新的 Lifetime 记录
    await db.insert(subscription).values({
      id: crypto.randomUUID(),
      userId,
      stripeSubscriptionId: `lifetime_${paymentIntentId}`,
      stripePriceId: planId ?? "lifetime",
      status: "lifetime",
      currentPeriodStart: new Date(),
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    });
  }

  console.log(`Lifetime plan activated for user ${userId}`);
}

// ============================================
// 订阅支付处理
// ============================================

/**
 * 处理 Checkout Session 完成事件（订阅）
 *
 * 当用户完成支付后，创建或更新订阅记录
 */
async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  const userId = session.metadata?.userId;
  const subscriptionId = session.subscription as string;

  if (!userId || !subscriptionId) {
    console.error("Missing userId or subscriptionId in checkout session");
    return;
  }

  // 获取订阅详情
  const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = stripeSubscription.items.data[0]?.price.id;

  if (!priceId) {
    console.error("Missing priceId in subscription");
    return;
  }

  // 检查是否已存在订阅记录
  const [existingSubscription] = await db
    .select()
    .from(subscription)
    .where(eq(subscription.userId, userId))
    .limit(1);

  // 获取订阅周期时间
  const currentPeriodStart = stripeSubscription.items.data[0]?.current_period_start;
  const currentPeriodEnd = stripeSubscription.items.data[0]?.current_period_end;

  if (existingSubscription) {
    // 更新现有订阅
    await db
      .update(subscription)
      .set({
        stripeSubscriptionId: subscriptionId,
        stripePriceId: priceId,
        status: stripeSubscription.status,
        currentPeriodStart: currentPeriodStart ? new Date(currentPeriodStart * 1000) : null,
        currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : null,
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        updatedAt: new Date(),
      })
      .where(eq(subscription.userId, userId));
  } else {
    // 创建新订阅记录
    await db.insert(subscription).values({
      id: crypto.randomUUID(),
      userId,
      stripeSubscriptionId: subscriptionId,
      stripePriceId: priceId,
      status: stripeSubscription.status,
      currentPeriodStart: currentPeriodStart ? new Date(currentPeriodStart * 1000) : null,
      currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : null,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    });
  }

  console.log(`Subscription created/updated for user ${userId}`);
}

/**
 * 处理订阅创建事件
 *
 * 当订阅首次创建时触发（包括试用期开始）
 */
async function handleSubscriptionCreated(stripeSubscription: Stripe.Subscription) {
  const userId = stripeSubscription.metadata?.userId;

  if (!userId) {
    console.log("No userId in subscription metadata, skipping...");
    return;
  }

  const priceId = stripeSubscription.items.data[0]?.price.id;
  const currentPeriodStart = stripeSubscription.items.data[0]?.current_period_start;
  const currentPeriodEnd = stripeSubscription.items.data[0]?.current_period_end;

  // 检查是否已存在订阅记录
  const [existingSubscription] = await db
    .select()
    .from(subscription)
    .where(eq(subscription.userId, userId))
    .limit(1);

  if (!existingSubscription) {
    // 创建新订阅记录
    await db.insert(subscription).values({
      id: crypto.randomUUID(),
      userId,
      stripeSubscriptionId: stripeSubscription.id,
      stripePriceId: priceId ?? "",
      status: stripeSubscription.status,
      currentPeriodStart: currentPeriodStart ? new Date(currentPeriodStart * 1000) : null,
      currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : null,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    });

    console.log(`Subscription created for user ${userId}`);
  }
}

/**
 * 处理发票支付成功事件
 *
 * 更新订阅的当前计费周期
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  // 从 parent.subscription_details 获取 subscription ID
  const subscriptionDetails = invoice.parent?.subscription_details;
  const subscriptionId = typeof subscriptionDetails?.subscription === "string"
    ? subscriptionDetails.subscription
    : subscriptionDetails?.subscription?.id;

  if (!subscriptionId) {
    return;
  }

  // 获取订阅详情
  const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);

  // 获取订阅周期时间
  const currentPeriodStart = stripeSubscription.items.data[0]?.current_period_start;
  const currentPeriodEnd = stripeSubscription.items.data[0]?.current_period_end;

  // 更新订阅周期
  await db
    .update(subscription)
    .set({
      currentPeriodStart: currentPeriodStart ? new Date(currentPeriodStart * 1000) : null,
      currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : null,
      status: stripeSubscription.status,
      updatedAt: new Date(),
    })
    .where(eq(subscription.stripeSubscriptionId, subscriptionId));

  console.log(`Subscription period updated for ${subscriptionId}`);
}

/**
 * 处理订阅更新事件
 *
 * 同步订阅状态变更（升级、降级、取消等）
 */
async function handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription) {
  const priceId = stripeSubscription.items.data[0]?.price.id;

  // 获取订阅周期时间
  const currentPeriodStart = stripeSubscription.items.data[0]?.current_period_start;
  const currentPeriodEnd = stripeSubscription.items.data[0]?.current_period_end;

  await db
    .update(subscription)
    .set({
      stripePriceId: priceId,
      status: stripeSubscription.status,
      currentPeriodStart: currentPeriodStart ? new Date(currentPeriodStart * 1000) : null,
      currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : null,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      updatedAt: new Date(),
    })
    .where(eq(subscription.stripeSubscriptionId, stripeSubscription.id));

  console.log(`Subscription updated: ${stripeSubscription.id}`);
}

/**
 * 处理订阅删除事件
 *
 * 将订阅状态标记为已取消
 */
async function handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription) {
  await db
    .update(subscription)
    .set({
      status: "canceled",
      updatedAt: new Date(),
    })
    .where(eq(subscription.stripeSubscriptionId, stripeSubscription.id));

  console.log(`Subscription canceled: ${stripeSubscription.id}`);
}

// ============================================
// 积分购买处理
// ============================================

/**
 * 处理积分购买完成事件
 *
 * 从 metadata 中获取积分数量并发放给用户
 */
async function handleCreditPurchaseCompleted(
  session: Stripe.Checkout.Session
) {
  const userId = session.metadata?.userId;
  const creditsStr = session.metadata?.credits;
  const packageId = session.metadata?.packageId;

  if (!userId || !creditsStr) {
    console.error("Missing userId or credits in credit purchase session metadata");
    return;
  }

  const credits = parseInt(creditsStr, 10);
  if (isNaN(credits) || credits <= 0) {
    console.error("Invalid credits value in session metadata:", creditsStr);
    return;
  }

  // 计算过期时间
  const expiresAt = CREDITS_EXPIRY_DAYS
    ? new Date(Date.now() + CREDITS_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
    : null;

  // 发放积分
  try {
    const result = await grantCredits({
      userId,
      amount: credits,
      sourceType: "purchase",
      debitAccount: `PAYMENT:${session.id}`,
      transactionType: "purchase",
      expiresAt,
      sourceRef: session.id,
      description: `购买 ${credits} 积分 (${packageId ?? "custom"})`,
      metadata: {
        sessionId: session.id,
        packageId,
        paymentIntent: session.payment_intent,
      },
    });

    console.log(`Credits purchased for user ${userId}: ${credits} credits, batch ${result.batchId}`);
  } catch (error) {
    console.error("Failed to grant credits:", error);
    throw error; // 让 Webhook 返回错误，Stripe 会重试
  }
}
