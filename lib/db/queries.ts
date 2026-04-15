import { eq, desc } from "drizzle-orm";
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
  data: Partial<Pick<ProcessInsert, "name" | "description" | "status"> & { structuredData: unknown }>
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

export async function getRecordingByProcessId(processId: string) {
  const rows = await db
    .select()
    .from(recordings)
    .where(eq(recordings.processId, processId))
    .orderBy(desc(recordings.createdAt))
    .limit(1);
  return rows[0] ?? null;
}
