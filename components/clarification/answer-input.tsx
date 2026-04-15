"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type Props = {
  onSubmit: (answer: string) => void;
};

export function AnswerInput({ onSubmit }: Props) {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (!text.trim()) return;
    onSubmit(text.trim());
    setText("");
  };

  return (
    <div className="flex gap-2 mt-3">
      <Textarea
        placeholder="Type your answer..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="bg-slate-900 border-slate-600 text-sm min-h-[44px] resize-none"
        rows={2}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
      />
      <Button onClick={handleSubmit} size="sm" className="self-end bg-indigo-600">
        Send
      </Button>
    </div>
  );
}
