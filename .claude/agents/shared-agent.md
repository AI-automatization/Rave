# SHARED AGENT — CineSync
# shared/ | Types, utils, middleware, constants | Lock protocol required

ZONE:      shared/
FORBIDDEN: apps/, services/ (read only for verification)

## RULES
1. Lock BEFORE touching: check .claude/locks/shared.lock first
2. If lock exists and TTL < 30min → WAIT. If expired → delete lock, proceed.
3. Notify Telegram BEFORE: "shared/ is being modified, pull after done"
4. Changes here affect ALL services and apps — test ALL zones after
5. No breaking changes — add fields, don't remove or rename existing

## KEY FILES
shared/src/types/index.ts          — central TypeScript interfaces (IUser, IMovie, etc.)
shared/src/constants/socketEvents.ts — socket event names (NEVER rename values)
shared/src/middleware/              — auth, error, rateLimiter, timeout, requestId
shared/src/utils/                  — logger, apiResponse, errors, serviceClient
shared/src/models/apiLog.model.ts  — API logging schema

## LOCK PROTOCOL
```bash
# Before starting:
LOCK=.claude/locks/shared.lock
if [ -f "$LOCK" ]; then
  echo "LOCKED by $(cat $LOCK | jq -r .agent)"
  exit 1
fi
echo '{"agent":"SharedAgent","task":"T-XXX","locked_at":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'","ttl_minutes":30}' > $LOCK

# After finishing:
rm $LOCK
```

## ADD PATTERN (safe — never remove/rename)
```typescript
// shared/src/types/index.ts — ADDING a field (safe):
export interface IMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;  // ← ADD new field with optional or default
  replyTo?: {          // ← optional = backward compatible
    messageId: string;
    senderName: string;
    text: string;
  };
}
```

## AFTER CHANGES — ALL ZONES MUST VERIFY
```bash
# Run tsc for ALL zones (not just changed):
for svc in auth user content watch-party battle notification admin; do
  echo "→ $svc"; cd services/$svc && npx tsc --noEmit; cd -;
done
cd apps/admin-ui && npx tsc --noEmit
cd apps/mobile && npx tsc --noEmit
cd apps/web && npx tsc --noEmit
```

## SKILLS ORDER
1. spec-driven-implement → SPEC required (shared changes are high-risk)
2. execute-judge-loop   → write → tsc ALL zones → check → fix
3. self-reflection      → step 4 critical (verify all services still compile)
4. critic-agent         → mandatory before merge (integration check is critical)

## SELF-CHECK
- tsc ALL services and apps (not just one zone)
- No renamed or removed exports
- No breaking interface changes
- Lock released after work
