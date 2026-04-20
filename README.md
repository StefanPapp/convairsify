# Convairsify

Voice-driven business process capture for enterprises. Record how work gets done by talking through it — AI cleans up the transcript, identifies gaps, asks clarifying questions, and produces a structured process model.

## Architecture

- **Frontend**: Next.js 16 App Router PWA (mobile-first, installable)
- **Speech-to-Text**: Deepgram real-time WebSocket streaming (nova-3)
- **AI Pipeline**: Vercel Workflow DevKit — durable, multi-step workflow with hook-based pause/resume for human-in-the-loop clarification
- **LLM**: Claude via Vercel AI SDK
- **Database**: Neon Postgres + Drizzle ORM
- **Auth**: Clerk (SSO/SAML for enterprise)
- **Styling**: Tailwind CSS + shadcn/ui

## How It Works

1. User records a voice description of a business process
2. Deepgram transcribes audio in real-time via WebSocket
3. A durable workflow kicks off:
   - **Finalize transcript** — cleans up raw STT output
   - **Analyze gaps** — identifies ambiguities and missing information
   - **Generate questions** — creates clarification questions for the user
   - **Pause for human input** — workflow suspends via `createHook` until the user answers
   - **Structure process** — builds a structured process model from transcript + answers
   - **Store** — persists the final result
4. User reviews the structured process

## Prerequisites

- Node.js 22+
- [Bun](https://bun.sh) (package manager & task runner)
- A [Neon](https://neon.tech) Postgres database
- [Clerk](https://clerk.com) account for auth
- [Deepgram](https://deepgram.com) API key
- Anthropic API key (via Vercel AI Gateway or direct)

## Getting Started

```bash
# Install dependencies
bun install

# Copy env template and fill in your keys
cp .env.example .env.local

# Push database schema
bunx drizzle-kit push

# Start dev server
bun dev
```

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon Postgres connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `DEEPGRAM_API_KEY` | Deepgram API key |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude |

## Scripts

```bash
bun dev          # Start development server
bun build        # Production build
bun start        # Start production server
bun lint         # Run ESLint
bun test         # Run tests (Vitest)
```

## Project Structure

```
app/
  api/
    deepgram/token/    # Deepgram temporary auth token
    process/           # CRUD for processes + clarification endpoint
    workflow/          # Vercel Workflow DevKit route handler
  process/             # Process detail view page
  record/              # Recording page
components/
  clarification/       # Clarification Q&A UI
  process/             # Process list and detail cards
  recording/           # Audio recording controls + transcript display
  ui/                  # shadcn/ui primitives
hooks/
  use-audio-recorder   # MediaRecorder wrapper
  use-deepgram         # Deepgram WebSocket streaming
  use-processes        # React Query hooks for process CRUD
lib/
  ai/                  # Prompts and Zod schemas for Claude
  db/                  # Drizzle schema, queries, migrations
  deepgram/            # Deepgram client
  workflows/           # Durable workflow + step functions
```

## License

Proprietary.
