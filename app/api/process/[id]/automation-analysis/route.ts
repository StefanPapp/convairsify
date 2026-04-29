import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getProcess, getRecordingByProcessId, updateAutomationAnalysis } from "@/lib/db/queries";
import { analyzeAutomationPotential } from "@/lib/ai/automation-analysis";
import type { ProcessStructuredData } from "@/lib/ai/schemas";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const process = await getProcess(id);
  if (!process) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(process.automationAnalysis ?? null);
}

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const process = await getProcess(id);
  if (!process) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (process.status !== "complete" || !process.structuredData) {
    return NextResponse.json({ error: "Process not yet structured" }, { status: 409 });
  }
  const recording = await getRecordingByProcessId(id);
  const analysis = await analyzeAutomationPotential(
    process.structuredData as ProcessStructuredData,
    recording?.rawTranscript ?? ""
  );
  await updateAutomationAnalysis(id, analysis);
  return NextResponse.json(analysis);
}
