# USER + BATTLE + NOTIFICATION AGENT — CineSync
# services/user/ :3002 | services/battle/ :3005 | services/notification/ :3007
# Combined — small services with similar patterns

ZONE:      services/user/, services/battle/, services/notification/
FORBIDDEN: apps/, shared/ (read only), services/auth/, services/content/, services/watch-party/, services/admin/

## RULES
1. Controller = HTTP only. Business logic → *Service classes
2. No console.log → import { logger } from '@shared/utils/logger'
3. No `any` type. TypeScript strict.
4. Standard response: apiResponse.success(data) / apiResponse.error(msg)
5. FCM tokens: dedup with Set before saving. Notification queue via Bull.

## USER SERVICE KEY FILES
src/controllers/user.controller.ts     — profile, friends, search
src/services/profile.service.ts        — avatar, bio, username update
src/models/User.model.ts               — user schema (synced with auth)

## BATTLE SERVICE KEY FILES
src/controllers/battle.controller.ts   — create/accept/reject/status
src/services/battle.service.ts         — scoring, timer, leaderboard
src/models/Battle.model.ts             — battle schema

## BATTLE POINTS
MOVIE_WATCHED=10, WATCH_PARTY=15, BATTLE_WIN=50, ACHIEVEMENT=20, DAILY_STREAK=5

## NOTIFICATION SERVICE KEY FILES
src/controllers/notification.controller.ts
src/services/notification.service.ts   — FCM send, in-app, email queue
src/models/Notification.model.ts

## NOTIFICATION TYPES
friend_request, friend_accepted, watch_party_invite, battle_invite,
battle_result, achievement_unlocked, friend_online, friend_watching

## BATTLE ENDPOINTS (missing — need to implement)
POST /battles/:id/reject   — invited user rejects, status→'rejected', notify challenger
POST /battles/:id/accept   — status→'active', notify challenger

## PATTERNS
```typescript
// FCM dedup:
const tokenSet = new Set(user.fcmTokens);
tokenSet.add(newToken);
user.fcmTokens = [...tokenSet];

// Bull queue for email:
await emailQueue.add({ to: email, template: 'welcome', data: { username } });

// Battle reject:
const battle = await Battle.findById(id);
if (battle.invitedUserId.toString() !== req.user.id) throw new ForbiddenError();
if (battle.status !== 'pending') throw new BadRequestError('Battle not pending');
await Battle.findByIdAndUpdate(id, { status: 'rejected' });
// notify challenger
```

## SKILL EXECUTION — ОБЯЗАТЕЛЬНЫЙ ПОРЯДОК

### 1. SPEC (перед кодом)
```yaml
TASK_SPEC:
  id: T-XXXX
  problem: { what: "", where: "file:line", evidence: "" }
  solution: { files_to_modify: ["path/file.ts: что изменить"] }
  verification: { compile: "cd services/user && npx tsc --noEmit", manual: "" }
```

### 2. ROOT CAUSE (только для багов)
symptom → grep → read code → root cause → minimal fix. Не угадывать.

### 3. EXECUTE LOOP
write → `cd services/user && npx tsc --noEmit` → judge(1-10) → если <7 → fix → повтор (max 3)

### 4. SELF-REFLECTION (все 7 перед сабмитом)
```bash
# 1. Импорты существуют?  ls <каждый новый import path>
# 2. Функции существуют?  grep -n "funcName" <target file>
# 3. Socket events?       grep "SERVER_EVENTS" в client и server — совпадают?
# 4. API routes?          grep -rn "/api/..." services/*/src/routes/
# 5. tsc clean?           cd services/user && npx tsc --noEmit
# 6. Forbidden?           git diff --name-only | xargs grep -l "console\.log\|any\b"
# 7. Zone ok?             git diff --name-only | grep -vE "^services/(user|battle|notification)/" # должно быть пусто
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
