"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { ProcessStep } from "@/lib/ai/schemas";

type Props = {
  steps: ProcessStep[];
  onSave: (steps: ProcessStep[]) => void;
  isSaving: boolean;
};

export function StepEditor({ steps: initialSteps, onSave, isSaving }: Props) {
  const [steps, setSteps] = useState(initialSteps);

  const updateStep = (index: number, field: keyof ProcessStep, value: string) => {
    setSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const removeStep = (index: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 })));
  };

  const addStep = () => {
    setSteps((prev) => [
      ...prev,
      {
        id: `s${Date.now()}`,
        order: prev.length + 1,
        name: "",
        description: "",
        type: "action" as const,
        actor_role: prev[0]?.actor_role ?? "",
        inputs: [],
        outputs: [],
        duration_estimate: null,
        decision_criteria: null,
        branches: null,
        exception_handling: null,
      },
    ]);
  };

  const moveStep = (from: number, to: number) => {
    if (to < 0 || to >= steps.length) return;
    setSteps((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next.map((s, i) => ({ ...s, order: i + 1 }));
    });
  };

  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <div
          key={step.id}
          className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-3"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-mono w-6">
              #{step.order}
            </span>
            <Input
              value={step.name}
              onChange={(e) => updateStep(index, "name", e.target.value)}
              placeholder="Step name"
              className="bg-slate-900 border-slate-600 text-sm"
            />
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => moveStep(index, index - 1)} disabled={index === 0}>
                Up
              </Button>
              <Button variant="ghost" size="sm" onClick={() => moveStep(index, index + 1)} disabled={index === steps.length - 1}>
                Dn
              </Button>
              <Button variant="ghost" size="sm" onClick={() => removeStep(index)} className="text-red-400 hover:text-red-300">
                X
              </Button>
            </div>
          </div>
          <Textarea
            value={step.description}
            onChange={(e) => updateStep(index, "description", e.target.value)}
            placeholder="Description"
            className="bg-slate-900 border-slate-600 text-sm"
            rows={2}
          />
          <div className="flex gap-2">
            <Input
              value={step.actor_role}
              onChange={(e) => updateStep(index, "actor_role", e.target.value)}
              placeholder="Role"
              className="bg-slate-900 border-slate-600 text-xs flex-1"
            />
            <Input
              value={step.duration_estimate ?? ""}
              onChange={(e) => updateStep(index, "duration_estimate", e.target.value)}
              placeholder="Duration"
              className="bg-slate-900 border-slate-600 text-xs w-28"
            />
          </div>
        </div>
      ))}

      <Button variant="outline" onClick={addStep} className="w-full">
        + Add Step
      </Button>

      <Button
        onClick={() => onSave(steps)}
        disabled={isSaving}
        className="w-full bg-indigo-600 hover:bg-indigo-700"
      >
        {isSaving ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
}
