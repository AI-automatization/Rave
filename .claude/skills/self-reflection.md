# SKILL: Self-Reflection Framework
# Anti-hallucination protocol — EVERY agent MUST run before submitting work

---

## TRIGGER

This skill activates AUTOMATICALLY before any agent submits completed work.
Run the full checklist. If ANY check fails → fix it yourself, do NOT submit.

## SELF-CHECK PROTOCOL (7 STEPS)

After writing code, run these checks IN ORDER:

### Step 1: Verify All Imports Exist
```bash
# For each import statement you wrote, verify the file exists
# Example: import { contentApi } from '@api/content.api'
# → Check: does apps/mobile/src/api/content.api.ts exist?
```
**Action:** `ls` or `Glob` every imported path. If file missing → REMOVE the import or CREATE the file.

### Step 2: Verify All Called Functions Exist
```bash
# For each function you call, verify it exists in the target file
# Example: contentApi.extractVideo(url)
# → Grep: does extractVideo exist in content.api.ts?
```
**Action:** `Grep` for every function name you call. If function missing → you hallucinated. REMOVE the call or IMPLEMENT the function.

### Step 3: Verify Socket Event Consistency
```bash
# If you listen for a server event → verify server EMITS it
# If you emit a client event → verify server HANDLES it
# Source of truth: shared/src/constants/socketEvents.ts
```
**Action:**
- Client `socket.on(EVENT)` → `Grep "emit.*EVENT" services/`
- Client `socket.emit(EVENT)` → `Grep "on.*EVENT" services/`
- If no match → DEAD CODE. Remove the listener or add server handler.

### Step 4: Verify API Endpoints Match Backend
```bash
# For each API call (GET/POST/PUT/DELETE), verify the route exists
# Example: POST /api/v1/content/extract
# → Grep: does this route exist in services/content/src/routes/?
```
**Action:** `Grep` the route pattern in `services/*/src/routes/`. If missing → you're calling a non-existent endpoint. Fix or report.

### Step 5: TypeScript Strict Check
```bash
# Run tsc for your zone
tsc --noEmit                           # General
cd apps/mobile && npx tsc --noEmit     # Mobile zone
cd services/auth && npx tsc --noEmit   # Backend zone
```
**Action:** Fix ALL type errors. No `any` types allowed.

### Step 6: No Forbidden Patterns
```bash
# Check for banned patterns in your changes
git diff --name-only  # List changed files
# Then grep each changed file for:
```
**Forbidden patterns:**
- `console.log` (use Winston logger or `__DEV__`)
- `any` type
- Files > 400 lines
- Hardcoded secrets/URLs
- Zone violations (files outside your zone)

### Step 7: Zone Boundary Check
```bash
git diff --name-only
# Every changed file MUST be within your allowed zone:
# Backend Agent: services/*, apps/admin-ui/
# Mobile Agent:  apps/mobile/
# Web Agent:     apps/web/
# If ANY file is outside → REVERT those changes
```

## OUTPUT FORMAT

After completing all 7 steps, report:
```
SELF-CHECK RESULTS:
  1. imports_exist:      ✅ / ❌ [details]
  2. functions_exist:    ✅ / ❌ [details]
  3. socket_events_match:✅ / ❌ [details]
  4. api_endpoints_exist:✅ / ❌ [details]
  5. tsc_pass:           ✅ / ❌ [error count]
  6. no_forbidden:       ✅ / ❌ [violations]
  7. zone_respected:     ✅ / ❌ [files]

VERDICT: READY / NEEDS_FIX
```

## CRITICAL RULE

**If you find an issue during self-check → FIX IT IMMEDIATELY.**
Do NOT submit work with known failures.
Do NOT claim "it should work" without evidence.
Evidence = grep output, tsc output, ls output.
