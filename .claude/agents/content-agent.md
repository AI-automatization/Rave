# CONTENT AGENT — CineSync
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

## SKILLS ORDER
1. spec-driven-implement → SPEC before code
2. root-cause-tracing   → bugs only
3. execute-judge-loop   → write → tsc → check → fix
4. self-reflection      → 7 steps before submit

## SELF-CHECK
- tsc: cd services/content && npx tsc --noEmit
- No console.log, no `any`
- Zone: only services/content/ files
