import { generateText, Output } from "ai";
import { processStructuredDataSchema, type ProcessStructuredData } from "@/lib/ai/schemas";
import { STRUCTURE_PROCESS_PROMPT } from "@/lib/ai/prompts";

type QAPair = { question: string; answer: string };

export async function structureProcess(transcript: string, clarificationQa: QAPair[]): Promise<ProcessStructuredData> {
  "use step";
  console.log("[structureProcess] Structuring with %d QA pairs", clarificationQa.length);
  const qaSection = clarificationQa.length > 0
    ? `\n\n## Clarification Q&A\n${clarificationQa.map((qa) => `Q: ${qa.question}\nA: ${qa.answer}`).join("\n\n")}`
    : "";
  const { output } = await generateText({
    model: "anthropic/claude-sonnet-4.6",
    system: STRUCTURE_PROCESS_PROMPT,
    prompt: `## Process Transcript\n${transcript}${qaSection}`,
    output: Output.object({ schema: processStructuredDataSchema }),
  });
  console.log("[structureProcess] Produced %d steps, %d roles", output.steps.length, output.roles.length);
  return output;
}
