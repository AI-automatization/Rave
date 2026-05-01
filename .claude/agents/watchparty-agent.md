# WATCH-PARTY AGENT — CineSync
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

## SKILLS ORDER
1. spec-driven-implement → SPEC before code
2. root-cause-tracing   → bugs only (socket events are common root cause)
3. execute-judge-loop   → write → tsc → check → fix
4. self-reflection      → step 3 is critical (verify socket event names match)

## SELF-CHECK
- tsc: cd services/watch-party && npx tsc --noEmit
- Step 3: every socket.on(X) has matching emit(X) in client
- Zone: only services/watch-party/ files
