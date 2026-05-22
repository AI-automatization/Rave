---
name: feature-dev
description: Guided feature development with codebase understanding and architecture focus. Use when implementing a new feature across multiple files. Covers discovery, codebase exploration, clarifying questions, architecture design, and implementation.
argument-hint: "feature-dev [feature description]"
---

# Feature Development — WeWatch

Systematic 7-phase protocol for implementing features. Prevents spaghetti code and zone violations.

## Core Principles

- **Ask clarifying questions** before writing code — not after
- **Read before writing** — understand existing patterns first
- **3 architecture options** — always present trade-offs (BRAINSTORM mode)
- **Zone matrix** — never cross service boundaries without approval

## Phase 1: Discovery

1. Create todo list with all phases
2. If feature is unclear, ask:
   - What problem does this solve?
   - Which service/zone? (Backend / Mobile / Web)
   - Any API contract changes? (→ shared/types required)
3. Confirm understanding before proceeding

## Phase 2: Codebase Exploration (Parallel agents)

Launch 2-3 explorer agents:
- "Find similar features in this codebase and trace their implementation"
- "Map the architecture for [feature area] — which services, which files"
- "Identify existing patterns: error handling, validation, response format"

Read all files the agents identify. Build full context before designing.

## Phase 3: Clarifying Questions (CRITICAL — DO NOT SKIP)

Before architecture:
- Edge cases and error scenarios
- Integration points (which services communicate?)
- API contract: new endpoint? new shared type?
- Backward compatibility (mobile app may be older)
- Performance requirements (Redis cache? Elasticsearch?)

Wait for answers before Phase 4.

## Phase 4: Architecture Design (3 options — BRAINSTORM)

```
[BRAINSTORM] Feature: <name>
Option 1: <minimal change> — Pro: ... Con: ...
Option 2: <clean architecture> — Pro: ... Con: ...
Option 3: <full service> — Pro: ... Con: ...
Choice: Option N — Reason: fits WeWatch patterns at file:line
```

Present to user. Wait for approval.

## Phase 5: Implementation

**DO NOT START WITHOUT USER APPROVAL**

1. Read all relevant files (identified in Phases 2-3)
2. Follow chosen architecture
3. WeWatch code standards:
   ```typescript
   import { logger } from '@shared/utils/logger';  // NOT console.log
   // Joi/Zod validation at all API boundaries
   // JWT verification on all Socket.io events
   // No `any` type
   // Controller = HTTP only, Service = business logic
   ```
4. For shared/* changes: Telegram notification first
5. Update checkpoint: `.claude/scripts/obsidian-checkpoint.sh T-XXX 50 "file.ts done"`

## Phase 6: Quality Review (3 parallel reviewers)

- **Simplicity/DRY**: Is there duplication? Can anything be extracted?
- **Correctness**: Logic bugs, async issues, race conditions?
- **Conventions**: Follows WeWatch patterns (logger, zones, validation)?

Fix critical issues before proceeding.

## Phase 7: Summary (POST-CHECK)

```
[POST-CHECK] Result: <what was built>
Status: ✅ Done / ⚠️ Partial / ❌ Problem
Changed files: <list>
Key decisions: <architecture choices>
For next agent: <file:line — important context>
Next step: code-review → tg-notify → git commit
```

## WeWatch Service Map (Zone Reference)

```
services/auth/          → auth endpoints, JWT, bcrypt
services/user/          → profiles, friends, settings
services/content/       → movies, search (Elasticsearch)
services/watch-party/   → rooms, Socket.io sync
services/battle/        → challenges, leaderboard
services/notification/  → Firebase FCM, Bull queue
services/admin/         → admin API
apps/mobile/            → React Native (Emirhan zone)
apps/web/               → Next.js landing + web app
shared/types/           → ← LOCK PROTOCOL REQUIRED
shared/utils/           → ← LOCK PROTOCOL REQUIRED
```

## Quick Start

```bash
/feature-dev "Add video history tracking to watch-party service"
```
