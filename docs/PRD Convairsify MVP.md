# PRD — Convairsify MVP

# Overview

**Product:** Convairsify

**Version:** MVP (v0.1)

**Target Clients:** Large enterprises (e.g. Thermo Fisher)

**Vision:** Record, map, display, and ultimately automate business processes.

**MVP Goal:** Let users record processes via voice on mobile, with AI-assisted clarification, transcription, structured storage, and editing.

---

# Problem Statement

Process documentation in large enterprises is painful. It's manual, inconsistent, and often outdated. Subject matter experts carry critical process knowledge in their heads. Current tools require deliberate documentation effort that competes with actual work.

Convairsify lets people capture processes as naturally as explaining them to a colleague — by talking.

---

# MVP Scope

## Core User Flow

1. User opens mobile app and starts a new process recording
2. User describes the process step-by-step via voice
3. AI agent transcribes in real-time
4. AI agent interrupts with clarifying questions when something is ambiguous (e.g. missing decision criteria, unclear handoffs, vague roles)
5. Once recording is complete, the process is structured into steps, decision points, roles, and dependencies
6. The structured process is stored and can be retrieved and edited at any time

## Functional Requirements

### FR-1: Voice Recording & Transcription

- Mobile-first voice input (iOS + Android)
- Real-time speech-to-text transcription
- Support for long recordings (up to 60 min)
- English only for MVP

### FR-2: AI Clarification Agent

- Listens to the process description in real-time
- Detects ambiguity, gaps, or missing information
- Both modes available — user chooses per session:
    - **Voice interruption:** AI asks clarifying questions via voice during recording (conversational mode)
    - **On-screen review:** AI collects questions and presents them on-screen after recording ends
    - Default: on-screen review (lower technical risk)
- Examples of triggers:
    - Missing actor/role: "Who performs this step?"
    - Unclear decision logic: "What determines whether you go left or right here?"
    - Missing exception handling: "What happens if this step fails?"
    - Vague timing: "How long does this typically take?"

### FR-3: Process Structuring

- Converts raw transcript into a structured process model
- Extracts: steps, sequence, decision points, roles/actors, inputs/outputs, timing estimates
- Presents structured process to user for review

### FR-4: Storage & Retrieval

- Each process is saved as a named, versioned entity
- Browse/search all recorded processes
- Open any process for viewing

### FR-5: Editing

- Edit any step, decision point, role, or metadata
- Add/remove/reorder steps
- Re-record specific sections via voice
- Overwrite-in-place (no version history in MVP)

## Non-Functional Requirements

### NFR-1: Performance

- Transcription latency < 2 seconds
- Process structuring completes within 30 seconds of recording end

### NFR-2: Security & Compliance

- Enterprise-grade authentication (SSO/SAML)
- Data encryption at rest and in transit
- Audit logging
- Data residency options (relevant for pharma/regulated industries)

### NFR-3: Reliability

- Offline recording with sync on reconnect
- No data loss on app crash or network drop

---

# Out of MVP Scope (Future)

- Visual process map / flowchart rendering
- Process automation / execution
- Collaboration features (commenting, approval workflows)
- Desktop/web recording interface
- Integration with enterprise tools (SAP, ServiceNow, etc.)
- Process comparison / diff between versions
- Analytics on process efficiency

---

# Open Questions

### Resolved

- ✅ **Clarification mode:** Both — voice interruption and on-screen review. User chooses per session.
- ✅ **Multi-speaker:** Single speaker only for MVP.
- ✅ **Language:** English only for MVP.
- ✅ **Approval workflow:** Not for MVP. Add in a later version.
- ✅ **Version history:** Overwrite-in-place for MVP. No version tracking yet.
- ✅ **Compliance:** GxP / 21 CFR Part 11 not required for MVP. Revisit before scaling to regulated clients.
- ✅ **Process model format:** Custom lightweight JSON schema. BPMN export can be added post-MVP.
- ✅ **Access control:** Everyone in the org sees everything for MVP. Role-based access later.

### Still Open

⚠️ Needs resolution before development:

1. **Integration:** Any day-1 integration requirements from Thermo Fisher or other early clients? Or standalone app for pilot?

---

# Success Metrics (MVP)

- Time to document a process vs. traditional methods (target: 3x faster)
- Transcription accuracy > 95%
- Clarification question relevance rate > 80%
- User satisfaction score (NPS) from pilot users
- Number of processes recorded in first 30 days of pilot

---

# Technical Architecture (High-Level)

> To be defined — placeholder for tech decisions
> 
- **Mobile app:** React Native or native (iOS/Android)
- **Speech-to-text:** Whisper / Deepgram / cloud provider STT
- **AI Agent:** LLM-based (Claude / GPT) for clarification and structuring
- **Backend:** API layer + process storage
- **Database:** Process graph storage (to be decided)

---

# Stakeholders

| Role | Responsibility |
| --- | --- |
| Product Owner | Define priorities, accept deliverables |
| Engineering Lead | Architecture, implementation |
| AI/ML Lead | Agent behavior, transcription quality |
| Design Lead | Mobile UX, process editing UX |
| Pilot Client (Thermo Fisher) | Feedback, validation |