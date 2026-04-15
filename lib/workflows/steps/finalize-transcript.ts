import { generateText } from "ai";
import { FINALIZE_TRANSCRIPT_PROMPT } from "@/lib/ai/prompts";

export async function finalizeTranscript(rawTranscript: string) {
  "use step";
  console.log("[finalizeTranscript] Cleaning transcript (%d chars)", rawTranscript.length);
  const { text } = await generateText({
    model: "anthropic/claude-sonnet-4.6",
    system: FINALIZE_TRANSCRIPT_PROMPT,
    prompt: rawTranscript,
    maxOutputTokens: 8192,
  });
  console.log("[finalizeTranscript] Done (%d chars)", text.length);
  return text;
}
