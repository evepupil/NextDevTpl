DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typnamespace = 'public'::regnamespace
      AND typname = 'credits_status'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typnamespace = 'public'::regnamespace
      AND typname = 'credits_balance_status'
  ) THEN
    ALTER TYPE "public"."credits_status" RENAME TO "credits_balance_status";
  END IF;
END $$;--> statement-breakpoint

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typnamespace = 'public'::regnamespace
      AND typname = 'credits_transaction_type'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_type t
      JOIN pg_enum e ON e.enumtypid = t.oid
      WHERE t.typnamespace = 'public'::regnamespace
        AND t.typname = 'credits_transaction_type'
        AND e.enumlabel = 'admin_grant'
    ) THEN
      ALTER TYPE "public"."credits_transaction_type" ADD VALUE 'admin_grant' BEFORE 'expiration';
    END IF;
  ELSE
    CREATE TYPE "public"."credits_transaction_type" AS ENUM(
      'purchase',
      'consumption',
      'monthly_grant',
      'registration_bonus',
      'admin_grant',
      'expiration',
      'refund'
    );
  END IF;
END $$;--> statement-breakpoint

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'credits_transaction'
      AND column_name = 'type'
      AND udt_name = 'text'
  ) THEN
    ALTER TABLE "credits_transaction"
    ALTER COLUMN "type" TYPE "public"."credits_transaction_type"
    USING "type"::"public"."credits_transaction_type";
  END IF;
END $$;--> statement-breakpoint

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
