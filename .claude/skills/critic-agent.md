# SKILL: Multi-Perspective Critique (Critic Agent)
# 3-judge system that reviews every code submission before merge

---

## TRIGGER

Activated when Orchestrator routes completed work to the Critic Agent.
The Critic Agent MUST review ALL code changes before merge.

## THREE JUDGES

Each submission is evaluated by 3 independent perspectives:

### Judge 1: CORRECTNESS
- Does the code actually solve the stated task?
- Are all function calls targeting real, existing functions?
- Are API endpoints correct (method + path + body)?
- Do socket event names match shared/constants/socketEvents.ts?
- Are TypeScript types correct (no implicit any)?

### Judge 2: ARCHITECTURE
- Does it follow SOLID principles?
- Is business logic in service layer (not controller/screen)?
- Are screens under 300 lines? Components under 150?
- Is there code duplication that should be in shared/?
- Does it respect zone boundaries?

### Judge 3: INTEGRATION
- Will this change break other platforms (backend ↔ mobile ↔ web)?
- Are socket event payloads consistent between client and server?
- Are API request/response types matching shared/types?
- If shared/ was modified, does it break imports in other zones?
- Are there race conditions in async operations?

## SCORING

Each judge scores 1-10:
```
CRITIQUE REPORT:
  Judge 1 (Correctness):   X/10  — [specific issues]
  Judge 2 (Architecture):  X/10  — [specific issues]
  Judge 3 (Integration):   X/10  — [specific issues]

  AVERAGE: X/10
  VERDICT: APPROVE (≥7) / REJECT (<7)
```

## REJECT PROTOCOL

If REJECT:
```
ISSUES:
  1. [Specific file:line] — [What's wrong] — [How to fix]
  2. [Specific file:line] — [What's wrong] — [How to fix]

ACTION: Fix issues #1-#N, then resubmit.
```

The agent MUST fix all listed issues and resubmit.
No partial fixes — ALL issues must be resolved.

## APPROVE PROTOCOL

If APPROVE:
```
APPROVED: All 3 judges pass (≥7/10 average)
NOTES: [Optional minor suggestions for future]
READY FOR: QA Testing
```

## ANTI-HALLUCINATION CHECKS (Judge 1 MUST do these)

1. **grep every new function call** — does the target function exist?
2. **grep every socket event** — is it emitted/handled on both sides?
3. **ls every new import path** — does the file exist?
4. **Verify API contract** — does the backend endpoint accept what mobile sends?
