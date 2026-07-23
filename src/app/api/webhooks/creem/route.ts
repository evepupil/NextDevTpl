import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { SUBSCRIPTION_MONTHLY_CREDITS } from "@/config/payment";
import { getPlanFromPriceId } from "@/config/subscription-plan";
import type {
  PaymentCheckout,
  PaymentSubscription,
  PaymentWebhookEvent,
} from "@/core/services";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { creditsBatch } from "@/db/schema/credits";
import { subscription } from "@/db/schema/subscription";
import { CREDITS_EXPIRY_DAYS, grantCredits } from "@/features/credits";
import { withApiLogging } from "@/lib/api-logger";
import { logError, logEvent, logWarn } from "@/lib/logger";
import { paymentService } from "@/services/payment";

export const POST = withApiLogging(async (request: Request) => {
  const payload = await request.text();
  const signature = (await headers()).get("creem-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing payment signature header" },
      { status: 400 }
    );
  }

  let event: PaymentWebhookEvent;
  try {
    event = await paymentService.verifyWebhook({ payload, signature });
  } catch (error) {
    logError(error, { source: "payment-webhook", stage: "signature" });
    return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
  }

  try {
    await handlePaymentEvent(event);
    return NextResponse.json({ received: true });
  } catch (error) {
    logError(error, { source: "payment-webhook", stage: "handler" });
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
});

async function handlePaymentEvent(event: PaymentWebhookEvent): Promise<void> {
  switch (event.type) {
    case "checkout.completed":
      if (event.checkout) {
        await handleCheckoutCompleted(event.checkout);
      }
      return;
    case "subscription.active":
      if (event.subscription) {
        await handleSubscriptionActive(event.subscription);
      }
      return;
    case "subscription.paid":
    case "subscription.renewed":
      if (event.subscription) {
        await handleSubscriptionRenewed(event.subscription);
      }
      return;
    case "subscription.canceled":
    case "subscription.expired":
      if (event.subscription) {
        await handleSubscriptionCanceled(event.subscription);
      }
      return;
    case "subscription.past_due":
      if (event.subscription) {
        await updateSubscriptionState(event.subscription, "past_due");
      }
      return;
    case "subscription.paused":
      if (event.subscription) {
        await updateSubscriptionState(event.subscription, "paused");
      }
      return;
  }
}

async function handleCheckoutCompleted(data: PaymentCheckout): Promise<void> {
  const userId = data.metadata.userId;
  if (!userId) {
    logError("Missing userId in checkout metadata");
    return;
  }

  await db
    .update(user)
    .set({ customerId: data.customer.id })
    .where(eq(user.id, userId));

  if (data.subscription) {
    await createOrUpdateSubscription(userId, data.subscription);
  }

  logEvent("payment.checkout.completed", {
    userId,
    customerId: data.customer.id,
    productId: data.productId,
    subscriptionId: data.subscription?.id,
    checkoutType: data.metadata.type ?? data.mode,
    provider: paymentService.provider,
  });
}

async function handleSubscriptionActive(
  externalSubscription: PaymentSubscription
): Promise<void> {
  const metadataUserId = externalSubscription.metadata.userId;
  const userId =
    metadataUserId ?? (await findSubscriptionUserId(externalSubscription.id));

  if (!userId) {
    logError("Cannot find userId for subscription", {
      subscriptionId: externalSubscription.id,
    });
    return;
  }

  if (metadataUserId) {
    await createOrUpdateSubscription(userId, externalSubscription);
  } else {
    await updateSubscription(externalSubscription);
  }

  await grantSubscriptionCredits(
    userId,
    externalSubscription,
    "subscription_create"
  );
  logEvent("payment.subscription.created", {
    userId,
    subscriptionId: externalSubscription.id,
    priceId: externalSubscription.productId,
    status: externalSubscription.status,
    provider: paymentService.provider,
  });
}

async function handleSubscriptionRenewed(
  externalSubscription: PaymentSubscription
): Promise<void> {
  await updateSubscription(externalSubscription);
  const userId = await findSubscriptionUserId(externalSubscription.id);

  if (!userId) {
    logError("Subscription not found for renewal", {
      subscriptionId: externalSubscription.id,
    });
    return;
  }

  await grantSubscriptionCredits(
    userId,
    externalSubscription,
    "subscription_cycle"
  );
}

async function handleSubscriptionCanceled(
  externalSubscription: PaymentSubscription
): Promise<void> {
  const periodEnd = externalSubscription.currentPeriodEnd;
  const isStillInPeriod = periodEnd !== null && periodEnd > new Date();

  await db
    .update(subscription)
    .set({
      status: isStillInPeriod ? "active" : "canceled",
      cancelAtPeriodEnd: isStillInPeriod,
      ...(periodEnd ? { currentPeriodEnd: periodEnd } : {}),
      updatedAt: new Date(),
    })
    .where(eq(subscription.subscriptionId, externalSubscription.id));

  logEvent("payment.subscription.canceled", {
    userId: await findSubscriptionUserId(externalSubscription.id),
    subscriptionId: externalSubscription.id,
    cancelAtPeriodEnd: isStillInPeriod,
    periodEnd: periodEnd?.toISOString(),
    provider: paymentService.provider,
  });
}

async function updateSubscriptionState(
  externalSubscription: PaymentSubscription,
  status: "past_due" | "paused"
): Promise<void> {
  await db
    .update(subscription)
    .set({ status, updatedAt: new Date() })
    .where(eq(subscription.subscriptionId, externalSubscription.id));

  logEvent(`payment.subscription.${status}`, {
    subscriptionId: externalSubscription.id,
    provider: paymentService.provider,
  });
}

async function findSubscriptionUserId(
  subscriptionId: string
): Promise<string | undefined> {
  const [existing] = await db
    .select({ userId: subscription.userId })
    .from(subscription)
    .where(eq(subscription.subscriptionId, subscriptionId))
    .limit(1);
  return existing?.userId;
}

async function createOrUpdateSubscription(
  userId: string,
  externalSubscription: PaymentSubscription
): Promise<void> {
  const [existing] = await db
    .select({ id: subscription.id })
    .from(subscription)
    .where(eq(subscription.userId, userId))
    .limit(1);
  const data = subscriptionValues(externalSubscription);

  if (existing) {
    await db
      .update(subscription)
      .set(data)
      .where(eq(subscription.userId, userId));
  } else {
    await db.insert(subscription).values({
      id: crypto.randomUUID(),
      userId,
      ...data,
    });
  }

  logEvent("payment.subscription.upserted", {
    userId,
    provider: paymentService.provider,
  });
}

function subscriptionValues(externalSubscription: PaymentSubscription) {
  return {
    subscriptionId: externalSubscription.id,
    priceId: externalSubscription.productId,
    status: externalSubscription.status,
    currentPeriodStart: externalSubscription.currentPeriodStart,
    currentPeriodEnd: externalSubscription.currentPeriodEnd,
    cancelAtPeriodEnd: externalSubscription.cancelAtPeriodEnd,
    updatedAt: new Date(),
  };
}

async function updateSubscription(
  externalSubscription: PaymentSubscription
): Promise<void> {
  await db
    .update(subscription)
    .set(subscriptionValues(externalSubscription))
    .where(eq(subscription.subscriptionId, externalSubscription.id));
}

async function grantSubscriptionCredits(
  userId: string,
  externalSubscription: PaymentSubscription,
  billingReason: "subscription_create" | "subscription_cycle"
): Promise<void> {
  const { currentPeriodStart, currentPeriodEnd, productId, id } =
    externalSubscription;
  if (!currentPeriodStart || !currentPeriodEnd) {
    logWarn("Subscription period is incomplete", { subscriptionId: id });
    return;
  }

  const planType = getPlanFromPriceId(productId);
  if (!planType) {
    logError("Unknown priceId", { priceId: productId });
    return;
  }

  const periodKey = `${id}:${currentPeriodStart.toISOString()}`;
  const [existingBatch] = await db
    .select({ id: creditsBatch.id })
    .from(creditsBatch)
    .where(
      and(
        eq(creditsBatch.sourceRef, periodKey),
        eq(creditsBatch.sourceType, "subscription")
      )
    )
    .limit(1);

  if (existingBatch) {
    logEvent("payment.credits.already_granted", { periodKey });
    return;
  }

  const monthlyCredits =
    SUBSCRIPTION_MONTHLY_CREDITS[
      planType as keyof typeof SUBSCRIPTION_MONTHLY_CREDITS
    ];
  if (!monthlyCredits) {
    logWarn("No monthly credits configured for plan", { planType });
    return;
  }

  const periodDays = Math.round(
    (currentPeriodEnd.getTime() - currentPeriodStart.getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const isYearly = periodDays > 60;
  const amount = isYearly ? monthlyCredits * 12 : monthlyCredits;
  const expiresAt = CREDITS_EXPIRY_DAYS
    ? new Date(Date.now() + CREDITS_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
    : null;

  try {
    const result = await grantCredits({
      userId,
      amount,
      sourceType: "subscription",
      debitAccount: `SUBSCRIPTION:${id}`,
      transactionType: "monthly_grant",
      expiresAt,
      sourceRef: periodKey,
      description: isYearly
        ? `${planType} 年度订阅积分 (${monthlyCredits} × 12)`
        : `${planType} 月度订阅积分`,
      metadata: {
        subscriptionId: id,
        priceId: productId,
        planType,
        billingReason,
        interval: isYearly ? "year" : "month",
        periodStart: currentPeriodStart.toISOString(),
        periodEnd: currentPeriodEnd.toISOString(),
      },
    });

    logEvent("payment.credits.grant_success", {
      userId,
      credits: amount,
      planType,
      batchId: result.batchId,
    });
  } catch (error) {
    logError("Failed to grant subscription credits", {
      error: String(error),
      userId,
    });
  }
}
