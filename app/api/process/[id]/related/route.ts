import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { findRelatedProcesses, getProcess } from "@/lib/db/queries";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId, orgId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const process = await getProcess(id);
  if (!process) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const tenantId = orgId ?? process.orgId;
  const related = await findRelatedProcesses(id, tenantId, 5);
  return NextResponse.json(related);
}
