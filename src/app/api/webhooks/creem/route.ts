import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { CREDITS_EXPIRY_DAYS } from "@/features/credits/config";
import { grantCredits } from "@/features/credits/core";
import { db } from "@/db";
import { subscription, user } from "@/db/schema";
import { PaymentType } from "@/features/payment/types";
import { verifyCreemSignature } from "@/features/payment/creem";

type CreemEvent = {
  eventType?: string;
  event_type?: string;
  object?: Record<string, unknown>;
};

type CreemMetadata = Record<string, unknown>;

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("creem-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing creem-signature header" },
      { status: 400 }
    );
  }

  const secret = process.env.CREEM_WEBHOOK_SECRET ?? "";
  if (!secret) {
    return NextResponse.json(
      { error: "CREEM_WEBHOOK_SECRET 未配置" },
      { status: 500 }
    );
  }

  if (!verifyCreemSignature(body, signature, secret)) {
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 400 }
    );
  }

  let event: CreemEvent;
  try {
    event = JSON.parse(body) as CreemEvent;
  } catch (error) {
    console.error("Invalid webhook payload:", error);
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const eventType = event.eventType ?? event.event_type ?? "";
  const object = event.object ?? {};

  try {
    switch (eventType) {
      case "checkout.completed": {
        await handleCheckoutCompleted(object);
        break;
      }
      case "subscription.active":
      case "subscription.paid":
      case "subscription.update":
      case "subscription.trialing":
      case "subscription.paused": {
        await handleSubscriptionUpsert(object);
        break;
      }
      case "subscription.scheduled_cancel": {
        await handleSubscriptionScheduledCancel(object);
        break;
      }
      case "subscription.past_due": {
        await handleSubscriptionPastDue(object);
        break;
      }
      case "subscription.canceled":
      case "subscription.expired": {
        await handleSubscriptionCanceled(object);
        break;
      }
      default:
        console.log(`Unhandled Creem event type: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Creem webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

function extractMetadata(object: Record<string, unknown>): CreemMetadata {
  const metadata =
    (object.metadata as CreemMetadata | undefined) ??
    (object.subscription as Record<string, unknown> | undefined)?.metadata ??
    (object.order as Record<string, unknown> | undefined)?.metadata;
  return (metadata ?? {}) as CreemMetadata;
}

function getMetadataValue(metadata: CreemMetadata, key: string): string | undefined {
  const value = metadata[key];
  if (value === undefined || value === null) {
    return undefined;
  }
  return String(value);
}

function parseCreemDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "number") {
    return new Date(value * 1000);
  }
  if (typeof value === "string") {
    const timestamp = Date.parse(value);
    return Number.isNaN(timestamp) ? null : new Date(timestamp);
  }
  return null;
}

function getCustomerInfo(object: Record<string, unknown>): {
  id?: string;
  email?: string;
} {
  const customerCandidates = [
    object.customer,
    (object.subscription as Record<string, unknown> | undefined)?.customer,
    (object.order as Record<string, unknown> | undefined)?.customer,
  ];

  let customerObject: Record<string, unknown> | undefined;
  let customerId: string | undefined;

  for (const candidate of customerCandidates) {
    if (!candidate) continue;
    if (typeof candidate === "string") {
      customerId = candidate;
      continue;
    }
    if (typeof candidate === "object") {
      customerObject = candidate as Record<string, unknown>;
      customerId = (customerObject.id as string | undefined) ?? customerId;
    }
  }

  const result: { id?: string; email?: string } = {};
  if (customerId) {
    result.id = customerId;
  }
  const email = customerObject?.email as string | undefined;
  if (email) {
    result.email = email;
  }
  return result;
}

function getProductId(object: Record<string, unknown>): string | undefined {
  const candidates = [
    object.product,
    (object.subscription as Record<string, unknown> | undefined)?.product,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    if (typeof candidate === "string") {
      return candidate;
    }
    if (typeof candidate === "object") {
      return (candidate as Record<string, unknown>).id as string | undefined;
    }
  }

  return undefined;
}

async function resolveUserId(
  metadataUserId: string | undefined,
  customerEmail: string | undefined
): Promise<string | null> {
  if (metadataUserId) return metadataUserId;
  if (!customerEmail) return null;

  const [dbUser] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, customerEmail))
    .limit(1);

  return dbUser?.id ?? null;
}

async function upsertCustomerId(userId: string, customerId?: string) {
  if (!customerId) return;
  await db
    .update(user)
    .set({ stripeCustomerId: customerId, updatedAt: new Date() })
    .where(eq(user.id, userId));
}

async function handleCheckoutCompleted(object: Record<string, unknown>) {
  const metadata = extractMetadata(object);
  const { id: customerId, email: customerEmail } = getCustomerInfo(object);
  const userId = await resolveUserId(getMetadataValue(metadata, "userId"), customerEmail);

  if (!userId) {
    console.error("Creem checkout.completed: Missing userId");
    return;
  }

  await upsertCustomerId(userId, customerId);

  const purchaseType = getMetadataValue(metadata, "type");
  const paymentType = getMetadataValue(metadata, "paymentType");
  const orderType = (object.order as Record<string, unknown> | undefined)?.type as
    | string
    | undefined;

  if (purchaseType === "credit_purchase") {
    await handleCreditPurchaseCompleted(object, metadata, userId);
    return;
  }

  if (paymentType === PaymentType.ONE_TIME || orderType === "one-time") {
    await handleOneTimePaymentCompleted(object, metadata, userId);
  }
}

async function handleOneTimePaymentCompleted(
  object: Record<string, unknown>,
  metadata: CreemMetadata,
  userId: string
) {
  const planId =
    getMetadataValue(metadata, "planId") ??
    getMetadataValue(metadata, "priceId") ??
    getProductId(object) ??
    "lifetime";

  const orderId = (object.order as Record<string, unknown> | undefined)?.id as
    | string
    | undefined;
  const paymentId = orderId ?? (object.id as string | undefined) ?? crypto.randomUUID();

  const [existingSubscription] = await db
    .select()
    .from(subscription)
    .where(eq(subscription.userId, userId))
    .limit(1);

  if (existingSubscription) {
    await db
      .update(subscription)
      .set({
        stripeSubscriptionId: `lifetime_${paymentId}`,
        stripePriceId: planId,
        status: "lifetime",
        currentPeriodStart: new Date(),
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        updatedAt: new Date(),
      })
      .where(eq(subscription.userId, userId));
  } else {
    await db.insert(subscription).values({
      id: crypto.randomUUID(),
      userId,
      stripeSubscriptionId: `lifetime_${paymentId}`,
      stripePriceId: planId,
      status: "lifetime",
      currentPeriodStart: new Date(),
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    });
  }

  console.log(`Creem lifetime plan activated for user ${userId}`);
}

async function handleSubscriptionUpsert(object: Record<string, unknown>) {
  const metadata = extractMetadata(object);
  const { id: customerId, email: customerEmail } = getCustomerInfo(object);
  const userId = await resolveUserId(getMetadataValue(metadata, "userId"), customerEmail);

  if (!userId) {
    console.error("Creem subscription event: Missing userId");
    return;
  }

  await upsertCustomerId(userId, customerId);

  const subscriptionId = object.id as string | undefined;
  if (!subscriptionId) {
    console.error("Creem subscription event: Missing subscription id");
    return;
  }

  const priceId =
    getProductId(object) ??
    getMetadataValue(metadata, "priceId") ??
    getMetadataValue(metadata, "planId") ??
    "";
  const status = (object.status as string | undefined) ?? "active";
  const currentPeriodStart = parseCreemDate(
    (object.current_period_start_date as string | undefined) ??
      object.current_period_start
  );
  const currentPeriodEnd = parseCreemDate(
    (object.current_period_end_date as string | undefined) ??
      object.current_period_end
  );
  const cancelAtPeriodEnd = Boolean(
    object.cancel_at_period_end ?? object.cancelAtPeriodEnd ?? false
  );

  const [existingSubscription] = await db
    .select()
    .from(subscription)
    .where(eq(subscription.userId, userId))
    .limit(1);

  if (existingSubscription) {
    await db
      .update(subscription)
      .set({
        stripeSubscriptionId: subscriptionId,
        stripePriceId: priceId,
        status,
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd,
        updatedAt: new Date(),
      })
      .where(eq(subscription.userId, userId));
  } else {
    await db.insert(subscription).values({
      id: crypto.randomUUID(),
      userId,
      stripeSubscriptionId: subscriptionId,
      stripePriceId: priceId,
      status,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd,
    });
  }

  console.log(`Creem subscription updated for user ${userId}`);
}

async function handleSubscriptionScheduledCancel(object: Record<string, unknown>) {
  const subscriptionId = object.id as string | undefined;
  if (!subscriptionId) return;

  await db
    .update(subscription)
    .set({
      cancelAtPeriodEnd: true,
      status: (object.status as string | undefined) ?? "active",
      updatedAt: new Date(),
    })
    .where(eq(subscription.stripeSubscriptionId, subscriptionId));
}

async function handleSubscriptionPastDue(object: Record<string, unknown>) {
  const subscriptionId = object.id as string | undefined;
  if (!subscriptionId) return;

  await db
    .update(subscription)
    .set({
      status: (object.status as string | undefined) ?? "past_due",
      updatedAt: new Date(),
    })
    .where(eq(subscription.stripeSubscriptionId, subscriptionId));
}

async function handleSubscriptionCanceled(object: Record<string, unknown>) {
  const subscriptionId = object.id as string | undefined;
  if (!subscriptionId) return;

  await db
    .update(subscription)
    .set({
      status: (object.status as string | undefined) ?? "canceled",
      cancelAtPeriodEnd: false,
      updatedAt: new Date(),
    })
    .where(eq(subscription.stripeSubscriptionId, subscriptionId));
}

async function handleCreditPurchaseCompleted(
  object: Record<string, unknown>,
  metadata: CreemMetadata,
  userId: string
) {
  const creditsStr = getMetadataValue(metadata, "credits");
  const packageId = getMetadataValue(metadata, "packageId");

  if (!creditsStr) {
    console.error("Creem credit purchase: Missing credits metadata");
    return;
  }

  const credits = parseInt(creditsStr, 10);
  if (Number.isNaN(credits) || credits <= 0) {
    console.error("Creem credit purchase: Invalid credits value", creditsStr);
    return;
  }

  const orderId = (object.order as Record<string, unknown> | undefined)?.id as
    | string
    | undefined;
  const paymentId = orderId ?? (object.id as string | undefined) ?? crypto.randomUUID();

  const expiresAt = CREDITS_EXPIRY_DAYS
    ? new Date(Date.now() + CREDITS_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
    : null;

  const result = await grantCredits({
    userId,
    amount: credits,
    sourceType: "purchase",
    debitAccount: `PAYMENT:${paymentId}`,
    transactionType: "purchase",
    expiresAt,
    sourceRef: paymentId,
    description: `购买 ${credits} 积分 (${packageId ?? "custom"})`,
    metadata: {
      paymentId,
      packageId,
    },
  });

  console.log(
    `Creem credits purchased for user ${userId}: ${credits} credits, batch ${result.batchId}`
  );
}
