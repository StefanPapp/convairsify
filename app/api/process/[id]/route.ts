import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getProcess, updateProcess, deleteProcess } from "@/lib/db/queries";
import { z } from "zod";

const updateProcessSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  structuredData: z.unknown().optional(),
});

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const process = await getProcess(id);
  if (!process) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(process);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const parsed = updateProcessSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const updated = await updateProcess(id, parsed.data);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await deleteProcess(id);
  return new Response(null, { status: 204 });
}
