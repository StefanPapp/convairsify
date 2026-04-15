import { generateText, Output } from "ai";
import { gapAnalysisSchema, type GapAnalysis } from "@/lib/ai/schemas";
import { ANALYZE_GAPS_PROMPT } from "@/lib/ai/prompts";

export async function analyzeGaps(transcript: string): Promise<GapAnalysis> {
  "use step";
  console.log("[analyzeGaps] Starting gap analysis");
  const { output } = await generateText({
    model: "anthropic/claude-sonnet-4.6",
    system: ANALYZE_GAPS_PROMPT,
    prompt: transcript,
    output: Output.object({ schema: gapAnalysisSchema }),
  });
  console.log("[analyzeGaps] Found %d gaps", output.gaps.length);
  return output;
}
