# CLAUDE.md

## Project Overview

Convairsify is a voice-driven business process capture tool. Users record themselves describing a process, AI transcribes and structures it, and a durable workflow handles the multi-step pipeline with human-in-the-loop clarification.

## Tech Stack

- **Next.js 16.2** (App Router) with Vercel Workflow DevKit v4
- **AI SDK v6** — model strings like `"anthropic/claude-sonnet-4.6"` resolve via AI Gateway (requires `AI_GATEWAY_API_KEY`)
- Deepgram (real-time WebSocket STT, nova-3 model)
- Neon Postgres + Drizzle ORM
- Clerk for auth (SSO/SAML)
- Tailwind CSS + shadcn/ui (no `asChild` prop on Button — use Link with className for button-styled links)
- Bun as package manager and task runner

## Commands

```bash
bun dev              # Dev server (runs next dev)
bun build            # Production build
bun lint             # ESLint
bun test             # Vitest (unit tests)
bunx drizzle-kit push      # Push schema to database
bunx drizzle-kit generate  # Generate migration
npx tsc --noEmit            # Type check
```

## Environment

- Secrets are in `.env` (not `.env.local`). Keys: `DEEPGRAM_API_KEY`, `AI_GATEWAY_API_KEY`, `CLERK_SECRET_KEY`, `DATABASE_URL`, etc.
- `.env.example` has the template with empty values.

## Key Architecture Decisions

- **Vercel Workflow DevKit** (`"use workflow"` / `"use step"`) for the AI pipeline. Steps are individually retryable and crash-safe. The workflow pauses via `createHook` when clarification questions need human answers.
- **Server Components by default**; `"use client"` only for interactive components (recording, clarification forms).
- **URL state via `nuqs`** for shareable/bookmarkable views.
- **React Query** (`@tanstack/react-query`) for server state and polling.
- PWA with service worker for mobile installability.

## Conventions

- Path aliases: `@/` maps to project root (e.g., `@/lib/db/queries`).
- API routes live under `app/api/`. Process CRUD is REST-style at `/api/process/[id]`.
- Workflow steps are separate files under `lib/workflows/steps/`.
- AI prompts and Zod schemas are in `lib/ai/prompts.ts` and `lib/ai/schemas.ts`.
- Database schema is in `lib/db/schema.ts`; queries in `lib/db/queries.ts`.
- Component organization: domain folders (`recording/`, `process/`, `clarification/`) + `ui/` for shadcn primitives.
- Process statuses: `draft` (workflow running), `reviewing` (waiting for clarification answers), `complete` (fully structured).
- Middleware is `proxy.ts` (Next.js 16 convention, NOT `middleware.ts`).

## Workflow DevKit (Local Dev)

- `withWorkflow(nextConfig)` in `next.config.ts` wraps the Next.js config and sets up the local workflow runtime.
- Local workflow state is stored in `.next/workflow-data/` (auto-created on first write). **This is lost when `.next/` is cleared** (e.g., dev server restart), causing in-flight workflows to silently stall.
- The builder generates route handlers under `app/.well-known/workflow/v1/`:
  - `flow/route.js` — handles workflow invocations (bundled workflow code inline)
  - `step/route.js` — handles step executions
  - `webhook/[token]/route.js` — handles hook resumption (clarification answers)
- The local queue sends HTTP POST requests to these routes on `localhost:3000`.
- `proxy.ts` excludes `.well-known/workflow/*` from Clerk auth via the matcher regex.
- AI step functions use `generateText` with string model IDs (e.g., `"anthropic/claude-sonnet-4.6"`) which resolve through AI Gateway.

## Workflow Pipeline

The core pipeline in `lib/workflows/process-recording.ts`:

1. `writeProgress` — updates `structuredData.progress` in DB (called before each step)
2. `finalizeTranscript` — clean raw STT output
3. `analyzeGaps` — identify ambiguities
4. `generateQuestions` — create clarification questions (if gaps found)
5. Hook pause — wait for user answers via `createHook({ token: "clarify-{processId}" })`
6. `structureProcess` — build structured model from transcript + Q&A
7. `storeProcess` — persist to database, set status to `complete`

## Known Issues

- **Stalled workflows after dev server restart**: When `.next/` is cleared, workflow state is lost. Processes remain in `draft` with no running workflow. The UI now has a 90-second stall timeout that shows an error state with retry/home links.
- Polling stops for `complete` and `reviewing` statuses but continues indefinitely for `draft` until the stall timeout fires.

## Testing

- Unit tests in `__tests__/` using Vitest
- Run `bun test` before committing
