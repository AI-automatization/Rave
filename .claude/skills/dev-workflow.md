---
description: Agent workflow protocol — BRAINSTORM for new tasks, KAIZEN for existing code, structured PRE/POST checks with agent handoffs
argument-hint: "dev-workflow"
---

# Dev-Workflow — Agent Work Protocol

Defines how every agent starts and finishes a task.

---

## ⚡ WHEN TO USE — MANDATORY LAWS

These rules override everything. No exceptions.

### LAW 1 — ALWAYS use if:
- Task touches **3+ files**
- Task estimated **>20 minutes**
- Task involves **architecture decisions** (new service, new DB schema, new API contract)
- Task is **multi-agent** (Backend + Mobile/Web in parallel)
- Task involves **shared/** files (high blast radius)

### LAW 2 — ALWAYS use KAIZEN if:
- Fixing a bug that has caused incidents before
- Refactoring >100 lines
- Performance optimization
- Security-related changes

### LAW 3 — SKIP if (and only if):
- Single-file typo or text fix
- docs/Tasks.md or docs/Done.md update only
- Config value change (port, env key)
- Translation/copy fix in messages/*.json with no logic

### LAW 4 — POST-CHECK is NEVER optional:
If a task modified ≥2 files, POST-CHECK is mandatory.
Even if skipping PRE-CHECK was allowed, POST-CHECK must run.

### LAW 5 — Self-trigger on failure:
If a task gets stuck, crashes, or produces a result rated <7/10 by Critic Agent →
automatically restart with BRAINSTORM mode (list 3 new solutions).

---

## Mode Selection (Mandatory on Every Task)

### New task → BRAINSTORM mode
- No existing code
- New feature, new module, new architecture

### Existing code → KAIZEN mode
- Code already written
- Bug fix, refactor, optimization, small change

---

## Work Format — Always in This Order

### [PRE-CHECK] — Before Starting Work

**In BRAINSTORM mode:**
```
[BRAINSTORM] Task: <task name>
Solution 1: <description> — Pro: ... Con: ...
Solution 2: <description> — Pro: ... Con: ...
Solution 3: <description> — Pro: ... Con: ...
Choice: Solution N — Reason: <short justification>
```

**In KAIZEN mode:**
```
[KAIZEN] Existing code analysis: <brief status>
Improvement 1 (high impact): <what changes>
Improvement 2 (medium impact): <what changes>
Improvement 3 (low impact): <what changes>
Start: Improvement 1 — Reason: biggest impact
```

> Rule: Never propose only one solution.
> Even when time is short — 3 solutions, one choice.

---

### [EXECUTION] — Main Task

- Implement the chosen solution
- Mark each significant decision with `[BRAINSTORM]` or `[KAIZEN]` tag
- While writing code: explain WHY in one line if non-obvious

---

### [POST-CHECK] — After Finishing Work

```
[POST-CHECK] Result: <what was done>
Status: ✅ Done / ⚠️ Partial / ❌ Problem exists
Changed files: <list>
Key decisions: <architecture choices made>
For next agent: <important info — file:line, port, decision>
Next step: <what to do next>
```

**Data passed to next agent:**
- Which files were modified
- Which architecture decisions were made
- Which problems remain unsolved (if any)

---

## Decision Matrix

| Condition | Mode | PRE-CHECK | POST-CHECK |
|-----------|------|-----------|------------|
| New feature, 1-2 files, <20 min | BRAINSTORM | Optional | Optional |
| New feature, 3+ files | BRAINSTORM | **Mandatory** | **Mandatory** |
| Bug fix, 1 file | KAIZEN | Optional | Optional |
| Bug fix, caused incident | KAIZEN | **Mandatory** | **Mandatory** |
| Refactor >100 lines | KAIZEN | **Mandatory** | **Mandatory** |
| Multi-agent task | Either | **Mandatory** | **Mandatory** |
| shared/* change | Either | **Mandatory** | **Mandatory** |
| Architecture decision | BRAINSTORM | **Mandatory** | **Mandatory** |
| Typo / docs / copy | — | Skip | Skip |

---

## Example — Order CRUD Feature

```
[PRE-CHECK]
[BRAINSTORM] Task: Create Order API
Solution 1: Single controller — simple, fast to write, but grows large
Solution 2: Service + Controller separated — clean, easy to test, standard pattern
Solution 3: CQRS — complex, overkill for this project
Choice: Solution 2 — Reason: WeWatch already uses service pattern everywhere

[EXECUTION]
- order.service.ts created (business logic)
- order.controller.ts created (HTTP layer)
- [KAIZEN] error handling: global error middleware instead of try/catch

[POST-CHECK]
Result: POST /orders, GET /orders, PATCH /orders/:id/status ready
Status: ✅ Done
Changed files: order.service.ts, order.controller.ts, routes/index.ts
Key decisions: service pattern, no CQRS
For next agent: order.service.ts:45 — status enum: PENDING, PREPARING, READY, DELIVERED
Next step: critic-agent review → then QA
```

---

## Integration with Other Skills

```
dev-workflow → selects mode
  ├── BRAINSTORM → brainstorm.md (5-phase idea generation)
  ├── KAIZEN → execute-judge-loop.md (write → judge → fix)
  ├── Any code change → self-reflection.md (7 checks)
  ├── Architecture → spec-driven-implement.md
  └── POST-CHECK fails → root-cause-tracing.md
```

---

## WeWatch-Specific Rules

1. **Backend (Saidazim)**: BRAINSTORM mandatory for any new service endpoint
2. **Mobile/Web (Emirhan)**: BRAINSTORM mandatory for new screens, KAIZEN for component fixes
3. **shared/*** : BRAINSTORM + Telegram notification before touching
4. **Multi-agent parallel tasks**: Each agent writes its own POST-CHECK before merge
