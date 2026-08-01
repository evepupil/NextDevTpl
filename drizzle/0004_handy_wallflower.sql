CREATE TABLE "revenue_event" (
	"id" text PRIMARY KEY NOT NULL,
	"external_event_id" text NOT NULL,
	"provider" text NOT NULL,
	"kind" text NOT NULL,
	"user_id" text,
	"subscription_id" text,
	"price_id" text,
	"currency" text NOT NULL,
	"amount_minor" integer NOT NULL,
	"interval" text,
	"occurred_at" timestamp NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "revenue_event" ADD CONSTRAINT "revenue_event_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "revenue_event_external_kind_unique" ON "revenue_event" USING btree ("external_event_id","kind");