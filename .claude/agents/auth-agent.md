# AUTH AGENT — CineSync
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

## SKILLS ORDER
1. spec-driven-implement → write SPEC before code
2. root-cause-tracing   → bugs only (trace, don't guess)
3. execute-judge-loop   → write → tsc → check → fix
4. self-reflection      → 7 steps before submit
5. → submit to Critic Agent

## SELF-CHECK (must pass before submit)
- tsc: cd services/auth && npx tsc --noEmit
- No console.log in changed files
- No `any` type
- Zone: only services/auth/ files changed
