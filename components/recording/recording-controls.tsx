"use client";

import { Button } from "@/components/ui/button";

type Props = {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
};

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function RecordingControls({
  isRecording,
  isPaused,
  duration,
  onPause,
  onResume,
  onStop,
}: Props) {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <div className="text-4xl font-light text-slate-100 tabular-nums">
          {formatDuration(duration)}
        </div>
        <div className="text-sm mt-1">
          {isPaused ? (
            <span className="text-amber-400">Paused</span>
          ) : isRecording ? (
            <span className="text-red-400">Recording</span>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-6">
        <Button
          variant="outline"
          size="lg"
          className="rounded-full w-14 h-14"
          onClick={isPaused ? onResume : onPause}
        >
          {isPaused ? "Resume" : "Pause"}
        </Button>

        <Button
          variant="destructive"
          size="lg"
          className="rounded-full w-16 h-16 text-lg font-semibold shadow-lg shadow-red-500/25"
          onClick={onStop}
        >
          Stop
        </Button>
      </div>
    </div>
  );
}
