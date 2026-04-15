import { describe, it, expect, vi } from "vitest";

vi.mock("ai", () => ({
  generateText: vi.fn().mockResolvedValue({
    text: "First, the technician scans the barcode at the receiving dock.",
  }),
}));

describe("finalizeTranscript", () => {
  it("should return cleaned transcript text", async () => {
    const { finalizeTranscript } = await import("@/lib/workflows/steps/finalize-transcript");
    const result = await finalizeTranscript(
      "um so first uh the technician like scans the barcode at the um receiving dock"
    );
    expect(result).toBe("First, the technician scans the barcode at the receiving dock.");
  });
});
