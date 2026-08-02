/**
 * Test database helpers.
 *
 * Provides the shared test DB connection plus cleanup and inspection helpers.
 */

import { eq, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "@/db/schema";

let pool: Pool | null = null;
let legacySchemaSynced = false;

function getTestDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not configured.\n" +
        "Create .env.test and set DATABASE_URL to your test database."
    );
  }

  return url;
}

function createTestDb() {
  const databaseUrl = getTestDatabaseUrl();
  pool = new Pool({
    connectionString: databaseUrl,
    max: 1,
    connectionTimeoutMillis: 15000,
  });
  return drizzle(pool, { schema });
}

export const testDb = createTestDb();

export async function closeTestDb() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

/**
 * Forward-sync legacy test branches to the current schema.
 *
 * Some existing test databases were created from the initial Stripe-based schema
 * and are missing the Creem-era columns now used by the app code.
 */
export async function syncLegacyTestSchema() {
  if (legacySchemaSynced) {
    return;
  }

  const readinessResult = await testDb.execute(
    sql.raw(`
SELECT
	EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_name = 'subscription'
		  AND column_name = 'subscription_id'
	) AS has_subscription_id,
	EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_name = 'subscription'
		  AND column_name = 'price_id'
	) AS has_price_id,
	EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_name = 'user'
		  AND column_name = 'customer_id'
	) AS has_customer_id,
	EXISTS (
		SELECT 1
		FROM pg_type t
		JOIN pg_enum e ON e.enumtypid = t.oid
		WHERE t.typname = 'credits_transaction_type'
		  AND e.enumlabel = 'admin_grant'
	) AS has_admin_grant,
	EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_name = 'subscription'
		  AND column_name = 'pending_price_id'
	) AS has_pending_price_id,
	to_regclass('public.subscription_history') IS NOT NULL AS has_subscription_history,
	to_regclass('public.subscription_checkout') IS NOT NULL AS has_subscription_checkout,
	EXISTS (
		SELECT 1
		FROM pg_indexes
		WHERE schemaname = 'public'
		  AND indexname = 'subscription_user_id_unique'
	) AS has_subscription_user_unique;
`)
  );

  const readinessRow = readinessResult.rows[0] as
    | {
        has_subscription_id?: boolean;
        has_price_id?: boolean;
        has_customer_id?: boolean;
        has_admin_grant?: boolean;
        has_pending_price_id?: boolean;
        has_subscription_history?: boolean;
        has_subscription_checkout?: boolean;
        has_subscription_user_unique?: boolean;
      }
    | undefined;

  if (
    readinessRow?.has_subscription_id &&
    readinessRow.has_price_id &&
    readinessRow.has_customer_id &&
    readinessRow.has_admin_grant &&
    readinessRow.has_pending_price_id &&
    readinessRow.has_subscription_history &&
    readinessRow.has_subscription_checkout &&
    readinessRow.has_subscription_user_unique
  ) {
    legacySchemaSynced = true;
    return;
  }

  await testDb.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(842145611)`);

    await tx.execute(
      sql.raw(`
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_type t
		JOIN pg_enum e ON e.enumtypid = t.oid
		WHERE t.typname = 'credits_transaction_type'
		  AND e.enumlabel = 'admin_grant'
	) THEN
		ALTER TYPE "public"."credits_transaction_type"
		ADD VALUE 'admin_grant' BEFORE 'expiration';
	END IF;
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;
`)
    );

    await tx.execute(
      sql.raw(
        `ALTER TABLE "subscription" ADD COLUMN IF NOT EXISTS "subscription_id" text;`
      )
    );
    await tx.execute(
      sql.raw(
        `ALTER TABLE "subscription" ADD COLUMN IF NOT EXISTS "price_id" text;`
      )
    );
    await tx.execute(
      sql.raw(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "customer_id" text;`)
    );

    await tx.execute(
      sql.raw(`
DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_name = 'subscription'
		  AND column_name = 'stripe_subscription_id'
	) THEN
		UPDATE "subscription"
		SET "subscription_id" = COALESCE("subscription_id", "stripe_subscription_id")
		WHERE "subscription_id" IS NULL;
	END IF;

	IF EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_name = 'subscription'
		  AND column_name = 'stripe_price_id'
	) THEN
		UPDATE "subscription"
		SET "price_id" = COALESCE("price_id", "stripe_price_id")
		WHERE "price_id" IS NULL;
	END IF;

	IF EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_name = 'user'
		  AND column_name = 'stripe_customer_id'
	) THEN
		UPDATE "user"
		SET "customer_id" = COALESCE("customer_id", "stripe_customer_id")
		WHERE "customer_id" IS NULL;
	END IF;

	IF EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_name = 'subscription'
		  AND column_name = 'stripe_subscription_id'
	) THEN
		ALTER TABLE "subscription"
		ALTER COLUMN "stripe_subscription_id" DROP NOT NULL;
	END IF;

	IF EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_name = 'subscription'
		  AND column_name = 'stripe_price_id'
	) THEN
		ALTER TABLE "subscription"
		ALTER COLUMN "stripe_price_id" DROP NOT NULL;
	END IF;
END $$;
`)
    );

    await tx.execute(
      sql.raw(`
ALTER TABLE "subscription"
ADD COLUMN IF NOT EXISTS "pending_price_id" text;
ALTER TABLE "subscription"
ADD COLUMN IF NOT EXISTS "pending_price_effective_at" timestamp;
WITH ranked_subscriptions AS (
	SELECT
		"id",
		ROW_NUMBER() OVER (
			PARTITION BY "user_id"
			ORDER BY
				CASE
					WHEN "status" IN ('active', 'trialing', 'lifetime', 'past_due', 'paused', 'unpaid', 'incomplete') THEN 0
					ELSE 1
				END,
				"updated_at" DESC,
				"created_at" DESC,
				"id" DESC
		) AS "row_number"
	FROM "subscription"
)
DELETE FROM "subscription" AS current_subscription
USING ranked_subscriptions
WHERE current_subscription."id" = ranked_subscriptions."id"
	AND ranked_subscriptions."row_number" > 1;
CREATE UNIQUE INDEX IF NOT EXISTS "subscription_user_id_unique"
ON "subscription" ("user_id");

CREATE TABLE IF NOT EXISTS "subscription_history" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"subscription_id" text NOT NULL,
	"event_type" text NOT NULL,
	"from_price_id" text,
	"to_price_id" text,
	"effective_at" timestamp NOT NULL,
	"source_event_id" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscription_history_user_id_user_id_fk"
		FOREIGN KEY ("user_id") REFERENCES "public"."user"("id")
		ON DELETE cascade ON UPDATE no action
);
CREATE INDEX IF NOT EXISTS "subscription_history_user_created_idx"
ON "subscription_history" ("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "subscription_history_subscription_idx"
ON "subscription_history" ("subscription_id");
CREATE UNIQUE INDEX IF NOT EXISTS "subscription_history_source_event_unique"
ON "subscription_history" ("source_event_id");

CREATE TABLE IF NOT EXISTS "subscription_checkout" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"request_id" text NOT NULL,
	"price_id" text NOT NULL,
	"status" text DEFAULT 'idle' NOT NULL,
	"checkout_id" text,
	"checkout_url" text,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscription_checkout_user_id_user_id_fk"
		FOREIGN KEY ("user_id") REFERENCES "public"."user"("id")
		ON DELETE cascade ON UPDATE no action
);
CREATE UNIQUE INDEX IF NOT EXISTS "subscription_checkout_user_unique"
ON "subscription_checkout" ("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "subscription_checkout_request_unique"
ON "subscription_checkout" ("request_id");
CREATE UNIQUE INDEX IF NOT EXISTS "subscription_checkout_checkout_unique"
ON "subscription_checkout" ("checkout_id");
CREATE INDEX IF NOT EXISTS "subscription_checkout_expires_idx"
ON "subscription_checkout" ("expires_at");
`)
    );
  });

  legacySchemaSynced = true;
}

export async function cleanupUserData(userId: string) {
  await testDb
    .delete(schema.creditsTransaction)
    .where(eq(schema.creditsTransaction.userId, userId));

  await testDb
    .delete(schema.creditsBatch)
    .where(eq(schema.creditsBatch.userId, userId));

  await testDb
    .delete(schema.creditsBalance)
    .where(eq(schema.creditsBalance.userId, userId));

  await testDb.delete(schema.session).where(eq(schema.session.userId, userId));
  await testDb.delete(schema.account).where(eq(schema.account.userId, userId));
  await testDb.delete(schema.user).where(eq(schema.user.id, userId));
}

export async function cleanupTestUsers(userIds: string[]) {
  if (userIds.length === 0) return;

  await testDb
    .delete(schema.ticketMessage)
    .where(inArray(schema.ticketMessage.userId, userIds));

  await testDb
    .delete(schema.ticket)
    .where(inArray(schema.ticket.userId, userIds));

  await testDb
    .delete(schema.creditsTransaction)
    .where(inArray(schema.creditsTransaction.userId, userIds));

  await testDb
    .delete(schema.creditsBatch)
    .where(inArray(schema.creditsBatch.userId, userIds));

  await testDb
    .delete(schema.creditsBalance)
    .where(inArray(schema.creditsBalance.userId, userIds));

  await testDb
    .delete(schema.subscription)
    .where(inArray(schema.subscription.userId, userIds));

  await testDb
    .delete(schema.session)
    .where(inArray(schema.session.userId, userIds));

  await testDb
    .delete(schema.account)
    .where(inArray(schema.account.userId, userIds));

  await testDb.delete(schema.user).where(inArray(schema.user.id, userIds));
}

export async function cleanupTestData() {
  const testUsers = await testDb
    .select({ id: schema.user.id })
    .from(schema.user)
    .where(sql`${schema.user.id} LIKE 'test_%'`);

  const userIds = testUsers.map((u) => u.id);
  await cleanupTestUsers(userIds);
}

export async function checkDbConnection(): Promise<boolean> {
  try {
    await testDb.execute(sql`SELECT 1`);
    return true;
  } catch {
    return false;
  }
}

export async function getUserCreditsState(userId: string) {
  const [balance] = await testDb
    .select()
    .from(schema.creditsBalance)
    .where(eq(schema.creditsBalance.userId, userId))
    .limit(1);

  const batches = await testDb
    .select()
    .from(schema.creditsBatch)
    .where(eq(schema.creditsBatch.userId, userId));

  const transactions = await testDb
    .select()
    .from(schema.creditsTransaction)
    .where(eq(schema.creditsTransaction.userId, userId));

  return { balance, batches, transactions };
}

export async function getTicketWithMessages(ticketId: string) {
  const [ticketData] = await testDb
    .select()
    .from(schema.ticket)
    .where(eq(schema.ticket.id, ticketId))
    .limit(1);

  const messages = await testDb
    .select()
    .from(schema.ticketMessage)
    .where(eq(schema.ticketMessage.ticketId, ticketId))
    .orderBy(schema.ticketMessage.createdAt);

  return { ticket: ticketData, messages };
}

export async function getUserTickets(userId: string) {
  return await testDb
    .select()
    .from(schema.ticket)
    .where(eq(schema.ticket.userId, userId))
    .orderBy(schema.ticket.createdAt);
}

export async function getUserSubscription(userId: string) {
  const [sub] = await testDb
    .select()
    .from(schema.subscription)
    .where(eq(schema.subscription.userId, userId))
    .limit(1);

  return sub;
}

export async function cleanupTestNewsletterSubscribers(emails: string[]) {
  if (emails.length === 0) return;

  for (const email of emails) {
    await testDb
      .delete(schema.newsletterSubscriber)
      .where(eq(schema.newsletterSubscriber.email, email.toLowerCase()));
  }
}

export async function createTestNewsletterSubscriber(options: {
  email: string;
  isSubscribed?: boolean;
}): Promise<schema.NewsletterSubscriber> {
  const id = `test_newsletter_${Date.now()}`;
  const normalizedEmail = options.email.toLowerCase().trim();

  const data: schema.NewNewsletterSubscriber = {
    id,
    email: normalizedEmail,
    isSubscribed: options.isSubscribed ?? true,
  };

  const [subscriber] = await testDb
    .insert(schema.newsletterSubscriber)
    .values(data)
    .returning();

  if (!subscriber) {
    throw new Error("Failed to create test newsletter subscriber");
  }

  return subscriber;
}
