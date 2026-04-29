import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getProcess, getRecordingByProcessId } from "@/lib/db/queries";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const process = await getProcess(id);
  if (!process) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const recording = await getRecordingByProcessId(id);
  if (!recording) return NextResponse.json({ error: "No recording" }, { status: 404 });
  return NextResponse.json(recording);
}
