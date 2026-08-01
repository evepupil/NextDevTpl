import { and, eq, lt } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import {
  findPlanByPriceId,
  SUBSCRIPTION_MONTHLY_CREDITS,
} from "@/config/payment";
import { getPlanFromPriceId } from "@/config/subscription-plan";
import type {
  PaymentCheckout,
  PaymentSubscription,
  PaymentWebhookEvent,
} from "@/core/services";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { creditsBatch } from "@/db/schema/credits";
import { paymentWebhookEvent } from "@/db/schema/payment";
import { subscription } from "@/db/schema/subscription";
import {
  CREDIT_PACKAGES,
  CREDITS_EXPIRY_DAYS,
  grantCredits,
} from "@/features/credits";
import {
  isStaleSubscriptionEvent,
  PlanInterval,
  recordRevenueEvent,
} from "@/features/payment";
import { withApiLogging } from "@/lib/api-logger";
import { logError, logEvent, logWarn } from "@/lib/logger";
import { paymentService } from "@/services/payment";
import { trackServerEvent } from "@/services/telemetry";

export const POST = withApiLogging(async (request: Request) => {
  const payload = await request.text();
  const requestHeaders = await headers();
  const signature =
    requestHeaders.get("creem-signature") ??
    requestHeaders.get("stripe-signature");

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
    const claimed = await claimWebhookEvent(event);
    if (!claimed) {
      return NextResponse.json({ received: true, duplicate: true });
    }
    await handlePaymentEvent(event);
    await db
      .update(paymentWebhookEvent)
      .set({
        status: "processed",
        processedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(paymentWebhookEvent.id, event.id));
    return NextResponse.json({ received: true });
  } catch (error) {
    await db
      .delete(paymentWebhookEvent)
      .where(eq(paymentWebhookEvent.id, event.id))
      .catch(() => undefined);
    logError(error, { source: "payment-webhook", stage: "handler" });
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
});

async function claimWebhookEvent(event: PaymentWebhookEvent): Promise<boolean> {
  const [inserted] = await db
    .insert(paymentWebhookEvent)
    .values({ id: event.id, type: event.type })
    .onConflictDoNothing()
    .returning({ id: paymentWebhookEvent.id });
  if (inserted) return true;

  const staleBefore = new Date(Date.now() - 10 * 60 * 1000);
  const [reclaimed] = await db
    .update(paymentWebhookEvent)
    .set({ status: "processing", updatedAt: new Date() })
    .where(
      and(
        eq(paymentWebhookEvent.id, event.id),
        eq(paymentWebhookEvent.status, "processing"),
        lt(paymentWebhookEvent.updatedAt, staleBefore)
      )
    )
    .returning({ id: paymentWebhookEvent.id });
  return Boolean(reclaimed);
}

async function handlePaymentEvent(event: PaymentWebhookEvent): Promise<void> {
  switch (event.type) {
    case "checkout.completed":
      if (event.checkout) {
        await handleCheckoutCompleted(
          event.checkout,
          event.id,
          event.createdAt
        );
      }
      return;
    case "subscription.active":
      if (event.subscription) {
        await handleSubscriptionActive(
          event.subscription,
          event.id,
          event.createdAt
        );
      }
      return;
    case "subscription.paid":
    case "subscription.renewed":
      if (event.subscription) {
        await handleSubscriptionRenewed(
          event.subscription,
          event.id,
          event.createdAt
        );
      }
      return;
    case "subscription.canceled":
    case "subscription.expired":
      if (event.subscription) {
        await handleSubscriptionCanceled(
          event.subscription,
          event.id,
          event.createdAt
        );
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
    case "payment.failed":
      await recordRevenueEvent({
        externalEventId: event.id,
        kind: "payment_failed",
        occurredAt: event.createdAt,
        provider: paymentService.provider,
        ...(event.payment?.amountMinor !== undefined
          ? { amountMinor: event.payment.amountMinor }
          : {}),
        ...(event.payment?.currency
          ? { currency: event.payment.currency }
          : {}),
        ...(event.payment?.subscriptionId
          ? { subscriptionId: event.payment.subscriptionId }
          : {}),
        ...((event.payment?.userId ?? event.payment?.metadata.userId)
          ? { userId: event.payment?.userId ?? event.payment?.metadata.userId }
          : {}),
      });
      return;
    case "payment.refunded":
      await recordRevenueEvent({
        externalEventId: event.id,
        kind: "refund",
        occurredAt: event.createdAt,
        provider: paymentService.provider,
        ...(event.payment?.amountMinor !== undefined
          ? { amountMinor: event.payment.amountMinor }
          : {}),
        ...(event.payment?.currency
          ? { currency: event.payment.currency }
          : {}),
        ...(event.payment?.subscriptionId
          ? { subscriptionId: event.payment.subscriptionId }
          : {}),
        ...((event.payment?.userId ?? event.payment?.metadata.userId)
          ? { userId: event.payment?.userId ?? event.payment?.metadata.userId }
          : {}),
      });
      return;
  }
}

async function handleCheckoutCompleted(
  data: PaymentCheckout,
  eventId: string,
  occurredAt: Date
): Promise<void> {
  const userId = data.metadata.userId;
  if (!userId) {
    throw new Error("Missing userId in checkout metadata");
  }

  if (data.customer.id) {
    await db
      .update(user)
      .set({ customerId: data.customer.id })
      .where(eq(user.id, userId));
  }

  if (data.subscription) {
    const applied = await createOrUpdateSubscription(userId, data.subscription);
    if (applied && ["active", "trialing"].includes(data.subscription.status)) {
      await grantSubscriptionCredits(
        userId,
        data.subscription,
        "subscription_create"
      );
    }
  } else if (data.mode === "one-time") {
    await handleOneTimeCheckoutCompleted(data, eventId);
  }

  const configuredAmount = getConfiguredCheckoutAmount(data);
  await recordRevenueEvent({
    externalEventId: data.subscription
      ? subscriptionRevenueEventId(data.subscription, eventId)
      : eventId,
    kind: "payment_succeeded",
    occurredAt,
    priceId: data.productId,
    provider: paymentService.provider,
    ...(configuredAmount !== undefined
      ? { amountMajor: configuredAmount }
      : {}),
    ...(data.amountMinor !== undefined
      ? { amountMinor: data.amountMinor }
      : {}),
    ...(data.currency ? { currency: data.currency } : {}),
    ...(data.subscription ? { subscriptionId: data.subscription.id } : {}),
    userId,
  });

  logEvent("payment.checkout.completed", {
    userId,
    customerId: data.customer.id,
    productId: data.productId,
    subscriptionId: data.subscription?.id,
    checkoutType: data.metadata.type ?? data.mode,
    provider: paymentService.provider,
  });
  trackServerEvent({
    attributes: {
      checkoutType: data.metadata.type ?? data.mode,
      customerId: data.customer.id,
      productId: data.productId,
      provider: paymentService.provider,
      ...(data.subscription?.id
        ? { subscriptionId: data.subscription.id }
        : {}),
    },
    context: { identity: { userId } },
    name: "payment.checkout.completed",
    source: "server",
    version: 1,
  });
}

async function handleOneTimeCheckoutCompleted(
  data: PaymentCheckout,
  eventId: string
): Promise<void> {
  const { metadata } = data;
  const userId = metadata.userId;
  if (!userId) {
    throw new Error("Missing userId in one-time checkout metadata");
  }
  if (metadata.type === "credit_purchase") {
    const packageId = metadata.packageId;
    const creditPackage = CREDIT_PACKAGES.find((item) => item.id === packageId);
    const declaredCredits = Number(metadata.credits);

    if (
      !creditPackage ||
      data.productId !== `credits_${packageId}` ||
      declaredCredits !== creditPackage.credits
    ) {
      throw new Error("Invalid credit purchase metadata");
    }

    const result = await grantCredits({
      userId,
      amount: creditPackage.credits,
      sourceType: "purchase",
      debitAccount: `PAYMENT:${data.id}`,
      transactionType: "purchase",
      expiresAt: CREDITS_EXPIRY_DAYS
        ? new Date(Date.now() + CREDITS_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
        : null,
      sourceRef: `checkout:${data.id}`,
      description: `购买 ${creditPackage.credits} 积分 (${creditPackage.id})`,
      metadata: {
        checkoutId: data.id,
        eventId,
        packageId: creditPackage.id,
        productId: data.productId,
      },
    });

    logEvent("credits.purchased", {
      amount: creditPackage.credits,
      granted: result.granted,
      packageId: creditPackage.id,
      provider: paymentService.provider,
      userId,
    });
    trackServerEvent({
      attributes: {
        amount: creditPackage.credits,
        granted: result.granted,
        packageId: creditPackage.id,
        provider: paymentService.provider,
        productId: data.productId,
      },
      context: { identity: { userId } },
      name: "credits.purchased",
      source: "server",
      version: 1,
    });
    return;
  }

  const { plan, price } = findPlanByPriceId(data.productId);
  if (plan?.isLifetime && price?.type === "one-time") {
    await upsertLifetimeSubscription(userId, data);
    return;
  }

  throw new Error(`Unsupported one-time checkout product ${data.productId}`);
}

async function upsertLifetimeSubscription(
  userId: string,
  checkout: PaymentCheckout
): Promise<void> {
  const [existing] = await db
    .select({ id: subscription.id })
    .from(subscription)
    .where(eq(subscription.userId, userId))
    .limit(1);
  const values = {
    priceId: checkout.productId,
    status: "lifetime",
    subscriptionId: `lifetime_${checkout.id}`,
    currentPeriodStart: new Date(),
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    updatedAt: new Date(),
  };

  if (existing) {
    await db
      .update(subscription)
      .set(values)
      .where(eq(subscription.userId, userId));
  } else {
    await db.insert(subscription).values({
      id: crypto.randomUUID(),
      userId,
      ...values,
    });
  }
}

async function handleSubscriptionActive(
  externalSubscription: PaymentSubscription,
  eventId: string,
  occurredAt: Date
): Promise<void> {
  const metadataUserId = externalSubscription.metadata.userId;
  const userId =
    metadataUserId ?? (await findSubscriptionUserId(externalSubscription.id));

  if (!userId) {
    throw new Error(
      `Cannot find userId for subscription ${externalSubscription.id}`
    );
  }

  const applied = await createOrUpdateSubscription(
    userId,
    externalSubscription
  );

  if (applied) {
    await grantSubscriptionCredits(
      userId,
      externalSubscription,
      "subscription_create"
    );
  }
  await recordRevenueEvent({
    externalEventId: subscriptionRevenueEventId(externalSubscription, eventId),
    kind: "payment_succeeded",
    occurredAt,
    priceId: externalSubscription.productId,
    provider: paymentService.provider,
    subscriptionId: externalSubscription.id,
    userId,
  });
  logEvent("payment.subscription.created", {
    userId,
    subscriptionId: externalSubscription.id,
    priceId: externalSubscription.productId,
    status: externalSubscription.status,
    provider: paymentService.provider,
  });
  trackServerEvent({
    attributes: {
      priceId: externalSubscription.productId,
      provider: paymentService.provider,
      status: externalSubscription.status,
      subscriptionId: externalSubscription.id,
    },
    context: { identity: { userId } },
    name: "payment.subscription.created",
    source: "server",
    version: 1,
  });
}

async function handleSubscriptionRenewed(
  externalSubscription: PaymentSubscription,
  eventId: string,
  occurredAt: Date
): Promise<void> {
  const userId =
    externalSubscription.metadata.userId ??
    (await findSubscriptionUserId(externalSubscription.id));

  if (!userId) {
    throw new Error(
      `Subscription user not found for renewal ${externalSubscription.id}`
    );
  }

  const applied = await createOrUpdateSubscription(
    userId,
    externalSubscription
  );
  if (applied) {
    await grantSubscriptionCredits(
      userId,
      externalSubscription,
      "subscription_cycle"
    );
  }
  await recordRevenueEvent({
    externalEventId: subscriptionRevenueEventId(externalSubscription, eventId),
    kind: "payment_succeeded",
    occurredAt,
    priceId: externalSubscription.productId,
    provider: paymentService.provider,
    subscriptionId: externalSubscription.id,
    userId,
  });
}

async function handleSubscriptionCanceled(
  externalSubscription: PaymentSubscription,
  eventId: string,
  occurredAt: Date
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

  const userId = await findSubscriptionUserId(externalSubscription.id);
  await recordRevenueEvent({
    externalEventId: eventId,
    kind: "subscription_canceled",
    occurredAt,
    priceId: externalSubscription.productId,
    provider: paymentService.provider,
    subscriptionId: externalSubscription.id,
    ...(userId ? { userId } : {}),
  });
  logEvent("payment.subscription.canceled", {
    userId,
    subscriptionId: externalSubscription.id,
    cancelAtPeriodEnd: isStillInPeriod,
    periodEnd: periodEnd?.toISOString(),
    provider: paymentService.provider,
  });
  trackServerEvent({
    attributes: {
      cancelAtPeriodEnd: isStillInPeriod,
      periodEnd: periodEnd?.toISOString() ?? null,
      provider: paymentService.provider,
      subscriptionId: externalSubscription.id,
    },
    ...(userId ? { context: { identity: { userId } } } : {}),
    name: "payment.subscription.canceled",
    source: "server",
    version: 1,
  });
}

function subscriptionRevenueEventId(
  subscriptionData: PaymentSubscription,
  fallbackEventId: string
): string {
  return subscriptionData.currentPeriodStart
    ? `${subscriptionData.id}:${subscriptionData.currentPeriodStart.toISOString()}`
    : fallbackEventId;
}

function getConfiguredCheckoutAmount(
  data: PaymentCheckout
): number | undefined {
  const planPrice = findPlanByPriceId(data.productId).price?.amount;
  if (planPrice !== undefined) return planPrice;
  const packageId = data.metadata.packageId;
  return CREDIT_PACKAGES.find((item) => item.id === packageId)?.price;
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
  trackServerEvent({
    attributes: {
      provider: paymentService.provider,
      status,
      subscriptionId: externalSubscription.id,
    },
    name: `payment.subscription.${status}`,
    source: "server",
    version: 1,
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
): Promise<boolean> {
  const [existing] = await db
    .select({
      currentPeriodStart: subscription.currentPeriodStart,
      id: subscription.id,
    })
    .from(subscription)
    .where(eq(subscription.userId, userId))
    .limit(1);
  const data = subscriptionValues(externalSubscription);

  if (existing) {
    if (
      isStaleSubscriptionEvent(
        existing.currentPeriodStart,
        externalSubscription.currentPeriodStart
      )
    ) {
      logWarn("Ignoring stale subscription event", {
        incomingPeriodStart:
          externalSubscription.currentPeriodStart?.toISOString(),
        subscriptionId: externalSubscription.id,
        storedPeriodStart: existing.currentPeriodStart?.toISOString(),
      });
      return false;
    }
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
  trackServerEvent({
    attributes: {
      provider: paymentService.provider,
      subscriptionId: externalSubscription.id,
    },
    context: { identity: { userId } },
    name: "payment.subscription.upserted",
    source: "server",
    version: 1,
  });
  return true;
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

async function grantSubscriptionCredits(
  userId: string,
  externalSubscription: PaymentSubscription,
  billingReason: "subscription_create" | "subscription_cycle"
): Promise<void> {
  const { currentPeriodStart, currentPeriodEnd, productId, id } =
    externalSubscription;
  if (!currentPeriodStart || !currentPeriodEnd) {
    throw new Error(`Subscription period is incomplete for ${id}`);
  }

  const planType = getPlanFromPriceId(productId);
  if (!planType) {
    throw new Error(`Unknown priceId ${productId}`);
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
    trackServerEvent({
      attributes: { periodKey },
      context: { identity: { userId } },
      name: "payment.credits.already_granted",
      source: "server",
      version: 1,
    });
    return;
  }

  const monthlyCredits =
    SUBSCRIPTION_MONTHLY_CREDITS[
      planType as keyof typeof SUBSCRIPTION_MONTHLY_CREDITS
    ];
  if (!monthlyCredits) {
    throw new Error(`No monthly credits configured for plan ${planType}`);
  }

  const { price } = findPlanByPriceId(productId);
  if (!price) {
    throw new Error(`Unknown registered price ${productId}`);
  }
  const isYearly = price.interval === PlanInterval.YEAR;
  const amount = isYearly ? monthlyCredits * 12 : monthlyCredits;
  const expiresAt = CREDITS_EXPIRY_DAYS
    ? new Date(Date.now() + CREDITS_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
    : null;

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
    granted: result.granted,
    planType,
    batchId: result.batchId,
  });
  trackServerEvent({
    attributes: {
      batchId: result.batchId,
      credits: amount,
      granted: result.granted,
      planType,
    },
    context: { identity: { userId } },
    name: "payment.credits.grant_success",
    source: "server",
    version: 1,
  });
}
