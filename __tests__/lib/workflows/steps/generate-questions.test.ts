import { describe, it, expect, vi } from "vitest";
import type { GapAnalysis, ClarificationQuestions } from "@/lib/ai/schemas";

const mockQuestions: ClarificationQuestions = {
  questions: [{ id: "q1", text: "Who performs the barcode scan at receiving?", context: "You mentioned scanning but didn't specify who does it", gap_type: "missing_role" }],
};

vi.mock("ai", () => ({
  generateText: vi.fn().mockResolvedValue({ output: mockQuestions }),
  Output: { object: vi.fn() },
}));

describe("generateQuestions", () => {
  it("should generate questions from gaps", async () => {
    const { generateQuestions } = await import("@/lib/workflows/steps/generate-questions");
    const gaps: GapAnalysis = {
      gaps: [{ type: "missing_role", description: "No actor for barcode scan", severity: "high", transcript_excerpt: "the barcode is scanned" }],
      summary: "1 gap",
    };
    const result = await generateQuestions(gaps, "transcript text");
    expect(result.questions).toHaveLength(1);
    expect(result.questions[0].gap_type).toBe("missing_role");
  });
});
