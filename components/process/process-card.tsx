"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useDeleteProcess } from "@/hooks/use-processes";
import type { Process } from "@/lib/db/schema";
import type { ProcessStructuredData } from "@/lib/ai/schemas";

const statusConfig = {
  draft: { label: "Draft", className: "bg-amber-900/50 text-amber-300 border-amber-700" },
  reviewing: { label: "Reviewing", className: "bg-purple-900/50 text-purple-300 border-purple-700" },
  complete: { label: "Complete", className: "bg-emerald-900/50 text-emerald-300 border-emerald-700" },
  failed: { label: "Failed", className: "bg-red-900/50 text-red-300 border-red-700" },
};

export function ProcessCard({ process }: { process: Process }) {
  const config = statusConfig[process.status];
  const deleteProcess = useDeleteProcess();
  const data = process.structuredData as ProcessStructuredData | null;
  const stepCount = data?.steps?.length ?? 0;
  const decisionCount = data?.steps?.filter((s) => s.type === "decision").length ?? 0;

  const [timeAgo, setTimeAgo] = useState<string | null>(null);
  useEffect(() => {
    setTimeAgo(getTimeAgo(new Date(process.updatedAt)));
  }, [process.updatedAt]);

  return (
    <div className="relative group">
      <Link href={`/process/${process.id}`}>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-colors">
          <div className="flex justify-between items-start">
            <div className="min-w-0 flex-1 pr-2">
              <h3 className="font-semibold text-slate-100">{process.name}</h3>
              <p className={`text-xs mt-1 ${process.status === "failed" ? "text-red-400" : "text-slate-400"}`}>
                {stepCount > 0
                  ? `${stepCount} steps \u00b7 ${decisionCount} decision points`
                  : process.status === "failed"
                    ? "Processing failed"
                    : process.status === "reviewing"
                      ? "Awaiting clarification"
                      : "Processing..."}
              </p>
            </div>
            <Badge variant="outline" className={config.className}>
              {config.label}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-2 min-h-[1rem]">
            {timeAgo ? `Updated ${timeAgo}` : "\u00a0"}
          </p>
        </div>
      </Link>
      <button
        onClick={(e) => {
          e.preventDefault();
          if (confirm(`Delete "${process.name}"?`)) {
            deleteProcess.mutate(process.id);
          }
        }}
        className="absolute top-3 right-3 p-1.5 rounded-md text-slate-500 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-slate-700 transition-all"
        aria-label="Delete process"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
