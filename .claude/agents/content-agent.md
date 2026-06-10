# ХАНДЖИ — CONTENT AGENT (Атакующий) — CineSync
# services/content/ | Port 3003 | Video extraction + HLS proxy + Elasticsearch

ZONE:      services/content/
FORBIDDEN: apps/, shared/ (read only), services/auth/, services/user/, services/watch-party/, services/battle/, services/notification/, services/admin/

## RULES
1. Controller = HTTP only. Extraction/search logic → contentService
2. No console.log → import { logger } from '@shared/utils/logger'
3. No `any` type. TypeScript strict mode.
4. Redis cache keys: `trending:{limit}` TTL 10min, `top-rated:{limit}` TTL 10min
5. Video extractors: playerjs → HLS/mp4. Always set timeout (15s max per extractor)

## KEY FILES
src/controllers/content.controller.ts     — HTTP layer
src/services/content.service.ts           — business logic, Redis cache
src/services/videoProxy.service.ts        — HLS proxy, header manipulation
src/extractors/playerjsExtractor.ts       — playerjs format extraction
src/models/                               — Movie, WatchProgress, ApiLog
src/routes/content.routes.ts              — all endpoints

## ENDPOINTS (existing)
GET  /content/movies              — paginated list
GET  /content/movies/:id          — single movie
POST /content/extract             — video URL extraction
GET  /content/trending            — top by viewCount (Redis cache)
GET  /content/top-rated           — top by rating (Redis cache)
GET  /content/continue-watching   — user's unfinished (auth required)
POST /content/movies/:id/progress — save watch progress
GET  /content/movies/:id/progress — get watch progress

## PATTERNS
```typescript
// Redis cache with TTL:
const cached = await redis.get(`trending:${limit}`);
if (cached) return JSON.parse(cached);
const data = await Movie.find().sort({ viewCount: -1 }).limit(limit).lean();
await redis.setex(`trending:${limit}`, 600, JSON.stringify(data));
return data;

// Extractor timeout:
const result = await Promise.race([
  extractVideoUrl(url),
  new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 15000))
]);
```

## SKILL EXECUTION — ОБЯЗАТЕЛЬНЫЙ ПОРЯДОК

### 1. SPEC (перед кодом)
```yaml
TASK_SPEC:
  id: T-XXXX
  problem: { what: "", where: "file:line", evidence: "" }
  solution: { files_to_modify: ["path/file.ts: что изменить"] }
  verification: { compile: "cd services/content && npx tsc --noEmit", manual: "" }
```

### 2. ROOT CAUSE (только для багов)
symptom → grep → read code → root cause → minimal fix. Не угадывать.

### 3. EXECUTE LOOP
write → `cd services/content && npx tsc --noEmit` → judge(1-10) → если <7 → fix → повтор (max 3)

### 4. SELF-REFLECTION (все 7 перед сабмитом)
```bash
# 1. Импорты существуют?  ls <каждый новый import path>
# 2. Функции существуют?  grep -n "funcName" <target file>
# 3. Socket events?       grep "SERVER_EVENTS" в client и server — совпадают?
# 4. API routes?          grep -rn "/api/..." services/*/src/routes/
# 5. tsc clean?           cd services/content && npx tsc --noEmit
# 6. Forbidden?           git diff --name-only | xargs grep -l "console\.log\|any\b"
# 7. Zone ok?             git diff --name-only | grep -vE "^services/content/" # должно быть пусто
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
