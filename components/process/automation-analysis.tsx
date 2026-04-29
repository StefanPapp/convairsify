"use client";

import { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useAutomationAnalysis,
  useRunAutomationAnalysis,
} from "@/hooks/use-processes";
import type { AutomationStep } from "@/lib/ai/schemas";

const CANDIDACY_STYLES: Record<AutomationStep["candidacy"], string> = {
  high: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
  medium: "bg-amber-500/15 text-amber-300 border-amber-500/40",
  low: "bg-slate-500/15 text-slate-300 border-slate-500/40",
  none: "bg-slate-700/40 text-slate-400 border-slate-600",
};

const AGENT_TYPE_LABEL: Record<AutomationStep["agent_type"], string> = {
  llm: "LLM agent",
  rpa: "RPA",
  deterministic: "Rules / code",
  hybrid: "Hybrid",
  none: "Keep human",
};

export function AutomationAnalysisCard({ processId }: { processId: string }) {
  const { data: analysis, isLoading } = useAutomationAnalysis(processId);
  const run = useRunAutomationAnalysis(processId);
  const [expanded, setExpanded] = useState<string | null>(null);

  if (isLoading) return null;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-sm space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-slate-500 text-xs uppercase">Where could AI help?</p>
          <p className="text-slate-300 text-xs mt-1">
            Analyzes each step for AI-agent automation potential.
          </p>
        </div>
        <Button
          onClick={() => run.mutate()}
          disabled={run.isPending}
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <Sparkles className="h-3.5 w-3.5 mr-1" />
          {run.isPending
            ? "Analyzing..."
            : analysis
              ? "Re-analyze"
              : "Analyze automation potential"}
        </Button>
      </div>

      {run.error && (
        <p className="text-xs text-red-400">{(run.error as Error).message}</p>
      )}

      {analysis && (
        <>
          <div className="rounded-md border border-slate-700 bg-slate-900/40 p-3">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-2xl font-semibold text-indigo-300 tabular-nums">
                {analysis.overall.automatable_step_count}
              </span>
              <span className="text-xs text-slate-400">
                of {analysis.overall.total_step_count} steps automatable
              </span>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              {analysis.overall.summary}
            </p>
          </div>

          <ul className="space-y-2">
            {analysis.steps.map((s) => {
              const isOpen = expanded === s.step_id;
              return (
                <li
                  key={s.step_id}
                  className="rounded-md border border-slate-700 bg-slate-900/30"
                >
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : s.step_id)}
                    className="w-full p-3 flex items-start gap-3 text-left hover:bg-slate-800/40"
                  >
                    <span
                      className={`shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${CANDIDACY_STYLES[s.candidacy]}`}
                    >
                      {s.candidacy}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-slate-200 font-medium truncate">
                        {s.step_name}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {AGENT_TYPE_LABEL[s.agent_type]} &middot; {s.reasoning}
                      </p>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-slate-500 shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-500 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-3 pb-3 space-y-2 border-t border-slate-800">
                      {s.prerequisites.length > 0 && (
                        <div>
                          <p className="text-[10px] uppercase text-slate-500 mt-2 mb-1">
                            Prerequisites
                          </p>
                          <ul className="text-xs text-slate-300 space-y-0.5 list-disc list-inside">
                            {s.prerequisites.map((p, i) => (
                              <li key={i}>{p}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {s.risks.length > 0 && (
                        <div>
                          <p className="text-[10px] uppercase text-slate-500 mt-2 mb-1">
                            Risks
                          </p>
                          <ul className="text-xs text-red-300/80 space-y-0.5 list-disc list-inside">
                            {s.risks.map((r, i) => (
                              <li key={i}>{r}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
