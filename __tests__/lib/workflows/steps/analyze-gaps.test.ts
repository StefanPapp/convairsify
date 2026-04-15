import { describe, it, expect, vi } from "vitest";
import type { GapAnalysis } from "@/lib/ai/schemas";

const mockGapAnalysis: GapAnalysis = {
  gaps: [{ type: "missing_role", description: "No actor specified for barcode scan", severity: "high", transcript_excerpt: "the barcode is scanned" }],
  summary: "1 high-severity gap found",
};

vi.mock("ai", () => ({
  generateText: vi.fn().mockResolvedValue({ output: mockGapAnalysis }),
  Output: { object: vi.fn() },
}));

describe("analyzeGaps", () => {
  it("should return structured gap analysis", async () => {
    const { analyzeGaps } = await import("@/lib/workflows/steps/analyze-gaps");
    const result = await analyzeGaps("The barcode is scanned at the dock.");
    expect(result.gaps).toHaveLength(1);
    expect(result.gaps[0].type).toBe("missing_role");
    expect(result.gaps[0].severity).toBe("high");
  });
});
