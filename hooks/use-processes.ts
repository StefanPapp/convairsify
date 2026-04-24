"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Process } from "@/lib/db/schema";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  return res.json();
}

export function useProcesses() {
  return useQuery<Process[]>({
    queryKey: ["processes"],
    queryFn: () => fetchJson("/api/process"),
  });
}

export function useProcess(id: string, { poll = false }: { poll?: boolean } = {}) {
  return useQuery<Process>({
    queryKey: ["process", id],
    queryFn: () => fetchJson(`/api/process/${id}`),
    enabled: !!id,
    // Poll every 2s while the workflow is still processing; stop once terminal or paused
    refetchInterval: (query) => {
      if (!poll) return false;
      const data = query.state.data;
      if (!data) return 2000;
      if (data.status === "complete" || data.status === "reviewing" || data.status === "failed") return false;
      return 2000;
    },
  });
}

export function useCreateProcess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; transcript: string; durationSeconds: number }) =>
      fetchJson<Process & { workflowRunId: string }>("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processes"] });
    },
  });
}

export function useUpdateProcess(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name?: string; description?: string; tags?: string[]; structuredData?: unknown }) =>
      fetchJson<Process>(`/api/process/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["process", id], updated);
      queryClient.invalidateQueries({ queryKey: ["processes"] });
    },
  });
}

export function useDeleteProcess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/process/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processes"] });
    },
  });
}

export function useRestartProcess(processId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      fetchJson(`/api/process/${processId}/restart`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["process", processId] });
    },
  });
}

export function useSubmitClarification(processId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (answers: { question: string; answer: string }[]) =>
      fetchJson(`/api/process/${processId}/clarify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["process", processId] });
    },
  });
}
