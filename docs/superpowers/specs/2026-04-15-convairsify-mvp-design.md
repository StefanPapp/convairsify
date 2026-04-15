# Convairsify MVP — Technical Design Spec

**Date:** 2026-04-15
**Status:** Draft
**PRD Reference:** `docs/PRD Convairsify MVP.md`

---

## 1. Overview

Convairsify is a mobile-first web application that lets enterprise users capture business processes by speaking. The AI agent transcribes in real-time, asks clarifying questions when gaps are detected, and structures the recording into a formal process model with steps, decision points, roles, and metadata.

**MVP scope:** Record via voice, AI-assisted clarification (on-screen review mode), structured process storage, browse/search, and editing.

---

## 2. Architecture

### 2.1 High-Level Components

```
Browser (PWA)
  ├── Recording View ──WebSocket──→ Deepgram STT API
  ├── Clarification Review ──REST──→ API (resumeHook)
  ├── Process List/View/Edit ──REST──→ API (CRUD)
  └── Auth ──→ Clerk

Vercel Platform
  ├── Next.js 16 App Router (frontend + API routes)
  ├── Vercel Workflow DevKit (durable AI pipeline)
  ├── Claude via AI SDK (analysis, structuring)
  ├── Neon Postgres (storage)
  └── Clerk (SSO/SAML auth)
```

### 2.2 Data Flow

1. **Record:** Browser mic → WebSocket → Deepgram → real-time transcript displayed in UI. Raw transcript stored client-side and sent to server on recording end.
2. **Process:** Recording ends → POST to API → starts Workflow → finalize transcript → analyze gaps → generate clarifying questions.
3. **Clarify:** Workflow pauses via hook → UI shows questions → user answers (text or voice-to-text) → API calls `resumeHook` → workflow resumes with answers.
4. **Structure & Store:** Claude structures the enriched transcript into the process JSON model → stored in Neon Postgres → process status set to "complete".

### 2.3 Why Vercel Workflow DevKit

The recording-to-structured-process pipeline requires:
- Multi-step async processing (30+ seconds)
- Independent retry per step (Claude rate limits, transient failures)
- Human-in-the-loop pause/resume (clarification questions)
- Streaming progress to UI
- Crash recovery without re-running completed steps

Workflow DevKit provides all of these natively. The clarification review maps to a Workflow hook — the workflow suspends until the user finishes answering.

---

## 3. Data Model

### 3.1 Database Schema (Neon Postgres + Drizzle ORM)

**`processes` table:**

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Default: `gen_random_uuid()` |
| org_id | text | Clerk organization ID |
| name | text | User-provided process name |
| description | text, nullable | Optional summary |
| status | enum: `draft`, `reviewing`, `complete` | Tracks pipeline state |
| created_by | text | Clerk user ID |
| structured_data | jsonb, nullable | The structured process model (see 3.2) |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**`recordings` table:**

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| process_id | uuid (FK → processes) | |
| raw_transcript | text | Deepgram output after finalization |
| audio_url | text, nullable | Vercel Blob URL. MVP stores audio for re-recording/playback. |
| duration_seconds | integer | Recording length |
| clarification_qa | jsonb, nullable | `[{ question, answer }]` |
| workflow_run_id | text, nullable | Workflow DevKit run ID for tracking |
| created_at | timestamptz | |

### 3.2 Process Structured Data (JSON Schema)

```typescript
type ProcessStructuredData = {
  steps: ProcessStep[];
  roles: Role[];
  metadata: ProcessMetadata;
};

type ProcessStep = {
  id: string;              // nanoid
  order: number;
  name: string;
  description: string;
  type: "action" | "decision" | "subprocess";
  actor_role: string;      // references Role.id
  inputs: string[];
  outputs: string[];
  duration_estimate: string | null;  // e.g., "~5 min"
  // Decision-specific fields
  decision_criteria: string | null;
  branches: { label: string; next_step_id: string }[] | null;
  // Exception handling
  exception_handling: string | null;
};

type Role = {
  id: string;
  name: string;
  description: string;
};

type ProcessMetadata = {
  domain: string;                    // e.g., "Quality Control"
  estimated_total_duration: string;  // e.g., "~45 min"
  trigger: string;                   // What starts the process
  end_condition: string;             // What marks completion
};
```

### 3.3 Key Data Decisions

- **JSONB for structured_data:** Flexible schema evolution without migrations. Queryable with Postgres JSON operators.
- **Separate recordings table:** A process can be re-recorded. We keep recordings linked to processes.
- **Clarification Q&A with recording:** Ties AI questions and user answers to the specific recording session.
- **No version history (per PRD):** Overwrites in place. Editing mutates `structured_data` directly.

---

## 4. Workflow Pipeline

```
processRecordingWorkflow(processId: string, transcript: string)
  "use workflow"

  Step 1: finalizeTranscript(transcript)
    "use step"
    - Clean Deepgram output: remove filler words, fix punctuation
    - Claude call: polish transcript preserving meaning
    - Returns: cleaned transcript string

  Step 2: analyzeGaps(cleanedTranscript)
    "use step"
    - Claude call with Zod-validated structured output
    - Detects: missing roles, unclear decisions, vague timing,
      missing exception handling, ambiguous handoffs
    - Returns: { gaps: Gap[], summary: string }

  Step 3: generateQuestions(gaps)
    "use step"
    - Claude call: converts gaps into natural-language questions
    - Prioritizes by severity (high → low)
    - Writes questions to DB, updates process status to "reviewing"
    - Returns: { questions: Question[] }

  --- HOOK: createHook({ token: `clarify-${processId}` }) ---
    - Workflow PAUSES
    - UI shows clarification review screen
    - User answers questions (text or voice → transcribed)
    - API route calls resumeHook(token, { answers })
    - Workflow RESUMES

  Step 4: structureProcess(cleanedTranscript, answers)
    "use step"
    - Claude call with full context (transcript + Q&A)
    - Zod-validated structured output matching ProcessStructuredData
    - Returns: ProcessStructuredData

  Step 5: storeProcess(processId, structuredData)
    "use step"
    - Writes structured_data to Postgres
    - Updates process status to "complete"
    - Returns: { success: true }
```

**If no gaps are detected** in step 2 (rare but possible for well-described processes): step 3 returns empty questions, the hook is immediately resumed with empty answers, and step 4 structures directly from the transcript.

**Streaming:** Each step writes progress updates via `getWritable()` so the UI can show real-time status ("Analyzing transcript...", "Found 5 gaps...", "Structuring process...").

---

## 5. Frontend

### 5.1 Views and Routes

| Route | View | Description |
|-------|------|-------------|
| `/` | Process List | Browse/search all processes. Status badges. "New Recording" FAB. |
| `/record` | Recording | Mic capture, live transcript via Deepgram WebSocket, timer, pause/stop. |
| `/process/[id]/review` | Clarification Review | Progress bar, question cards (answered/current/upcoming), text + voice answer input. |
| `/process/[id]` | Process View | Structured step timeline, decision diamonds, role badges, metadata. |
| `/process/[id]/edit` | Process Editor | Edit steps, decision points, roles. Add/remove/reorder steps. Re-record sections. |

### 5.2 Key UI Components

**Recording:**
- `AudioRecorder` — captures mic via `MediaRecorder` API, streams audio chunks to Deepgram WebSocket. Handles permission, reconnection, and local buffering.
- `LiveTranscript` — displays real-time Deepgram output with interim/final result distinction. Auto-scrolls.
- `RecordingControls` — pause, resume, stop. Timer display.

**Clarification:**
- `QuestionList` — renders answered (dimmed), current (highlighted), and upcoming questions. Progress bar.
- `AnswerInput` — text input + mic button for voice answers. Voice answers transcribed via Deepgram before submission.

**Process:**
- `StepTimeline` — vertical timeline with numbered circles (actions) and diamond markers (decisions). Role color-coding.
- `StepEditor` — inline editing of step fields. Drag-and-drop reorder via native DnD API.
- `RoleBadges` — colored pills for each role, filterable.
- `ProcessCard` — list item showing name, step count, status badge, last updated.

### 5.3 State Management

- **Server state:** React Query (TanStack Query) for process CRUD, with optimistic updates for edits.
- **URL state:** `nuqs` for search filters, pagination, active tab on process list.
- **Local state:** `useState`/`useReducer` only for ephemeral UI (recording timer, mic status, transcript buffer).
- **No global client store.** Server is the source of truth.

### 5.4 Styling

- Tailwind CSS with shadcn/ui components.
- Dark theme by default (enterprise users often prefer this; configurable later).
- Mobile-first responsive: optimized for phone-size screens, functional on tablet/desktop.

---

## 6. Authentication

**Clerk** via `@clerk/nextjs`:
- Middleware protects all routes except public landing (if needed).
- `org_id` from Clerk scopes all data queries — users only see their org's processes.
- SSO/SAML configured per enterprise client in Clerk dashboard.
- For MVP pilot: email/password + optional Google SSO. SAML configured for Thermo Fisher when ready.

---

## 7. API Routes

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/process` | List processes for current org |
| POST | `/api/process` | Create new process (name, start recording) |
| GET | `/api/process/[id]` | Get process detail |
| PATCH | `/api/process/[id]` | Update process (edit structured data, name, etc.) |
| DELETE | `/api/process/[id]` | Delete process |
| POST | `/api/process/[id]/clarify` | Resume workflow hook with user answers |
| GET | `/api/deepgram/token` | Short-lived Deepgram API key for client-side WebSocket |
| POST | `/api/workflow` | Workflow DevKit endpoint |

All routes authenticated via Clerk middleware. All mutations validate input with Zod.

---

## 8. Error Handling

### 8.1 Recording Failures

- **Mic permission denied:** Clear prompt explaining why mic access is needed, with retry button.
- **Deepgram WebSocket drops:** Auto-reconnect with exponential backoff. Buffer audio locally during gap. Stitch transcripts on reconnect.
- **Long recordings (60 min):** Deepgram streams natively. Client buffers 30s audio chunks in IndexedDB as crash recovery fallback.

### 8.2 AI Processing Failures

- **Claude rate limit / timeout:** Workflow steps auto-retry. Use `RetryableError` with `retryAfter`.
- **Malformed Claude output:** Zod validation catches it. Step retries with refined prompt including validation error.
- **Workflow crash:** DevKit replays from last completed step. No duplicate work.

### 8.3 Clarification Flow

- **User abandons review:** Process stays in "reviewing". User can return later; hook stays open.
- **User skips all questions:** "Skip & Structure" button resumes hook with empty answers. Step 4 structures with transcript only.

### 8.4 Offline / Network

- **PWA offline:** Service worker caches app shell. Recording works offline (mic + IndexedDB). On reconnect: upload audio, trigger workflow. No real-time STT offline — raw audio with post-processing.
- **Network drop during save:** Optimistic UI with retry queue. IndexedDB as write-ahead log.

### 8.5 Data Edge Cases

- **Empty transcript:** If recording < 10 seconds or STT returns empty, prompt user to re-record. Don't start workflow.
- **Concurrent edits:** Not applicable for MVP (no collaboration). Simple last-write-wins.

---

## 9. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Runtime | React 19, TypeScript |
| Styling | Tailwind CSS, shadcn/ui |
| Auth | Clerk (`@clerk/nextjs`) |
| Database | Neon Postgres, Drizzle ORM |
| AI | Claude via Vercel AI SDK (`@ai-sdk/anthropic`) |
| Speech-to-text | Deepgram (`@deepgram/sdk`) |
| Workflow | Vercel Workflow DevKit (`workflow`, `@workflow/next`) |
| State | TanStack Query, `nuqs` |
| Validation | Zod |
| Deployment | Vercel |

---

## 10. Project Structure

```
convairsify/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                      # Process list
│   ├── record/page.tsx               # Recording view
│   ├── process/[id]/
│   │   ├── page.tsx                  # Process view
│   │   ├── edit/page.tsx             # Process editor
│   │   └── review/page.tsx           # Clarification review
│   └── api/
│       ├── deepgram/token/route.ts
│       ├── process/
│       │   ├── route.ts
│       │   └── [id]/
│       │       ├── route.ts
│       │       └── clarify/route.ts
│       └── workflow/route.ts
├── lib/
│   ├── db/
│   │   ├── schema.ts
│   │   ├── client.ts
│   │   └── migrations/
│   ├── workflows/
│   │   ├── process-recording.ts
│   │   └── steps/
│   │       ├── finalize-transcript.ts
│   │       ├── analyze-gaps.ts
│   │       ├── generate-questions.ts
│   │       ├── structure-process.ts
│   │       └── store-process.ts
│   ├── ai/
│   │   ├── prompts.ts
│   │   └── schemas.ts
│   └── deepgram/
│       └── client.ts
├── components/
│   ├── recording/
│   ├── clarification/
│   ├── process/
│   └── ui/
├── drizzle.config.ts
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## 11. Out of Scope (Confirmed)

Per PRD, explicitly excluded from MVP:
- Visual flowchart/BPMN rendering
- Process automation/execution
- Collaboration (commenting, approvals)
- Desktop/web recording (web PWA covers this partially)
- Enterprise integrations (SAP, ServiceNow)
- Version history / diff
- Analytics
- Multi-language
- Multi-speaker
- Voice interruption clarification mode (on-screen review only for MVP)
