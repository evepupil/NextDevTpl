ALTER TYPE "public"."credits_transaction_type" ADD VALUE IF NOT EXISTS 'admin_grant' BEFORE 'expiration';--> statement-breakpoint

ALTER TABLE "subscription" DROP CONSTRAINT IF EXISTS "subscription_stripe_subscription_id_unique";--> statement-breakpoint
ALTER TABLE "user" DROP CONSTRAINT IF EXISTS "user_stripe_customer_id_unique";--> statement-breakpoint

ALTER TABLE "subscription" ADD COLUMN IF NOT EXISTS "subscription_id" text;--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN IF NOT EXISTS "price_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "customer_id" text;--> statement-breakpoint

UPDATE "subscription"
SET
  "subscription_id" = COALESCE("subscription_id", "stripe_subscription_id"),
  "price_id" = COALESCE("price_id", "stripe_price_id")
WHERE "stripe_subscription_id" IS NOT NULL OR "stripe_price_id" IS NOT NULL;--> statement-breakpoint

UPDATE "user"
SET "customer_id" = COALESCE("customer_id", "stripe_customer_id")
WHERE "stripe_customer_id" IS NOT NULL;--> statement-breakpoint

ALTER TABLE "subscription" ALTER COLUMN "subscription_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "subscription" ALTER COLUMN "price_id" SET NOT NULL;--> statement-breakpoint

ALTER TABLE "subscription" DROP COLUMN IF EXISTS "stripe_subscription_id";--> statement-breakpoint
ALTER TABLE "subscription" DROP COLUMN IF EXISTS "stripe_price_id";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN IF EXISTS "stripe_customer_id";--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "subscription_subscription_id_unique"
ON "subscription" ("subscription_id");--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "user_customer_id_unique"
ON "user" ("customer_id")
WHERE "customer_id" IS NOT NULL;
