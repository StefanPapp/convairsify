import { embed } from "ai";
import type { ProcessStructuredData } from "@/lib/ai/schemas";
import { updateProcessEmbedding } from "@/lib/db/queries";

export async function embedProcess(
  processId: string,
  transcript: string,
  structuredData: ProcessStructuredData
) {
  "use step";
  const text = buildEmbeddingText(transcript, structuredData);
  console.log("[embedProcess] Embedding %d chars for process %s", text.length, processId);
  const { embedding } = await embed({
    model: "openai/text-embedding-3-small",
    value: text,
  });
  await updateProcessEmbedding(processId, embedding);
  console.log("[embedProcess] Stored %d-dim embedding", embedding.length);
  return { success: true };
}

function buildEmbeddingText(transcript: string, data: ProcessStructuredData) {
  const stepLines = data.steps.map((s) => `- ${s.name}: ${s.description}`).join("\n");
  const roleLines = data.roles.map((r) => `- ${r.name}: ${r.description}`).join("\n");
  return [
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
}
