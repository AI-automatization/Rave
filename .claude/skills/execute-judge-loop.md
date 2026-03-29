# SKILL: Execute and Judge Loop
# Write code → auto-verify → fix if broken → repeat until correct

---

## TRIGGER

Every code agent uses this loop when implementing a task.
Do NOT submit work without completing at least one full loop.

## THE LOOP

```
while (quality < THRESHOLD) {
  1. IMPLEMENT  — Write/modify code based on spec
  2. COMPILE    — tsc --noEmit (must pass with 0 errors)
  3. SELF-CHECK — Run Self-Reflection skill (7 steps)
  4. JUDGE      — Score own work honestly (1-10)
  5. If score < 7 → identify issues → go to step 1
  6. If score ≥ 7 → SUBMIT to Critic Agent
}
```

## IMPLEMENTATION RULES

### Step 1: IMPLEMENT
- Read the SPEC carefully before writing any code
- Read existing code FIRST — understand before modifying
- Make MINIMAL changes — don't refactor unrelated code
- One concern per change — don't mix features with fixes

### Step 2: COMPILE
```bash
# Backend:
cd services/{service} && npx tsc --noEmit

# Mobile:
cd apps/mobile && npx tsc --noEmit

# Web:
cd apps/web && npx tsc --noEmit
```
If compile fails → fix type errors IMMEDIATELY. Do NOT proceed.

### Step 3: SELF-CHECK
Run the full Self-Reflection Protocol (see self-reflection.md).
All 7 checks must pass.

### Step 4: JUDGE
Rate your own work honestly:
```
- Does it solve the exact problem stated in the spec? (0-3 points)
- Is it minimal — no unnecessary changes? (0-2 points)
- Does it pass all self-checks? (0-3 points)
- Would a senior dev approve this? (0-2 points)
Total: X/10
```

### Step 5: FIX or SUBMIT
- Score < 7 → Identify the weakest area → fix → repeat loop
- Score ≥ 7 → Submit with self-check results to Critic Agent
- Max 3 iterations — if still failing after 3, report blocker

## EXAMPLE

```
Task: T-E077 — Fix cookie-less extraction

Loop 1:
  IMPLEMENT: Moved extraction to onLoadEnd callback
  COMPILE: ✅ 0 errors
  SELF-CHECK: ❌ Step 3 fail — tryBackendExtract still called in useEffect
  JUDGE: 4/10 — old code still present
  → FIX: Remove old useEffect, keep only onLoadEnd path

Loop 2:
  IMPLEMENT: Removed old useEffect, added onLoadEnd handler
  COMPILE: ✅ 0 errors
  SELF-CHECK: ✅ All 7 pass
  JUDGE: 8/10 — clean fix, minimal change
  → SUBMIT to Critic
```
