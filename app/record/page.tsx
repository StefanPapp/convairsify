"use client";

import Link from "next/link";
import { AudioRecorder } from "@/components/recording/audio-recorder";

export default function RecordPage() {
  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur border-b border-slate-800 px-4 py-4">
        <div className="flex justify-between items-center max-w-lg mx-auto">
          <Link href="/" className="text-sm text-slate-400 hover:text-slate-200">
            Back
          </Link>
          <h1 className="text-base font-semibold">New Recording</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-lg mx-auto">
        <AudioRecorder />
      </div>
    </div>
  );
}
