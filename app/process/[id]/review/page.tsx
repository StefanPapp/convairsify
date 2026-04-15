"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProcess, useSubmitClarification } from "@/hooks/use-processes";
import { QuestionList } from "@/components/clarification/question-list";
import { Skeleton } from "@/components/ui/skeleton";

type PendingQuestions = {
  pendingQuestions: {
    id: string;
    text: string;
    context: string;
    gap_type: string;
  }[];
};

export default function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: process, isLoading } = useProcess(id);
  const submitClarification = useSubmitClarification(id);

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto p-4 space-y-4">
        <Skeleton className="h-8 bg-slate-800" />
        <Skeleton className="h-32 bg-slate-800" />
        <Skeleton className="h-32 bg-slate-800" />
      </div>
    );
  }

  if (!process) {
    return <div className="p-4 text-slate-400">Process not found</div>;
  }

  if (process.status === "complete") {
    router.replace(`/process/${id}`);
    return null;
  }

  const data = process.structuredData as PendingQuestions | null;
  const questions = data?.pendingQuestions ?? [];

  if (questions.length === 0) {
    return (
      <div className="max-w-lg mx-auto p-8 text-center">
        <p className="text-slate-300">AI is analyzing your recording...</p>
        <p className="text-sm text-slate-500 mt-1">This usually takes 15-30 seconds</p>
      </div>
    );
  }

  const handleComplete = async (answers: { question: string; answer: string }[]) => {
    await submitClarification.mutateAsync(answers);
    router.push(`/process/${id}`);
  };

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur border-b border-slate-800 px-4 py-4">
        <div className="flex justify-between items-center max-w-lg mx-auto">
          <Link href="/" className="text-sm text-slate-400">Back</Link>
          <h1 className="text-base font-semibold">AI has questions</h1>
          <div className="w-10" />
        </div>
        <p className="text-xs text-slate-400 text-center mt-1">{process.name}</p>
      </div>

      <div className="max-w-lg mx-auto p-4">
        <QuestionList
          questions={questions}
          onComplete={handleComplete}
          isSubmitting={submitClarification.isPending}
        />
      </div>
    </div>
  );
}
