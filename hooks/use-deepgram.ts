"use client";

import { useState, useRef, useCallback } from "react";
import {
  DefaultDeepgramClient,
  ListenV1SmartFormat,
  ListenV1InterimResults,
  ListenV1VadEvents,
} from "@deepgram/sdk";

// Infer the connection type from the client to avoid deep import paths
type DeepgramConnection = Awaited<
  ReturnType<InstanceType<typeof DefaultDeepgramClient>["listen"]["v1"]["connect"]>
>;

export function useDeepgram() {
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const connectionRef = useRef<DeepgramConnection | null>(null);

  const connect = useCallback(async () => {
    const res = await fetch("/api/deepgram/token");
    const { key } = await res.json();

    const client = new DefaultDeepgramClient({ apiKey: key });
    const connection = await client.listen.v1.connect({
      Authorization: key,
      model: "nova-3",
      language: "en",
      smart_format: ListenV1SmartFormat.True,
      interim_results: ListenV1InterimResults.True,
      utterance_end_ms: 1000,
      vad_events: ListenV1VadEvents.True,
      endpointing: 300,
    });

    connection.on("open", () => {
      setIsConnected(true);
    });

    connection.on("message", (data) => {
      // data is ListenV1Results | ListenV1Metadata | ListenV1UtteranceEnd | ListenV1SpeechStarted
      const result = data as {
        type?: string;
        is_final?: boolean;
        channel?: { alternatives?: { transcript?: string }[] };
      };
      if (result.type === "Results") {
        const text = result.channel?.alternatives?.[0]?.transcript ?? "";
        if (result.is_final) {
          if (text) {
            setTranscript((prev) => (prev ? prev + " " + text : text));
          }
          setInterimText("");
        } else {
          setInterimText(text);
        }
      }
    });

    connection.on("error", (error) => {
      console.error("Deepgram error:", error);
    });

    connection.on("close", () => {
      setIsConnected(false);
    });

    connectionRef.current = connection;
  }, []);

  const sendAudio = useCallback((data: Blob) => {
    if (connectionRef.current) {
      connectionRef.current.sendMedia(data);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (connectionRef.current) {
      connectionRef.current.close();
      connectionRef.current = null;
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimText("");
  }, []);

  return {
    transcript,
    interimText,
    fullText: transcript + (interimText ? " " + interimText : ""),
    isConnected,
    connect,
    sendAudio,
    disconnect,
    resetTranscript,
  };
}
