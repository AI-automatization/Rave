# ИСТОРИЯ — AUTH AGENT (Атакующий) — CineSync
# services/auth/ | Port 3001 | JWT RS256 + bcrypt + brute-force

ZONE:      services/auth/
FORBIDDEN: apps/, shared/ (read only), services/user/, services/content/, services/watch-party/, services/battle/, services/notification/, services/admin/

## RULES
1. Controller = HTTP only. DB/logic → authService / passwordAuthService
2. No console.log → import { logger } from '@shared/utils/logger'
3. No `any` type. TypeScript strict mode.
4. Passwords: bcrypt 12 rounds. Tokens: RS256, access=15min, refresh=30d MongoDB
5. Brute force: Redis key `login_attempts:{email}`, 5 fails → 900s TTL block

## KEY FILES
src/controllers/auth.controller.ts      — HTTP layer
src/services/passwordAuth.service.ts    — register/login/refresh logic
src/services/socialAuth.service.ts      — Google/Telegram OAuth
src/models/                             — User, RefreshToken, OTP schemas
src/validators/                         — Joi/Zod schemas for all endpoints
src/config/index.ts                     — env vars

## PATTERNS
```typescript
// API response — always:
res.json(apiResponse.success(data, 'message'));
res.status(400).json(apiResponse.error('message'));

// JWT verify middleware:
router.post('/endpoint', verifyToken, requireVerified, controller.method);

// Redis brute-force:
const key = `login_attempts:${email}`;
const attempts = await redis.incr(key);
if (attempts === 1) await redis.expire(key, 900);
if (attempts >= 5) throw new TooManyRequestsError('Account locked 15 min');
```

## SKILL EXECUTION — ОБЯЗАТЕЛЬНЫЙ ПОРЯДОК

### 1. SPEC (перед кодом)
```yaml
TASK_SPEC:
  id: T-XXXX
  problem: { what: "", where: "file:line", evidence: "" }
  solution: { files_to_modify: ["path/file.ts: что изменить"] }
  verification: { compile: "cd services/auth && npx tsc --noEmit", manual: "" }
```

### 2. ROOT CAUSE (только для багов)
symptom → grep → read code → root cause → minimal fix. Не угадывать.

### 3. EXECUTE LOOP
write → `cd services/auth && npx tsc --noEmit` → judge(1-10) → если <7 → fix → повтор (max 3)

### 4. SELF-REFLECTION (все 7 перед сабмитом)
```bash
# 1. Импорты существуют?  ls <каждый новый import path>
# 2. Функции существуют?  grep -n "funcName" <target file>
# 3. Socket events?       grep "SERVER_EVENTS" в client и server — совпадают?
# 4. API routes?          grep -rn "/api/..." services/*/src/routes/
# 5. tsc clean?           cd services/auth && npx tsc --noEmit
# 6. Forbidden?           git diff --name-only | xargs grep -l "console\.log\|any\b"
# 7. Zone ok?             git diff --name-only | grep -vE "^services/auth/" # должно быть пусто
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
- security-audit       → JWT RS256, bcrypt, brute force
- read-before-write    → читать файл до правки
- self-reflection      → 7 шагов проверки
- spec-driven-implement→ YAML-спек
- execute-judge-loop   → write→tsc→judge≥7→fix
- root-cause-tracing   → 5 шагов для auth багов
- bugs                 → логировать
