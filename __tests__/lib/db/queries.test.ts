import { describe, it, expect } from "vitest";
import {
  processStatusEnum,
  type ProcessInsert,
  type RecordingInsert,
} from "@/lib/db/schema";

describe("db schema types", () => {
  it("should define valid process status enum values", () => {
    expect(processStatusEnum.enumValues).toEqual([
      "draft",
      "reviewing",
      "complete",
    ]);
  });

  it("should accept valid process insert shape", () => {
    const process: ProcessInsert = {
      name: "Sample Receipt QC",
      orgId: "org_123",
      createdBy: "user_456",
      status: "draft",
    };
    expect(process.name).toBe("Sample Receipt QC");
    expect(process.status).toBe("draft");
  });

  it("should accept valid recording insert shape", () => {
    const recording: RecordingInsert = {
      processId: "00000000-0000-0000-0000-000000000001",
      rawTranscript: "First the technician scans the barcode...",
      durationSeconds: 120,
    };
    expect(recording.rawTranscript).toContain("technician");
  });
});
