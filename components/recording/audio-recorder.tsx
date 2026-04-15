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

  const handleStart = async () => {
    await deepgram.connect();
    await recorder.startRecording();
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

  if (!recorder.isRecording) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Input
          placeholder="Process name (e.g., Sample Receipt QC)"
          value={processName}
          onChange={(e) => setProcessName(e.target.value)}
          className="bg-slate-800 border-slate-700"
        />
        <Button
          onClick={handleStart}
          size="lg"
          className="w-full bg-indigo-600 hover:bg-indigo-700"
        >
          Start Recording
        </Button>
        {recorder.error && (
          <p className="text-sm text-red-400">{recorder.error}</p>
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
