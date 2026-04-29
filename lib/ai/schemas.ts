import { z } from "zod";

export const gapSchema = z.object({
  type: z.enum([
    "missing_role",
    "unclear_decision",
    "missing_exception_handling",
    "vague_timing",
    "ambiguous_handoff",
    "missing_input_output",
  ]),
  description: z.string(),
  severity: z.enum(["high", "medium", "low"]),
  transcript_excerpt: z.string(),
});

export const gapAnalysisSchema = z.object({
  gaps: z.array(gapSchema),
  summary: z.string(),
});

export const clarificationQuestionSchema = z.object({
  id: z.string(),
  text: z.string(),
  context: z.string(),
  gap_type: gapSchema.shape.type,
});

export const clarificationQuestionsSchema = z.object({
  questions: z.array(clarificationQuestionSchema),
});

export const processStepSchema = z.object({
  id: z.string(),
  order: z.number().int().positive(),
  name: z.string(),
  description: z.string(),
  type: z.enum(["action", "decision", "subprocess"]),
  actor_role: z.string(),
  inputs: z.array(z.string()).default([]),
  outputs: z.array(z.string()).default([]),
  duration_estimate: z.string().nullable().default(null),
  decision_criteria: z.string().nullable().default(null),
  branches: z
    .array(z.object({ label: z.string(), next_step_id: z.string() }))
    .nullable()
    .default(null),
  exception_handling: z.string().nullable().default(null),
});

export const roleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
});

export const processMetadataSchema = z.object({
  domain: z.string().default("general"),
  estimated_total_duration: z.string().default("unknown"),
  trigger: z.string().default(""),
  end_condition: z.string().default(""),
});

export const processStructuredDataSchema = z.object({
  summary: z.string(),
  steps: z.array(processStepSchema),
  roles: z.array(roleSchema),
  metadata: processMetadataSchema,
});

export const automationStepSchema = z.object({
  step_id: z.string(),
  step_name: z.string(),
  candidacy: z.enum(["high", "medium", "low", "none"]),
  agent_type: z.enum(["llm", "rpa", "deterministic", "hybrid", "none"]),
  reasoning: z.string(),
  prerequisites: z.array(z.string()).default([]),
  risks: z.array(z.string()).default([]),
});

export const automationAnalysisSchema = z.object({
  overall: z.object({
    automatable_step_count: z.number().int().nonnegative(),
    total_step_count: z.number().int().nonnegative(),
    summary: z.string(),
  }),
  steps: z.array(automationStepSchema),
});

export type GapAnalysis = z.infer<typeof gapAnalysisSchema>;
export type ClarificationQuestions = z.infer<typeof clarificationQuestionsSchema>;
export type ProcessStructuredData = z.infer<typeof processStructuredDataSchema>;
export type ProcessStep = z.infer<typeof processStepSchema>;
export type AutomationAnalysis = z.infer<typeof automationAnalysisSchema>;
export type AutomationStep = z.infer<typeof automationStepSchema>;
