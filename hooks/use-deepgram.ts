"use client";

import { useState, useRef, useCallback } from "react";
import {
  DeepgramClient,
  ListenV1SmartFormat,
  ListenV1InterimResults,
  ListenV1VadEvents,
} from "@deepgram/sdk";

// Infer the connection type from the client to avoid deep import paths
type DeepgramConnection = Awaited<
  ReturnType<InstanceType<typeof DeepgramClient>["listen"]["v1"]["connect"]>
>;

export function useDeepgram() {
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const connectionRef = useRef<DeepgramConnection | null>(null);

  const connect = useCallback(async () => {
    setError(null);
    console.log("[deepgram] fetching token...");

    const res = await fetch("/api/deepgram/token");
    if (!res.ok) {
      const msg = `Token endpoint returned ${res.status}`;
      console.error("[deepgram]", msg);
      setError(msg);
      throw new Error(msg);
    }
    const { key } = await res.json();
    if (!key || typeof key !== "string" || key.length < 10) {
      const msg = "Deepgram API key is missing or invalid in server env";
      console.error("[deepgram]", msg);
      setError(msg);
      throw new Error(msg);
    }
    console.log("[deepgram] got token, connecting...");

    const client = new DeepgramClient({ apiKey: key });
    const connection = await client.listen.v1.connect({
      Authorization: `Token ${key}`,
      model: "nova-3",
      language: "en",
      smart_format: ListenV1SmartFormat.True,
      interim_results: ListenV1InterimResults.True,
      utterance_end_ms: 1000,
      vad_events: ListenV1VadEvents.True,
      endpointing: 300,
    });

    connection.on("open", () => {
      console.log("[deepgram] socket open");
      setIsConnected(true);
    });

    connection.on("message", (data) => {
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

    connection.on("error", (err) => {
      console.error("[deepgram] error event:", err);
      setError(err instanceof Error ? err.message : "Deepgram connection error");
    });

    connection.on("close", () => {
      console.log("[deepgram] socket closed");
      setIsConnected(false);
    });

    connectionRef.current = connection;

    // Wait for the WebSocket to fully open, with a 10-second timeout.
    // Without a timeout, an auth failure would hang the UI forever.
    await Promise.race([
      connection.waitForOpen(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Deepgram connection timed out after 10s")), 10_000)
      ),
    ]);
    console.log("[deepgram] ready to send audio");
  }, []);

  const sendAudio = useCallback((data: Blob) => {
    const conn = connectionRef.current;
    if (!conn) return;
    // Guard: drop audio if socket closed mid-stream
    if (conn.readyState !== 1 /* WebSocket.OPEN */) return;
    conn.sendMedia(data);
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
    error,
    connect,
    sendAudio,
    disconnect,
    resetTranscript,
  };
}
