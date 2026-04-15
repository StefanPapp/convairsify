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

export function useProcess(id: string) {
  return useQuery<Process>({
    queryKey: ["process", id],
    queryFn: () => fetchJson(`/api/process/${id}`),
    enabled: !!id,
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
    mutationFn: (data: { name?: string; description?: string; structuredData?: unknown }) =>
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
