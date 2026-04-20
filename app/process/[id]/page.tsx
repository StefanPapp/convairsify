"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useProcess, useRestartProcess } from "@/hooks/use-processes";
import { StepTimeline } from "@/components/process/step-timeline";
import { RoleBadges } from "@/components/process/role-badges";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProcessStructuredData } from "@/lib/ai/schemas";

type StructuredOrProgress = Partial<ProcessStructuredData> & {
  progress?: { stage: string; message: string; at: string };
  pendingQuestions?: unknown[];
};

const STAGE_ORDER = ["finalize", "analyze", "questions", "waiting", "structuring", "storing", "complete"];
const STALL_TIMEOUT_MS = 90_000;

export default function ProcessViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: process, isLoading } = useProcess(id, { poll: true });
  const restartProcess = useRestartProcess(id);
  const [stalled, setStalled] = useState(false);
  const lastProgressRef = useRef<string | null>(null);
  const stallTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const raw = process?.structuredData as StructuredOrProgress | null;
  const progress = raw?.progress;

  useEffect(() => {
    if (!process || process.status === "complete") return;
    const progressKey = progress?.stage ?? null;

    if (progressKey !== lastProgressRef.current) {
      lastProgressRef.current = progressKey;
      setStalled(false);
      clearTimeout(stallTimerRef.current);
    }

    stallTimerRef.current = setTimeout(() => setStalled(true), STALL_TIMEOUT_MS);
    return () => clearTimeout(stallTimerRef.current);
  }, [process, progress?.stage]);

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto p-4 space-y-4">
        <Skeleton className="h-8 bg-slate-800" />
        <Skeleton className="h-64 bg-slate-800" />
      </div>
    );
  }

  if (!process) {
    return <div className="p-4 text-slate-400">Process not found</div>;
  }

  const isFullyStructured = Boolean(raw?.steps && raw?.roles && raw?.metadata);
  const data = isFullyStructured ? (raw as ProcessStructuredData) : null;
  const errorMessage = (raw as { error?: string } | null)?.error;

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur border-b border-slate-800 px-4 py-4">
        <div className="flex justify-between items-center max-w-lg mx-auto">
          <Link href="/" className="text-sm text-slate-400">Back</Link>
          <div className="text-center">
            <h1 className="text-base font-semibold">{process.name}</h1>
            {data && (
              <p className="text-xs text-slate-400 mt-0.5">
                {data.steps.length} steps &middot; {data.roles.length} roles &middot; {data.metadata.estimated_total_duration}
              </p>
            )}
          </div>
          {data ? (
            <Link href={`/process/${id}/edit`} className="text-sm text-indigo-400">
              Edit
            </Link>
          ) : (
            <div className="w-10" />
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {data ? (
          <>
            <RoleBadges data={data} />
            <StepTimeline data={data} />
            {data.metadata.trigger && (
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-sm">
                <p className="text-slate-500 text-xs uppercase mb-1">Trigger</p>
                <p className="text-slate-300">{data.metadata.trigger}</p>
                <p className="text-slate-500 text-xs uppercase mt-3 mb-1">End condition</p>
                <p className="text-slate-300">{data.metadata.end_condition}</p>
              </div>
            )}
          </>
        ) : (
          <ProgressView
            progress={progress}
            stalled={stalled}
            errorMessage={errorMessage}
            failed={process.status === "failed"}
            hasInput={!!(raw as { _input?: unknown } | null)?._input}
            onRestart={() => restartProcess.mutate(undefined, { onSuccess: () => setStalled(false) })}
            isRestarting={restartProcess.isPending}
          />
        )}
      </div>
    </div>
  );
}

function ProgressView({
  progress,
  stalled,
  failed,
  errorMessage,
  hasInput,
  onRestart,
  isRestarting,
}: {
  progress?: { stage: string; message: string; at: string };
  stalled: boolean;
  failed: boolean;
  errorMessage?: string;
  hasInput: boolean;
  onRestart: () => void;
  isRestarting: boolean;
}) {
  if (failed || stalled) {
    return (
      <div className="py-12 space-y-6">
        <div className="text-center space-y-3">
          <p className="text-red-400 font-medium">
            {failed ? "Processing failed" : "Workflow appears to have stalled"}
          </p>
          <p className="text-sm text-red-300/70">
            {errorMessage ?? "No progress received. The workflow may have failed or the dev server was restarted."}
          </p>
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
              onClick={onRestart}
              disabled={isRestarting}
              className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isRestarting ? "Restarting..." : "Restart"}
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

  const stageIndex = progress ? STAGE_ORDER.indexOf(progress.stage) : -1;
  const percent = stageIndex >= 0 ? ((stageIndex + 1) / STAGE_ORDER.length) * 100 : 8;
  return (
    <div className="py-12 space-y-6">
      <div className="text-center">
        <p className="text-slate-200 font-medium">
          {progress?.message ?? "Starting AI analysis..."}
        </p>
        <p className="text-sm text-slate-500 mt-2">
          {progress?.stage ? `Stage: ${progress.stage}` : "Polling for updates..."}
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
