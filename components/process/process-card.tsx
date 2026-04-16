"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { Process } from "@/lib/db/schema";
import type { ProcessStructuredData } from "@/lib/ai/schemas";

const statusConfig = {
  draft: { label: "Draft", className: "bg-amber-900/50 text-amber-300 border-amber-700" },
  reviewing: { label: "Reviewing", className: "bg-purple-900/50 text-purple-300 border-purple-700" },
  complete: { label: "Complete", className: "bg-emerald-900/50 text-emerald-300 border-emerald-700" },
};

export function ProcessCard({ process }: { process: Process }) {
  const config = statusConfig[process.status];
  const data = process.structuredData as ProcessStructuredData | null;
  const stepCount = data?.steps?.length ?? 0;
  const decisionCount = data?.steps?.filter((s) => s.type === "decision").length ?? 0;

  // Compute timeAgo only on the client after mount — avoids SSR/hydration mismatch
  // where Date.now() differs between server render and client hydration.
  const [timeAgo, setTimeAgo] = useState<string | null>(null);
  useEffect(() => {
    setTimeAgo(getTimeAgo(new Date(process.updatedAt)));
  }, [process.updatedAt]);

  return (
    <Link href={`/process/${process.id}`}>
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-colors">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-slate-100">{process.name}</h3>
            <p className="text-xs text-slate-400 mt-1">
              {stepCount > 0
                ? `${stepCount} steps \u00b7 ${decisionCount} decision points`
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
