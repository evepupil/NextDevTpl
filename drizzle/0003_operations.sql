CREATE TABLE "operations_daily_snapshot" (
	"id" text PRIMARY KEY NOT NULL,
	"snapshot_date" date NOT NULL,
	"timezone" text NOT NULL,
	"metrics" jsonb NOT NULL,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "operations_daily_snapshot_date_unique" ON "operations_daily_snapshot" USING btree ("snapshot_date","timezone");