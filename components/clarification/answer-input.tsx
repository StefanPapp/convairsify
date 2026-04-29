"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square, Volume2, VolumeX } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useDeepgram } from "@/hooks/use-deepgram";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";

type Props = {
  questionText: string;
  questionContext?: string;
  onSubmit: (answer: string) => void;
};

export function AnswerInput({ questionText, questionContext, onSubmit }: Props) {
  const [text, setText] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const baseTextRef = useRef("");
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const dg = useDeepgram();
  const recorder = useAudioRecorder(dg.sendAudio);
  const isRecording = recorder.isRecording;

  // While recording, mirror the live transcript into the textarea.
  useEffect(() => {
    if (!isRecording) return;
    const live = dg.fullText.trim();
    setText(live ? `${baseTextRef.current}${baseTextRef.current ? " " : ""}${live}` : baseTextRef.current);
  }, [dg.fullText, isRecording]);

  // Stop TTS and any active recording on unmount.
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") window.speechSynthesis.cancel();
      recorder.stopRecording();
      dg.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = () => {
    if (!text.trim()) return;
    if (isRecording) handleStopRecording();
    if (isSpeaking) handleStopSpeaking();
    onSubmit(text.trim());
    setText("");
    baseTextRef.current = "";
  };

  const handleSpeak = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setVoiceError("Text-to-speech is not supported in this browser.");
      return;
    }
    if (isSpeaking) {
      handleStopSpeaking();
      return;
    }
    setVoiceError(null);
    window.speechSynthesis.cancel();
    const speakable = questionContext?.trim()
      ? `${questionText}\n\n${questionContext}`
      : questionText;
    const utterance = new SpeechSynthesisUtterance(speakable);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    utteranceRef.current = utterance;
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleStopSpeaking = () => {
    if (typeof window !== "undefined") window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const handleStartRecording = async () => {
    try {
      setVoiceError(null);
      baseTextRef.current = text;
      dg.resetTranscript();
      await dg.connect();
      await recorder.startRecording();
    } catch (err) {
      setVoiceError(err instanceof Error ? err.message : "Could not start recording");
      recorder.stopRecording();
      dg.disconnect();
    }
  };

  const handleStopRecording = () => {
    recorder.stopRecording();
    dg.disconnect();
  };

  const toggleRecording = () => {
    if (isRecording) handleStopRecording();
    else void handleStartRecording();
  };

  return (
    <div className="mt-3 space-y-2">
      <div className="flex gap-2">
        <Textarea
          placeholder={isRecording ? "Listening..." : "Type or speak your answer..."}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            baseTextRef.current = e.target.value;
          }}
          className="bg-slate-900 border-slate-600 text-sm min-h-[44px] resize-none"
          rows={2}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        <Button onClick={handleSubmit} size="sm" className="self-end bg-indigo-600">
          Send
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          onClick={handleSpeak}
          size="sm"
          variant="outline"
          className="border-slate-600 bg-slate-900 text-slate-200 hover:bg-slate-800"
          aria-label={isSpeaking ? "Stop reading question" : "Read question aloud"}
        >
          {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          <span className="ml-1 text-xs">{isSpeaking ? "Stop" : "Read aloud"}</span>
        </Button>
        <Button
          type="button"
          onClick={toggleRecording}
          size="sm"
          variant="outline"
          className={`border-slate-600 bg-slate-900 text-slate-200 hover:bg-slate-800 ${
            isRecording ? "border-red-500 text-red-400" : ""
          }`}
          aria-label={isRecording ? "Stop voice answer" : "Answer by voice"}
        >
          {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          <span className="ml-1 text-xs">{isRecording ? "Stop" : "Speak answer"}</span>
        </Button>
        {isRecording && !dg.isConnected && (
          <span className="text-xs text-slate-500">Connecting...</span>
        )}
        {isRecording && dg.isConnected && (
          <span className="text-xs text-red-400">● Listening</span>
        )}
      </div>
      {(voiceError || dg.error) && (
        <p className="text-xs text-red-400">{voiceError ?? dg.error}</p>
      )}
    </div>
  );
}
