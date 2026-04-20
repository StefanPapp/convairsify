import { createHook, getWritable } from "workflow";
import { getWorkflowMetadata } from "workflow";
import { finalizeTranscript } from "./steps/finalize-transcript";
import { analyzeGaps } from "./steps/analyze-gaps";
import { generateQuestions } from "./steps/generate-questions";
import { structureProcess } from "./steps/structure-process";
import { storeProcess } from "./steps/store-process";
import { getProcess, updateProcess } from "@/lib/db/queries";

type ClarifyPayload = {
  answers: { question: string; answer: string }[];
};

type ProgressUpdate = {
  stage: string;
  message: string;
};

async function writeProgress(
  writable: WritableStream<ProgressUpdate>,
  processId: string,
  stage: string,
  message: string
) {
  "use step";
  console.log("[workflow:progress] %s: %s", stage, message);

  // Stream for any live consumers
  const writer = writable.getWriter();
  try {
    await writer.write({ stage, message });
  } finally {
    writer.releaseLock();
  }

  // Persist to the process record so the polling UI can display it.
  // Merge with any existing structuredData (e.g., pendingQuestions) so we don't lose state.
  const existing = await getProcess(processId);
  const currentData =
    (existing?.structuredData as Record<string, unknown> | null) ?? {};
  await updateProcess(processId, {
    structuredData: {
      ...currentData,
      progress: { stage, message, at: new Date().toISOString() },
    },
  });
}

export async function processRecordingWorkflow(
  processId: string,
  rawTranscript: string,
  durationSeconds: number
) {
  "use workflow";

  const { workflowRunId: runId } = getWorkflowMetadata();
  const writable = getWritable<ProgressUpdate>();

  try {
    // Step 1: Finalize transcript
    await writeProgress(writable, processId, "finalize", "Cleaning up transcript...");
    const cleanedTranscript = await finalizeTranscript(rawTranscript);

    // Step 2: Analyze gaps
    await writeProgress(writable, processId, "analyze", "Analyzing for gaps and ambiguities...");
    const gapAnalysis = await analyzeGaps(cleanedTranscript);

    // Step 3: Generate questions (if gaps found)
    let clarificationQa: { question: string; answer: string }[] = [];

    if (gapAnalysis.gaps.length > 0) {
      await writeProgress(
        writable,
        processId,
        "questions",
        `Found ${gapAnalysis.gaps.length} areas needing clarification...`
      );
      const questions = await generateQuestions(gapAnalysis, cleanedTranscript);

      // Update process status and store questions
      await updateProcessStatus(processId, questions.questions);

      // Pause workflow — wait for user to answer questions
      await writeProgress(writable, processId, "waiting", "Waiting for your answers...");
      const hook = createHook<ClarifyPayload>({ token: `clarify-${processId}` });
      const payload = await hook;
      clarificationQa = payload.answers;
    }

    // Step 4: Structure the process
    await writeProgress(writable, processId, "structuring", "Building structured process model...");
    const structuredData = await structureProcess(cleanedTranscript, clarificationQa);

    // Step 5: Store
    await writeProgress(writable, processId, "storing", "Saving structured process...");
    await storeProcess(processId, structuredData, cleanedTranscript, clarificationQa, durationSeconds, runId);

    return { success: true, processId };
  } catch (error) {
    await markProcessFailed(processId, error);
    throw error;
  }
}

async function markProcessFailed(processId: string, error: unknown) {
  "use step";
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error("[markProcessFailed] Process %s failed: %s", processId, message);
  const existing = await getProcess(processId);
  const currentData = (existing?.structuredData as Record<string, unknown> | null) ?? {};
  await updateProcess(processId, {
    status: "failed",
    structuredData: { _input: currentData._input, error: message },
  });
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
