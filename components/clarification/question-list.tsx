"use client";

import { useState } from "react";
import { AnswerInput } from "./answer-input";
import { Button } from "@/components/ui/button";

type Question = {
  id: string;
  text: string;
  context: string;
  gap_type: string;
};

type QAPair = { question: string; answer: string };

type Props = {
  questions: Question[];
  onComplete: (answers: QAPair[]) => void;
  isSubmitting: boolean;
};

export function QuestionList({ questions, onComplete, isSubmitting }: Props) {
  const [answers, setAnswers] = useState<Map<string, string>>(new Map());
  const currentIndex = answers.size;
  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? (answers.size / questions.length) * 100 : 0;

  const handleAnswer = (answer: string) => {
    if (!currentQuestion) return;
    setAnswers((prev) => new Map(prev).set(currentQuestion.id, answer));
  };

  const handleSubmit = () => {
    const qaPairs = questions
      .filter((q) => answers.has(q.id))
      .map((q) => ({ question: q.text, answer: answers.get(q.id)! }));
    onComplete(qaPairs);
  };

  const handleSkipAll = () => {
    onComplete([]);
  };

  const allAnswered = answers.size >= questions.length;

  return (
    <div className="space-y-4">
      <div>
        <div className="flex justify-between text-sm text-slate-400 mb-2">
          <span>{answers.size} of {questions.length} answered</span>
          <button
            onClick={handleSkipAll}
            className="text-slate-500 hover:text-slate-300 text-xs"
          >
            Skip all
          </button>
        </div>
        <div className="h-1 bg-slate-700 rounded-full">
          <div
            className="h-1 bg-indigo-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {questions.map((q, i) => {
          const isAnswered = answers.has(q.id);
          const isCurrent = i === currentIndex;

          return (
            <div
              key={q.id}
              className={`rounded-xl border p-4 transition-all ${
                isAnswered
                  ? "border-slate-700 bg-slate-800/50 opacity-60"
                  : isCurrent
                    ? "border-indigo-500 bg-slate-800"
                    : "border-slate-700 bg-slate-800/30 opacity-40"
              }`}
            >
              <div className="text-xs mb-1">
                {isAnswered ? (
                  <span className="text-emerald-400">Answered</span>
                ) : isCurrent ? (
                  <span className="text-indigo-400">Current</span>
                ) : (
                  <span className="text-slate-500">Upcoming</span>
                )}
              </div>
              <p className="text-sm font-medium text-slate-100">{q.text}</p>
              <p className="text-xs text-slate-500 mt-1">{q.context}</p>
              {isAnswered && (
                <p className="text-xs text-slate-400 mt-2 italic">
                  &ldquo;{answers.get(q.id)}&rdquo;
                </p>
              )}
              {isCurrent && <AnswerInput onSubmit={handleAnswer} />}
            </div>
          );
        })}
      </div>

      {allAnswered && (
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-indigo-600 hover:bg-indigo-700"
        >
          {isSubmitting ? "Submitting..." : "Submit Answers & Structure Process"}
        </Button>
      )}
    </div>
  );
}
