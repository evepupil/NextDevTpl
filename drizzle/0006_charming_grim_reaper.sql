CREATE TABLE "operations_alert" (
	"id" text PRIMARY KEY NOT NULL,
	"rule_key" text NOT NULL,
	"dedupe_key" text NOT NULL,
	"status" text NOT NULL,
	"severity" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"source" text NOT NULL,
	"value" integer NOT NULL,
	"threshold" integer NOT NULL,
	"consecutive_count" integer DEFAULT 0 NOT NULL,
	"first_seen_at" timestamp NOT NULL,
	"last_seen_at" timestamp NOT NULL,
	"resolved_at" timestamp,
	"cooldown_until" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "operations_alert_delivery" (
	"id" text PRIMARY KEY NOT NULL,
	"alert_id" text NOT NULL,
	"provider" text NOT NULL,
	"status" text NOT NULL,
	"error" text,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "operations_alert_delivery" ADD CONSTRAINT "operations_alert_delivery_alert_id_operations_alert_id_fk" FOREIGN KEY ("alert_id") REFERENCES "public"."operations_alert"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "operations_alert_dedupe_unique" ON "operations_alert" USING btree ("dedupe_key");