"use client";

import Link from "next/link";
import { useProcesses } from "@/hooks/use-processes";
import { ProcessCard } from "@/components/process/process-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo, useState } from "react";

export default function HomePage() {
  const { data: processes, isLoading } = useProcesses();
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());

  const allTags = useMemo(() => {
    if (!processes) return [];
    const counts = new Map<string, number>();
    for (const p of processes) {
      for (const t of p.tags ?? []) {
        counts.set(t, (counts.get(t) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag);
  }, [processes]);

  const allRoles = useMemo(() => {
    if (!processes) return [];
    const counts = new Map<string, number>();
    for (const p of processes) {
      for (const r of p.roles ?? []) {
        counts.set(r, (counts.get(r) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([role]) => role);
  }, [processes]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) => {
      const next = new Set(prev);
      if (next.has(role)) next.delete(role);
      else next.add(role);
      return next;
    });
  };

  const hasActiveFilters = selectedTags.size > 0 || selectedRoles.size > 0;

  const filtered = processes?.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || p.name.toLowerCase().includes(q) ||
      p.tags?.some((t) => t.toLowerCase().includes(q));
    const matchesTags = selectedTags.size === 0 ||
      [...selectedTags].every((t) => p.tags?.includes(t));
    const matchesRoles = selectedRoles.size === 0 ||
      [...selectedRoles].every((r) => p.roles?.includes(r));
    return matchesSearch && matchesTags && matchesRoles;
  });

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur border-b border-slate-800 px-4 py-4">
        <div className="flex justify-between items-center max-w-lg mx-auto">
          <h1 className="text-lg font-semibold">ConvAIrsify MVP</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <Input
          placeholder="Search processes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-slate-800 border-slate-700"
        />

        {(allTags.length > 0 || allRoles.length > 0) && (
          <div className="space-y-2">
            {allTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 mr-1">Tags</span>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                      selectedTags.has(tag)
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
            {allRoles.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 mr-1">Roles</span>
                {allRoles.map((role) => (
                  <button
                    key={role}
                    onClick={() => toggleRole(role)}
                    className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                      selectedRoles.has(role)
                        ? "bg-teal-600 text-white"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            )}
            {hasActiveFilters && (
              <button
                onClick={() => { setSelectedTags(new Set()); setSelectedRoles(new Set()); }}
                className="px-2 py-0.5 rounded text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

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
