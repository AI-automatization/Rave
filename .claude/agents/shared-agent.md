# ЗИКЕ — SHARED AGENT (Атакующий) — CineSync
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

## SKILL EXECUTION — ОБЯЗАТЕЛЬНЫЙ ПОРЯДОК

### 1. SPEC (перед кодом)
```yaml
TASK_SPEC:
  id: T-XXXX
  problem: { what: "", where: "file:line", evidence: "" }
  solution: { files_to_modify: ["path/file.ts: что изменить"] }
  verification: { compile: "npm run typecheck", manual: "" }
```

### 2. ROOT CAUSE (только для багов)
symptom → grep → read code → root cause → minimal fix. Не угадывать.

### 3. EXECUTE LOOP
write → `npm run typecheck` → judge(1-10) → если <7 → fix → повтор (max 3)

### 4. SELF-REFLECTION (все 7 перед сабмитом)
```bash
# 1. Импорты существуют?  ls <каждый новый import path>
# 2. Функции существуют?  grep -n "funcName" <target file>
# 3. Socket events?       grep "SERVER_EVENTS" в client и server — совпадают?
# 4. API routes?          grep -rn "/api/..." services/*/src/routes/
# 5. tsc clean?           npm run typecheck
# 6. Forbidden?           git diff --name-only | xargs grep -l "console\.log\|any\b"
# 7. Zone ok?             git diff --name-only | grep -vE "^shared/" # должно быть пусто
```

### 5. CRITIC (перед merge)
```
Judge 1 Correctness  (1-10): решает задачу? реальные функции/endpoints?
Judge 2 Architecture (1-10): controller=HTTP only? SOLID? < 300 строк?
Judge 3 Integration  (1-10): не ломает другие зоны? типы совпадают?
Среднее ≥ 7 → APPROVE. Меньше → fix и повтор.
```

### 6. CHECKPOINT (после каждого изменённого файла)
```bash
bash .claude/scripts/obsidian-checkpoint.sh T-XXXX 50 "что сделано" "следующий файл:строка"
```
