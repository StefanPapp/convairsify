import { config } from "dotenv";
config();

import { embed } from "ai";
import { eq, isNull, and, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { processes, recordings } from "@/lib/db/schema";
import type { ProcessStructuredData } from "@/lib/ai/schemas";

async function main() {
  const rows = await db
    .select({
      id: processes.id,
      structuredData: processes.structuredData,
    })
    .from(processes)
    .where(and(eq(processes.status, "complete"), isNull(processes.embedding)));

  console.log("found %d processes needing embeddings", rows.length);

  for (const row of rows) {
    const data = row.structuredData as ProcessStructuredData | null;
    if (!data?.steps?.length) {
      console.log("skip %s — no structured data", row.id);
      continue;
    }
    const recording = await db
      .select({ rawTranscript: recordings.rawTranscript })
      .from(recordings)
      .where(eq(recordings.processId, row.id))
      .limit(1);
    const transcript = recording[0]?.rawTranscript ?? "";

    const stepLines = data.steps.map((s) => `- ${s.name}: ${s.description}`).join("\n");
    const roleLines = data.roles.map((r) => `- ${r.name}: ${r.description}`).join("\n");
    const text = [
      `Summary: ${data.summary}`,
      data.metadata.domain ? `Domain: ${data.metadata.domain}` : "",
      data.metadata.trigger ? `Trigger: ${data.metadata.trigger}` : "",
      data.metadata.end_condition ? `End: ${data.metadata.end_condition}` : "",
      `Roles:\n${roleLines}`,
      `Steps:\n${stepLines}`,
      `Transcript: ${transcript.slice(0, 4000)}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const { embedding } = await embed({
      model: "openai/text-embedding-3-small",
      value: text,
    });
    await db
      .update(processes)
      .set({ embedding, updatedAt: new Date() })
      .where(eq(processes.id, row.id));
    console.log("✓ embedded %s (%d chars → %d dims)", row.id, text.length, embedding.length);
  }

  const total = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(processes)
    .where(sql`${processes.embedding} IS NOT NULL`);
  console.log("done. processes with embeddings:", total[0].n);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
