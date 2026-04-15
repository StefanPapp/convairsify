import { generateText, Output } from "ai";
import { clarificationQuestionsSchema, type ClarificationQuestions, type GapAnalysis } from "@/lib/ai/schemas";
import { GENERATE_QUESTIONS_PROMPT } from "@/lib/ai/prompts";

export async function generateQuestions(gapAnalysis: GapAnalysis, transcript: string): Promise<ClarificationQuestions> {
  "use step";
  console.log("[generateQuestions] Generating questions for %d gaps", gapAnalysis.gaps.length);
  const { output } = await generateText({
    model: "anthropic/claude-sonnet-4.6",
    system: GENERATE_QUESTIONS_PROMPT,
    prompt: `## Transcript\n${transcript}\n\n## Identified Gaps\n${JSON.stringify(gapAnalysis.gaps, null, 2)}`,
    output: Output.object({ schema: clarificationQuestionsSchema }),
  });
  console.log("[generateQuestions] Generated %d questions", output.questions.length);
  return output;
}
