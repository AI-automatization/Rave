---
name: refactor
description: Code cleanup, dead code removal, and simplification. Use when code smells accumulate, files exceed 400 lines, or after a feature sprint to clean up tech debt.
argument-hint: "refactor [file or module path]"
---

# Refactor — WeWatch

For code cleanup, dead code removal, and simplification. Behavior must not change.

## When to Use

- File > 400 lines (CLAUDE.md limit)
- Function does more than one thing
- Nested try/catch (forbidden in WeWatch)
- Magic numbers without constants
- Duplicated logic across services
- After a feature sprint (cleanup pass)

## Simplification Steps

### 1. Reduce Nesting (Guard Clauses)

```typescript
// BAD
async function getRoom(id: string) {
  if (id) {
    const room = await Room.findById(id);
    if (room) {
      if (room.isActive) {
        return room;
      }
    }
  }
}

// GOOD
async function getRoom(id: string) {
  if (!id) return null;
  const room = await Room.findById(id);
  if (!room?.isActive) return null;
  return room;
}
```

### 2. Extract Functions

Comments that explain a block of code → that block is a function:

```typescript
// BAD
// Check if user can join room
if (room.participants.length < room.maxSize && !room.isBanned(userId)) { ... }

// GOOD
function canJoinRoom(room: Room, userId: string): boolean {
  return room.participants.length < room.maxSize && !room.isBanned(userId);
}
```

### 3. Remove Duplication

Search for copy-paste patterns across services:
```bash
# Find duplicated validation logic
grep -r "mongoose.Types.ObjectId.isValid" services/ --include="*.ts" -l

# Find duplicated error responses  
grep -r "res.status(404).json" services/ --include="*.ts" -l
```
Move to `shared/utils/` if used in 2+ services.

### 4. Dead Code Removal

```bash
# Find unused imports (TypeScript)
tsc --noEmit 2>&1 | grep "is declared but"

# Find unused exports
grep -r "export " services/ --include="*.ts" | \
  awk '{print $3}' | sort | uniq -c | sort -n | head -20
```

### 5. WeWatch-Specific Cleanup

```
□ console.log → logger.info/warn/error
□ any type → proper interface/type
□ Nested try/catch → single catch with error type check  
□ Magic numbers → constants
□ Hardcoded strings → constants or env vars
□ Repeated Joi schemas → shared schema file
```

### 6. Forbidden WeWatch Patterns

```typescript
// ❌ Nested try/catch
try {
  try { await db.save() } catch(e) { throw e; }
} catch(e) { ... }

// ✅ Single catch
await db.save().catch(err => {
  logger.error('save failed', { err });
  throw new AppError(500, 'Database error');
});

// ❌ Any type
function process(data: any) { ... }

// ✅ Proper type
function process(data: WatchPartyEvent) { ... }

// ❌ console.log
console.log('user joined', userId);

// ✅ Logger
logger.info('user joined room', { userId, roomId });
```

## Refactor Checklist (Pre-Commit)

```
□ tsc --noEmit → 0 errors (MANDATORY)
□ jest → no regressions
□ No behavior changes (refactor = restructure only)
□ File line count: was N → now M < 400
□ Test coverage not decreased
□ CLAUDE.md zone respected (no cross-service changes)
```

## Format

```
## Refactor: <file/module>

### Before
- Lines: 520
- Issues: nested try/catch ×3, console.log ×7, any type ×4

### After
- Lines: 310
- Extracted: validateRoomAccess(), formatRoomResponse()
- Moved to shared/utils/: roomValidators.ts

### Changed Files
- services/watch-party/src/room.service.ts (520→310 lines)
- shared/utils/roomValidators.ts (NEW)

### Behavior: UNCHANGED ✅
```

## Running

```bash
/refactor services/watch-party/src/room.service.ts
/refactor services/user                            # whole module
```
