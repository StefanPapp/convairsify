"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProcess, useUpdateProcess } from "@/hooks/use-processes";
import { StepEditor } from "@/components/process/step-editor";
import { TagEditor } from "@/components/process/tag-editor";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import type { ProcessStructuredData } from "@/lib/ai/schemas";
import { validateProcessName } from "@/lib/validate-process-name";

export default function ProcessEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: process, isLoading } = useProcess(id);
  const updateProcess = useUpdateProcess(id);
  const [name, setName] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (process) {
      setName(process.name);
      setTags(process.tags ?? []);
    }
  }, [process]);

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto p-4 space-y-4">
        <Skeleton className="h-10 bg-slate-800" />
        <Skeleton className="h-64 bg-slate-800" />
      </div>
    );
  }

  if (!process) {
    return <div className="p-4 text-slate-400">Process not found</div>;
  }

  const data = process.structuredData as ProcessStructuredData | null;
  if (!data) {
    return <div className="p-4 text-slate-400">Process not yet structured</div>;
  }

  const handleSave = async (steps: ProcessStructuredData["steps"]) => {
    await updateProcess.mutateAsync({
      name,
      tags,
      structuredData: { ...data, steps },
    });
    router.push(`/process/${id}`);
  };

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur border-b border-slate-800 px-4 py-4">
        <div className="flex justify-between items-center max-w-lg mx-auto">
          <Link href={`/process/${id}`} className="text-sm text-slate-400">
            Cancel
          </Link>
          <h1 className="text-base font-semibold">Edit Process</h1>
          <div className="w-16" />
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        <div>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Process name"
            className="bg-slate-800 border-slate-700 text-lg font-semibold"
          />
          {validateProcessName(name) && (
            <p className="mt-1.5 text-xs text-amber-400">{validateProcessName(name)}</p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 mb-1.5 block">Tags</label>
          <TagEditor tags={tags} onChange={setTags} />
        </div>
        <StepEditor
          steps={data.steps}
          onSave={handleSave}
          isSaving={updateProcess.isPending}
        />
      </div>
    </div>
  );
}
