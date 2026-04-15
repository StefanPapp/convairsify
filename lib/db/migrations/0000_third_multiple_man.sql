CREATE TYPE "public"."process_status" AS ENUM('draft', 'reviewing', 'complete');--> statement-breakpoint
CREATE TABLE "processes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" "process_status" DEFAULT 'draft' NOT NULL,
	"created_by" text NOT NULL,
	"structured_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recordings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"process_id" uuid NOT NULL,
	"raw_transcript" text NOT NULL,
	"audio_url" text,
	"duration_seconds" integer NOT NULL,
	"clarification_qa" jsonb,
	"workflow_run_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "recordings" ADD CONSTRAINT "recordings_process_id_processes_id_fk" FOREIGN KEY ("process_id") REFERENCES "public"."processes"("id") ON DELETE cascade ON UPDATE no action;