import { describe, it, expect } from "vitest";
import {
  gapAnalysisSchema,
  clarificationQuestionsSchema,
  processStructuredDataSchema,
} from "@/lib/ai/schemas";

describe("AI output schemas", () => {
  it("should validate a valid gap analysis", () => {
    const result = gapAnalysisSchema.safeParse({
      gaps: [
        {
          type: "missing_role",
          description: "No actor specified for barcode scanning step",
          severity: "high",
          transcript_excerpt: "then the barcode is scanned",
        },
      ],
      summary: "Found 1 gap in the process description",
    });
    expect(result.success).toBe(true);
  });

  it("should reject gap with invalid severity", () => {
    const result = gapAnalysisSchema.safeParse({
      gaps: [{ type: "missing_role", description: "x", severity: "critical", transcript_excerpt: "y" }],
      summary: "x",
    });
    expect(result.success).toBe(false);
  });

  it("should validate clarification questions", () => {
    const result = clarificationQuestionsSchema.safeParse({
      questions: [
        {
          id: "q1",
          text: "Who performs the barcode scan?",
          context: "You mentioned scanning but not who does it",
          gap_type: "missing_role",
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("should validate a complete structured process", () => {
    const result = processStructuredDataSchema.safeParse({
      steps: [
        {
          id: "s1",
          order: 1,
          name: "Receive sample",
          description: "Receive sample at loading dock",
          type: "action",
          actor_role: "r1",
          inputs: ["sample package"],
          outputs: ["received sample"],
          duration_estimate: "~5 min",
          decision_criteria: null,
          branches: null,
          exception_handling: "Contact supplier if damaged",
        },
      ],
      roles: [
        { id: "r1", name: "QC Technician", description: "Performs quality checks" },
      ],
      metadata: {
        domain: "Quality Control",
        estimated_total_duration: "~45 min",
        trigger: "Sample arrives at dock",
        end_condition: "Sample approved and logged",
      },
    });
    expect(result.success).toBe(true);
  });

  it("should reject process with invalid step type", () => {
    const result = processStructuredDataSchema.safeParse({
      steps: [
        {
          id: "s1", order: 1, name: "x", description: "x",
          type: "invalid_type", actor_role: "r1",
          inputs: [], outputs: [],
          duration_estimate: null, decision_criteria: null,
          branches: null, exception_handling: null,
        },
      ],
      roles: [{ id: "r1", name: "x", description: "x" }],
      metadata: { domain: "x", estimated_total_duration: "x", trigger: "x", end_condition: "x" },
    });
    expect(result.success).toBe(false);
  });
});
