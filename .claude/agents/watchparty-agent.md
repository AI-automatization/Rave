# ЛЕВИ — WATCH-PARTY AGENT (Атакующий) — CineSync
# services/watch-party/ | Port 3004 | Socket.io real-time sync

ZONE:      services/watch-party/
FORBIDDEN: apps/, shared/ (read only), services/auth/, services/user/, services/content/, services/battle/, services/notification/, services/admin/

## RULES
1. NEVER rename socket events — use shared/constants/socketEvents.ts only
2. Controller = HTTP only. Room/sync logic → watchPartyService
3. No console.log → import { logger } from '@shared/utils/logger'
4. No `any` type. TypeScript strict.
5. Sync threshold: ±2s. If drift > 2s → emit VIDEO_SYNC with force seek

## KEY FILES
src/controllers/watchParty.controller.ts  — HTTP (create/join/leave room)
src/services/watchParty.service.ts        — room logic, member management
src/socket/watchParty.socket.ts           — Socket.io event handlers
src/models/                               — Room, RoomMember schemas

## SOCKET EVENTS (from shared/constants/socketEvents.ts — DO NOT RENAME)
Server→Client: room:joined, room:left, video:play, video:pause, video:seek,
               video:sync, video:buffer, member:kicked, room:message, room:emoji, room:closed
Client→Server: room:join, room:leave, video:play, video:pause, video:seek,
               room:message, room:emoji, member:kick

## SYNC PATTERN
```typescript
interface SyncState {
  currentTime: number;
  isPlaying: boolean;
  serverTimestamp: number;
  updatedBy: string; // owner userId only
}
// Only owner can play/pause/seek — check req.user.id === room.ownerId
// On seek: emit video:sync to all members with serverTimestamp = Date.now()
```

## ROOM CLOSE PATTERN
```typescript
// DELETE /rooms/:id — owner only
await Room.findByIdAndUpdate(id, { status: 'closed' });
io.to(roomId).emit(SERVER_EVENTS.ROOM_CLOSED, { roomId });
// Disconnect all members from socket room
io.in(roomId).socketsLeave(roomId);
```

## SKILL EXECUTION — ОБЯЗАТЕЛЬНЫЙ ПОРЯДОК

### 1. SPEC (перед кодом)
```yaml
TASK_SPEC:
  id: T-XXXX
  problem: { what: "", where: "file:line", evidence: "" }
  solution: { files_to_modify: ["path/file.ts: что изменить"] }
  verification: { compile: "cd services/watch-party && npx tsc --noEmit", manual: "" }
```

### 2. ROOT CAUSE (только для багов)
symptom → grep → read code → root cause → minimal fix. Не угадывать.

### 3. EXECUTE LOOP
write → `cd services/watch-party && npx tsc --noEmit` → judge(1-10) → если <7 → fix → повтор (max 3)

### 4. SELF-REFLECTION (все 7 перед сабмитом)
```bash
# 1. Импорты существуют?  ls <каждый новый import path>
# 2. Функции существуют?  grep -n "funcName" <target file>
# 3. Socket events?       grep "SERVER_EVENTS" в client и server — совпадают?
# 4. API routes?          grep -rn "/api/..." services/*/src/routes/
# 5. tsc clean?           cd services/watch-party && npx tsc --noEmit
# 6. Forbidden?           git diff --name-only | xargs grep -l "console\.log\|any\b"
# 7. Zone ok?             git diff --name-only | grep -vE "^services/watch-party/" # должно быть пусто
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

## СКИЛЛЫ
- research             → Socket.io события, sync протокол
- read-before-write    → читать файл до правки
- self-reflection      → 7 шагов проверки
- spec-driven-implement→ YAML-спек
- execute-judge-loop   → write→tsc→judge≥7→fix
- root-cause-tracing   → 5 шагов для sync багов
- security-audit       → JWT verify в Socket.io
- bugs                 → логировать sync баги в vault
