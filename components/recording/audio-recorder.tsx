"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { useDeepgram } from "@/hooks/use-deepgram";
import { useCreateProcess } from "@/hooks/use-processes";
import { LiveTranscript } from "./live-transcript";
import { RecordingControls } from "./recording-controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { validateProcessName } from "@/lib/validate-process-name";

export function AudioRecorder() {
  const router = useRouter();
  const [processName, setProcessName] = useState("");
  const deepgram = useDeepgram();
  const createProcess = useCreateProcess();

  const onAudioData = useCallback(
    (data: Blob) => {
      deepgram.sendAudio(data);
    },
    [deepgram]
  );

  const recorder = useAudioRecorder(onAudioData);

  const [startError, setStartError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const handleStart = async () => {
    setStartError(null);
    setIsStarting(true);
    try {
      await deepgram.connect();
      await recorder.startRecording();
    } catch (err) {
      console.error("Failed to start recording:", err);
      setStartError(err instanceof Error ? err.message : "Failed to start recording");
    } finally {
      setIsStarting(false);
    }
  };

  const handleStop = async () => {
    recorder.stopRecording();
    deepgram.disconnect();

    if (!deepgram.transcript.trim()) return;

    const result = await createProcess.mutateAsync({
      name: processName || "Untitled Process",
      transcript: deepgram.transcript,
      durationSeconds: recorder.duration,
    });

    router.push(`/process/${result.id}/review`);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    if (text.trim().length < 10) {
      setStartError("File must contain at least 10 characters of text.");
      return;
    }

    setStartError(null);
    const result = await createProcess.mutateAsync({
      name: processName || file.name.replace(/\.[^.]+$/, "") || "Untitled Process",
      transcript: text.trim(),
      durationSeconds: 0,
    });

    router.push(`/process/${result.id}/review`);
  };

  if (!recorder.isRecording) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <div>
          <Input
            placeholder="Process name (e.g., Sample Receipt QC)"
            value={processName}
            onChange={(e) => setProcessName(e.target.value)}
            className="bg-slate-800 border-slate-700"
          />
          {validateProcessName(processName) ? (
            <p className="mt-1.5 text-xs text-amber-400">{validateProcessName(processName)}</p>
          ) : (
            <p className="mt-1.5 text-xs text-slate-500">Use a universally recognizable name that anyone in your org would understand.</p>
          )}
        </div>
        <Button
          onClick={handleStart}
          size="lg"
          disabled={isStarting || createProcess.isPending}
          className="w-full bg-indigo-600 hover:bg-indigo-700"
        >
          {isStarting ? "Connecting..." : "Start Recording"}
        </Button>
        <div className="relative flex items-center gap-3">
          <div className="flex-1 border-t border-slate-700" />
          <span className="text-xs text-slate-500 uppercase">or</span>
          <div className="flex-1 border-t border-slate-700" />
        </div>
        <label
          className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 w-full border border-slate-700 hover:bg-slate-800 h-11 px-8 cursor-pointer ${
            isStarting || createProcess.isPending ? "pointer-events-none opacity-50" : ""
          }`}
        >
          {createProcess.isPending ? "Uploading..." : "Upload Text Manually"}
          <input
            type="file"
            accept=".txt,.md,text/plain"
            className="hidden"
            onChange={handleFileUpload}
          />
        </label>
        {(recorder.error || startError || deepgram.error || createProcess.error) && (
          <p className="text-sm text-red-400">
            {recorder.error ?? startError ?? deepgram.error ?? createProcess.error?.message}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <RecordingControls
        isRecording={recorder.isRecording}
        isPaused={recorder.isPaused}
        duration={recorder.duration}
        onPause={recorder.pauseRecording}
        onResume={recorder.resumeRecording}
        onStop={handleStop}
      />
      <LiveTranscript
        transcript={deepgram.transcript}
        interimText={deepgram.interimText}
      />
    </div>
  );
}
