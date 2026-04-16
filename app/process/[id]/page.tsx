"use client";

import { use } from "react";
import Link from "next/link";
import { useProcess } from "@/hooks/use-processes";
import { StepTimeline } from "@/components/process/step-timeline";
import { RoleBadges } from "@/components/process/role-badges";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProcessStructuredData } from "@/lib/ai/schemas";

export default function ProcessViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  // Poll until the process is structured (status becomes "complete" with structuredData)
  const { data: process, isLoading } = useProcess(id, { poll: true });

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

  const data = process.structuredData as ProcessStructuredData | null;

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
          <Link href={`/process/${id}/edit`} className="text-sm text-indigo-400">
            Edit
          </Link>
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
          <div className="text-center py-12 text-slate-500">
            <p>Process is still being structured...</p>
            <p className="text-sm mt-1">Check back in a moment</p>
          </div>
        )}
      </div>
    </div>
  );
}
