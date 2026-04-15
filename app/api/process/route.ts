import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { listProcesses, createProcess } from "@/lib/db/queries";
import { start } from "workflow/api";
import { processRecordingWorkflow } from "@/lib/workflows/process-recording";
import { z } from "zod";

const createProcessSchema = z.object({
  name: z.string().min(1).max(200),
  transcript: z.string().min(10),
  durationSeconds: z.number().int().positive(),
});

export async function GET() {
  const { userId, orgId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const org = orgId ?? userId;
  const processes = await listProcesses(org);
  return NextResponse.json(processes);
}

export async function POST(request: Request) {
  const { userId, orgId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const parsed = createProcessSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const org = orgId ?? userId;
  const process = await createProcess({ name: parsed.data.name, orgId: org, createdBy: userId, status: "draft" });
  const run = await start(processRecordingWorkflow, [process.id, parsed.data.transcript, parsed.data.durationSeconds]);
  return NextResponse.json({ ...process, workflowRunId: run.runId }, { status: 201 });
}
