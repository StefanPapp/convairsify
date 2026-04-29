"use client";

import Link from "next/link";
import { useRelatedProcesses } from "@/hooks/use-processes";

export function RelatedProcesses({ processId }: { processId: string }) {
  const { data, isLoading } = useRelatedProcesses(processId);
  if (isLoading) return null;
  const related = data ?? [];
  if (related.length === 0) return null;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-sm">
      <p className="text-slate-500 text-xs uppercase mb-3">Related processes</p>
      <ul className="space-y-2">
        {related.map((r) => (
          <li key={r.id}>
            <Link
              href={`/process/${r.id}`}
              className="flex items-center justify-between gap-3 rounded-md p-2 -mx-2 hover:bg-slate-700/50"
            >
              <div className="min-w-0">
                <p className="text-slate-200 font-medium truncate">{r.name}</p>
                {r.description && (
                  <p className="text-xs text-slate-500 line-clamp-2">{r.description}</p>
                )}
              </div>
              <span className="shrink-0 text-xs text-indigo-300 tabular-nums">
                {Math.round(r.similarity * 100)}%
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
