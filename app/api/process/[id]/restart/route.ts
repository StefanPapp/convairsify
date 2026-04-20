import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getProcess, updateProcess } from "@/lib/db/queries";
import { start } from "workflow/api";
import { processRecordingWorkflow } from "@/lib/workflows/process-recording";

type InputData = { transcript: string; durationSeconds: number };

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const process = await getProcess(id);
  if (!process) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (process.status !== "failed") {
    return NextResponse.json({ error: "Only failed processes can be restarted" }, { status: 400 });
  }

  const input = (process.structuredData as { _input?: InputData } | null)?._input;
  if (!input?.transcript) {
    return NextResponse.json({ error: "Original transcript not available — cannot restart" }, { status: 400 });
  }

  await updateProcess(id, {
    status: "draft",
    structuredData: { _input: input },
  });

  const run = await start(processRecordingWorkflow, [id, input.transcript, input.durationSeconds]);
  return NextResponse.json({ workflowRunId: run.runId });
}
