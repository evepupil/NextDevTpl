CREATE TABLE "ai_usage_event" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"feature" text DEFAULT 'unknown' NOT NULL,
	"user_id" text,
	"input_tokens" integer,
	"output_tokens" integer,
	"total_tokens" integer,
	"usage_status" text NOT NULL,
	"latency_ms" integer NOT NULL,
	"credits_consumed" integer,
	"success" boolean DEFAULT true NOT NULL,
	"occurred_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_usage_event" ADD CONSTRAINT "ai_usage_event_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;