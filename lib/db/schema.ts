import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

export const processStatusEnum = pgEnum("process_status", [
  "draft",
  "reviewing",
  "complete",
  "failed",
]);

export const processes = pgTable("processes", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: text("org_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  status: processStatusEnum("status").notNull().default("draft"),
  createdBy: text("created_by").notNull(),
  structuredData: jsonb("structured_data"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const recordings = pgTable("recordings", {
  id: uuid("id").defaultRandom().primaryKey(),
  processId: uuid("process_id")
    .notNull()
    .references(() => processes.id, { onDelete: "cascade" }),
  rawTranscript: text("raw_transcript").notNull(),
  audioUrl: text("audio_url"),
  durationSeconds: integer("duration_seconds").notNull(),
  clarificationQa: jsonb("clarification_qa"),
  workflowRunId: text("workflow_run_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Process = typeof processes.$inferSelect;
export type ProcessInsert = typeof processes.$inferInsert;
export type Recording = typeof recordings.$inferSelect;
export type RecordingInsert = typeof recordings.$inferInsert;
