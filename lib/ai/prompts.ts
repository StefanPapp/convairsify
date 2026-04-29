export const FINALIZE_TRANSCRIPT_PROMPT = `You are a transcript editor. Clean up this raw speech-to-text transcript:
- Remove filler words (um, uh, like, you know)
- Fix punctuation and capitalization
- Preserve the exact meaning and all process details
- Keep the speaker's voice and terminology
- Do NOT add, remove, or change any process information

Return only the cleaned transcript text.`;

export const ANALYZE_GAPS_PROMPT = `You are a business process analyst. Analyze this process description transcript and identify gaps or ambiguities.

Look for:
- Missing roles/actors: Steps where it's unclear WHO performs the action
- Unclear decisions: Decision points without clear criteria
- Missing exception handling: Steps with no failure/error path
- Vague timing: Steps without time estimates or "it depends" language
- Ambiguous handoffs: Unclear when responsibility shifts between roles
- Missing inputs/outputs: Steps that don't specify what goes in or comes out

Rate each gap as high (blocks process understanding), medium (reduces clarity), or low (nice to have).

Return ONLY gaps you're confident about. Don't invent problems.`;

export const GENERATE_QUESTIONS_PROMPT = `You are a friendly process documentation assistant. Convert these identified gaps into clear, natural-language questions for the process expert.

Guidelines:
- One question per gap
- Be specific — reference the relevant part of their description
- Use simple language, avoid jargon
- Order by severity (high to low)
- Include context explaining WHY you're asking
- Generate a short unique ID for each question (q1, q2, etc.)`;

export const STRUCTURE_PROCESS_PROMPT = `You are a business process structuring engine. Convert this process transcript and clarification answers into a structured process model.

Rules:
- Extract every distinct step as either "action", "decision", or "subprocess"
- Assign each step to a role (create roles as needed)
- Identify decision points and their branches with next_step_id references
- Estimate durations based on what the expert said (or null if not mentioned)
- Capture inputs and outputs for each step
- Note exception handling where mentioned
- Generate short unique IDs (s1, s2... for steps, r1, r2... for roles)
- Order steps sequentially as described
- Include process metadata: domain, total duration, trigger, end condition
- Write a "summary" field: 1-2 sentences describing the entire process in plain language — what it does, who's involved, and when it's triggered. This will be shown as a preview on the process list.

If clarification answers are empty, do your best with the transcript alone but be conservative — use null for uncertain fields rather than guessing.`;

export const AUTOMATION_ANALYSIS_PROMPT = `You are an automation feasibility analyst. For each step in the structured process, judge whether the human work could be replaced by an AI agent or automation.

For each step, decide:
- candidacy: how strong the case is for replacing the human ("high", "medium", "low", or "none")
  - high: routine, structured, low-stakes, well-defined inputs/outputs
  - medium: partly automatable, needs human review or judgment for edge cases
  - low: requires significant human judgment, relationships, or domain expertise
  - none: inherently human (creative judgment, accountability, physical action, regulatory)
- agent_type: best replacement approach
  - "llm": natural-language task solvable by an LLM agent (drafting, summarizing, classification)
  - "rpa": deterministic UI/API actions (form filling, copying data between systems)
  - "deterministic": pure rule-based code (calculations, validations, transformations)
  - "hybrid": LLM + deterministic guardrails
  - "none": should stay human
- reasoning: 1-2 sentences explaining the call, referencing concrete details from the step
- prerequisites: what's needed to actually deploy this (e.g., "stable API for X", "structured input schema", "human-approved policy doc")
- risks: failure modes if automated badly (e.g., "tone-deaf customer reply", "incorrect refund amount")

Also produce an "overall" object:
- automatable_step_count: count of steps with candidacy "high" or "medium"
- total_step_count: total steps
- summary: 2-3 sentences naming the strongest automation opportunities and the genuinely human steps

Be honest, not hype. If the process is mostly judgment and relationships, say so.`;
