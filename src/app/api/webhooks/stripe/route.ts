import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { db } from "@/db";
import { subscription } from "@/db/schema";
import { stripe } from "@/payment/stripe";

/**
 * Stripe Webhook 处理器
 *
 * 处理来自 Stripe 的事件通知
 * 用于同步订阅状态到数据库
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
      case "checkout.session.completed": {
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session
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

/**
 * 处理 Checkout Session 完成事件
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
