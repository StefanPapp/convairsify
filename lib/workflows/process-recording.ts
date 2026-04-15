import { createHook, getWritable } from "workflow";
import { getWorkflowMetadata } from "workflow";
import { finalizeTranscript } from "./steps/finalize-transcript";
import { analyzeGaps } from "./steps/analyze-gaps";
import { generateQuestions } from "./steps/generate-questions";
import { structureProcess } from "./steps/structure-process";
import { storeProcess } from "./steps/store-process";
import { updateProcess } from "@/lib/db/queries";

type ClarifyPayload = {
  answers: { question: string; answer: string }[];
};

type ProgressUpdate = {
  stage: string;
  message: string;
};

async function writeProgress(writable: WritableStream<ProgressUpdate>, stage: string, message: string) {
  "use step";
  console.log("[workflow:progress] %s: %s", stage, message);
  const writer = writable.getWriter();
  try {
    await writer.write({ stage, message });
  } finally {
    writer.releaseLock();
  }
}

export async function processRecordingWorkflow(
  processId: string,
  rawTranscript: string,
  durationSeconds: number
) {
  "use workflow";

  const { runId } = getWorkflowMetadata();
  const writable = getWritable<ProgressUpdate>();

  // Step 1: Finalize transcript
  await writeProgress(writable, "finalize", "Cleaning up transcript...");
  const cleanedTranscript = await finalizeTranscript(rawTranscript);

  // Step 2: Analyze gaps
  await writeProgress(writable, "analyze", "Analyzing for gaps and ambiguities...");
  const gapAnalysis = await analyzeGaps(cleanedTranscript);

  // Step 3: Generate questions (if gaps found)
  let clarificationQa: { question: string; answer: string }[] = [];

  if (gapAnalysis.gaps.length > 0) {
    await writeProgress(writable, "questions", `Found ${gapAnalysis.gaps.length} areas needing clarification...`);
    const questions = await generateQuestions(gapAnalysis, cleanedTranscript);

    // Update process status and store questions
    await updateProcessStatus(processId, questions.questions);

    // Pause workflow — wait for user to answer questions
    await writeProgress(writable, "waiting", "Waiting for your answers...");
    const hook = createHook<ClarifyPayload>({ token: `clarify-${processId}` });
    const payload = await hook;
    clarificationQa = payload.answers;
  }

  // Step 4: Structure the process
  await writeProgress(writable, "structuring", "Building structured process model...");
  const structuredData = await structureProcess(cleanedTranscript, clarificationQa);

  // Step 5: Store
  await writeProgress(writable, "storing", "Saving structured process...");
  await storeProcess(processId, structuredData, cleanedTranscript, clarificationQa, durationSeconds, runId);

  await writeProgress(writable, "complete", "Process structured successfully!");
  return { success: true, processId };
}

async function updateProcessStatus(
  processId: string,
  questions: { id: string; text: string; context: string; gap_type: string }[]
) {
  "use step";
  console.log("[updateProcessStatus] Setting process %s to reviewing with %d questions", processId, questions.length);
  await updateProcess(processId, { status: "reviewing" });
  await updateProcess(processId, {
    structuredData: { pendingQuestions: questions } as unknown,
  });
}
