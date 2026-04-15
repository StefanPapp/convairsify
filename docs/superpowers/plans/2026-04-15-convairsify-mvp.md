# Convairsify MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first PWA where enterprise users record business processes via voice, get AI-assisted clarification, and receive structured process documentation.

**Architecture:** Next.js 16 App Router PWA with Vercel Workflow DevKit for durable AI processing pipeline. Deepgram WebSocket for real-time STT, Claude via AI SDK for analysis/structuring, Neon Postgres via Drizzle ORM for storage, Clerk for enterprise auth.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui, Vercel Workflow DevKit, AI SDK (via Vercel AI Gateway), Deepgram SDK, Clerk, Drizzle ORM, Neon Postgres, Zod, nuqs, TanStack Query

**Spec:** `docs/superpowers/specs/2026-04-15-convairsify-mvp-design.md`

---

## File Structure

```
convairsify/
├── app/
│   ├── layout.tsx                          # Root layout: ClerkProvider, QueryProvider, metadata
│   ├── page.tsx                            # Process list (home)
│   ├── record/page.tsx                     # Recording view
│   ├── process/[id]/
│   │   ├── page.tsx                        # Process view (structured)
│   │   ├── edit/page.tsx                   # Process editor
│   │   └── review/page.tsx                 # Clarification review
│   └── api/
│       ├── deepgram/token/route.ts         # Short-lived Deepgram key
│       ├── process/
│       │   ├── route.ts                    # List + create
│       │   └── [id]/
│       │       ├── route.ts               # Get + update + delete
│       │       └── clarify/route.ts       # Resume workflow hook
│       └── workflow/route.ts              # Workflow DevKit endpoint
├── lib/
│   ├── db/
│   │   ├── schema.ts                      # Drizzle table definitions
│   │   ├── client.ts                      # Neon + Drizzle client
│   │   └── queries.ts                     # Typed query helpers
│   ├── workflows/
│   │   ├── process-recording.ts           # Workflow orchestrator
│   │   └── steps/
│   │       ├── finalize-transcript.ts
│   │       ├── analyze-gaps.ts
│   │       ├── generate-questions.ts
│   │       ├── structure-process.ts
│   │       └── store-process.ts
│   ├── ai/
│   │   ├── prompts.ts                     # System prompts
│   │   └── schemas.ts                     # Zod schemas for AI output
│   └── deepgram/
│       └── client.ts                      # Server-side Deepgram config
├── components/
│   ├── recording/
│   │   ├── audio-recorder.tsx
│   │   ├── live-transcript.tsx
│   │   └── recording-controls.tsx
│   ├── clarification/
│   │   ├── question-list.tsx
│   │   └── answer-input.tsx
│   ├── process/
│   │   ├── process-card.tsx
│   │   ├── step-timeline.tsx
│   │   ├── step-editor.tsx
│   │   └── role-badges.tsx
│   └── providers.tsx                      # Client providers (QueryClient)
├── hooks/
│   ├── use-deepgram.ts                    # Deepgram WebSocket hook
│   ├── use-audio-recorder.ts              # MediaRecorder hook
│   └── use-processes.ts                   # TanStack Query hooks for process CRUD
├── __tests__/
│   ├── lib/
│   │   ├── db/queries.test.ts
│   │   ├── ai/schemas.test.ts
│   │   └── workflows/steps/
│   │       ├── finalize-transcript.test.ts
│   │       ├── analyze-gaps.test.ts
│   │       ├── generate-questions.test.ts
│   │       └── structure-process.test.ts
│   ├── api/
│   │   ├── process.test.ts
│   │   └── deepgram-token.test.ts
│   └── components/
│       ├── process-card.test.tsx
│       ├── step-timeline.test.tsx
│       └── question-list.test.tsx
├── drizzle.config.ts
├── middleware.ts                           # Clerk auth middleware
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.ts
├── package.json
└── .env.local
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `.env.local`, `.env.example`

- [ ] **Step 1: Create Next.js project**

```bash
cd /Users/stefanpapp/src/convairsify
npx create-next-app@latest . --typescript --tailwind --eslint --app --src=no --import-alias="@/*" --turbopack --yes
```

Expected: Next.js 16 project scaffolded with App Router.

- [ ] **Step 2: Install core dependencies**

```bash
bun add workflow @workflow/next @workflow/ai ai @deepgram/sdk @clerk/nextjs drizzle-orm @neondatabase/serverless zod nanoid @tanstack/react-query nuqs
```

- [ ] **Step 3: Install dev dependencies**

```bash
bun add -D drizzle-kit vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom @types/node
```

- [ ] **Step 4: Create environment files**

Create `.env.local`:
```
# Deepgram
DEEPGRAM_API_KEY=

# Vercel AI Gateway
AI_GATEWAY_API_KEY=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Neon Postgres
DATABASE_URL=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Create `.env.example` with same keys but empty values.

Add `.env.local` to `.gitignore` (already there).

- [ ] **Step 5: Configure Vitest**

Create `vitest.config.ts`:
```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: [],
    include: ["__tests__/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

- [ ] **Step 6: Update next.config.ts for PWA basics**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
```

- [ ] **Step 7: Verify project builds**

```bash
bun run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js 16 project with dependencies"
```

---

### Task 2: Database Schema & Client

**Files:**
- Create: `lib/db/schema.ts`, `lib/db/client.ts`, `lib/db/queries.ts`, `drizzle.config.ts`
- Test: `__tests__/lib/db/queries.test.ts`

- [ ] **Step 1: Write query helper tests**

Create `__tests__/lib/db/queries.test.ts`:
```typescript
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
bun run vitest run __tests__/lib/db/queries.test.ts
```

Expected: FAIL — module `@/lib/db/schema` not found.

- [ ] **Step 3: Create Drizzle schema**

Create `lib/db/schema.ts`:
```typescript
import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

export const processStatusEnum = pgEnum("process_status", [
  "draft",
  "reviewing",
  "complete",
]);

export const processes = pgTable("processes", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: text("org_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  status: processStatusEnum("status").notNull().default("draft"),
  createdBy: text("created_by").notNull(),
  structuredData: jsonb("structured_data"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const recordings = pgTable("recordings", {
  id: uuid("id").defaultRandom().primaryKey(),
  processId: uuid("process_id")
    .notNull()
    .references(() => processes.id, { onDelete: "cascade" }),
  rawTranscript: text("raw_transcript").notNull(),
  audioUrl: text("audio_url"),
  durationSeconds: integer("duration_seconds").notNull(),
  clarificationQa: jsonb("clarification_qa"),
  workflowRunId: text("workflow_run_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Process = typeof processes.$inferSelect;
export type ProcessInsert = typeof processes.$inferInsert;
export type Recording = typeof recordings.$inferSelect;
export type RecordingInsert = typeof recordings.$inferInsert;
```

- [ ] **Step 4: Create database client**

Create `lib/db/client.ts`:
```typescript
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle({ client: sql, schema });
```

- [ ] **Step 5: Create query helpers**

Create `lib/db/queries.ts`:
```typescript
import { eq, desc } from "drizzle-orm";
import { db } from "./client";
import { processes, recordings, type ProcessInsert } from "./schema";

export async function listProcesses(orgId: string) {
  return db
    .select()
    .from(processes)
    .where(eq(processes.orgId, orgId))
    .orderBy(desc(processes.updatedAt));
}

export async function getProcess(id: string) {
  const rows = await db
    .select()
    .from(processes)
    .where(eq(processes.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function createProcess(data: ProcessInsert) {
  const rows = await db.insert(processes).values(data).returning();
  return rows[0];
}

export async function updateProcess(
  id: string,
  data: Partial<Pick<ProcessInsert, "name" | "description" | "status"> & { structuredData: unknown }>
) {
  const rows = await db
    .update(processes)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(processes.id, id))
    .returning();
  return rows[0];
}

export async function deleteProcess(id: string) {
  await db.delete(processes).where(eq(processes.id, id));
}

export async function createRecording(data: typeof recordings.$inferInsert) {
  const rows = await db.insert(recordings).values(data).returning();
  return rows[0];
}

export async function getRecordingByProcessId(processId: string) {
  const rows = await db
    .select()
    .from(recordings)
    .where(eq(recordings.processId, processId))
    .orderBy(desc(recordings.createdAt))
    .limit(1);
  return rows[0] ?? null;
}
```

- [ ] **Step 6: Create Drizzle config**

Create `drizzle.config.ts`:
```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

- [ ] **Step 7: Run tests to verify they pass**

```bash
bun run vitest run __tests__/lib/db/queries.test.ts
```

Expected: PASS — schema types are valid.

- [ ] **Step 8: Generate initial migration**

```bash
bunx drizzle-kit generate
```

Expected: Migration SQL file created in `lib/db/migrations/`.

- [ ] **Step 9: Commit**

```bash
git add lib/db/ drizzle.config.ts __tests__/lib/db/
git commit -m "feat: add database schema and query helpers with Drizzle + Neon"
```

---

### Task 3: Clerk Auth Setup

**Files:**
- Create: `middleware.ts`, update `app/layout.tsx`

- [ ] **Step 1: Create Clerk middleware**

Create `middleware.ts`:
```typescript
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

- [ ] **Step 2: Update root layout with ClerkProvider**

Replace `app/layout.tsx`:
```typescript
import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Convairsify",
  description: "Record, map, and structure business processes with voice and AI",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0f172a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider appearance={{ baseTheme: dark }}>
      <html lang="en" className="dark">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-950 text-slate-50`}>
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
```

- [ ] **Step 3: Create client providers**

Create `components/providers.tsx`:
```typescript
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000 },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
```

- [ ] **Step 4: Verify auth works locally**

```bash
bun dev
```

Open `http://localhost:3000` — should redirect to Clerk sign-in. (Requires valid Clerk keys in `.env.local`.)

- [ ] **Step 5: Commit**

```bash
git add middleware.ts app/layout.tsx components/providers.tsx
git commit -m "feat: add Clerk auth middleware and providers"
```

---

### Task 4: AI Schemas & Prompts

**Files:**
- Create: `lib/ai/schemas.ts`, `lib/ai/prompts.ts`
- Test: `__tests__/lib/ai/schemas.test.ts`

- [ ] **Step 1: Write schema validation tests**

Create `__tests__/lib/ai/schemas.test.ts`:
```typescript
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
bun run vitest run __tests__/lib/ai/schemas.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create Zod schemas**

Create `lib/ai/schemas.ts`:
```typescript
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
  inputs: z.array(z.string()),
  outputs: z.array(z.string()),
  duration_estimate: z.string().nullable(),
  decision_criteria: z.string().nullable(),
  branches: z
    .array(z.object({ label: z.string(), next_step_id: z.string() }))
    .nullable(),
  exception_handling: z.string().nullable(),
});

export const roleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
});

export const processMetadataSchema = z.object({
  domain: z.string(),
  estimated_total_duration: z.string(),
  trigger: z.string(),
  end_condition: z.string(),
});

export const processStructuredDataSchema = z.object({
  steps: z.array(processStepSchema),
  roles: z.array(roleSchema),
  metadata: processMetadataSchema,
});

export type GapAnalysis = z.infer<typeof gapAnalysisSchema>;
export type ClarificationQuestions = z.infer<typeof clarificationQuestionsSchema>;
export type ProcessStructuredData = z.infer<typeof processStructuredDataSchema>;
export type ProcessStep = z.infer<typeof processStepSchema>;
```

- [ ] **Step 4: Create AI prompts**

Create `lib/ai/prompts.ts`:
```typescript
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

If clarification answers are empty, do your best with the transcript alone but be conservative — use null for uncertain fields rather than guessing.`;
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
bun run vitest run __tests__/lib/ai/schemas.test.ts
```

Expected: All 5 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/ai/ __tests__/lib/ai/
git commit -m "feat: add AI Zod schemas and system prompts"
```

---

### Task 5: Workflow Step — Finalize Transcript

**Files:**
- Create: `lib/workflows/steps/finalize-transcript.ts`
- Test: `__tests__/lib/workflows/steps/finalize-transcript.test.ts`

- [ ] **Step 1: Write test**

Create `__tests__/lib/workflows/steps/finalize-transcript.test.ts`:
```typescript
import { describe, it, expect, vi } from "vitest";

vi.mock("ai", () => ({
  generateText: vi.fn().mockResolvedValue({
    text: "First, the technician scans the barcode at the receiving dock.",
  }),
}));


describe("finalizeTranscript", () => {
  it("should return cleaned transcript text", async () => {
    const { finalizeTranscript } = await import(
      "@/lib/workflows/steps/finalize-transcript"
    );
    const result = await finalizeTranscript(
      "um so first uh the technician like scans the barcode at the um receiving dock"
    );
    expect(result).toBe(
      "First, the technician scans the barcode at the receiving dock."
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
bun run vitest run __tests__/lib/workflows/steps/finalize-transcript.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `lib/workflows/steps/finalize-transcript.ts`:
```typescript
import { generateText } from "ai";
import { FINALIZE_TRANSCRIPT_PROMPT } from "@/lib/ai/prompts";

export async function finalizeTranscript(rawTranscript: string) {
  "use step";

  console.log("[finalizeTranscript] Cleaning transcript (%d chars)", rawTranscript.length);
  const { text } = await generateText({
    model: "anthropic/claude-sonnet-4.6",
    system: FINALIZE_TRANSCRIPT_PROMPT,
    prompt: rawTranscript,
    maxOutputTokens: 8192,
  });

  console.log("[finalizeTranscript] Done (%d chars)", text.length);
  return text;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
bun run vitest run __tests__/lib/workflows/steps/finalize-transcript.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/workflows/steps/finalize-transcript.ts __tests__/lib/workflows/steps/finalize-transcript.test.ts
git commit -m "feat: add finalize-transcript workflow step"
```

---

### Task 6: Workflow Step — Analyze Gaps

**Files:**
- Create: `lib/workflows/steps/analyze-gaps.ts`
- Test: `__tests__/lib/workflows/steps/analyze-gaps.test.ts`

- [ ] **Step 1: Write test**

Create `__tests__/lib/workflows/steps/analyze-gaps.test.ts`:
```typescript
import { describe, it, expect, vi } from "vitest";
import type { GapAnalysis } from "@/lib/ai/schemas";

const mockGapAnalysis: GapAnalysis = {
  gaps: [
    {
      type: "missing_role",
      description: "No actor specified for barcode scan",
      severity: "high",
      transcript_excerpt: "the barcode is scanned",
    },
  ],
  summary: "1 high-severity gap found",
};

vi.mock("ai", () => ({
  generateText: vi.fn().mockResolvedValue({ output: mockGapAnalysis }),
  Output: { object: vi.fn() },
}));

describe("analyzeGaps", () => {
  it("should return structured gap analysis", async () => {
    const { analyzeGaps } = await import(
      "@/lib/workflows/steps/analyze-gaps"
    );
    const result = await analyzeGaps("The barcode is scanned at the dock.");
    expect(result.gaps).toHaveLength(1);
    expect(result.gaps[0].type).toBe("missing_role");
    expect(result.gaps[0].severity).toBe("high");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
bun run vitest run __tests__/lib/workflows/steps/analyze-gaps.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement**

Create `lib/workflows/steps/analyze-gaps.ts`:
```typescript
import { generateText, Output } from "ai";
import { gapAnalysisSchema, type GapAnalysis } from "@/lib/ai/schemas";
import { ANALYZE_GAPS_PROMPT } from "@/lib/ai/prompts";

export async function analyzeGaps(transcript: string): Promise<GapAnalysis> {
  "use step";

  console.log("[analyzeGaps] Starting gap analysis");
  const { output } = await generateText({
    model: "anthropic/claude-sonnet-4.6",
    system: ANALYZE_GAPS_PROMPT,
    prompt: transcript,
    output: Output.object({ schema: gapAnalysisSchema }),
  });

  console.log("[analyzeGaps] Found %d gaps", output.gaps.length);
  return output;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
bun run vitest run __tests__/lib/workflows/steps/analyze-gaps.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/workflows/steps/analyze-gaps.ts __tests__/lib/workflows/steps/
git commit -m "feat: add analyze-gaps workflow step"
```

---

### Task 7: Workflow Step — Generate Questions

**Files:**
- Create: `lib/workflows/steps/generate-questions.ts`
- Test: `__tests__/lib/workflows/steps/generate-questions.test.ts`

- [ ] **Step 1: Write test**

Create `__tests__/lib/workflows/steps/generate-questions.test.ts`:
```typescript
import { describe, it, expect, vi } from "vitest";
import type { GapAnalysis, ClarificationQuestions } from "@/lib/ai/schemas";

const mockQuestions: ClarificationQuestions = {
  questions: [
    {
      id: "q1",
      text: "Who performs the barcode scan at receiving?",
      context: "You mentioned scanning but didn't specify who does it",
      gap_type: "missing_role",
    },
  ],
};

vi.mock("ai", () => ({
  generateText: vi.fn().mockResolvedValue({ output: mockQuestions }),
  Output: { object: vi.fn() },
}));

describe("generateQuestions", () => {
  it("should generate questions from gaps", async () => {
    const { generateQuestions } = await import(
      "@/lib/workflows/steps/generate-questions"
    );
    const gaps: GapAnalysis = {
      gaps: [
        {
          type: "missing_role",
          description: "No actor for barcode scan",
          severity: "high",
          transcript_excerpt: "the barcode is scanned",
        },
      ],
      summary: "1 gap",
    };
    const result = await generateQuestions(gaps, "transcript text");
    expect(result.questions).toHaveLength(1);
    expect(result.questions[0].gap_type).toBe("missing_role");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
bun run vitest run __tests__/lib/workflows/steps/generate-questions.test.ts
```

- [ ] **Step 3: Implement**

Create `lib/workflows/steps/generate-questions.ts`:
```typescript
import { generateText, Output } from "ai";
import {
  clarificationQuestionsSchema,
  type ClarificationQuestions,
  type GapAnalysis,
} from "@/lib/ai/schemas";
import { GENERATE_QUESTIONS_PROMPT } from "@/lib/ai/prompts";

export async function generateQuestions(
  gapAnalysis: GapAnalysis,
  transcript: string
): Promise<ClarificationQuestions> {
  "use step";

  console.log("[generateQuestions] Generating questions for %d gaps", gapAnalysis.gaps.length);
  const { output } = await generateText({
    model: "anthropic/claude-sonnet-4.6",
    system: GENERATE_QUESTIONS_PROMPT,
    prompt: `## Transcript\n${transcript}\n\n## Identified Gaps\n${JSON.stringify(gapAnalysis.gaps, null, 2)}`,
    output: Output.object({ schema: clarificationQuestionsSchema }),
  });

  console.log("[generateQuestions] Generated %d questions", output.questions.length);
  return output;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
bun run vitest run __tests__/lib/workflows/steps/generate-questions.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/workflows/steps/generate-questions.ts __tests__/lib/workflows/steps/generate-questions.test.ts
git commit -m "feat: add generate-questions workflow step"
```

---

### Task 8: Workflow Step — Structure Process

**Files:**
- Create: `lib/workflows/steps/structure-process.ts`
- Test: `__tests__/lib/workflows/steps/structure-process.test.ts`

- [ ] **Step 1: Write test**

Create `__tests__/lib/workflows/steps/structure-process.test.ts`:
```typescript
import { describe, it, expect, vi } from "vitest";
import type { ProcessStructuredData } from "@/lib/ai/schemas";

const mockStructured: ProcessStructuredData = {
  steps: [
    {
      id: "s1",
      order: 1,
      name: "Receive sample",
      description: "Receive at dock",
      type: "action",
      actor_role: "r1",
      inputs: ["sample"],
      outputs: ["received sample"],
      duration_estimate: "~5 min",
      decision_criteria: null,
      branches: null,
      exception_handling: null,
    },
  ],
  roles: [{ id: "r1", name: "QC Tech", description: "Quality control" }],
  metadata: {
    domain: "QC",
    estimated_total_duration: "~5 min",
    trigger: "Sample arrives",
    end_condition: "Sample logged",
  },
};

vi.mock("ai", () => ({
  generateText: vi.fn().mockResolvedValue({ output: mockStructured }),
  Output: { object: vi.fn() },
}));


describe("structureProcess", () => {
  it("should return structured process data", async () => {
    const { structureProcess } = await import(
      "@/lib/workflows/steps/structure-process"
    );
    const result = await structureProcess("transcript", []);
    expect(result.steps).toHaveLength(1);
    expect(result.roles).toHaveLength(1);
    expect(result.metadata.domain).toBe("QC");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
bun run vitest run __tests__/lib/workflows/steps/structure-process.test.ts
```

- [ ] **Step 3: Implement**

Create `lib/workflows/steps/structure-process.ts`:
```typescript
import { generateText, Output } from "ai";
import {
  processStructuredDataSchema,
  type ProcessStructuredData,
} from "@/lib/ai/schemas";
import { STRUCTURE_PROCESS_PROMPT } from "@/lib/ai/prompts";

type QAPair = { question: string; answer: string };

export async function structureProcess(
  transcript: string,
  clarificationQa: QAPair[]
): Promise<ProcessStructuredData> {
  "use step";

  console.log("[structureProcess] Structuring with %d QA pairs", clarificationQa.length);
  const qaSection =
    clarificationQa.length > 0
      ? `\n\n## Clarification Q&A\n${clarificationQa.map((qa) => `Q: ${qa.question}\nA: ${qa.answer}`).join("\n\n")}`
      : "";

  const { output } = await generateText({
    model: "anthropic/claude-sonnet-4.6",
    system: STRUCTURE_PROCESS_PROMPT,
    prompt: `## Process Transcript\n${transcript}${qaSection}`,
    output: Output.object({ schema: processStructuredDataSchema }),
  });

  console.log("[structureProcess] Produced %d steps, %d roles", output.steps.length, output.roles.length);
  return output;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
bun run vitest run __tests__/lib/workflows/steps/structure-process.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/workflows/steps/structure-process.ts __tests__/lib/workflows/steps/structure-process.test.ts
git commit -m "feat: add structure-process workflow step"
```

---

### Task 9: Workflow Step — Store Process

**Files:**
- Create: `lib/workflows/steps/store-process.ts`

- [ ] **Step 1: Implement store step**

Create `lib/workflows/steps/store-process.ts`:
```typescript
import { updateProcess, createRecording } from "@/lib/db/queries";
import type { ProcessStructuredData } from "@/lib/ai/schemas";

export async function storeProcess(
  processId: string,
  structuredData: ProcessStructuredData,
  transcript: string,
  clarificationQa: { question: string; answer: string }[],
  durationSeconds: number,
  workflowRunId: string
) {
  "use step";

  console.log("[storeProcess] Saving process %s (%d steps)", processId, structuredData.steps.length);
  await updateProcess(processId, {
    structuredData,
    status: "complete",
  });

  await createRecording({
    processId,
    rawTranscript: transcript,
    durationSeconds,
    clarificationQa,
    workflowRunId,
  });

  return { success: true };
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/workflows/steps/store-process.ts
git commit -m "feat: add store-process workflow step"
```

---

### Task 10: Workflow Orchestrator

**Files:**
- Create: `lib/workflows/process-recording.ts`

- [ ] **Step 1: Implement workflow orchestrator**

Create `lib/workflows/process-recording.ts`:
```typescript
import { createHook, getWritable } from "workflow";
import { getWorkflowMetadata } from "workflow";
import { finalizeTranscript } from "./steps/finalize-transcript";
import { analyzeGaps } from "./steps/analyze-gaps";
import { generateQuestions } from "./steps/generate-questions";
import { structureProcess } from "./steps/structure-process";
import { storeProcess } from "./steps/store-process";
import { updateProcess } from "@/lib/db/queries";

type ClarifyPayload = {
  answers: { question: string; answer: string }[];
};

type ProgressUpdate = {
  stage: string;
  message: string;
};

async function writeProgress(writable: WritableStream<ProgressUpdate>, stage: string, message: string) {
  "use step";
  console.log("[workflow:progress] %s: %s", stage, message);
  const writer = writable.getWriter();
  try {
    await writer.write({ stage, message });
  } finally {
    writer.releaseLock();
  }
}

export async function processRecordingWorkflow(
  processId: string,
  rawTranscript: string,
  durationSeconds: number
) {
  "use workflow";

  const { runId } = getWorkflowMetadata();
  const writable = getWritable<ProgressUpdate>();

  // Step 1: Finalize transcript
  await writeProgress(writable, "finalize", "Cleaning up transcript...");
  const cleanedTranscript = await finalizeTranscript(rawTranscript);

  // Step 2: Analyze gaps
  await writeProgress(writable, "analyze", "Analyzing for gaps and ambiguities...");
  const gapAnalysis = await analyzeGaps(cleanedTranscript);

  // Step 3: Generate questions (if gaps found)
  let clarificationQa: { question: string; answer: string }[] = [];

  if (gapAnalysis.gaps.length > 0) {
    await writeProgress(
      writable,
      "questions",
      `Found ${gapAnalysis.gaps.length} areas needing clarification...`
    );
    const questions = await generateQuestions(gapAnalysis, cleanedTranscript);

    // Update process status and store questions
    await updateProcessStatus(processId, questions.questions);

    // Pause workflow — wait for user to answer questions
    await writeProgress(writable, "waiting", "Waiting for your answers...");
    const hook = createHook<ClarifyPayload>({
      token: `clarify-${processId}`,
    });
    const payload = await hook;
    clarificationQa = payload.answers;
  }

  // Step 4: Structure the process
  await writeProgress(writable, "structuring", "Building structured process model...");
  const structuredData = await structureProcess(cleanedTranscript, clarificationQa);

  // Step 5: Store
  await writeProgress(writable, "storing", "Saving structured process...");
  await storeProcess(
    processId,
    structuredData,
    cleanedTranscript,
    clarificationQa,
    durationSeconds,
    runId
  );

  await writeProgress(writable, "complete", "Process structured successfully!");
  return { success: true, processId };
}

async function updateProcessStatus(
  processId: string,
  questions: { id: string; text: string; context: string; gap_type: string }[]
) {
  "use step";
  await updateProcess(processId, { status: "reviewing" });
  // Store questions in structuredData temporarily for the review UI
  await updateProcess(processId, {
    structuredData: { pendingQuestions: questions } as unknown,
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/workflows/process-recording.ts
git commit -m "feat: add workflow orchestrator for process recording pipeline"
```

---

### Task 11: API Routes — Workflow Endpoint

**Files:**
- Create: `app/api/workflow/route.ts`

- [ ] **Step 1: Create workflow route**

Create `app/api/workflow/route.ts`:
```typescript
import { withWorkflow } from "workflow/next";

export const POST = withWorkflow();
```

- [ ] **Step 2: Commit**

```bash
git add app/api/workflow/
git commit -m "feat: add Workflow DevKit API route"
```

---

### Task 12: API Routes — Process CRUD

**Files:**
- Create: `app/api/process/route.ts`, `app/api/process/[id]/route.ts`

- [ ] **Step 1: Create process list + create route**

Create `app/api/process/route.ts`:
```typescript
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { listProcesses, createProcess } from "@/lib/db/queries";
import { start } from "workflow/api";
import { processRecordingWorkflow } from "@/lib/workflows/process-recording";
import { z } from "zod";

const createProcessSchema = z.object({
  name: z.string().min(1).max(200),
  transcript: z.string().min(10),
  durationSeconds: z.number().int().positive(),
});

export async function GET() {
  const { userId, orgId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = orgId ?? userId;
  const processes = await listProcesses(org);
  return NextResponse.json(processes);
}

export async function POST(request: Request) {
  const { userId, orgId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = createProcessSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const org = orgId ?? userId;
  const process = await createProcess({
    name: parsed.data.name,
    orgId: org,
    createdBy: userId,
    status: "draft",
  });

  // Start the workflow pipeline
  const run = await start(processRecordingWorkflow, [
    process.id,
    parsed.data.transcript,
    parsed.data.durationSeconds,
  ]);

  return NextResponse.json({ ...process, workflowRunId: run.runId }, { status: 201 });
}
```

- [ ] **Step 2: Create process detail route**

Create `app/api/process/[id]/route.ts`:
```typescript
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getProcess, updateProcess, deleteProcess } from "@/lib/db/queries";
import { z } from "zod";

const updateProcessSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  structuredData: z.unknown().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const process = await getProcess(id);
  if (!process) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(process);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const parsed = updateProcessSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await updateProcess(id, parsed.data);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await deleteProcess(id);
  return new Response(null, { status: 204 });
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/process/
git commit -m "feat: add process CRUD API routes"
```

---

### Task 13: API Routes — Deepgram Token & Clarification

**Files:**
- Create: `app/api/deepgram/token/route.ts`, `app/api/process/[id]/clarify/route.ts`, `lib/deepgram/client.ts`

- [ ] **Step 1: Create Deepgram server client**

Create `lib/deepgram/client.ts`:
```typescript
import { createClient } from "@deepgram/sdk";

export const deepgram = createClient(process.env.DEEPGRAM_API_KEY!);
```

- [ ] **Step 2: Create Deepgram token route**

For MVP pilot, proxy the API key. In production, use Deepgram's project key management.

Create `app/api/deepgram/token/route.ts`:
```typescript
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // For MVP: return the API key directly. The route is auth-protected.
  // Production: use Deepgram's createProjectKey for short-lived tokens.
  return NextResponse.json({ key: process.env.DEEPGRAM_API_KEY });
}
```

- [ ] **Step 3: Create clarification resume route**

Create `app/api/process/[id]/clarify/route.ts`:
```typescript
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { resumeHook } from "workflow/api";
import { z } from "zod";

const clarifySchema = z.object({
  answers: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
    })
  ),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const parsed = clarifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await resumeHook(`clarify-${id}`, { answers: parsed.data.answers });

  return NextResponse.json({ resumed: true });
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/deepgram/ app/api/deepgram/ app/api/process/
git commit -m "feat: add Deepgram token and clarification resume API routes"
```

---

### Task 14: shadcn/ui Setup

**Files:**
- Create: `components/ui/*` (via shadcn CLI)

- [ ] **Step 1: Initialize shadcn**

```bash
bunx shadcn@latest init -d
```

Select: New York style, Slate color, CSS variables enabled.

- [ ] **Step 2: Install needed components**

```bash
bunx shadcn@latest add button input card badge dialog textarea scroll-area separator skeleton
```

- [ ] **Step 3: Commit**

```bash
git add components/ui/ lib/utils.ts tailwind.config.ts app/globals.css
git commit -m "chore: initialize shadcn/ui with core components"
```

---

### Task 15: Hooks — Audio Recorder & Deepgram

**Files:**
- Create: `hooks/use-audio-recorder.ts`, `hooks/use-deepgram.ts`

- [ ] **Step 1: Create audio recorder hook**

Create `hooks/use-audio-recorder.ts`:
```typescript
"use client";

import { useState, useRef, useCallback } from "react";

type AudioRecorderState = {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  error: string | null;
};

export function useAudioRecorder(onAudioData: (data: Blob) => void) {
  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    error: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          onAudioData(event.data);
        }
      };

      mediaRecorder.start(250); // Send chunks every 250ms

      timerRef.current = setInterval(() => {
        setState((prev) => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);

      setState({ isRecording: true, isPaused: false, duration: 0, error: null });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "Microphone access denied",
      }));
    }
  }, [onAudioData]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
      if (timerRef.current) clearInterval(timerRef.current);
      setState((prev) => ({ ...prev, isPaused: true }));
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
      timerRef.current = setInterval(() => {
        setState((prev) => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);
      setState((prev) => ({ ...prev, isPaused: false }));
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setState((prev) => ({ ...prev, isRecording: false, isPaused: false }));
  }, []);

  return {
    ...state,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
  };
}
```

- [ ] **Step 2: Create Deepgram WebSocket hook**

Create `hooks/use-deepgram.ts`:
```typescript
"use client";

import { useState, useRef, useCallback } from "react";
import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";

export function useDeepgram() {
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const connectionRef = useRef<ReturnType<ReturnType<typeof createClient>["listen"]["live"]> | null>(null);

  const connect = useCallback(async () => {
    const res = await fetch("/api/deepgram/token");
    const { key } = await res.json();

    const client = createClient(key);
    const connection = client.listen.live({
      model: "nova-3",
      language: "en",
      smart_format: true,
      interim_results: true,
      utterance_end_ms: 1000,
      vad_events: true,
      endpointing: 300,
    });

    connection.on(LiveTranscriptionEvents.Open, () => {
      setIsConnected(true);
    });

    connection.on(LiveTranscriptionEvents.Transcript, (data) => {
      const text = data.channel.alternatives[0]?.transcript ?? "";
      if (data.is_final) {
        if (text) {
          setTranscript((prev) => (prev ? prev + " " + text : text));
        }
        setInterimText("");
      } else {
        setInterimText(text);
      }
    });

    connection.on(LiveTranscriptionEvents.Error, (error) => {
      console.error("Deepgram error:", error);
    });

    connection.on(LiveTranscriptionEvents.Close, () => {
      setIsConnected(false);
    });

    connectionRef.current = connection;
  }, []);

  const sendAudio = useCallback((data: Blob) => {
    if (connectionRef.current) {
      connectionRef.current.send(data);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (connectionRef.current) {
      connectionRef.current.requestClose();
      connectionRef.current = null;
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimText("");
  }, []);

  return {
    transcript,
    interimText,
    fullText: transcript + (interimText ? " " + interimText : ""),
    isConnected,
    connect,
    sendAudio,
    disconnect,
    resetTranscript,
  };
}
```

- [ ] **Step 3: Commit**

```bash
git add hooks/
git commit -m "feat: add audio recorder and Deepgram WebSocket hooks"
```

---

### Task 16: Hooks — Process CRUD

**Files:**
- Create: `hooks/use-processes.ts`

- [ ] **Step 1: Create TanStack Query hooks**

Create `hooks/use-processes.ts`:
```typescript
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Process } from "@/lib/db/schema";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  return res.json();
}

export function useProcesses() {
  return useQuery<Process[]>({
    queryKey: ["processes"],
    queryFn: () => fetchJson("/api/process"),
  });
}

export function useProcess(id: string) {
  return useQuery<Process>({
    queryKey: ["process", id],
    queryFn: () => fetchJson(`/api/process/${id}`),
    enabled: !!id,
  });
}

export function useCreateProcess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; transcript: string; durationSeconds: number }) =>
      fetchJson<Process & { workflowRunId: string }>("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processes"] });
    },
  });
}

export function useUpdateProcess(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name?: string; description?: string; structuredData?: unknown }) =>
      fetchJson<Process>(`/api/process/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["process", id], updated);
      queryClient.invalidateQueries({ queryKey: ["processes"] });
    },
  });
}

export function useDeleteProcess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/process/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processes"] });
    },
  });
}

export function useSubmitClarification(processId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (answers: { question: string; answer: string }[]) =>
      fetchJson(`/api/process/${processId}/clarify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["process", processId] });
    },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add hooks/use-processes.ts
git commit -m "feat: add TanStack Query hooks for process CRUD"
```

---

### Task 17: Components — Recording

**Files:**
- Create: `components/recording/audio-recorder.tsx`, `components/recording/live-transcript.tsx`, `components/recording/recording-controls.tsx`

- [ ] **Step 1: Create LiveTranscript component**

Create `components/recording/live-transcript.tsx`:
```typescript
"use client";

import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

type Props = {
  transcript: string;
  interimText: string;
};

export function LiveTranscript({ transcript, interimText }: Props) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript, interimText]);

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800">
      <div className="px-4 py-2 border-b border-slate-700">
        <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
          Live Transcript
        </span>
      </div>
      <ScrollArea className="h-48 p-4">
        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
          {transcript}
          {interimText && (
            <span className="text-indigo-400 bg-indigo-500/10 rounded px-0.5">
              {interimText}
            </span>
          )}
          {!transcript && !interimText && (
            <span className="text-slate-500">
              Start speaking to see your transcript here...
            </span>
          )}
        </p>
        <div ref={endRef} />
      </ScrollArea>
    </div>
  );
}
```

- [ ] **Step 2: Create RecordingControls component**

Create `components/recording/recording-controls.tsx`:
```typescript
"use client";

import { Button } from "@/components/ui/button";

type Props = {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
};

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function RecordingControls({
  isRecording,
  isPaused,
  duration,
  onPause,
  onResume,
  onStop,
}: Props) {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <div className="text-4xl font-light text-slate-100 tabular-nums">
          {formatDuration(duration)}
        </div>
        <div className="text-sm mt-1">
          {isPaused ? (
            <span className="text-amber-400">Paused</span>
          ) : isRecording ? (
            <span className="text-red-400">Recording</span>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-6">
        <Button
          variant="outline"
          size="lg"
          className="rounded-full w-14 h-14"
          onClick={isPaused ? onResume : onPause}
        >
          {isPaused ? "Resume" : "Pause"}
        </Button>

        <Button
          variant="destructive"
          size="lg"
          className="rounded-full w-16 h-16 text-lg font-semibold shadow-lg shadow-red-500/25"
          onClick={onStop}
        >
          Stop
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create AudioRecorder orchestrator component**

Create `components/recording/audio-recorder.tsx`:
```typescript
"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { useDeepgram } from "@/hooks/use-deepgram";
import { useCreateProcess } from "@/hooks/use-processes";
import { LiveTranscript } from "./live-transcript";
import { RecordingControls } from "./recording-controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AudioRecorder() {
  const router = useRouter();
  const [processName, setProcessName] = useState("");
  const deepgram = useDeepgram();
  const createProcess = useCreateProcess();

  const onAudioData = useCallback(
    (data: Blob) => {
      deepgram.sendAudio(data);
    },
    [deepgram]
  );

  const recorder = useAudioRecorder(onAudioData);

  const handleStart = async () => {
    await deepgram.connect();
    await recorder.startRecording();
  };

  const handleStop = async () => {
    recorder.stopRecording();
    deepgram.disconnect();

    if (!deepgram.transcript.trim()) return;

    const result = await createProcess.mutateAsync({
      name: processName || "Untitled Process",
      transcript: deepgram.transcript,
      durationSeconds: recorder.duration,
    });

    router.push(`/process/${result.id}/review`);
  };

  if (!recorder.isRecording) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Input
          placeholder="Process name (e.g., Sample Receipt QC)"
          value={processName}
          onChange={(e) => setProcessName(e.target.value)}
          className="bg-slate-800 border-slate-700"
        />
        <Button
          onClick={handleStart}
          size="lg"
          className="w-full bg-indigo-600 hover:bg-indigo-700"
        >
          Start Recording
        </Button>
        {recorder.error && (
          <p className="text-sm text-red-400">{recorder.error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <RecordingControls
        isRecording={recorder.isRecording}
        isPaused={recorder.isPaused}
        duration={recorder.duration}
        onPause={recorder.pauseRecording}
        onResume={recorder.resumeRecording}
        onStop={handleStop}
      />
      <LiveTranscript
        transcript={deepgram.transcript}
        interimText={deepgram.interimText}
      />
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add components/recording/
git commit -m "feat: add recording components (audio recorder, live transcript, controls)"
```

---

### Task 18: Components — Process Display

**Files:**
- Create: `components/process/process-card.tsx`, `components/process/step-timeline.tsx`, `components/process/role-badges.tsx`
- Test: `__tests__/components/process-card.test.tsx`

- [ ] **Step 1: Write ProcessCard test**

Create `__tests__/components/process-card.test.tsx`:
```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProcessCard } from "@/components/process/process-card";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) =>
    <a href={href}>{children}</a>,
}));

describe("ProcessCard", () => {
  it("should display process name and status", () => {
    render(
      <ProcessCard
        process={{
          id: "1",
          name: "Sample Receipt QC",
          status: "complete",
          description: null,
          orgId: "org1",
          createdBy: "user1",
          structuredData: { steps: [{}, {}, {}], roles: [], metadata: {} } as any,
          createdAt: new Date(),
          updatedAt: new Date(),
        }}
      />
    );
    expect(screen.getByText("Sample Receipt QC")).toBeTruthy();
    expect(screen.getByText("Complete")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
bun run vitest run __tests__/components/process-card.test.tsx
```

- [ ] **Step 3: Create ProcessCard**

Create `components/process/process-card.tsx`:
```typescript
"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { Process } from "@/lib/db/schema";
import type { ProcessStructuredData } from "@/lib/ai/schemas";

const statusConfig = {
  draft: { label: "Draft", className: "bg-amber-900/50 text-amber-300 border-amber-700" },
  reviewing: { label: "Reviewing", className: "bg-purple-900/50 text-purple-300 border-purple-700" },
  complete: { label: "Complete", className: "bg-emerald-900/50 text-emerald-300 border-emerald-700" },
};

export function ProcessCard({ process }: { process: Process }) {
  const config = statusConfig[process.status];
  const data = process.structuredData as ProcessStructuredData | null;
  const stepCount = data?.steps?.length ?? 0;
  const decisionCount = data?.steps?.filter((s) => s.type === "decision").length ?? 0;

  const timeAgo = getTimeAgo(new Date(process.updatedAt));

  return (
    <Link href={`/process/${process.id}`}>
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-colors">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-slate-100">{process.name}</h3>
            <p className="text-xs text-slate-400 mt-1">
              {stepCount > 0
                ? `${stepCount} steps \u00b7 ${decisionCount} decision points`
                : process.status === "reviewing"
                  ? "Awaiting clarification"
                  : "Processing..."}
            </p>
          </div>
          <Badge variant="outline" className={config.className}>
            {config.label}
          </Badge>
        </div>
        <p className="text-xs text-slate-500 mt-2">Updated {timeAgo}</p>
      </div>
    </Link>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
```

- [ ] **Step 4: Create StepTimeline**

Create `components/process/step-timeline.tsx`:
```typescript
"use client";

import type { ProcessStructuredData } from "@/lib/ai/schemas";

const roleColors = [
  "bg-indigo-900/50 text-indigo-300",
  "bg-orange-900/50 text-orange-300",
  "bg-emerald-900/50 text-emerald-300",
  "bg-pink-900/50 text-pink-300",
  "bg-cyan-900/50 text-cyan-300",
];

export function StepTimeline({ data }: { data: ProcessStructuredData }) {
  const roleNameMap = new Map(data.roles.map((r) => [r.id, r.name]));

  return (
    <div className="space-y-1">
      {data.steps.map((step, index) => (
        <div key={step.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            {step.type === "decision" ? (
              <div className="w-7 h-7 bg-amber-900/50 rounded-md rotate-45 flex items-center justify-center shrink-0">
                <span className="-rotate-45 text-amber-300 text-[10px] font-bold">
                  D{data.steps.filter((s, i2) => i2 <= index && s.type === "decision").length}
                </span>
              </div>
            ) : (
              <div className="w-7 h-7 bg-indigo-900/50 rounded-full flex items-center justify-center shrink-0">
                <span className="text-indigo-300 text-xs font-semibold">{step.order}</span>
              </div>
            )}
            {index < data.steps.length - 1 && (
              <div className="w-0.5 flex-1 bg-slate-700 min-h-[8px]" />
            )}
          </div>

          <div className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-3 mb-2">
            <div className="font-medium text-sm text-slate-100">{step.name}</div>
            <div className="text-xs text-slate-400 mt-1">
              {roleNameMap.get(step.actor_role) ?? step.actor_role}
              {step.duration_estimate && ` \u00b7 ${step.duration_estimate}`}
            </div>
            {step.type === "decision" && step.branches && (
              <div className="text-xs text-amber-300/80 mt-1">
                {step.branches.map((b) => b.label).join(" \u00b7 ")}
              </div>
            )}
            {step.description !== step.name && (
              <p className="text-xs text-slate-500 mt-1">{step.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Create RoleBadges**

Create `components/process/role-badges.tsx`:
```typescript
"use client";

import type { ProcessStructuredData } from "@/lib/ai/schemas";

const badgeColors = [
  "bg-indigo-900/50 text-indigo-300",
  "bg-orange-900/50 text-orange-300",
  "bg-emerald-900/50 text-emerald-300",
  "bg-pink-900/50 text-pink-300",
  "bg-cyan-900/50 text-cyan-300",
];

export function RoleBadges({ data }: { data: ProcessStructuredData }) {
  return (
    <div className="flex gap-2 overflow-x-auto py-2 px-1">
      {data.roles.map((role, i) => (
        <span
          key={role.id}
          className={`${badgeColors[i % badgeColors.length]} text-xs px-3 py-1 rounded-full whitespace-nowrap`}
        >
          {role.name}
        </span>
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Run test**

```bash
bun run vitest run __tests__/components/process-card.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add components/process/ __tests__/components/
git commit -m "feat: add process display components (card, timeline, role badges)"
```

---

### Task 19: Components — Clarification

**Files:**
- Create: `components/clarification/question-list.tsx`, `components/clarification/answer-input.tsx`

- [ ] **Step 1: Create AnswerInput component**

Create `components/clarification/answer-input.tsx`:
```typescript
"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type Props = {
  onSubmit: (answer: string) => void;
};

export function AnswerInput({ onSubmit }: Props) {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (!text.trim()) return;
    onSubmit(text.trim());
    setText("");
  };

  return (
    <div className="flex gap-2 mt-3">
      <Textarea
        placeholder="Type your answer..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="bg-slate-900 border-slate-600 text-sm min-h-[44px] resize-none"
        rows={2}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
      />
      <Button onClick={handleSubmit} size="sm" className="self-end bg-indigo-600">
        Send
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Create QuestionList component**

Create `components/clarification/question-list.tsx`:
```typescript
"use client";

import { useState } from "react";
import { AnswerInput } from "./answer-input";
import { Button } from "@/components/ui/button";

type Question = {
  id: string;
  text: string;
  context: string;
  gap_type: string;
};

type QAPair = { question: string; answer: string };

type Props = {
  questions: Question[];
  onComplete: (answers: QAPair[]) => void;
  isSubmitting: boolean;
};

export function QuestionList({ questions, onComplete, isSubmitting }: Props) {
  const [answers, setAnswers] = useState<Map<string, string>>(new Map());
  const currentIndex = answers.size;
  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? (answers.size / questions.length) * 100 : 0;

  const handleAnswer = (answer: string) => {
    if (!currentQuestion) return;
    setAnswers((prev) => new Map(prev).set(currentQuestion.id, answer));
  };

  const handleSubmit = () => {
    const qaPairs = questions
      .filter((q) => answers.has(q.id))
      .map((q) => ({ question: q.text, answer: answers.get(q.id)! }));
    onComplete(qaPairs);
  };

  const handleSkipAll = () => {
    onComplete([]);
  };

  const allAnswered = answers.size >= questions.length;

  return (
    <div className="space-y-4">
      <div>
        <div className="flex justify-between text-sm text-slate-400 mb-2">
          <span>{answers.size} of {questions.length} answered</span>
          <button
            onClick={handleSkipAll}
            className="text-slate-500 hover:text-slate-300 text-xs"
          >
            Skip all
          </button>
        </div>
        <div className="h-1 bg-slate-700 rounded-full">
          <div
            className="h-1 bg-indigo-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {questions.map((q, i) => {
          const isAnswered = answers.has(q.id);
          const isCurrent = i === currentIndex;

          return (
            <div
              key={q.id}
              className={`rounded-xl border p-4 transition-all ${
                isAnswered
                  ? "border-slate-700 bg-slate-800/50 opacity-60"
                  : isCurrent
                    ? "border-indigo-500 bg-slate-800"
                    : "border-slate-700 bg-slate-800/30 opacity-40"
              }`}
            >
              <div className="text-xs mb-1">
                {isAnswered ? (
                  <span className="text-emerald-400">Answered</span>
                ) : isCurrent ? (
                  <span className="text-indigo-400">Current</span>
                ) : (
                  <span className="text-slate-500">Upcoming</span>
                )}
              </div>
              <p className="text-sm font-medium text-slate-100">{q.text}</p>
              <p className="text-xs text-slate-500 mt-1">{q.context}</p>
              {isAnswered && (
                <p className="text-xs text-slate-400 mt-2 italic">
                  &ldquo;{answers.get(q.id)}&rdquo;
                </p>
              )}
              {isCurrent && <AnswerInput onSubmit={handleAnswer} />}
            </div>
          );
        })}
      </div>

      {allAnswered && (
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-indigo-600 hover:bg-indigo-700"
        >
          {isSubmitting ? "Submitting..." : "Submit Answers & Structure Process"}
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/clarification/
git commit -m "feat: add clarification components (question list, answer input)"
```

---

### Task 20: Components — Process Editor

**Files:**
- Create: `components/process/step-editor.tsx`

- [ ] **Step 1: Create StepEditor**

Create `components/process/step-editor.tsx`:
```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add components/process/step-editor.tsx
git commit -m "feat: add step editor component with reorder and add/remove"
```

---

### Task 21: Pages — Home (Process List)

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Implement process list page**

Replace `app/page.tsx`:
```typescript
"use client";

import Link from "next/link";
import { useProcesses } from "@/hooks/use-processes";
import { ProcessCard } from "@/components/process/process-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

export default function HomePage() {
  const { data: processes, isLoading } = useProcesses();
  const [search, setSearch] = useState("");

  const filtered = processes?.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur border-b border-slate-800 px-4 py-4">
        <div className="flex justify-between items-center max-w-lg mx-auto">
          <h1 className="text-lg font-semibold">My Processes</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <Input
          placeholder="Search processes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-slate-800 border-slate-700"
        />

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 bg-slate-800 rounded-xl" />
            ))}
          </div>
        ) : filtered && filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map((process) => (
              <ProcessCard key={process.id} process={process} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <p>No processes yet</p>
            <p className="text-sm mt-1">Start by recording your first process</p>
          </div>
        )}

        <div className="fixed bottom-6 left-0 right-0 flex justify-center">
          <Link href="/record">
            <Button
              size="lg"
              className="bg-indigo-600 hover:bg-indigo-700 rounded-full px-8 shadow-lg shadow-indigo-500/25"
            >
              + New Recording
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add process list home page"
```

---

### Task 22: Pages — Recording

**Files:**
- Create: `app/record/page.tsx`

- [ ] **Step 1: Create recording page**

Create `app/record/page.tsx`:
```typescript
"use client";

import Link from "next/link";
import { AudioRecorder } from "@/components/recording/audio-recorder";

export default function RecordPage() {
  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur border-b border-slate-800 px-4 py-4">
        <div className="flex justify-between items-center max-w-lg mx-auto">
          <Link href="/" className="text-sm text-slate-400 hover:text-slate-200">
            Back
          </Link>
          <h1 className="text-base font-semibold">New Recording</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-lg mx-auto">
        <AudioRecorder />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/record/
git commit -m "feat: add recording page"
```

---

### Task 23: Pages — Clarification Review

**Files:**
- Create: `app/process/[id]/review/page.tsx`

- [ ] **Step 1: Create review page**

Create `app/process/[id]/review/page.tsx`:
```typescript
"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProcess, useSubmitClarification } from "@/hooks/use-processes";
import { QuestionList } from "@/components/clarification/question-list";
import { Skeleton } from "@/components/ui/skeleton";

type PendingQuestions = {
  pendingQuestions: {
    id: string;
    text: string;
    context: string;
    gap_type: string;
  }[];
};

export default function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: process, isLoading } = useProcess(id);
  const submitClarification = useSubmitClarification(id);

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto p-4 space-y-4">
        <Skeleton className="h-8 bg-slate-800" />
        <Skeleton className="h-32 bg-slate-800" />
        <Skeleton className="h-32 bg-slate-800" />
      </div>
    );
  }

  if (!process) {
    return <div className="p-4 text-slate-400">Process not found</div>;
  }

  if (process.status === "complete") {
    router.replace(`/process/${id}`);
    return null;
  }

  const data = process.structuredData as PendingQuestions | null;
  const questions = data?.pendingQuestions ?? [];

  if (questions.length === 0) {
    return (
      <div className="max-w-lg mx-auto p-8 text-center">
        <p className="text-slate-300">AI is analyzing your recording...</p>
        <p className="text-sm text-slate-500 mt-1">This usually takes 15-30 seconds</p>
      </div>
    );
  }

  const handleComplete = async (answers: { question: string; answer: string }[]) => {
    await submitClarification.mutateAsync(answers);
    router.push(`/process/${id}`);
  };

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur border-b border-slate-800 px-4 py-4">
        <div className="flex justify-between items-center max-w-lg mx-auto">
          <Link href="/" className="text-sm text-slate-400">Back</Link>
          <h1 className="text-base font-semibold">AI has questions</h1>
          <div className="w-10" />
        </div>
        <p className="text-xs text-slate-400 text-center mt-1">{process.name}</p>
      </div>

      <div className="max-w-lg mx-auto p-4">
        <QuestionList
          questions={questions}
          onComplete={handleComplete}
          isSubmitting={submitClarification.isPending}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/process/
git commit -m "feat: add clarification review page"
```

---

### Task 24: Pages — Process View

**Files:**
- Create: `app/process/[id]/page.tsx`

- [ ] **Step 1: Create process view page**

Create `app/process/[id]/page.tsx`:
```typescript
"use client";

import { use } from "react";
import Link from "next/link";
import { useProcess } from "@/hooks/use-processes";
import { StepTimeline } from "@/components/process/step-timeline";
import { RoleBadges } from "@/components/process/role-badges";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProcessStructuredData } from "@/lib/ai/schemas";

export default function ProcessViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: process, isLoading } = useProcess(id);

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto p-4 space-y-4">
        <Skeleton className="h-8 bg-slate-800" />
        <Skeleton className="h-64 bg-slate-800" />
      </div>
    );
  }

  if (!process) {
    return <div className="p-4 text-slate-400">Process not found</div>;
  }

  const data = process.structuredData as ProcessStructuredData | null;

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur border-b border-slate-800 px-4 py-4">
        <div className="flex justify-between items-center max-w-lg mx-auto">
          <Link href="/" className="text-sm text-slate-400">Back</Link>
          <div className="text-center">
            <h1 className="text-base font-semibold">{process.name}</h1>
            {data && (
              <p className="text-xs text-slate-400 mt-0.5">
                {data.steps.length} steps &middot; {data.roles.length} roles &middot; {data.metadata.estimated_total_duration}
              </p>
            )}
          </div>
          <Link href={`/process/${id}/edit`} className="text-sm text-indigo-400">
            Edit
          </Link>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {data ? (
          <>
            <RoleBadges data={data} />
            <StepTimeline data={data} />
            {data.metadata.trigger && (
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-sm">
                <p className="text-slate-500 text-xs uppercase mb-1">Trigger</p>
                <p className="text-slate-300">{data.metadata.trigger}</p>
                <p className="text-slate-500 text-xs uppercase mt-3 mb-1">End condition</p>
                <p className="text-slate-300">{data.metadata.end_condition}</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <p>Process is still being structured...</p>
            <p className="text-sm mt-1">Check back in a moment</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/process/
git commit -m "feat: add process view page with step timeline"
```

---

### Task 25: Pages — Process Edit

**Files:**
- Create: `app/process/[id]/edit/page.tsx`

- [ ] **Step 1: Create edit page**

Create `app/process/[id]/edit/page.tsx`:
```typescript
"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProcess, useUpdateProcess } from "@/hooks/use-processes";
import { StepEditor } from "@/components/process/step-editor";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import type { ProcessStructuredData } from "@/lib/ai/schemas";

export default function ProcessEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: process, isLoading } = useProcess(id);
  const updateProcess = useUpdateProcess(id);
  const [name, setName] = useState("");

  useEffect(() => {
    if (process) setName(process.name);
  }, [process]);

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto p-4 space-y-4">
        <Skeleton className="h-10 bg-slate-800" />
        <Skeleton className="h-64 bg-slate-800" />
      </div>
    );
  }

  if (!process) {
    return <div className="p-4 text-slate-400">Process not found</div>;
  }

  const data = process.structuredData as ProcessStructuredData | null;
  if (!data) {
    return <div className="p-4 text-slate-400">Process not yet structured</div>;
  }

  const handleSave = async (steps: ProcessStructuredData["steps"]) => {
    await updateProcess.mutateAsync({
      name,
      structuredData: { ...data, steps },
    });
    router.push(`/process/${id}`);
  };

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur border-b border-slate-800 px-4 py-4">
        <div className="flex justify-between items-center max-w-lg mx-auto">
          <Link href={`/process/${id}`} className="text-sm text-slate-400">
            Cancel
          </Link>
          <h1 className="text-base font-semibold">Edit Process</h1>
          <div className="w-16" />
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Process name"
          className="bg-slate-800 border-slate-700 text-lg font-semibold"
        />
        <StepEditor
          steps={data.steps}
          onSave={handleSave}
          isSaving={updateProcess.isPending}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/process/
git commit -m "feat: add process edit page with step editor"
```

---

### Task 26: PWA Manifest & Service Worker

**Files:**
- Create: `public/manifest.json`, `app/sw-register.tsx`

- [ ] **Step 1: Create manifest**

Create `public/manifest.json`:
```json
{
  "name": "Convairsify",
  "short_name": "Convairsify",
  "description": "Record and structure business processes with voice and AI",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#0f172a",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

- [ ] **Step 2: Create service worker registration component**

Create `components/sw-register.tsx`:
```typescript
"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(console.error);
    }
  }, []);
  return null;
}
```

- [ ] **Step 3: Create minimal service worker**

Create `public/sw.js`:
```javascript
var CACHE_NAME = "convairsify-v1";
var PRECACHE_URLS = ["/", "/record"];

self.addEventListener("install", function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) { return cache.addAll(PRECACHE_URLS); })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k) { return k !== CACHE_NAME; }).map(function(k) { return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function(event) {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request).catch(function() { return caches.match(event.request); })
  );
});
```

- [ ] **Step 4: Add ServiceWorkerRegister to layout**

Add `<ServiceWorkerRegister />` inside the `<body>` in `app/layout.tsx`, after `<Providers>`:
```typescript
import { ServiceWorkerRegister } from "@/components/sw-register";

// Inside the body:
<Providers>{children}</Providers>
<ServiceWorkerRegister />
```

- [ ] **Step 5: Commit**

```bash
git add public/manifest.json public/sw.js components/sw-register.tsx app/layout.tsx
git commit -m "feat: add PWA manifest and service worker"
```

---

### Task 27: Run Database Migration & Smoke Test

**Files:** None new — verification only.

- [ ] **Step 1: Push migration to Neon**

```bash
bunx drizzle-kit push
```

Expected: Tables created in Neon database. (Requires `DATABASE_URL` in `.env.local`.)

- [ ] **Step 2: Start dev server**

```bash
bun dev
```

- [ ] **Step 3: Verify routes load**

Open `http://localhost:3000` — should show empty process list after Clerk auth.
Open `http://localhost:3000/record` — should show recording interface.

- [ ] **Step 4: Run all tests**

```bash
bun run vitest run
```

Expected: All unit tests pass.

- [ ] **Step 5: Build for production**

```bash
bun run build
```

Expected: Build succeeds.

- [ ] **Step 6: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve build and test issues"
```

---

## Summary

| Task | Component | Steps |
|------|-----------|-------|
| 1 | Project scaffolding | 8 |
| 2 | Database schema & client | 9 |
| 3 | Clerk auth | 5 |
| 4 | AI schemas & prompts | 6 |
| 5 | Workflow: finalize transcript | 5 |
| 6 | Workflow: analyze gaps | 5 |
| 7 | Workflow: generate questions | 5 |
| 8 | Workflow: structure process | 5 |
| 9 | Workflow: store process | 2 |
| 10 | Workflow orchestrator | 2 |
| 11 | API: workflow endpoint | 2 |
| 12 | API: process CRUD | 3 |
| 13 | API: deepgram token + clarify | 4 |
| 14 | shadcn/ui setup | 3 |
| 15 | Hooks: audio + deepgram | 3 |
| 16 | Hooks: process CRUD | 2 |
| 17 | Components: recording | 4 |
| 18 | Components: process display | 7 |
| 19 | Components: clarification | 3 |
| 20 | Components: step editor | 2 |
| 21 | Page: home | 2 |
| 22 | Page: recording | 2 |
| 23 | Page: clarification review | 2 |
| 24 | Page: process view | 2 |
| 25 | Page: process edit | 2 |
| 26 | PWA manifest + SW | 5 |
| 27 | Migration & smoke test | 6 |
| **Total** | | **106 steps** |
