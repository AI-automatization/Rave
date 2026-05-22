---
name: code-review
description: Multi-agent code review for pull requests. Use when reviewing a PR or checking code before merge. Covers CLAUDE.md compliance, bugs, security, and logic errors.
argument-hint: "code-review [PR number or branch]"
---

# Code Review — WeWatch

Multi-agent review protocol. Optimized for WeWatch zone constraints and TypeScript/Node.js stack.

## When to Use

- Before merging any branch to `main`
- When asked to review a PR (`/code-review 42`)
- QA gate after task completion (per CLAUDE.md: "QA перед merge: tsc + jest + Playwright")

## Review Workflow

### Step 1: Scope check (Haiku)
Check if PR:
- Is closed or draft → stop
- Is trivial/automated → stop
- Already has Claude review → stop

### Step 2: Changed files (Haiku)
```bash
git diff --name-only origin/main...HEAD
```
Collect relevant CLAUDE.md files for changed directories.

### Step 3: Summary (Sonnet)
View the diff and produce a 3-sentence summary of what changed.

### Step 4: Parallel review (4 agents)

**Agents 1+2 — CLAUDE.md compliance (Sonnet)**
- Zone violations (Backend touching mobile code, etc.)
- Forbidden patterns: `any` type, `console.log`, hardcoded secrets, `push to main`
- Missing: `logger` import, Joi/Zod validation, `shared/types` for API changes
- WeWatch-specific: Socket.io event renames, MongoDB collection drops

**Agent 3 — Bug hunter (Opus)**
- Logic errors in the diff only (no external context)
- Async/await mistakes, missing error handling at boundaries
- Race conditions in Socket.io event handlers
- Redis TTL / MongoDB query issues

**Agent 4 — Security (Opus)**
- Hardcoded credentials, API keys in code
- Missing JWT verification on Socket.io events
- Input not validated before DB queries
- CORS wildcards, rate limiting bypassed

### Step 5: Validate each finding (parallel Sonnet/Opus)
For every flagged issue — confirm it's real, not a false positive.

### Step 6: Output

```
## Code Review: <branch>

### Critical (must fix before merge)
- [agent]: Issue description — file:line

### Important (should fix)
- [agent]: Issue description — file:line

### Suggestions
- [agent]: Suggestion — file:line

### Strengths
- What's well done
```

If `--comment` flag: post as GitHub PR comment via `gh pr comment`.

## WeWatch-Specific Checklist

```
□ No console.log (use logger from @shared/utils/logger)
□ No `any` TypeScript type
□ JWT verified on all Socket.io events
□ Input validated with Joi/Zod at API boundary
□ shared/* changes announced in Telegram
□ No Socket.io event renames without updating all 3 platforms
□ tsc --noEmit → 0 errors
□ Rate limiting on new endpoints
```

## High Signal Only

Do NOT flag:
- Code style, missing tests (unless in CLAUDE.md), subjective improvements
- Issues outside the changed lines
- Things a linter already catches

## Running

```bash
# Review current branch vs main
/code-review

# Review specific PR
/code-review 42

# Review + post GitHub comment
/code-review 42 --comment
```
