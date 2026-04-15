"use client";

import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

type Props = {
  transcript: string;
  interimText: string;
};

export function LiveTranscript({ transcript, interimText }: Props) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript, interimText]);

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800">
      <div className="px-4 py-2 border-b border-slate-700">
        <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
          Live Transcript
        </span>
      </div>
      <ScrollArea className="h-48 p-4">
        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
          {transcript}
          {interimText && (
            <span className="text-indigo-400 bg-indigo-500/10 rounded px-0.5">
              {interimText}
            </span>
          )}
          {!transcript && !interimText && (
            <span className="text-slate-500">
              Start speaking to see your transcript here...
            </span>
          )}
        </p>
        <div ref={endRef} />
      </ScrollArea>
    </div>
  );
}
