import { generateText, Output } from "ai";
import { automationAnalysisSchema, type AutomationAnalysis, type ProcessStructuredData } from "./schemas";
import { AUTOMATION_ANALYSIS_PROMPT } from "./prompts";

export async function analyzeAutomationPotential(
  data: ProcessStructuredData,
  transcript: string
): Promise<AutomationAnalysis> {
  const stepBlock = data.steps
    .map((s) => {
      const lines = [
        `id=${s.id} | order=${s.order} | type=${s.type} | actor=${s.actor_role}`,
        `name: ${s.name}`,
        `description: ${s.description}`,
        s.inputs.length ? `inputs: ${s.inputs.join(", ")}` : "",
        s.outputs.length ? `outputs: ${s.outputs.join(", ")}` : "",
        s.decision_criteria ? `decision_criteria: ${s.decision_criteria}` : "",
        s.exception_handling ? `exception_handling: ${s.exception_handling}` : "",
      ].filter(Boolean);
      return lines.join("\n");
    })
    .join("\n\n");

  const roleBlock = data.roles.map((r) => `- ${r.name}: ${r.description}`).join("\n");

  const prompt = [
    `## Summary\n${data.summary}`,
    `## Domain\n${data.metadata.domain}`,
    data.metadata.trigger ? `## Trigger\n${data.metadata.trigger}` : "",
    data.metadata.end_condition ? `## End condition\n${data.metadata.end_condition}` : "",
    `## Roles\n${roleBlock}`,
    `## Steps\n${stepBlock}`,
    `## Original transcript (excerpt)\n${transcript.slice(0, 3000)}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const { output } = await generateText({
    model: "anthropic/claude-sonnet-4.6",
    system: AUTOMATION_ANALYSIS_PROMPT,
    prompt,
    output: Output.object({ schema: automationAnalysisSchema }),
  });

  return output;
}
