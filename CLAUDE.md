# CLAUDE.md — CineSync
# Ijtimoiy Onlayn Kinoteatr Ilovasi
# Claude CLI tomonidan avtomatik o'qiladi

---

## 🤖 BIRINCHI QADAM (MAJBURIY)

**Har yangi terminal sessiyasida Claude quyidagini so'rashi SHART:**

```
Salom! Men CineSync loyihasidaman.
Kimligingizni aniqlay olmayman — ismingiz kim?
  1. Saidazim (Backend + Admin + Operator)
  2. Emirhan (React Native Mobile)
  3. Jafar (Next.js Web Client)
```

Javob kelgach → tegishli faylni o'qib kontekstga kirish:
- Saidazim → `CLAUDE_BACKEND.md`
- Emirhan  → `CLAUDE_MOBILE.md`
- Jafar    → `CLAUDE_WEB.md`

> **Nima uchun?** 3 ta dasturchi 3 xil platforma. Noto'g'ri zona fayliga teginish = merge conflict + production crash.

---

## 📁 LOYIHA

**CineSync** — ijtimoiy onlayn kinoteatr ilovasi. Do'stlar bilan birga film ko'rish, battle, achievement va gamifikatsiya.

| Layer | Tech | Port |
|-------|------|------|
| Auth Service | Node.js + Express + MongoDB | 3001 |
| User Service | Node.js + Express + MongoDB | 3002 |
| Content Service | Node.js + Express + Elasticsearch | 3003 |
| Watch Party Service | Express + Socket.io + Redis | 3004 |
| Battle Service | Express + MongoDB + Redis | 3005 |
| Notification Service | Express + Firebase FCM + Bull | 3007 |
| Admin Service | Express + MongoDB | 3008 |
| Mobile App | React Native + TypeScript | — |
| Web Client | Next.js 14 + TailwindCSS | 3000 |
| Database | MongoDB (Atlas / Replica Set) | 27017 |
| Cache/Queue | Redis 7 (AOF persistence) | 6379 |
| Search | Elasticsearch | 9200 |
| Reverse Proxy | Nginx | 80/443 |

**Arxitektura:** Microservices Monorepo

```
cinesync/
├── services/
│   ├── auth/          → Saidazim (port 3001)
│   ├── user/          → Saidazim (port 3002)
│   ├── content/       → Saidazim (port 3003)
│   ├── watch-party/   → Saidazim (port 3004)
│   ├── battle/        → Saidazim (port 3005)
│   ├── notification/  → Saidazim (port 3007)
│   └── admin/         → Saidazim (port 3008)
├── apps/
│   ├── mobile/        → Emirhan (React Native)
│   ├── web/           → Jafar (Next.js)
│   └── admin-ui/      → Saidazim (React + Vite)
├── shared/
│   ├── types/         → UMUMIY — kelishib o'zgartirish
│   ├── utils/         → UMUMIY — kelishib o'zgartirish
│   ├── middleware/     → Saidazim (lekin hammaga import)
│   └── constants/     → UMUMIY
├── docker-compose.yml
├── docker-compose.dev.yml
├── docker-compose.prod.yml
└── nginx/
    └── nginx.conf
```

---

## ✅ CLEAN CODE PRINSIPLARI

### SOLID

| Tamoyil | Qoida |
|---------|-------|
| **S** — Single Responsibility | Har fayl BIR vazifa. Controller = HTTP. Service = logika. Screen = render. |
| **O** — Open/Closed | Mavjud service ni o'zgartirma → kengaytir (middleware, decorator) |
| **L** — Liskov | Interface va'da qilganini bajarish |
| **I** — Interface Segregation | Kichik, aniq interfeys. Katta "god service" TAQIQLANGAN |
| **D** — Dependency Inversion | Service → abstract ga bog'lanish |

### DRY + KISS
- Bir xil kod 2+ joyda → `shared/utils/` ga chiqar
- Murakkab yechimdan oldin oddiy yechimni sinab ko'r

### 🚫 TAQIQLANGAN NARSALAR
```
❌ any type — TypeScript strict mode
❌ console.log — Backend: Winston Logger, Mobile/Web: faqat __DEV__
❌ 400+ qatorli fayl — bo'lish kerak
❌ Inline styles (Web: Tailwind, Mobile: StyleSheet)
❌ Magic numbers — const bilan nomlash
❌ Nested try/catch — flat error handling
❌ Hardcoded secrets — .env ishlatish
❌ O'zga dasturchining zonasiga teginish
❌ shared/* ni kelishmasdan o'zgartirish
❌ main branch ga to'g'ridan-to'g'ri push
```

---

## 📋 TASK TRACKING TIZIMI (MAJBURIY)

### Fayllar

| Fayl | Vazifasi |
|------|----------|
| `docs/Tasks.md` | Barcha OCHIQ vazifalar — bug, error, feature |
| `docs/Done.md` | Bajarilgan ishlar arxivi |

### Task Formati
```markdown
## T-001 | P0 | [BACKEND] | Sarlavha
- **Sana:** 2026-XX-XX
- **Mas'ul:** Saidazim / Emirhan / Jafar
- **Fayl:** services/auth/src/controllers/auth.controller.ts
- **Muammo:** [nima bo'lyapti]
- **Kutilgan:** [nima bo'lishi kerak]
```

### Prioritet

| Daraja | Ma'nosi | Javob vaqti |
|--------|---------|-------------|
| **P0** | KRITIK — production buzilgan | Darhol |
| **P1** | MUHIM — funksional xatolik | 1 kun |
| **P2** | O'RTA — yaxshilash kerak | 3 kun |
| **P3** | PAST — sprint rejasi | Keyingi sprint |

### Kategoriyalar
```
[BACKEND]   — Services, DB, Redis, Socket.io, Nginx
[MOBILE]    — React Native, iOS, Android
[WEB]       — Next.js, Landing, SEO
[ADMIN]     — Admin Dashboard UI + Backend
[DEVOPS]    — Docker, CI/CD, Monitoring
[IKKALASI]  — Shared types, API contract, design tokens
```

### Qoidalar
```
1. Bug topilgan paytda DARHOL → docs/Tasks.md
2. Har sessiya boshida Tasks.md o'qib T-raqamni DAVOM ettirish
3. Fix bo'lgach: Tasks.md dan O'CHIRISH → Done.md ga KO'CHIRISH
```

---

## 🔀 SHARED FILE PROTOCOL

`shared/types/`, `shared/utils/`, `shared/constants/` o'zgartirish kerak bo'lsa:

```
1. Telegram guruhda boshqa dasturchilarga xabar
2. Tasdiq olingach o'zgartir
3. Commit: "shared: [nima qo'shildi] ([ism])"
4. Boshqa dasturchilari DARHOL pull qiladi
```

---

## 🔧 GIT QOIDALARI

```bash
# Har kuni boshida:
git pull origin develop

# Branch format:
saidazim/feat-[feature-name]
emirhan/feat-[feature-name]
jafar/feat-[feature-name]

# Commit format (Conventional Commits):
feat(auth): add Google OAuth callback
fix(watch-party): correct sync timestamp drift
refactor(content): split search into elasticsearch adapter
chore(docker): add elasticsearch container
test(battle): add unit test for score calculation

# Branch Strategy:
main     → production (protected, manual deploy)
develop  → integration branch (PR orqali)
feature/ → individual work
fix/     → bug fixes
```

---

## 📝 LOGGING STANDARTLARI

### Backend — Winston Logger
```typescript
// console.log EMAS — Winston Logger:
import { logger } from '@shared/utils/logger';

logger.info('User registered', { userId, email });
logger.warn('Rate limit approaching', { ip, remaining: 5 });
logger.error('MongoDB connection failed', { error: err.message, stack: err.stack });

// Transports: Console + File + MongoDB (APILog collection)
// Rotation: kunlik, max 30 kun
// Sensitive: password, token, secret → [REDACTED]
```

### Mobile — `__DEV__` only
```typescript
if (__DEV__) console.log('[debug]', data);
// Production: Sentry crash reporting
```

### Web — development only
```typescript
if (process.env.NODE_ENV === 'development') console.log('[debug]', data);
// Production: Sentry + Vercel Analytics
```

---

## 🔐 SECURITY CHECKLIST

```
✓ JWT: Access token (15min, RS256) + Refresh token (30kun, MongoDB)
✓ Password: bcrypt (12 rounds)
✓ Input: Joi/Zod validation (barcha endpointlar)
✓ NoSQL injection: mongoose-sanitize
✓ XSS: helmet + DOMPurify
✓ CORS: whitelist (mobile + web + admin)
✓ Rate limit: per IP + per user (express-rate-limit + Redis)
✓ Helmet: security headers
✓ Brute force: 5 xato → 15 min blok (Redis)
✓ Secrets: .env faylda, Docker secrets (prod)
✓ File upload: mimetype + size validation (Multer)
✓ Socket.io: JWT verify middleware
```

---

## 🖥️ LOCAL DEVELOPMENT

```bash
# 1. Infra (MongoDB + Redis + Elasticsearch):
docker-compose -f docker-compose.dev.yml up -d

# 2. Backend services (alohida terminallarda):
cd services/auth && npm run dev        # :3001
cd services/user && npm run dev        # :3002
cd services/content && npm run dev     # :3003
cd services/watch-party && npm run dev # :3004
cd services/battle && npm run dev      # :3005
cd services/notification && npm run dev # :3007
cd services/admin && npm run dev       # :3008

# 3. Frontend:
cd apps/web && npm run dev             # :3000
cd apps/mobile && npx react-native start
cd apps/admin-ui && npm run dev        # :5173

# 4. Type check:
npm run typecheck  # barcha workspaces
```

---

## 🔑 DEFINITIONS

| Atama | Ma'nosi |
|-------|---------|
| `WatchParty` | Do'stlar bilan sinxron film ko'rish (Socket.io room) |
| `Battle` | 1v1 yoki guruh: kim ko'proq film ko'radi (3/5/7 kun) |
| `Achievement` | Gamifikatsiya badge (oddiy, franchise, maxfiy) |
| `Heartbeat` | Online status yangilash (har 2 min, Redis TTL: 3 min) |
| `Sync Event` | Watch Party da video holat sinxronizatsiyasi |
| `Owner` | Watch Party xona egasi (play/pause/seek huquqi) |
| `Member` | Watch Party a'zosi (faqat ko'rish, chat, emoji) |
| `FCM` | Firebase Cloud Messaging (push notification) |
| `HLS` | HTTP Live Streaming (m3u8 video format) |

---

## 🎨 DESIGN SYSTEM

```
Primary:      #E50914 (Netflix red)
Background:   #0A0A0F (dark base)
Surface:      #111118 (elevated)
Overlay:      #16161F
Gold:         #FFD700 (achievement)
Diamond:      #88CCFF (top rank)

Fonts:
  Display: Bebas Neue (headings)
  Body:    DM Sans (text)
  Mono:    JetBrains Mono (code)

Dark mode ONLY — barcha platform.
```

---

## ⚠️ XAVFLI ZONALAR

```
❌ MongoDB collection drop       — BARCHA data yo'qoladi!
❌ main/develop ga to'g'ridan push
❌ .env commit qilish
❌ Boshqa zona fayllarini o'zgartirish
❌ shared/* kelishmasdan o'zgartirish
❌ Production DB ga qo'lda query
❌ Socket.io event nomini o'zgartirish (3 platformani buzadi!)
❌ API response formatini o'zgartirish (shared/types orqali kelishish)
```

---

## 📚 KEYIN O'QILADIGAN FAYLLAR

| Fayl | Kim uchun |
|------|-----------|
| `CLAUDE_BACKEND.md` | Saidazim — services, DB, Socket.io, Admin |
| `CLAUDE_MOBILE.md` | Emirhan — React Native, Firebase, navigation |
| `CLAUDE_WEB.md` | Jafar — Next.js, SEO, landing, web app |
| `docs/Tasks.md` | Hammaga — ochiq vazifalar |
| `docs/Done.md` | Hammaga — bajarilgan ishlar |

---

*CLAUDE.md | CineSync — Ijtimoiy Onlayn Kinoteatr | v1.0*
