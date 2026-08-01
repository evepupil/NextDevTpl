CREATE TABLE IF NOT EXISTS "payment_webhook_event" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'processing' NOT NULL,
	"received_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "credits_batch_source_unique"
ON "credits_batch" ("user_id", "source_type", "source_ref")
WHERE "source_ref" IS NOT NULL;
