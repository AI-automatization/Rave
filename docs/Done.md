# CineSync — BAJARILGAN ISHLAR ARXIVI

# Yangilangan: 2026-02-27

---

## ✅ BAJARILGAN FEATURELAR

### F-001 | 2026-02-26 | [DEVOPS] | Monorepo + Docker + Nginx setup

- **Mas'ul:** Saidazim
- **Sprint:** S1
- **Task:** T-S001
- **Bajarildi:**
  - `package.json` — npm workspaces (services/_, apps/_, shared)
  - `tsconfig.base.json` — strict mode, @shared/\* path aliases
  - `docker-compose.dev.yml` — MongoDB 7, Redis 7 (AOF), Elasticsearch 8.11
  - `docker-compose.prod.yml` — barcha service container + nginx
  - `nginx/nginx.conf` — reverse proxy (3001-3008), WebSocket support, rate limiting zones
- **Commit:** `379c2cd` → github.com:AI-automatization/Rave.git

---

### F-002 | 2026-02-26 | [BACKEND] | Shared utilities — types, logger, middleware, constants

- **Mas'ul:** Saidazim
- **Sprint:** S1
- **Task:** T-S007 (Logging), T-C001 (partial)
- **Bajarildi:**
  - `shared/src/types/index.ts` — ApiResponse<T>, IUser, IMovie, IWatchPartyRoom, IBattle, INotification, IFriendship, JwtPayload, pagination types
  - `shared/src/utils/logger.ts` — Winston (console + file transports, MongoDB prod-da), sensitive field redaction (password/token/secret → [REDACTED])
  - `shared/src/utils/apiResponse.ts` — success(), error(), paginated() helpers
  - `shared/src/utils/errors.ts` — AppError, NotFoundError, UnauthorizedError, ForbiddenError, ValidationError, ConflictError, TooManyRequestsError, BadRequestError
  - `shared/src/middleware/auth.middleware.ts` — verifyToken (RS256), optionalAuth, requireRole, requireVerified
  - `shared/src/middleware/error.middleware.ts` — global Express error handler
  - `shared/src/middleware/rateLimiter.middleware.ts` — Redis-based: apiRateLimiter, authRateLimiter, userRateLimiter
  - `shared/src/constants/index.ts` — POINTS, RANKS, PORTS, REDIS_KEYS, TTL, LIMITS, PATTERNS
  - `shared/src/constants/socketEvents.ts` — SERVER_EVENTS, CLIENT_EVENTS (freeze qilingan)
- **Commit:** `379c2cd`

---

### F-003 | 2026-02-26 | [BACKEND] | Auth Service boilerplate (port 3001)

- **Mas'ul:** Saidazim
- **Sprint:** S1
- **Task:** T-S002 (boilerplate qismi)
- **Bajarildi:**
  - `services/auth/src/models/user.model.ts` — Mongoose schema (email, username, passwordHash, role, isEmailVerified, googleId, fcmTokens, resetToken)
  - `services/auth/src/models/refreshToken.model.ts` — TTL index, tokenHash, ip, userAgent
  - `services/auth/src/services/auth.service.ts` — hashPassword (bcrypt 12 rounds), comparePassword, generateTokens (RS256), register, login, refreshTokens (rotation), logout, verifyEmail, forgotPassword, resetPassword, findOrCreateGoogleUser, bruteForce protection
  - `services/auth/src/controllers/auth.controller.ts` — register, login, refresh, logout, logoutAll, verifyEmail, forgotPassword, resetPassword, googleCallback, getMe
  - `services/auth/src/routes/auth.routes.ts` — barcha endpoint + Passport Google OAuth
  - `services/auth/src/validators/auth.validator.ts` — Joi schemas
  - `services/auth/src/app.ts` — Express, helmet, cors, passport init
  - `services/auth/src/server.ts` — MongoDB connect, Redis connect, graceful shutdown
  - `.env.example`, `Dockerfile`, `tsconfig.json`, `package.json`
- **Commit:** `379c2cd`

---

### F-004 | 2026-02-26 | [BACKEND] | User Service boilerplate (port 3002)

- **Mas'ul:** Saidazim
- **Sprint:** S1
- **Task:** T-S003 (boilerplate qismi)
- **Bajarildi:**
  - `services/user/src/models/user.model.ts` — authId ref, rank, totalPoints, lastSeenAt
  - `services/user/src/models/friendship.model.ts` — requesterId, receiverId, status (pending/accepted/blocked)
  - `services/user/src/services/user.service.ts` — getProfile, getPublicProfile, updateProfile, heartbeat (Redis TTL 3min), isUserOnline, sendFriendRequest, acceptFriendRequest (points award), removeFriend, getFriends, addPoints, recalculateRank
  - `services/user/src/controllers/user.controller.ts` + routes + app + server
- **Commit:** `379c2cd`

---

### F-005 | 2026-02-26 | [BACKEND] | Content Service boilerplate (port 3003)

- **Mas'ul:** Saidazim
- **Sprint:** S2
- **Task:** T-S005
- **Bajarildi:**
  - `services/content/src/models/movie.model.ts` — title, genre, year, duration, HLS videoUrl, isPublished, viewCount, elasticId
  - `services/content/src/models/watchHistory.model.ts` — progress (0-100%), completed (≥90%), durationWatched, TTL index yo'q
  - `services/content/src/models/rating.model.ts` — score (1-10), review, unique (userId+movieId)
  - `services/content/src/services/content.service.ts` — getMovieById (Redis cache), listMovies, searchMovies (Elasticsearch multi_match + fuzzy), createMovie (ES index), updateMovie (cache invalidate), deleteMovie, recordWatchHistory (upsert), getWatchHistory, rateMovie (avg recalc)
  - `services/content/src/controllers/content.controller.ts` + routes (operator/admin guard) + app + server
- **Commit:** `379c2cd`

---

### F-006 | 2026-02-26 | [BACKEND] | Watch Party Service boilerplate (port 3004)

- **Mas'ul:** Saidazim
- **Sprint:** S2
- **Task:** T-S006 (boilerplate qismi)
- **Bajarildi:**
  - `services/watch-party/src/models/watchPartyRoom.model.ts` — inviteCode, members, maxMembers (10), status, currentTime, isPlaying
  - `services/watch-party/src/services/watchParty.service.ts` — createRoom (random inviteCode), joinRoom, leaveRoom (owner→close), syncState (±2s threshold), getSyncState, needsResync, kickMember
  - `services/watch-party/src/socket/watchParty.socket.ts` — JWT auth middleware, join/leave/play/pause/seek/buffer/chat/emoji/kick handlers, latency compensation
  - HTTP controllers + routes + app (Socket.io init) + server
- **Commit:** `379c2cd`

---

### F-007 | 2026-02-26 | [BACKEND] | Battle Service boilerplate (port 3005)

- **Mas'ul:** Saidazim
- **Sprint:** S3
- **Task:** T-S008
- **Bajarildi:**
  - `services/battle/src/models/battle.model.ts` — duration (3/5/7 kun), status, startDate, endDate, winnerId
  - `services/battle/src/models/battleParticipant.model.ts` — score, moviesWatched, minutesWatched, hasAccepted
  - `services/battle/src/services/battle.service.ts` — createBattle, inviteParticipant, acceptInvite, addMovieScore (Redis ZINCRBY), getLeaderboard (Redis sorted set ZREVRANGEBYSCORE), getUserActiveBattles, cron hourly resolution (BATTLE_WIN points award)
  - Controllers + routes + app + server
- **Commit:** `379c2cd`

---

### F-008 | 2026-02-26 | [BACKEND] | Notification Service boilerplate (port 3007)

- **Mas'ul:** Saidazim
- **Sprint:** S3
- **Task:** T-S010
- **Bajarildi:**
  - `services/notification/src/models/notification.model.ts` — 8 NotificationType, data (Mixed), TTL 90 kun
  - `services/notification/src/queues/email.queue.ts` — Bull queue, nodemailer transporter, 3 retries (exponential backoff)
  - `services/notification/src/services/notification.service.ts` — sendInApp, sendPush (FCM multicast), sendEmail (Bull enqueue), getNotifications, markAsRead, markAllAsRead, getUnreadCount, deleteNotification
  - `services/notification/src/app.ts` — Firebase Admin init
  - Controllers + routes + server
- **Commit:** `379c2cd`

---

### F-009 | 2026-02-26 | [BACKEND] | Admin Service boilerplate (port 3008)

- **Mas'ul:** Saidazim
- **Sprint:** S4
- **Task:** T-S011 (boilerplate qismi)
- **Bajarildi:**
  - `services/admin/src/services/admin.service.ts` — getDashboardStats (totalUsers, activeUsers via Redis keys), listUsers (filter: role, isBlocked, search), blockUser (Redis session invalidate), unblockUser, changeUserRole, deleteUser
  - requireRole('admin', 'superadmin') guard barcha route
  - Controllers + routes + app + server
- **Commit:** `379c2cd`

---

### F-010 | 2026-02-27 | [BACKEND] | User Service — avatar upload + settings + profile sync (T-S002)

- **Mas'ul:** Saidazim
- **Sprint:** S1
- **Bajarildi:**
  - `services/user/src/models/user.model.ts` — `settings.notifications` (8 ta toggle) qo'shildi
  - `services/user/src/validators/user.validator.ts` — updateProfile, updateSettings, createProfile, fcmToken Joi schemas
  - `services/user/src/services/user.service.ts` — `updateAvatar`, `getSettings`, `updateSettings`, `createProfile`, `addFcmToken`, `removeFcmToken` metodlar
  - `services/user/src/controllers/user.controller.ts` — `uploadAvatar`, `getSettings`, `updateSettings`, `createProfile`, `addFcmToken`, `removeFcmToken` handlerlar
  - `services/user/src/routes/user.routes.ts` — multer (JPEG/PNG/WebP, max 5MB), `PATCH /me/avatar`, `GET/PATCH /me/settings`, `POST/DELETE /me/fcm-token`, `POST /internal/profile`
  - `services/user/src/app.ts` — `/uploads` static file serving
  - `services/auth/src/services/auth.service.ts` — register/Google OAuth da `syncUserProfile()` chaqiradi (user service `/internal/profile`)
  - `services/auth/src/config/index.ts` — `USER_SERVICE_URL` env var qo'shildi
  - `services/auth/.env.example` — `USER_SERVICE_URL` qo'shildi

---

### F-011 | 2026-02-27 | [BACKEND] | Missing MongoDB Schemas + Seed Script (T-S003)

- **Mas'ul:** Saidazim
- **Sprint:** S1
- **Bajarildi:**
  - `services/user/src/models/achievement.model.ts` — key, title, description, iconUrl, rarity (5 daraja), points, condition, isSecret; key+rarity index
  - `services/user/src/models/userAchievement.model.ts` — userId, achievementId, achievementKey, unlockedAt; (userId+achievementKey) unique index
  - `services/admin/src/models/feedback.model.ts` — userId, type (bug/feature/other), content, status (4 holat), adminReply, repliedAt, repliedBy
  - `services/admin/src/models/apiLog.model.ts` — service, method, url, statusCode, duration, userId, level, meta; TTL index (30 kun)
  - `scripts/seed.ts` — Auth+User+Content DB ga ulangan seed: 4 user (superadmin, operator, 2 test), 25 achievement, 12 demo film (IMDB top filmlar)
  - `scripts/tsconfig.json` — seed script uchun TypeScript config
  - `package.json` — `npm run seed` script qo'shildi

---

### F-012 | 2026-02-27 | [BACKEND] | Watch Party — audio mute control (T-S004)

- **Mas'ul:** Saidazim
- **Sprint:** S2
- **Bajarildi:**
  - `services/watch-party/src/socket/watchParty.socket.ts` — `CLIENT_EVENTS.MUTE_MEMBER` handler: owner tekshiruvi, member mavjudligi tekshiruvi, `SERVER_EVENTS.MEMBER_MUTED` broadcast (userId, mutedBy, reason, timestamp)
  - `services/watch-party/src/services/watchParty.service.ts` — `setMuteState()` (Redis Set: `watch_party:muted:{roomId}`), `getMutedMembers()`, `isMuted()` metodlar; TTL: WATCH_PARTY_ROOM (24h)
  - Buffer/sync flow allaqachon ishlagan: `BUFFER_START` → boshqa a'zolarga `VIDEO_BUFFER` (buffering: true) broadcast ✅
  - Redis room state cache allaqachon ishlagan: `cacheRoomState()` `watch_party:{roomId}` da ✅

---

### F-013 | 2026-02-27 | [BACKEND] | Content Service — Elasticsearch init + stats (T-S005)

- **Mas'ul:** Saidazim
- **Sprint:** S2
- **Bajarildi:**
  - `services/content/src/utils/elastic.init.ts` — `movies` index mapping: custom analyzer (cinesync_standard, cinesync_autocomplete, cinesync_search, cinesync_russian), Russian stemmer/stopwords, edge n-gram tokenizer (prefix search), field mappings (title^3, originalTitle^2, description, genre keyword, year integer, rating float, TTL index)
  - `services/content/src/server.ts` — startup da `initElasticsearchIndex()` chaqirish (idempotent — mavjud bo'lsa skip)
  - `services/content/src/services/content.service.ts` — `getStats()` metod: genre distribution aggregation, year histogram (top 20), top 10 rated movies, total/published count
  - `services/content/src/controllers/content.controller.ts` — `getStats` handler
  - `services/content/src/routes/content.routes.ts` — `GET /movies/stats` (operator+ role)
  - **Qolgan:** HLS upload pipeline → T-S005b ga ko'chirildi

---

### F-014 | 2026-02-27 | [BACKEND] | Achievement System (T-S006)

- **Mas'ul:** Saidazim
- **Sprint:** S3
- **Bajarildi:**
  - `services/user/src/services/achievement.service.ts` — `AchievementService`: `checkAndUnlock(userId, event)` metod (10 event turi: movie_watched, watch_party, battle, friend, review, streak, rank, watch_time, daily_minutes), `getUserAchievements(includeSecret)`, `getAchievementStats()`
  - `services/user/src/controllers/achievement.controller.ts` — `getMyAchievements`, `getMyStats`, `getUserAchievements` (public, secret hidden), `triggerEvent` (internal)
  - `services/user/src/routes/achievement.routes.ts` — `GET /achievements/me`, `GET /achievements/me/stats`, `GET /achievements/:id`, `POST /achievements/internal/trigger`
  - `services/user/src/app.ts` — `/achievements` routerini qo'shildi
  - Models (T-S003 dan): `Achievement` + `UserAchievement` ✅
  - 25 achievement ta'rifi (seed.ts da) ✅
  - Secret achievement: isSecret flag, caller ga yashiriladi ✅

---

### F-015 | 2026-02-27 | [BACKEND] | Rating + Review to'liq (T-S007)
- **Mas'ul:** Saidazim
- **Sprint:** S3
- **Bajarildi:**
  - `services/content/src/services/content.service.ts` — `getMovieRatings(movieId, page, limit)`, `deleteUserRating(userId, movieId)`, `deleteRatingByModerator(ratingId)`, `recalculateRating()` private metod (rating avg qayta hisobl + Redis cache invalidate)
  - `services/content/src/controllers/content.controller.ts` — `getMovieRatings`, `deleteMyRating`, `deleteRatingModerator` handlerlar
  - `services/content/src/routes/content.routes.ts` — `GET /movies/:id/ratings`, `DELETE /movies/:id/rate`, `DELETE /ratings/:ratingId` (operator+)
  - Movie not found check `rateMovie()` da qo'shildi

---

### F-016 | 2026-02-27 | [BACKEND] | Admin Service — to'liq funksionallik (T-S008)
- **Mas'ul:** Saidazim
- **Sprint:** S4
- **Bajarildi:**
  - `services/admin/src/config/index.ts` — `CONTENT_MONGO_URI`, `USER_MONGO_URI` env var qo'shildi
  - `services/admin/src/services/admin.service.ts` — `getMovieModel()` (content DB inline schema), movie: `listMovies`, `publishMovie`, `unpublishMovie`, `deleteMovie`, `operatorUpdateMovie`; feedback: `listFeedback`, `replyFeedback`, `submitFeedback`; analytics: `getAnalytics` (totalUsers, newUsersToday, newUsersThisMonth, activeUsers via Redis, movie counts); logs: `getLogs` (filter: level, service, dateFrom, dateTo)
  - `services/admin/src/controllers/admin.controller.ts` — 11 ta yangi handler: listMovies, publishMovie, unpublishMovie, deleteMovie, operatorUpdateMovie, listFeedback, replyFeedback, submitFeedback, getAnalytics, getLogs
  - `services/admin/src/routes/admin.routes.ts` — movies (list/publish/unpublish/delete), feedback (list/reply), analytics, logs endpointlari
  - `services/admin/src/routes/operator.routes.ts` — `/operator/*`: movie list+edit (publish yo'q), feedback submit
  - `services/admin/src/app.ts` — `/operator` router qo'shildi

---

## 🐛 TUZATILGAN BUGLAR

| #   | Sana | Tur | Muammo        | Yechim |
| --- | ---- | --- | ------------- | ------ |
| BUG-001 | 2026-02-27 | TS2349 | `admin.service.ts` `getMovieModel()`/`getUserModel()` not callable (union type) | Explicit `Model<Record<string, unknown>>` return type |
| BUG-002 | 2026-02-27 | TS2322/TS2556 | `rateLimiter.middleware.ts` SendCommandFn type mismatch | `sendRedisCommand` helper + `unknown as SendCommandFn` |
| BUG-003 | 2026-02-27 | TS2352 | `error.middleware.ts` Error → Record<string, unknown> cast | `as unknown as Record<string, unknown>` |
| BUG-004 | 2026-02-27 | TS2352 | `user.service.ts` lean() → IUserDocument cast | `as unknown as IUserDocument & ...` |
| BUG-005 | 2026-02-27 | TS2352 | `content.service.ts` Query → Promise cast | `as unknown as Promise<...>` |
| BUG-006 | 2026-02-27 | TS2790 | 13 model faylda `delete ret.__v` | `Reflect.deleteProperty(ret, '__v')` |
| BUG-007 | 2026-02-27 | TS6133 | `logger.ts` `simple` unused import | Import o'chirildi |
| BUG-008 | 2026-02-27 | TS6133 | `auth.service.ts` `NotFoundError` unused | Import o'chirildi |
| BUG-009 | 2026-02-27 | TS6133 | `battle.service.ts` `ForbiddenError` unused | Import o'chirildi |
| BUG-010 | 2026-02-27 | TS6133 | `admin.service.ts` `blockedUsers` unused | Ortiqcha query o'chirildi |
| BUG-012 | 2026-02-28 | Runtime | `elastic.init.ts` apostrophe_filter duplicate mappings (ASCII `'` 2x) | Unicode escape: `\\u2018=>\\u0027`, `\\u2019=>\\u0027` |
| BUG-013 | 2026-02-28 | Runtime | `elastic.init.ts` `boost` ES 8.x da qabul qilinmaydi | `title` va `originalTitle` fieldlaridan `boost` o'chirildi |

---

### F-017 | 2026-02-27 | [BACKEND] | Debug Log + TypeScript fixes + Logging config

- **Mas'ul:** Saidazim
- **Bajarildi:**
  - `docs/DebugLog.md` — barcha TypeScript xatolar hujjatlashtirildi (BUG-001..BUG-011)
  - 16 ta TypeScript xato tuzatildi (7 ta service, 13 ta fayl)
  - `shared/src/utils/logger.ts` — `fs.mkdirSync('logs', {recursive:true})` qo'shildi (har doim logs/ papka yaratiladi)
  - `shared/src/utils/logger.ts` — `LOG_LEVEL` env variable qo'llab-quvvatlandi
  - Barcha 7 service `.env.example` — `LOG_LEVEL=debug` qo'shildi
  - Winston: `logs/error.log` (10MB×5) + `logs/combined.log` (10MB×30) har doim yozadi

---

### F-018 | 2026-02-27 | [BACKEND] | Service-to-Service Communication (T-C005)

- **Mas'ul:** Saidazim
- **Bajarildi:**
  - `shared/src/utils/serviceClient.ts` — typed HTTP client (axios): `addUserPoints()`, `triggerAchievement()`, `sendInternalNotification()`, `getMovieInfo()`, `validateInternalSecret()`, `requireInternalSecret()` middleware
  - `shared/src/index.ts` — serviceClient export qo'shildi
  - `services/battle/src/services/battle.service.ts` — `resolveBattle()` da battle win → `addUserPoints()` + `triggerAchievement('battle')` (non-blocking)
  - `services/user/src/services/user.service.ts` — `acceptFriendRequest()` da → `triggerAchievement('friend')` (har ikkala user uchun, non-blocking)
  - `services/content/src/services/content.service.ts` — `recordWatchHistory()` da completed=true → `triggerAchievement('movie_watched')` (non-blocking)
  - `services/user/src/controllers/user.controller.ts` — `addPoints` handler qo'shildi (internal endpoint)
  - `services/user/src/routes/user.routes.ts` — `POST /internal/add-points` route qo'shildi
  - Barcha 7 service `.env.example` — `INTERNAL_SECRET` qo'shildi

---

### F-019 | 2026-02-27 | [BACKEND] | Git Workflow + PR Template (T-C003)

- **Mas'ul:** Saidazim
- **Bajarildi:**
  - `.github/PULL_REQUEST_TEMPLATE.md` — TypeScript, security, zone, API format tekshiruv ro'yxati
  - `.github/ISSUE_TEMPLATE/bug_report.md` — servis, fayl, qayta ishlab chiqarish, log maydonlari
  - `.github/ISSUE_TEMPLATE/feature_request.md` — prioritet, zona, texnik yondashuv maydonlari

---

### F-020 | 2026-02-27 | [DEVOPS] | CI/CD GitHub Actions (T-S010)

- **Mas'ul:** Saidazim
- **Bajarildi:**
  - `.github/workflows/lint.yml` — PR da barcha 8 service typecheck (matrix strategy, fail-fast: false)
  - `.github/workflows/test.yml` — PR da Jest tests (MongoDB + Redis service containers)
  - `.github/workflows/docker-build.yml` — develop/main push da Docker build + GHCR push (7 service, cache-from/to gha)
  - `.github/workflows/deploy-staging.yml` — develop branch → staging (environment: staging, manual trigger placeholder)
  - `.github/workflows/deploy-prod.yml` — main branch → production (workflow_dispatch confirm='yes' + push, environment: production)

---

### F-021 | 2026-02-27 | [BACKEND] | Swagger API Docs + /api/v1/ prefix (T-S011 + T-C001)

- **Mas'ul:** Saidazim
- **Bajarildi:**
  - Barcha 7 service `src/utils/swagger.ts` — swagger-jsdoc config (OpenAPI 3.0, bearerAuth, tags)
  - Barcha 7 service `app.ts` — `GET /api-docs` (Swagger UI) + `GET /api-docs.json` (spec) route qo'shildi
  - **API versioning** — barcha 7 service `/api/v1/` prefix:
    - auth: `/api/v1/auth`
    - user: `/api/v1/users`, `/api/v1/achievements`
    - content: `/api/v1/movies`
    - watch-party: `/api/v1/watch-party`
    - battle: `/api/v1/battles`
    - notification: `/api/v1/notifications`
    - admin: `/api/v1/admin`, `/api/v1/operator`
  - `swagger-jsdoc` + `swagger-ui-express` — root workspace da o'rnatildi

---

### F-022 | 2026-02-28 | [BACKEND] | Auth E2E login testi + Services startup + ES index yaratildi (T-S001)

- **Mas'ul:** Saidazim
- **Bajarildi:**
  - Barcha 7 service ishga tushirildi (ports 3001-3008, hammasi `/health` → 200 OK)
  - `services/content/src/utils/elastic.init.ts` — BUG-012 tuzatildi: apostrophe_filter mappings ASCII → Unicode escape sequences
  - `services/content/src/utils/elastic.init.ts` — BUG-013 tuzatildi: `boost` parametri ES 8.x incompatible, o'chirildi
  - Elasticsearch `movies` index muvaffaqiyatli yaratildi (green, 1 shard, 0 replica)
  - Auth login E2E test o'tdi: `POST /api/v1/auth/login` → `accessToken` + `refreshToken` + `user` qaytadi
  - Seed credentials (test1@cinesync.app / Test123!) bilan login ✅ ishladi
  - **SMTP (email):** mailtrap.io dan credentials kerak bo'lganda to'ldirish (ixtiyoriy dev uchun)

---

---

### F-023 | 2026-02-28 | [MOBILE] | React Native loyiha setup — T-E001

- **Mas'ul:** Emirhan
- **Sprint:** S1
- **Bajarildi:**
  - `apps/mobile/package.json` — RN 0.74.5, React Navigation, Zustand, React Query, Axios, Socket.io-client, Firebase, MMKV, react-native-video, FastImage, Google SignIn
  - `apps/mobile/tsconfig.json` — strict mode, path aliases (@screens, @components, @api, @store, @socket, @theme, @utils, @types, @navigation)
  - `apps/mobile/babel.config.js` — babel-plugin-module-resolver + reanimated/plugin
  - `apps/mobile/metro.config.js` + `index.js` + `app.json` + `.env.example`
  - `src/theme/index.ts` — colors, spacing, borderRadius, typography, shadows, RANK_COLORS
  - `src/types/index.ts` — barcha type'lar (IUser, IMovie, IWatchPartyRoom, IBattle, INotification, IAchievement, ApiResponse, ...)
  - `src/utils/storage.ts` — MMKV token storage (accessToken, refreshToken, userId)
  - `src/utils/notifications.ts` — FCM permission, token registration, NOTIFICATION_ROUTES
  - `src/api/client.ts` — per-service Axios instances (6 ta), auto-refresh interceptor, token rotation
  - `src/api/auth.api.ts` — register, login, refresh, logout, verifyEmail, forgotPassword, resetPassword, getMe
  - `src/api/user.api.ts` — profile, avatar, settings, FCM token, heartbeat, friends, achievements
  - `src/api/content.api.ts` — movies, search, watch history, ratings
  - `src/api/watchParty.api.ts` — room CRUD
  - `src/api/battle.api.ts` — battles CRUD + leaderboard
  - `src/api/notification.api.ts` — notifications CRUD
  - `src/store/auth.store.ts` — user, isAuthenticated, setAuth, logout, hydrateFromStorage
  - `src/store/movies.store.ts` — trending, topRated, continueWatching
  - `src/store/friends.store.ts` — friends, onlineIds, pendingRequests
  - `src/store/watchParty.store.ts` — room, syncState, messages, emojis, bufferingUserIds
  - `src/store/battle.store.ts` — activeBattles, pastBattles
  - `src/store/notification.store.ts` — notifications, unreadCount
  - `src/socket/client.ts` — Socket.io singleton, connectSocket/disconnect, watchPartySocket actions, SERVER/CLIENT_EVENTS constants, store integration
  - `src/navigation/types.ts` — AuthStackParams, HomeStackParams, SearchStackParams, FriendsStackParams, ProfileStackParams, MainTabsParams, RootStackParams
  - `src/navigation/AuthStack.tsx` — 7 screen stack
  - `src/navigation/MainTabs.tsx` — 4 tab (Home/Search/Friends/Profile), nested stacks
  - `src/navigation/index.tsx` — AppNavigator (auth-aware routing + modal group)
  - `src/hooks/useSocket.ts` — connect/disconnect on auth change
  - `src/hooks/useHeartbeat.ts` — 2 min interval + AppState listener
  - `src/App.tsx` — QueryClient, bootstrap (token hydration → /auth/me), FCM setup, GestureHandler, SafeArea
  - Sprint 2-5 placeholder screens (17 ta): home, search, friends, profile, modal

---

### F-024 | 2026-02-28 | [MOBILE] | Auth screens — T-E002

- **Mas'ul:** Emirhan
- **Sprint:** S1
- **Bajarildi:**
  - `src/screens/auth/SplashScreen.tsx` — animated logo, isLoading watch → Onboarding
  - `src/screens/auth/OnboardingScreen.tsx` — 3 slide FlatList (pagingEnabled), dot indicators, Next/Start/Login buttons
  - `src/screens/auth/LoginScreen.tsx` — email+password form, show/hide password, Google SignIn stub, API call, Toast errors, Axios error handling
  - `src/screens/auth/RegisterScreen.tsx` — username+email+password+confirm, Joi-like client validation (PATTERNS matcher), API call
  - `src/screens/auth/VerifyEmailScreen.tsx` — token input, authApi.verifyEmail, success → Login
  - `src/screens/auth/ForgotPasswordScreen.tsx` — email input, sent state (email enumeration safe message)
  - `src/screens/auth/ProfileSetupScreen.tsx` — bio input (200 char limit), avatar placeholder, skip option

---

### F-025 | 2026-02-28 | [MOBILE] | HomeScreen — T-E003

- **Mas'ul:** Emirhan
- **Sprint:** S2
- **Commit:** `8d06093`
- **Bajarildi:**
  - `src/screens/home/HomeScreen.tsx` — CINESYNC logo header, notification badge, RefreshControl
  - `src/hooks/useHomeData.ts` — React Query (trending, topRated, continueWatching, staleTime 10min)
  - `src/components/HeroBanner.tsx` — top 5 trending, linear gradient overlay, auto-scroll
  - `src/components/MovieRow.tsx` — horizontal FlatList, optimized (getItemLayout, windowSize)
  - `src/components/HomeSkeleton.tsx` — loading skeleton (react-native-skeleton-placeholder)

---

### F-026 | 2026-02-28 | [MOBILE] | SearchScreen + SearchResultsScreen — T-E004

- **Mas'ul:** Emirhan
- **Sprint:** S2
- **Commit:** `f25bf4a`
- **Bajarildi:**
  - `src/screens/search/SearchScreen.tsx` — debounced search (500ms), genre filter chips, search history (MMKV), recent searches
  - `src/screens/search/SearchResultsScreen.tsx` — results list, movie cards, pagination

---

### F-027 | 2026-02-28 | [MOBILE] | MovieDetailScreen + VideoPlayerScreen — T-E005

- **Mas'ul:** Emirhan
- **Sprint:** S2
- **Commit:** `4aedc38`
- **Bajarildi:**
  - `src/screens/home/MovieDetailScreen.tsx` — parallax header (Animated.ScrollView), movie info, genre chips, RatingWidget (1-10 stars), watch history integration
  - `src/screens/home/VideoPlayerScreen.tsx` — react-native-video HLS (m3u8), custom controls (play/pause/seek/fullscreen), progress save (debounced 30s), 90% → markComplete + checkAchievements

---

### F-028 | 2026-02-28 | [MOBILE] | WatchParty ekranlar — T-E006

- **Mas'ul:** Emirhan
- **Sprint:** S3
- **Commit:** `e42921f`
- **Bajarildi:**
  - `src/screens/modal/WatchPartyCreateScreen.tsx` — movie tanlov, private/public, create room
  - `src/screens/modal/WatchPartyScreen.tsx` — sync video player, chat panel, emoji float overlay, owner/member controls (play/pause/seek faqat owner), invite code share

---

### F-029 | 2026-02-28 | [MOBILE] | Do'stlar ekranlar — T-E007

- **Mas'ul:** Emirhan
- **Sprint:** S3
- **Commit:** `dd7b038`
- **Bajarildi:**
  - `src/screens/friends/FriendsScreen.tsx` — friends list (online indicator), pending requests badge, search button
  - `src/screens/friends/FriendSearchScreen.tsx` — debounced user search, send friend request
  - `src/screens/friends/FriendProfileScreen.tsx` — public profile, stats, online status, friend actions

---

### F-030 | 2026-02-28 | [MOBILE] | Battle ekranlar — T-E008

- **Mas'ul:** Emirhan
- **Sprint:** S3
- **Commit:** `988a424`
- **Bajarildi:**
  - `src/screens/modal/BattleCreateScreen.tsx` — duration tanlov (3/5/7 kun), opponent invite
  - `src/screens/modal/BattleScreen.tsx` — active battles list, leaderboard (progress bars), battle detail, result (confetti animation), global challenge tab

---

### F-031 | 2026-02-28 | [MOBILE] | Profil + Stats + Achievements + Settings — T-E009

- **Mas'ul:** Emirhan
- **Sprint:** S4
- **Bajarildi:**
  - `src/screens/profile/ProfileScreen.tsx` — avatar, rank badge, stats grid (4 card), rank progress bar, navigation buttons, logout. Bug fix: BUG-M005 (username?.[0]), BUG-M006 (division by zero), BUG-M007 (manfiy qoldiq)
  - `src/screens/profile/AchievementsScreen.tsx` — FlatList 3 column grid, RARITY_COLORS, locked/unlocked state, secret achievement "???" ko'rinishi, points badge
  - `src/screens/profile/StatsScreen.tsx` — rank card (progress bar, next rank), stats grid (6 card), activity bar chart (4 bar), rank yo'li timeline
  - `src/screens/profile/SettingsScreen.tsx` — til tanlash (uz/ru/en), bildirishnoma togglelar (5 ta), privacy togglelar (2 ta), save mutation, Alert feedback

---

### F-032 | 2026-02-28 | [MOBILE] | NotificationsScreen — T-E010

- **Mas'ul:** Emirhan
- **Sprint:** S4
- **Bajarildi:**
  - `src/screens/modal/NotificationsScreen.tsx` — FlatList, unread dot, icon per type (8 tur), formatDistanceToNow (date-fns), mark single read, mark all read, delete, WatchParty/Battle ga navigate (tap), empty state

---

### F-033 | 2026-02-28 | [MOBILE] | Mobile buglar — BUG-M005..BUG-M008

- **Mas'ul:** Emirhan
- **Bajarildi:**
  - BUG-M005: `ProfileScreen.tsx:72` — `username?.[0]` safe optional chaining
  - BUG-M006: `ProfileScreen.tsx:119` — `nextMilestone > 0 ?` division by zero guard
  - BUG-M007: `ProfileScreen.tsx:112` — `Math.max(0, ...)` manfiy qoldiq oldini olish
  - BUG-M008: `package.json:66` — `setupFilesAfterFramework` → `setupFilesAfterEnv` Jest config fix

---

### F-034 | 2026-02-28 | [MOBILE] | Polish + Performance + Testing — T-E011

- **Mas'ul:** Emirhan
- **Sprint:** S5
- **Bajarildi:**

**Performance:**
- `HeroBanner.tsx` — `getItemLayout` qo'shildi (full-width slides), `initialNumToRender=1`, `maxToRenderPerBatch=2`, `windowSize=3`
- `MovieCard.tsx` — `accessibilityRole="button"`, `accessibilityLabel="{title}, {year}, reyting {rating}"`
- `HeroBanner.tsx` — play button va slide `accessibilityRole` + `accessibilityLabel`

**Accessibility:**
- MovieCard, HeroBanner barcha interactive elementlariga `accessibilityRole` va `accessibilityLabel` qo'shildi

**Error Handling:**
- `src/components/ErrorBoundary.tsx` — React class-based ErrorBoundary, "Qayta urinish" button, `reportError` integration
- `App.tsx` — `<ErrorBoundary>` bilan `<AppContent>` wrap qilindi

**Crash Reporting:**
- `src/utils/crash.ts` — Sentry wrapper stub (initCrashReporting, reportError, reportMessage, setUserContext, clearUserContext). Sentry o'rnatilganda uncommenting kerak.
- `App.tsx` — `initCrashReporting()` startup da, `setUserContext`/`clearUserContext` auth o'zgarishida

**Jest Unit Tests:**
- `jest.setup.js` — native module mocks (FastImage, LinearGradient, MMKV, SafeAreaContext, Firebase, Toast)
- `package.json` — `setupFiles`, `transformIgnorePatterns`, `moduleNameMapper` (path aliases), `collectCoverageFrom`
- `__tests__/components/MovieCard.test.tsx` — 5 test (title, year, rating, onPress, accessibilityLabel)
- `__tests__/components/ErrorBoundary.test.tsx` — 4 test (normal render, error UI, reset, reportError chaqirildi)
- `__tests__/utils/crash.test.ts` — 4 test (init, reportError, reportMessage, setUser/clearUser)

**Detox E2E:**
- `.detoxrc.js` — iOS simulator + Android emulator konfiguratsiya
- `e2e/jest.config.js` — Detox jest runner config
- `e2e/auth.e2e.ts` — Auth flow E2E: Splash → Onboarding → Login → Home

**Bug fix (oldingi sessiyada qolgan):**
- `package.json` — `setupFilesAfterFramework` → `setupFilesAfterEnv` (BUG-M008)

---

---

### F-035 | 2026-02-28 | [WEB] | Next.js Web App — Sprint 1-4 (T-J001..T-J006)

- **Mas'ul:** Jafar
- **Sprint:** S1-S4
- **Commit:** `f32c5e5 feat(web): add Next.js web app — Sprint 1-5 (T-J001..T-J007)`
- **Bajarildi:**
  - **T-J001** — Next.js App Router setup, Tailwind v4, Shadcn/ui, Zustand + React Query, Socket.io client, JWT auth middleware
  - **T-J002** — Landing page: Hero, Features, How it works, Testimonials, Pricing, FAQ, JSON-LD schema, SEO metadata
  - **T-J003** — App layout (sidebar/topbar), `(app)/home/page.tsx` (SSR+ISR), `(app)/movies/[slug]/page.tsx` (dynamic metadata + Movie JSON-LD)
  - **T-J004** — `VideoPlayer.tsx` (hls.js, custom controls, keyboard shortcuts Space/Arrow/F/M, ±2s Watch Party sync), `(app)/search/page.tsx` (debounced, infinite scroll)
  - **T-J005** — `(app)/party/[roomId]/page.tsx` (70% video + 30% chat split layout, sync state, floating emoji, members list), `ChatPanel.tsx`
  - **T-J006** — `(app)/battle/page.tsx` (create modal, filter), `(app)/profile/[username]/page.tsx` (SSR, OG meta, achievements grid, rank badge), `(app)/stats/page.tsx`
  - `manifest.json` + `robots.txt` + PWA icons (72..512px)
  - Playwright test suite (`/tests/auth.spec.ts`) + `playwright.config.ts`
  - API rewrites (`next.config.mjs`) → backend services (3001-3007)

---

### F-036 | 2026-02-28 | [IKKALASI] | Design Tokens — T-C002

- **Mas'ul:** Saidazim + Emirhan + Jafar
- **Sprint:** S1
- **Bajarildi:**
  - **Mobile:** `apps/mobile/src/theme/index.ts` — colors (#E50914, #0A0A0F, #111118...), spacing, borderRadius, typography (Bebas Neue / DM Sans), shadows, RANK_COLORS
  - **Web:** `apps/web/src/app/globals.css` — Tailwind v4 `@theme` block, CSS custom properties
  - Dark mode ONLY — barcha platform

---

_docs/Done.md | CineSync | Yangilangan: 2026-03-01 (Emirhan: E001..E011 ✅ | Jafar: J001..J006 ✅ | T-C002 ✅)_
