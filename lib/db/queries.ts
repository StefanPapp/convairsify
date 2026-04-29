import { eq, desc, and, ne, sql } from "drizzle-orm";
import { db } from "./client";
import { processes, recordings, type ProcessInsert } from "./schema";

export async function listProcesses(orgId: string) {
  return db
    .select()
    .from(processes)
    .where(eq(processes.orgId, orgId))
    .orderBy(desc(processes.updatedAt));
}

export async function getProcess(id: string) {
  const rows = await db
    .select()
    .from(processes)
    .where(eq(processes.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function createProcess(data: ProcessInsert) {
  const rows = await db.insert(processes).values(data).returning();
  return rows[0];
}

export async function updateProcess(
  id: string,
  data: Partial<Pick<ProcessInsert, "name" | "description" | "status" | "tags" | "roles"> & { structuredData: unknown }>
) {
  const rows = await db
    .update(processes)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(processes.id, id))
    .returning();
  return rows[0];
}

export async function deleteProcess(id: string) {
  await db.delete(processes).where(eq(processes.id, id));
}

export async function createRecording(data: typeof recordings.$inferInsert) {
  const rows = await db.insert(recordings).values(data).returning();
  return rows[0];
}

// Atomic to avoid a read-modify-write race with the workflow's writeProgress steps,
// which run concurrently after resumeHook and would otherwise reintroduce pendingQuestions.
export async function acceptClarifications(id: string) {
  await db
    .update(processes)
    .set({
      status: "draft",
      structuredData: sql`COALESCE(${processes.structuredData}, '{}'::jsonb) - 'pendingQuestions'`,
      updatedAt: new Date(),
    })
    .where(eq(processes.id, id));
}

export async function updateAutomationAnalysis(id: string, analysis: unknown) {
  await db
    .update(processes)
    .set({ automationAnalysis: analysis, updatedAt: new Date() })
    .where(eq(processes.id, id));
}

export async function updateProcessEmbedding(id: string, embedding: number[]) {
  await db
    .update(processes)
    .set({ embedding, updatedAt: new Date() })
    .where(eq(processes.id, id));
}

export type RelatedProcess = {
  id: string;
  name: string;
  description: string | null;
  similarity: number;
};

export async function findRelatedProcesses(
  processId: string,
  orgId: string,
  limit = 5
): Promise<RelatedProcess[]> {
  const target = await db
    .select({ embedding: processes.embedding })
    .from(processes)
    .where(eq(processes.id, processId))
    .limit(1);
  const vec = target[0]?.embedding;
  if (!vec) return [];

  const distance = sql<number>`${processes.embedding} <=> ${JSON.stringify(vec)}::vector`;
  const rows = await db
    .select({
      id: processes.id,
      name: processes.name,
      description: processes.description,
      distance,
    })
    .from(processes)
    .where(
      and(
        eq(processes.orgId, orgId),
        ne(processes.id, processId),
        sql`${processes.embedding} IS NOT NULL`,
        eq(processes.status, "complete")
      )
    )
    .orderBy(distance)
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    similarity: 1 - Number(r.distance),
  }));
}

export async function getRecordingByProcessId(processId: string) {
  const rows = await db
    .select()
    .from(recordings)
    .where(eq(recordings.processId, processId))
    .orderBy(desc(recordings.createdAt))
    .limit(1);
  return rows[0] ?? null;
}
