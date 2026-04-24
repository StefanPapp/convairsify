import { describe, it, expect, vi } from "vitest";
import type { ProcessStructuredData } from "@/lib/ai/schemas";

const mockStructured: ProcessStructuredData = {
  summary: "A quality control process where a QC Tech receives and logs incoming samples at the dock.",
  steps: [{ id: "s1", order: 1, name: "Receive sample", description: "Receive at dock", type: "action", actor_role: "r1", inputs: ["sample"], outputs: ["received sample"], duration_estimate: "~5 min", decision_criteria: null, branches: null, exception_handling: null }],
  roles: [{ id: "r1", name: "QC Tech", description: "Quality control" }],
  metadata: { domain: "QC", estimated_total_duration: "~5 min", trigger: "Sample arrives", end_condition: "Sample logged" },
};

vi.mock("ai", () => ({
  generateText: vi.fn().mockResolvedValue({ output: mockStructured }),
  Output: { object: vi.fn() },
}));

describe("structureProcess", () => {
  it("should return structured process data", async () => {
    const { structureProcess } = await import("@/lib/workflows/steps/structure-process");
    const result = await structureProcess("transcript", []);
    expect(result.steps).toHaveLength(1);
    expect(result.roles).toHaveLength(1);
    expect(result.metadata.domain).toBe("QC");
  });
});
