"use client";

import type { ProcessStructuredData } from "@/lib/ai/schemas";

const roleColors = [
  "bg-indigo-900/50 text-indigo-300",
  "bg-orange-900/50 text-orange-300",
  "bg-emerald-900/50 text-emerald-300",
  "bg-pink-900/50 text-pink-300",
  "bg-cyan-900/50 text-cyan-300",
];

export function StepTimeline({ data }: { data: ProcessStructuredData }) {
  const roleNameMap = new Map(data.roles.map((r) => [r.id, r.name]));

  return (
    <div className="space-y-1">
      {data.steps.map((step, index) => (
        <div key={step.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            {step.type === "decision" ? (
              <div className="w-7 h-7 bg-amber-900/50 rounded-md rotate-45 flex items-center justify-center shrink-0">
                <span className="-rotate-45 text-amber-300 text-[10px] font-bold">
                  D{data.steps.filter((s, i2) => i2 <= index && s.type === "decision").length}
                </span>
              </div>
            ) : (
              <div className="w-7 h-7 bg-indigo-900/50 rounded-full flex items-center justify-center shrink-0">
                <span className="text-indigo-300 text-xs font-semibold">{step.order}</span>
              </div>
            )}
            {index < data.steps.length - 1 && (
              <div className="w-0.5 flex-1 bg-slate-700 min-h-[8px]" />
            )}
          </div>

          <div className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-3 mb-2">
            <div className="font-medium text-sm text-slate-100">{step.name}</div>
            <div className="text-xs text-slate-400 mt-1">
              {roleNameMap.get(step.actor_role) ?? step.actor_role}
              {step.duration_estimate && ` \u00b7 ${step.duration_estimate}`}
            </div>
            {step.type === "decision" && step.branches && (
              <div className="text-xs text-amber-300/80 mt-1">
                {step.branches.map((b) => b.label).join(" \u00b7 ")}
              </div>
            )}
            {step.description !== step.name && (
              <p className="text-xs text-slate-500 mt-1">{step.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
