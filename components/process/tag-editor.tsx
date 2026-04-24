"use client";

import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";

export function TagEditor({
  tags,
  onChange,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
}) {
  const [input, setInput] = useState("");

  const addTag = (value: string) => {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed || trimmed.length > 50 || tags.length >= 20) return;
    if (tags.includes(trimmed)) {
      setInput("");
      return;
    }
    onChange([...tags, trimmed]);
    setInput("");
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      e.stopPropagation();
      addTag(input);
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-700 text-slate-300"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:text-red-400 transition-colors"
              aria-label={`Remove tag ${tag}`}
            >
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => addTag(input)}
        placeholder={tags.length >= 20 ? "Max 20 tags" : "Add tag and press Enter"}
        disabled={tags.length >= 20}
        className="bg-slate-800 border-slate-700 text-sm"
      />
    </div>
  );
}
