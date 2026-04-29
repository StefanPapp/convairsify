"use client";

import { useRecording } from "@/hooks/use-processes";

type QAPair = { question: string; answer: string };

export function ClarificationsList({ processId }: { processId: string }) {
  const { data: recording, isLoading, error } = useRecording(processId);

  if (isLoading) return null;
  if (error || !recording) return null;

  const qa = (recording.clarificationQa as QAPair[] | null) ?? [];
  if (qa.length === 0) return null;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-sm">
      <p className="text-slate-500 text-xs uppercase mb-3">
        Your clarifications &middot; {qa.length}
      </p>
      <ul className="space-y-3">
        {qa.map((pair, i) => (
          <li key={i} className="space-y-1">
            <p className="text-slate-300 font-medium">{pair.question}</p>
            <p className="text-slate-400 italic">&ldquo;{pair.answer}&rdquo;</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
