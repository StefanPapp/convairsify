"use client";

import Link from "next/link";
import { useProcesses } from "@/hooks/use-processes";
import { ProcessCard } from "@/components/process/process-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

export default function HomePage() {
  const { data: processes, isLoading } = useProcesses();
  const [search, setSearch] = useState("");

  const filtered = processes?.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur border-b border-slate-800 px-4 py-4">
        <div className="flex justify-between items-center max-w-lg mx-auto">
          <h1 className="text-lg font-semibold">My Processes</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <Input
          placeholder="Search processes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-slate-800 border-slate-700"
        />

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 bg-slate-800 rounded-xl" />
            ))}
          </div>
        ) : filtered && filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map((process) => (
              <ProcessCard key={process.id} process={process} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <p>No processes yet</p>
            <p className="text-sm mt-1">Start by recording your first process</p>
          </div>
        )}

        <div className="fixed bottom-6 left-0 right-0 flex justify-center">
          <Link href="/record">
            <Button
              size="lg"
              className="bg-indigo-600 hover:bg-indigo-700 rounded-full px-8 shadow-lg shadow-indigo-500/25"
            >
              + New Recording
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
