# CLAUDE_BACKEND.md — Backend + Admin Engineer Guide
# Node.js · Express · MongoDB · Redis · Socket.io · Elasticsearch · Bull · FCM
# Claude CLI bu faylni Saidazim tanlanganda o'qiydi

---

## 👋 ZONA

```
services/auth/           → Auth service (port 3001)
services/user/           → User service (port 3002)
services/content/        → Content + Elasticsearch (port 3003)
services/watch-party/    → Socket.io real-time (port 3004)
services/battle/         → Gamification (port 3005)
services/notification/   → FCM + Email + In-app (port 3007)
services/admin/          → Admin API (port 3008)
apps/admin-ui/           → Admin Dashboard (React + Vite)
shared/                  → Middleware, utils, types, constants
docker-compose*.yml      → Infra config
nginx/                   → Reverse proxy
```

**🚫 TEGINMA:** `apps/mobile/` (Emirhan), `apps/web/` (Jafar)

---

## 🏗️ MICROSERVICE ARXITEKTURASI

### Servis Tuzilishi (HAR servis uchun bir xil)

```
services/[name]/
├── src/
│   ├── app.ts              // Express init, middleware, routes
│   ├── server.ts           // Port listen + graceful shutdown
│   ├── config/
│   │   └── index.ts        // Environment variables
│   ├── controllers/
│   │   └── [name].controller.ts   // HTTP layer FAQAT
│   ├── services/
│   │   └── [name].service.ts      // Biznes logika
│   ├── models/
│   │   └── [entity].model.ts      // Mongoose schema
│   ├── routes/
│   │   └── [name].routes.ts       // Express Router
│   ├── validators/
│   │   └── [name].validator.ts    // Joi/Zod schemas
│   └── types/
│       └── index.ts               // Service-specific types
├── package.json
├── tsconfig.json
└── Dockerfile
```

### Controller — FAQAT HTTP, Logika YO'Q

```typescript
// ❌ NOTO'G'RI — controller ichida DB query
router.get('/:id', async (req, res) => {
  const movie = await Movie.findById(req.params.id); // NO!
  res.json(movie);
});

// ✅ TO'G'RI — service orqali
router.get('/:id', verifyToken, async (req, res, next) => {
  try {
    const movie = await contentService.getMovieById(req.params.id, req.user.id);
    res.json(apiResponse.success(movie));
  } catch (error) {
    next(error);
  }
});
```

### Service — Biznes Logika

```typescript
class ContentService {
  async getMovieById(movieId: string, userId: string): Promise<IMovie> {
    const movie = await Movie.findById(movieId).lean();
    if (!movie) throw new NotFoundError('Movie not found');
    if (!movie.isPublished) throw new ForbiddenError('Movie not available');

    // View count increment
    await Movie.updateOne({ _id: movieId }, { $inc: { viewCount: 1 } });

    // Cache update
    await redis.del(`movie:${movieId}`);

    return movie;
  }
}
```

---

## 📊 MONGODB QOIDALARI

### Schema Pattern

```typescript
const userSchema = new Schema<IUser>({
  email:           { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash:    { type: String, required: true, select: false },
  username:        { type: String, unique: true, match: /^[a-zA-Z0-9_]{3,20}$/ },
  avatar:          { type: String, default: null },
  bio:             { type: String, maxlength: 200 },
  isEmailVerified: { type: Boolean, default: false },
  isBlocked:       { type: Boolean, default: false },
  role:            { type: String, enum: ['user', 'operator', 'admin', 'superadmin'], default: 'user' },
  lastLoginAt:     { type: Date },
  fcmTokens:       [String],
}, {
  timestamps: true,
  toJSON: { virtuals: true, transform: (_, ret) => { delete ret.passwordHash; delete ret.__v; } },
});

// INDEXES — performance uchun:
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ createdAt: -1 });
```

### Index Qoidalari
```
1. HAR query da ishlatiladigan field → index qo'sh
2. Compound index — ko'p field bilan filterlash
3. TTL index — expiring data (sessions, OTP)
4. Text index — search (yoki Elasticsearch ishlatish)
5. explain() bilan query plan tekshirish
```

---

## 🔌 SOCKET.IO QOIDALARI (Watch Party)

### Event Naming Convention
```typescript
// Server → Client events:
const SERVER_EVENTS = {
  ROOM_JOINED:     'room:joined',
  ROOM_LEFT:       'room:left',
  VIDEO_PLAY:      'video:play',
  VIDEO_PAUSE:     'video:pause',
  VIDEO_SEEK:      'video:seek',
  VIDEO_SYNC:      'video:sync',
  VIDEO_BUFFER:    'video:buffer',
  MEMBER_KICKED:   'member:kicked',
  MEMBER_MUTED:    'member:muted',
  ROOM_MESSAGE:    'room:message',
  ROOM_EMOJI:      'room:emoji',
  ROOM_CLOSED:     'room:closed',
} as const;

// Client → Server events:
const CLIENT_EVENTS = {
  JOIN_ROOM:       'room:join',
  LEAVE_ROOM:      'room:leave',
  PLAY:            'video:play',
  PAUSE:           'video:pause',
  SEEK:            'video:seek',
  SEND_MESSAGE:    'room:message',
  SEND_EMOJI:      'room:emoji',
  KICK_MEMBER:     'member:kick',
  MUTE_MEMBER:     'member:mute',
} as const;

// ⚠️ BU NOMLARNI O'ZGARTIRISH 3 TA PLATFORMANI BUZADI!
// O'zgartirish kerak bo'lsa → shared/constants/socket-events.ts
```

### Sync Algorithm
```typescript
// Latency compensation:
// 1. Server timestamp + client offset
// 2. ±2 sec threshold — agar farq 2 sec dan katta → force seek
// 3. Buffer event → boshqa a'zolarni pause qilish

interface SyncState {
  currentTime: number;
  isPlaying: boolean;
  serverTimestamp: number;
  updatedBy: string; // owner userId
}
```

---

## 🔒 AUTH VA GUARDS

### JWT Strategy (RS256)
```typescript
// Access token: 15 daqiqa, RS256
const accessToken = jwt.sign(
  { userId, email, role },
  PRIVATE_KEY,
  { algorithm: 'RS256', expiresIn: '15m' }
);

// Refresh token: 30 kun, MongoDB da saqlash
const refreshToken = crypto.randomBytes(64).toString('hex');
await RefreshToken.create({ userId, token: hashToken(refreshToken), expiresAt });
```

### Middleware Stack
```
verifyToken       → JWT tekshirish, req.user qo'shish
optionalAuth      → token bo'lmasa ham ishlaydi (public endpoints)
requireVerified   → isEmailVerified === true
requireRole(role) → role tekshirish (admin, operator)
rateLimiter       → per IP + per user
```

### Brute Force Protection
```typescript
// Redis: login_attempts:{email} → counter (TTL: 15 min)
// 5 ta xato → 15 daqiqa blok
const key = `login_attempts:${email}`;
const attempts = await redis.incr(key);
if (attempts === 1) await redis.expire(key, 900); // 15 min
if (attempts >= 5) throw new TooManyRequestsError('Account locked for 15 minutes');
```

---

## 📨 NOTIFICATION TIZIMI

```typescript
// Notification turlari:
type NotificationType =
  | 'friend_request'
  | 'friend_accepted'
  | 'watch_party_invite'
  | 'battle_invite'
  | 'battle_result'
  | 'achievement_unlocked'
  | 'friend_online'
  | 'friend_watching';

// Yuborish kanallari:
// 1. In-app (MongoDB + Socket.io real-time)
// 2. Push (Firebase FCM)
// 3. Email (Nodemailer + SendGrid, Bull queue)
```

---

## 🎮 GAMIFICATION QOIDALARI

### Ball Tizimi
```typescript
const POINTS = {
  MOVIE_WATCHED:    10,
  WATCH_PARTY:      15,
  BATTLE_WIN:       50,
  ACHIEVEMENT:      20, // 20-100 arasi (darajaga qarab)
  DAILY_STREAK:     5,
} as const;
```

### Rank Tizimi
```
Bronze:   0 - 499 ball
Silver:   500 - 1999
Gold:     2000 - 4999
Platinum: 5000 - 9999
Diamond:  10000+
```

---

## 🐳 DOCKER

```bash
# Development:
docker-compose -f docker-compose.dev.yml up -d

# Production:
docker-compose -f docker-compose.prod.yml up -d --build

# Logs:
docker-compose logs -f auth user content watch-party

# DB shell:
docker exec -it cinesync_mongo mongosh

# Redis:
docker exec -it cinesync_redis redis-cli
```

---

## 📊 API RESPONSE FORMATI (STANDART)

```typescript
// ✅ HAR doim bir xil format:
interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string;
  errors: string[] | null;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Usage:
res.json(apiResponse.success(data, 'Movie found'));
res.status(404).json(apiResponse.error('Movie not found'));
res.json(apiResponse.paginated(movies, { page, limit, total }));
```

---

## 🧪 TEST

```typescript
// Unit test — Service:
describe('AuthService', () => {
  it('should hash password with bcrypt', async () => {
    const hash = await authService.hashPassword('Test123!');
    expect(hash).not.toBe('Test123!');
    expect(hash.startsWith('$2b$')).toBe(true);
  });
});

// Integration test — API:
describe('POST /auth/register', () => {
  it('returns 201 with valid data', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'test@test.com', password: 'Test123!' })
      .expect(201);
    expect(res.body.success).toBe(true);
  });
});
```

---

## 📝 LOGGING — Winston

```typescript
// shared/utils/logger.ts
const logger = createLogger({
  level: 'info',
  format: combine(timestamp(), json()),
  transports: [
    new transports.Console({ format: combine(colorize(), simple()) }),
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' }),
    new transports.MongoDB({ db: MONGO_URI, collection: 'api_logs', level: 'info' }),
  ],
});

// Sensitive data redaction:
// password, token, secret, authorization → [REDACTED]
```

---

## 🚫 TAQIQLANGAN

```
❌ apps/mobile/ papkasiga TEGINMA (Emirhan)
❌ apps/web/ papkasiga TEGINMA (Jafar)
❌ any type — TypeScript strict
❌ console.log — Winston Logger ishlatish
❌ Callback hell — async/await
❌ try/catch ichida try/catch — flat structure
❌ MongoDB query controller ichida — Service layer orqali
❌ Socket event nomlarini o'zgartirish — 3 platformani buzadi
❌ API response formatini o'zgartirish — shared/types orqali kelishish
```

---

## 📱 MOBILE UCHUN KERAKLI ENDPOINTLAR (Emirhan tomonidan so'ralgan)

> **Sana:** 2026-03-14
> **Sabab:** Mobile app exploration da aniqlandi — quyidagi endpointlar mobile da chaqirilmoqda lekin backend da mavjud emas yoki path/method farq qiladi.
> Bular bajarilmasa **HomeScreen ishlamaydi** (P0) va bir qator funksiyalar sinadi (P1).

---

### 🔴 P0 — HomeScreen ishlamaydi

#### T-S026 | Content Service — Trending + Top-Rated + Continue-Watching

**Fayl:** `services/content/src/`

Mobile quyidagilarni chaqiradi:

```
GET /api/v1/content/trending?limit=10
GET /api/v1/content/top-rated?limit=10
GET /api/v1/content/continue-watching
```

Backend da bu endpointlar **yo'q** — faqat `/content/movies` (paginated) bor.

**Bajarilishi kerak:**

- [ ] `GET /content/trending` — `viewCount` yoki `createdAt` bo'yicha top filmlar
  - Response: `{ success, data: IMovie[] }`
  - Query param: `limit` (default 10)
  - Redis cache: `trending:${limit}` — TTL 10 daqiqa
- [ ] `GET /content/top-rated` — `averageRating` bo'yicha saralangan filmlar
  - Response: `{ success, data: IMovie[] }`
  - Query param: `limit` (default 10)
  - Redis cache: `top-rated:${limit}` — TTL 10 daqiqa
- [ ] `GET /content/continue-watching` — foydalanuvchining tugallanmagan filmlari
  - Auth: `verifyToken` (majburiy)
  - Response: `{ success, data: Array<IMovie & { progress: number }> }`
  - WatchProgress collection dan `userId` bo'yicha `progress < 0.9` filtrlab olish

---

#### T-S027 | Content Service — Watch Progress path moslashtirish

Mobile quyidagilarni chaqiradi:

```
POST /api/v1/content/movies/:id/progress    body: { progress: number, duration: number }
GET  /api/v1/content/movies/:id/progress
```

Backend da mavjud:

```
POST /api/v1/content/watch-progress         body: { movieId, progress, duration }
GET  /api/v1/content/watch-progress?movieId=...
```

**Path va body format farq qiladi** — mobile ishlamaydi.

**Bajarilishi kerak (2 variant — birini tanlash):**

- [ ] **Variant A (tavsiya):** `services/content/src/routes/` ga alias route qo'shish:
  ```
  POST /content/movies/:id/progress  →  watchProgressController.saveProgress (movieId param dan oladi)
  GET  /content/movies/:id/progress  →  watchProgressController.getProgress (movieId param dan oladi)
  ```
- [ ] **Variant B:** Mobile `contentApi.ts` ni mavjud endpointga moslashtirish (Emirhan qiladi, lekin body format ham farq qiladi — ikkalasi ham o'zgaradi)

> **Tavsiya: Variant A** — mobile side ko'p joy o'zgaradi, backend bir route qo'shish oson.

---

### 🟡 P1 — Funksiyalar ishlamaydi

#### T-S028 | Watch Party Service — Room yopish endpoint

Mobile quyidagini chaqiradi:

```
DELETE /api/v1/watch-party/rooms/:id
```

Lekin backend da bu endpoint **yo'q** (faqat `leave` bor).

**Bajarilishi kerak:**

- [ ] `DELETE /watch-party/rooms/:id` — xonani yopish (faqat owner)
  - Auth: `verifyToken` + owner tekshirish
  - Socket emit: `ROOM_CLOSED` barcha a'zolarga
  - DB: room `status: 'closed'` ga o'tkazish
  - Response: `{ success: true }`

---

#### T-S029 | Battle Service — Battle rad etish endpoint

Mobile quyidagini chaqiradi:

```
POST /api/v1/battles/:id/reject
```

Lekin backend da **yo'q**.

**Bajarilishi kerak:**

- [ ] `POST /battles/:id/reject` — battle taklifini rad etish
  - Auth: `verifyToken`
  - Tekshirish: faqat invited user rad eta oladi, status `pending` bo'lishi kerak
  - DB: battle `status: 'rejected'` ga o'tkazish
  - Notification: challengerga "battle rad etildi" xabari

---

### ℹ️ Eslatma

```
Mobile API fayllarida shuningdek quyidagi method mismatch lar bor
(Emirhan o'zi tuzatadi — backend o'zgarishi shart emas):

  battleApi.acceptBattle()      → PUT /battles/:id/accept   (to'g'risi: POST)
  userApi.acceptFriendRequest() → PUT /users/friend-requests/:id/accept
                                  (to'g'risi: PATCH /users/friends/accept/:id)

Bu ikkalasini Emirhan o'z api/*.ts fayllarida tuzatadi.
```

---

*CLAUDE_BACKEND.md | CineSync | Saidazim | v1.0*
