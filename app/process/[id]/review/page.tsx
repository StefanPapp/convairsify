"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProcess, useSubmitClarification, useRestartProcess } from "@/hooks/use-processes";
import { QuestionList } from "@/components/clarification/question-list";
import { Skeleton } from "@/components/ui/skeleton";

type StructuredDataShape = {
  pendingQuestions?: {
    id: string;
    text: string;
    context: string;
    gap_type: string;
  }[];
  progress?: {
    stage: string;
    message: string;
    at: string;
  };
};

const STAGE_ORDER = ["finalize", "analyze", "questions", "waiting", "structuring", "storing", "complete"];
const STALL_TIMEOUT_MS = 90_000;

export default function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: process, isLoading } = useProcess(id, { poll: true });
  const submitClarification = useSubmitClarification(id);
  const restartProcess = useRestartProcess(id);
  const [stalled, setStalled] = useState(false);
  const lastProgressRef = useRef<string | null>(null);
  const stallTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Detect stalled workflows: if progress doesn't change for STALL_TIMEOUT_MS, show error
  useEffect(() => {
    if (!process || process.status === "complete") return;
    const data = process.structuredData as StructuredDataShape | null;
    const progressKey = data?.progress?.stage ?? null;

    if (progressKey !== lastProgressRef.current) {
      lastProgressRef.current = progressKey;
      setStalled(false);
      clearTimeout(stallTimerRef.current);
    }

    stallTimerRef.current = setTimeout(() => setStalled(true), STALL_TIMEOUT_MS);
    return () => clearTimeout(stallTimerRef.current);
  }, [process]);

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto p-4 space-y-4">
        <Skeleton className="h-8 bg-slate-800" />
        <Skeleton className="h-32 bg-slate-800" />
        <Skeleton className="h-32 bg-slate-800" />
      </div>
    );
  }

  if (!process) {
    return <div className="p-4 text-slate-400">Process not found</div>;
  }

  if (process.status === "complete") {
    router.replace(`/process/${id}`);
    return null;
  }

  const data = process.structuredData as StructuredDataShape | null;
  const questions = data?.pendingQuestions ?? [];
  const progress = data?.progress;
  const errorMessage = (data as { error?: string } | null)?.error;

  if (process.status === "failed" || errorMessage) {
    const hasInput = !!(data as { _input?: unknown } | null)?._input;
    return (
      <div className="max-w-lg mx-auto p-8 space-y-6">
        <div className="text-center space-y-3">
          <p className="text-red-400 font-medium">Processing failed</p>
          <p className="text-sm text-red-300/70">{errorMessage ?? "Unknown error"}</p>
        </div>
        <div className="flex gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-slate-700 bg-transparent px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
          >
            Back to home
          </Link>
          {hasInput ? (
            <button
              onClick={() => {
                restartProcess.mutate(undefined, {
                  onSuccess: () => setStalled(false),
                });
              }}
              disabled={restartProcess.isPending}
              className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {restartProcess.isPending ? "Restarting..." : "Restart"}
            </button>
          ) : (
            <Link
              href="/record"
              className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Record again
            </Link>
          )}
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    if (stalled) {
      return (
        <div className="max-w-lg mx-auto p-8 space-y-6">
          <div className="text-center space-y-3">
            <p className="text-red-400 font-medium">Workflow appears to have stalled</p>
            <p className="text-sm text-red-300/70">
              No progress received. The workflow may have failed or the dev server was restarted.
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-md border border-slate-700 bg-transparent px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
            >
              Back to home
            </Link>
            <Link
              href="/record"
              className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Try again
            </Link>
          </div>
        </div>
      );
    }

    const stageIndex = progress ? STAGE_ORDER.indexOf(progress.stage) : -1;
    const percent = stageIndex >= 0 ? ((stageIndex + 1) / STAGE_ORDER.length) * 100 : 8;
    return (
      <div className="max-w-lg mx-auto p-8 space-y-6">
        <div className="text-center">
          <p className="text-slate-200 font-medium">
            {progress?.message ?? "Starting AI analysis..."}
          </p>
          <p className="text-sm text-slate-500 mt-2">
            {progress?.stage
              ? `Stage: ${progress.stage}`
              : "This usually takes 15-30 seconds"}
          </p>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 transition-all duration-500 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    );
  }

  const handleComplete = async (answers: { question: string; answer: string }[]) => {
    await submitClarification.mutateAsync(answers);
    router.push(`/process/${id}`);
  };

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur border-b border-slate-800 px-4 py-4">
        <div className="flex justify-between items-center max-w-lg mx-auto">
          <Link href="/" className="text-sm text-slate-400">Back</Link>
          <h1 className="text-base font-semibold">AI has questions</h1>
          <div className="w-10" />
        </div>
        <p className="text-xs text-slate-400 text-center mt-1">{process.name}</p>
      </div>

      <div className="max-w-lg mx-auto p-4">
        <QuestionList
          questions={questions}
          onComplete={handleComplete}
          isSubmitting={submitClarification.isPending}
        />
      </div>
    </div>
  );
}
