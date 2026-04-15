import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { resumeHook } from "workflow/api";
import { z } from "zod";

const clarifySchema = z.object({
  answers: z.array(z.object({ question: z.string(), answer: z.string() })),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const parsed = clarifySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  await resumeHook(`clarify-${id}`, { answers: parsed.data.answers });
  return NextResponse.json({ resumed: true });
}
