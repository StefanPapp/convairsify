import { updateProcess, createRecording } from "@/lib/db/queries";
import type { ProcessStructuredData } from "@/lib/ai/schemas";

export async function storeProcess(
  processId: string,
  structuredData: ProcessStructuredData,
  transcript: string,
  clarificationQa: { question: string; answer: string }[],
  durationSeconds: number,
  workflowRunId: string
) {
  "use step";
  console.log("[storeProcess] Saving process %s (%d steps)", processId, structuredData.steps.length);
  await updateProcess(processId, { structuredData, status: "complete" });
  await createRecording({ processId, rawTranscript: transcript, durationSeconds, clarificationQa, workflowRunId });
  console.log("[storeProcess] Done");
  return { success: true };
}
