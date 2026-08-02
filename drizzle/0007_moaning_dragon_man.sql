CREATE TABLE "subscription_checkout" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"request_id" text NOT NULL,
	"price_id" text NOT NULL,
	"status" text DEFAULT 'idle' NOT NULL,
	"checkout_id" text,
	"checkout_url" text,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_history" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"subscription_id" text NOT NULL,
	"event_type" text NOT NULL,
	"from_price_id" text,
	"to_price_id" text,
	"effective_at" timestamp NOT NULL,
	"source_event_id" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "pending_price_id" text;--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "pending_price_effective_at" timestamp;--> statement-breakpoint
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
	AND ranked_subscriptions."row_number" > 1;--> statement-breakpoint
ALTER TABLE "subscription_checkout" ADD CONSTRAINT "subscription_checkout_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_history" ADD CONSTRAINT "subscription_history_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "subscription_checkout_user_unique" ON "subscription_checkout" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "subscription_checkout_request_unique" ON "subscription_checkout" USING btree ("request_id");--> statement-breakpoint
CREATE UNIQUE INDEX "subscription_checkout_checkout_unique" ON "subscription_checkout" USING btree ("checkout_id");--> statement-breakpoint
CREATE INDEX "subscription_checkout_expires_idx" ON "subscription_checkout" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "subscription_history_user_created_idx" ON "subscription_history" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "subscription_history_subscription_idx" ON "subscription_history" USING btree ("subscription_id");--> statement-breakpoint
CREATE UNIQUE INDEX "subscription_history_source_event_unique" ON "subscription_history" USING btree ("source_event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "subscription_user_id_unique" ON "subscription" USING btree ("user_id");
