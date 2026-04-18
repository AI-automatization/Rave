# CLAUDE.md — CineSync
# Ijtimoiy Onlayn Kinoteatr Ilovasi
# Claude CLI tomonidan avtomatik o'qiladi

---

## ЯЗЫК ОБЩЕНИЯ — ЗАКОН (ОБЯЗАТЕЛЬНО)

> **ЭТО АБСОЛЮТНОЕ ПРАВИЛО. ИСКЛЮЧЕНИЙ НЕТ.**

**Claude ВСЕГДА отвечает ТОЛЬКО на русском языке.**
- Пользователь пишет на узбекском → ответ на **русском**
- Пользователь пишет на английском → ответ на **русском**
- Пользователь пишет на турецком → ответ на **русском**
- Пользователь пишет на ЛЮБОМ языке → ответ на **русском**

**Код, комментарии в коде и технические термины** остаются на английском (это стандарт программирования).

**Всё остальное — объяснения, вопросы, отчёты, планы, ответы — СТРОГО на русском языке. Без исключений.**

---

## BIRINCHI QADAM (MAJBURIY)

**Har yangi terminal sessiyasida Claude quyidagini so'rashi SHART:**

```
Salom! Men CineSync loyihasidaman.

Kimligingizni aniqlay olmayman — ismingiz kim?
  1. Saidazim (Backend + Admin + Operator)
  2. Emirhan  (React Native Mobile + Web)

Ishlash rejimi:
  A. Single Task  — 1 agent, oddiy task
  B. Multi-Agent  — parallel agentlar, sprint mode
  C. Review Only  — QA + code review
```

Javob kelgach:
1. Tegishli faylni o'qib kontekstga kirish:
   - Saidazim → `CLAUDE_BACKEND.md`
   - Emirhan  → `CLAUDE_MOBILE.md`
2. `git pull origin main` — eng yangi holatni olish
3. `docs/Tasks.md` o'qib ochiq tasklarni ko'rish + `pending[X]` statuslarni tekshirish
4. Task boshlashdan oldin **GIT-BASED TASK LOCKING** protokolini bajarish (pastda)
5. **Mode B** tanlansa → Multi-Agent Protocol (pastda) faollashadi

> **Nima uchun?** 2 ta dasturchi 2 xil platforma. Noto'g'ri zona fayliga teginish = merge conflict + production crash.

---

## LOYIHA

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
| Admin UI | React + Vite + TailwindCSS | 5173 |
| Database | MongoDB (Atlas / Replica Set) | 27017 |
| Cache/Queue | Redis 7 (AOF persistence) | 6380 |
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
│   ├── web/           → (hozircha mas'ul yo'q)
│   └── admin-ui/      → Saidazim (React + Vite)
├── shared/
│   ├── types/         → UMUMIY — kelishib o'zgartirish
│   ├── utils/         → UMUMIY — kelishib o'zgartirish
│   ├── middleware/    → Saidazim (lekin hammaga import)
│   └── constants/     → UMUMIY — kelishib o'zgartirish
├── docker-compose.yml
├── docker-compose.dev.yml
├── docker-compose.prod.yml
└── nginx/
    └── nginx.conf
```

---

## CLEAN CODE PRINSIPLARI

### SOLID
- **S** — Single Responsibility: Har fayl BIR vazifa. Controller = HTTP, Service = logika, Screen = render.
- **O** — Open/Closed: Yangi funksionallik uchun mavjud kodni o'zgartirma, kengaytir (middleware, decorator).
- **L** — Liskov: Interface va'da qilganini bajar. `any` type TAQIQLANGAN.
- **I** — Interface Segregation: Kichik, aniq interfeys. Katta "god service" TAQIQLANGAN.
- **D** — Dependency Inversion: Service → abstract ga bog'lan, konkret implementatsiyaga emas.

### DRY + KISS
- Bir xil kod 2+ joyda → `shared/utils/` ga chiqar.
- Murakkab yechimdan oldin oddiy yechimni sinab ko'r.
- Premature optimization qilma — avval ishlat, keyin optimizatsiya qil.

### TAQIQLANGAN
```
❌ any type (TypeScript strict mode)
❌ console.log (Backend: Winston Logger, Mobile: __DEV__, Web: development only)
❌ 400+ qatorli fayl — bo'lish kerak
❌ Inline styles (Web: Tailwind, Mobile: StyleSheet)
❌ Magic numbers (const bilan nomlash)
❌ Nested try/catch (flat error handling)
❌ Hardcoded secrets (.env ishlatish)
❌ O'zga dasturchining zonasiga teginish
❌ shared/* ni kelishmasdan o'zgartirish
❌ main branch ga to'g'ridan-to'g'ri push
```

---

## TASK TRACKING (MAJBURIY)

**Loyiha vazifalari 2 ta faylda boshqariladi:**

| Fayl | Vazifasi |
|------|----------|
| `docs/Tasks.md` | Barcha ochiq vazifalar — bug, error, feature, devops |
| `docs/Done.md` | Bajarilgan ishlar arxivi — fix, feature, test natijalari |

**Yangi bug/error/task topilganda `docs/Tasks.md` ga qo'shiladi:**

Format: `T-XXX | Pn | [KATEGORIYA] | Sarlavha | pending[Ism]`
- Kategoriyalar: BACKEND, MOBILE, WEB, ADMIN, DEVOPS, IKKALASI
- Prioritetlar: P0 (kritik), P1 (muhim), P2 (o'rta), P3 (past)

**Tasks.md da status format:**
```markdown
### T-S016 | P1 | BACKEND  | Auth refresh token bug        | pending[Saidazim]
### T-E012 | P2 | MOBILE   | Push notification iOS fix     | pending[Emirhan]
### T-J008 | P1 | WEB      | OG image dynamic endpoint     |              ← ochiq, hech kim olmagan
### T-C006 | P2 | IKKALASI | Socket event types shared      | pending[Saidazim]
```

**Fix bo'lgandan keyin:**
1. `docs/Tasks.md` dan o'chiriladi
2. `docs/Done.md` ga ko'chiriladi (sana + qisqa yechim)

**Qoidalar:**
- Bug/task topilgan paytda DARHOL yoziladi
- Har sessiyada avval `docs/Tasks.md` o'qib, T-raqamni davom ettirish
- Takroriy task yaratmaslik, mavjudini yangilash

---

## TELEGRAM NOTIFICATIONS — ЗАКОН (ОБЯЗАТЕЛЬНО)

> **ЭТО АБСОЛЮТНОЕ ПРАВИЛО. КАЖДЫЙ РАЗ. БЕЗ ИСКЛЮЧЕНИЙ.**

**При ЛЮБОМ изменении задач Claude ОБЯЗАН отправить Telegram уведомление.**

### Скрипт

```bash
.claude/scripts/tg-notify.sh <action> <task_id> <task_meta> <title> [executor] [details]
```

| Параметр | Описание | Пример |
|----------|----------|--------|
| `action` | Событие | `new` / `claim` / `done` / `update` / `blocked` |
| `task_id` | ID задачи | `T-S057` |
| `task_meta` | Приоритет + категория | `"P2 \| BACKEND"` |
| `title` | Название задачи | `"Sarlavha matni"` |
| `executor` | Исполнитель (опц.) | `Saidazim` |
| `details` | Подробности (опц.) | `"tsc: CLEAN, 3 fayl"` |

### Кому отправляется (автоматически по префиксу)

```
T-S***  →  только Saidazim  (chat: 6299152655)
T-E***  →  только Emirhan   (chat: 569913655)
T-C***  →  оба              (оба chat ID)
```

### Примеры использования

```bash
# Новая задача:
.claude/scripts/tg-notify.sh new T-S057 "P2 | BACKEND" "Battle leaderboard endpoint"

# Взять задачу:
.claude/scripts/tg-notify.sh claim T-S057 "P2 | BACKEND" "Battle leaderboard endpoint" Saidazim

# Выполнить задачу (с деталями):
.claude/scripts/tg-notify.sh done T-S057 "P2 | BACKEND" "Battle leaderboard endpoint" Saidazim \
  "3 fayl o'zgartirildi: controller, service, routes | tsc: CLEAN"

# Обновление совместной задачи:
.claude/scripts/tg-notify.sh update T-C012 "P0 | IKKALASI" "MVP E2E test" "Saidazim+Emirhan" \
  "YouTube OK, Rutube FAIL — issue topildi"

# Заблокировано:
.claude/scripts/tg-notify.sh blocked T-S058 "P1 | BACKEND" "Mesh handler" Saidazim \
  "T-E096 tugashini kutmoqda"
```

### Порядок действий при claim (обновлённый)

```
1. git pull origin main
2. docs/Tasks.md ni o'qi
3. pending[SeniningIsming] yoz
4. git add docs/Tasks.md
5. git commit -m "task: claim T-XXX [Ism]"
6. git push origin main
7. .claude/scripts/tg-notify.sh claim T-XXX "Pn | KAT" "Sarlavha" Ism   ← MAJBURIY
8. ENDI ishni boshlash mumkin
```

### Порядок действий при выполнении (обновлённый)

```
1. Tasks.md dan o'chirish
2. Done.md ga ko'chirish
3. git add + git commit + git push
4. .claude/scripts/tg-notify.sh done T-XXX "Pn | KAT" "Sarlavha" Ism "Bajarilgan ishlar"  ← MAJBURIY
```

---

## GIT-BASED TASK LOCKING (MAJBURIY)

**Taskni boshlashdan OLDIN quyidagi qadamlar bajariladi:**

```
1. git pull origin main                             ← eng yangi holatni ol
2. docs/Tasks.md ni o'qi                            ← pending[boshqa_dasturchi] bormi tekshir
3. Agar task pending[boshqa_dasturchi] bo'lsa       ← TEGIZMA, boshqa task ol
4. Task ochiq bo'lsa → pending[SeniningIsming] yoz  ← masalan: pending[Saidazim]
5. git add docs/Tasks.md
6. git commit -m "task: claim T-XXX [Saidazim]"
7. git push origin main                             ← boshqalar ko'rishi uchun
8. ENDI ishni boshlash mumkin
```

**Task tugaganda:**
```
1. Tasks.md dan taskni o'chirish
2. Done.md ga ko'chirish
3. git add docs/Tasks.md docs/Done.md
4. git commit -m "fix(auth): T-XXX yechildi [Saidazim]"
5. git push origin main
```

**Xavflardan himoya:**
- `git push` reject bo'lsa → `git pull --rebase` qilib qayta push
- 1 soatdan ortiq `pending[X]` o'zgarishsiz tursa → task "stuck" deb hisoblanadi, boshqasi olishi mumkin
- Multi-agent mode da: barcha batch tasklarni BIR commit da claim qilish (conflict kamaytirish)

---

## SHARED FILE PROTOCOL

`shared/types/`, `shared/utils/`, `shared/constants/` o'zgartirish kerak bo'lsa:

**Single mode:**
```
1. Telegram guruhda boshqa dasturchilarga xabar ber
2. Tasdiq olingach o'zgartir
3. Commit: "shared: [nima qo'shildi] ([ism])"
4. Boshqa dasturchilari DARHOL pull qiladi
```

**Multi-Agent mode:**
```
1. Orchestrator lock faylni tekshiradi
2. Lock bo'sh → .claude/locks/shared-{zone}.lock yaratadi
3. Agent o'zgarishni bajaradi
4. Tugagach lock faylni o'chiradi
5. Ikkinchi agent endi ishlashi mumkin
```

---

## GIT QOIDALARI

```bash
# Har kuni boshida:
git pull origin main

# Branch format:
saidazim/feat-[feature-name]
emirhan/feat-[feature-name]

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

## LOGGING STANDARTLARI

### Backend — Winston Logger
```typescript
// console.log EMAS — Winston Logger:
import { logger } from '@shared/utils/logger';

logger.info('User registered', { userId, email });
logger.warn('Rate limit approaching', { ip, remaining: 5 });
logger.error('MongoDB connection failed', { error: err.message, stack: err.stack });

// Transports: Console + File + MongoDB (api_logs collection)
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

## SECURITY CHECKLIST

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

## LOCAL DEVELOPMENT

```bash
# 1. Infra — BARCHA DASTURCHILAR UCHUN (MongoDB + Redis + Elasticsearch):
docker compose -f docker-compose.dev.yml up -d

# Faqat infra (backend servislarsiz):
docker compose -f docker-compose.dev.yml up -d mongo redis elasticsearch

# 2. Backend services (alohida terminallarda):
cd services/auth && npm run dev         # :3001
cd services/user && npm run dev         # :3002
cd services/content && npm run dev      # :3003
cd services/watch-party && npm run dev  # :3004
cd services/battle && npm run dev       # :3005
cd services/notification && npm run dev # :3007
cd services/admin && npm run dev        # :3008

# 3. Frontend:
cd apps/web && npm run dev              # :3000
cd apps/mobile && npx expo start
cd apps/admin-ui && npm run dev         # :5173

# 4. Type check:
npm run typecheck  # barcha workspaces
```

---

## DOCKER (BARCHA DASTURCHILAR UCHUN)

### Asosiy buyruqlar

```bash
# Barcha konteynerlarni ishga tushirish:
docker compose -f docker-compose.dev.yml up -d

# Faqat infra (Emirhan uchun — backend lokal ishlatmasdan):
docker compose -f docker-compose.dev.yml up -d mongo redis elasticsearch

# Holat tekshirish:
docker compose -f docker-compose.dev.yml ps

# To'xtatish (ma'lumotlar saqlanadi):
docker compose -f docker-compose.dev.yml stop

# To'liq o'chirish (ma'lumotlar o'chadi!):
docker compose -f docker-compose.dev.yml down -v
```

### Loglarni ko'rish

```bash
# Barcha servislar:
docker compose -f docker-compose.dev.yml logs -f

# Alohida servis:
docker compose -f docker-compose.dev.yml logs -f auth
docker compose -f docker-compose.dev.yml logs -f mongo
docker compose -f docker-compose.dev.yml logs -f redis
```

### DB Shell (Saidazim)

```bash
# MongoDB:
docker exec -it cinesync_mongo mongosh -u $MONGO_ROOT_USER -p $MONGO_ROOT_PASSWORD

# Redis:
docker exec -it cinesync_redis redis-cli -a $REDIS_PASSWORD
```

### Konteyner restart

```bash
# Bitta servis qayta ishga tushirish:
docker compose -f docker-compose.dev.yml restart auth

# Build qilib qayta ishga tushirish:
docker compose -f docker-compose.dev.yml up -d --build auth
```

### Emirhan uchun minimal ishga tushirish

```bash
# 1. Infrani ko'tar:
docker compose -f docker-compose.dev.yml up -d

# 2. O'z appingni ishga tushir:
#    Emirhan: cd apps/mobile && npx expo start

# Backend lokal ishlatish shart emas — Docker konteynerlar ishlaydi.
```

---

## SCREENSHOT VA TEMP FAYLLAR

**Root papkani musorga to'ldirmaslik uchun:**

| Fayl/Papka | Maqsad | .gitignore |
|------------|--------|------------|
| `screenshots/` | Debug, MCP screenshotlar | ✅ ignore |
| `test-results/` | Playwright test natijalari | ✅ ignore |
| `*.png` (root) | Tasodifiy screenshot | ✅ ignore |
| `tmp_*.json` | Vaqtinchalik debug JSON | ✅ ignore |

**Qoidalar:**
- Screenshot olsang — `screenshots/` papkaga saqla, root'ga EMAS
- Root'da `.png` yoki `tmp_*.json` paydo bo'lsa — tegishli papkaga ko'chirish

---

## DEFINITIONS

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

## DESIGN SYSTEM

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

## MULTI-AGENT PROTOCOL

> To'liq arxitektura: `docs/MULTI_AGENT_ARCHITECTURE.md`

### Agent turlari

| Agent | Tool | Zona | Vazifasi |
|-------|------|------|----------|
| **Orchestrator** | Main CLI session | docs/, git | Task parsing, dispatch, merge, archive |
| **Backend Agent** | `Agent(subagent_type: "general-purpose", isolation: "worktree")` | services/*, apps/admin-ui/ | Express, MongoDB, Socket.io, Bull |
| **Mobile Agent** | `Agent(subagent_type: "general-purpose", isolation: "worktree")` | apps/mobile/ | React Native, Firebase, navigation |
| **Web Agent** | `Agent(subagent_type: "general-purpose", isolation: "worktree")` | apps/web/ | Next.js, TailwindCSS, SEO |
| **QA Agent** | `Agent(subagent_type: "general-purpose")` | read-only, barcha fayllar | tsc, build, lint, test |
| **Explorer** | `Agent(subagent_type: "Explore")` | read-only | Code research, bug analysis |
| **Planner** | `Agent(subagent_type: "Plan")` | read-only | Architecture, decomposition |

### Ishlash tartibi (Mode B)

```
1. PLAN     — Orchestrator: Tasks.md o'qish → dependency graph → parallel batch
2. DISPATCH — Parallel agentlar ishga tushirish (worktree isolation)
   ├─ Backend Agent  → backend tasks (worktree A)
   ├─ Mobile Agent   → mobile tasks  (worktree B)
   ├─ Web Agent      → web tasks     (worktree C)
   └─ Explorer Agent → research (read-only, agar kerak)
3. VALIDATE — QA Agent: tsc + build (MAJBURIY, har merge dan oldin)
4. MERGE    — Orchestrator: worktree → main, conflict resolve
5. ARCHIVE  — Tasks.md → Done.md ko'chirish
```

### Zone qoidalari — QATTIQ

```
ZONE MATRIX:
                  Backend    Mobile     Web        Shared    Docs
  Backend Agent:    ✅ o'zi    ❌ tegma   ❌ tegma   🔒 lock   ❌ tegma
  Mobile Agent:     ❌ tegma   ✅ o'zi    ❌ tegma   🔒 lock   ❌ tegma
  Web Agent:        ❌ tegma   ❌ tegma   ✅ o'zi    🔒 lock   ❌ tegma
  QA Agent:         👁 read    👁 read    👁 read    👁 read   ❌ tegma
  Orchestrator:     👁 read    👁 read    👁 read    ✅ merge  ✅ yozadi

ZONE MAP:
  backend = services/*, apps/admin-ui/
  mobile  = apps/mobile/
  web     = apps/web/
  shared  = shared/types/, shared/utils/, shared/constants/
  docs    = docs/, CLAUDE*.md
```

### Lock protocol (shared/* uchun)

```
Lock fayl: .claude/locks/{zone}.lock
Format:    {"agent":"...", "task":"T-XXX", "locked_at":"ISO", "ttl_minutes":30}

Qoidalar:
  1. O'zgartirish OLDIN lock tekshir
  2. Lock mavjud → KUTISH yoki boshqa task
  3. Lock TTL 30 daqiqa — expired lock = bo'sh
  4. O'zgartirish tugagach → lock o'chirish
  5. Orchestrator expired lock larni tozalashi mumkin
```

### Agent prompt template

Har sub-agent ga beriladigan prompt formati:

```
You are {ROLE} AGENT for CineSync.

ZONE:       {allowed directories}
FORBIDDEN:  {restricted directories — DO NOT touch}
RULES:      {top 5 rules from CLAUDE_BACKEND/MOBILE/WEB.md}

TASK:
  ID:    T-{XXX}
  Title: {task title}
  Files: {expected files to modify}
  Deps:  {prerequisite tasks — already done}

DELIVERABLES:
  1. Code changes within your ZONE only
  2. Self-check: tsc --noEmit for your app
  3. Summary: files changed + what + why

CONSTRAINTS:
  - DO NOT touch files outside your zone
  - DO NOT modify docs/Tasks.md or docs/Done.md
  - DO NOT commit — Orchestrator handles git
  - NO `any` type — TypeScript strict
  - NO console.log — use Winston/logger
  - If blocked → return error, do not guess
```

### Task classification

```
Task fayllariga qarab agent tanlanadi:

  services/**              → Backend Agent
  apps/admin-ui/**         → Backend Agent
  apps/mobile/**           → Mobile Agent
  apps/web/**              → Web Agent
  shared/**                → Lock → birinchi kelgan agent
  IKKALASI tasks           → Sequential: Backend → Mobile/Web

Task hajmi → mode:
  < 30 min, 1-2 fayl    → Single Agent (worktree'siz)
  30-60 min, 3-5 fayl   → Single Agent + worktree
  > 60 min, 5+ fayl     → Multi-Agent + worktrees
  Cross-zone (IKKALASI)  → Sequential: Backend birinchi, keyin Mobile/Web
```

### QA Agent — MAJBURIY validatsiya

```
Har merge dan OLDIN QA Agent quyidagilarni tekshiradi:

  1. npm run typecheck (barcha workspaces)
  2. services/*/: tsc --noEmit (har bir service)
  3. apps/web/: tsc --noEmit
  4. apps/mobile/: tsc --noEmit
  5. apps/admin-ui/: tsc --noEmit
  6. cd apps/mobile && npx jest --passWithNoTests
  7. Maestro E2E: cd apps/mobile && maestro test .maestro/
  8. Playwright: cd apps/web && npx playwright test (agar web o'zgargan bo'lsa)

### Critic Agent — MAJBURIY code review

Har merge dan OLDIN Critic Agent 3 ta perspective dan tekshiradi:
  1. CORRECTNESS — Kod muammoni hal qiladimi? API/Socket mos keladi?
  2. ARCHITECTURE — SOLID, zone, 300-line limit?
  3. INTEGRATION — Backend↔Mobile↔Web buzilmaydi?

Agar o'rtacha ball < 7/10 → merge TAQIQLANGAN.
Skill: `.claude/skills/critic-agent.md`

QA FAIL bo'lsa → merge TAQIQLANGAN → agent xatoni tuzatishi kerak.
```

### Parallel ishlash misoli

```
  Saidazim (Terminal 1)                  Emirhan (Terminal 2)
  ══════════════════════                 ══════════════════
  Mode B → Backend Orch.                 Mode B → Mobile Orch.
    │                                      │
    ├─ Agent: T-S052 (Mesh handler)        ├─ Agent: T-E092 (FAB tugma)
    ├─ Agent: T-S053 (Scope cleanup)       ├─ Agent: T-E096 (MeshClient)
    ├─ QA: tsc services                    ├─ QA: tsc mobile
    ├─ git commit + push                   ├─ git commit + push
    └─ Done.md update                      └─ Done.md update

  PARALLEL OK: backend zone ≠ mobile zone → conflict YO'Q
  SHARED ZONE: shared/* → LOCK protocol faollashadi
```

---

## XAVFLI ZONALAR (UCHALA DASTURCHI UCHUN)

```
❌ MongoDB collection drop           — BARCHA data yo'qoladi!
❌ main branch ga to'g'ridan push    — PR orqali
❌ .env faylni commit qilish          — .gitignore da bo'lishi kerak
❌ O'zga dasturchining zonasiga teginish (services ↔ mobile ↔ web)
❌ shared/* kelishmasdan o'zgartirish (yoki lock protocol)
❌ Production DB ga qo'lda query
❌ Socket.io event nomini o'zgartirish — 3 platformani buzadi!
❌ API response formatini o'zgartirish — shared/types orqali kelishish
❌ Multi-Agent: agent zone dan tashqari fayl o'zgartirish TAQIQLANGAN
❌ Multi-Agent: QA Agent tekshirmasdan merge qilish TAQIQLANGAN
```

---

## AGENT SKILLS (.claude/skills/)

Barcha agentlar quyidagi skilllarni avtomatik ishlatadi:

| Skill | Fayl | Vazifa |
|-------|------|--------|
| Self-Reflection | `.claude/skills/self-reflection.md` | 7-step anti-hallucination check |
| Critic Agent | `.claude/skills/critic-agent.md` | 3-judge code review before merge |
| Execute-Judge Loop | `.claude/skills/execute-judge-loop.md` | Write→Compile→Check→Fix cycle |
| Subagent Dispatch | `.claude/skills/subagent-dispatch.md` | Agent coordination + zone enforcement |
| Auto Tests | `.claude/skills/auto-tests.md` | Parallel test writing and fixing |
| Visual Testing | `.claude/skills/visual-testing.md` | Screenshot UI verification |
| Root Cause Tracing | `.claude/skills/root-cause-tracing.md` | 5-step backward debugging |
| Spec-Driven Implement | `.claude/skills/spec-driven-implement.md` | Spec→Code→Verify pipeline |

**Har agent ishni tugatganda Self-Reflection (7 step) bajarishi MAJBURIY.**
**Har merge dan oldin Critic Agent (3 judge) tekshirishi MAJBURIY.**

---

## KEYIN O'QILADIGAN FAYLLAR

| Fayl | Kim uchun |
|------|-----------|
| `CLAUDE_BACKEND.md` | Saidazim — services, DB, Socket.io, Admin |
| `CLAUDE_MOBILE.md` | Emirhan — React Native, Firebase, navigation |
| `CLAUDE_WEB.md` | (hozircha mas'ul yo'q) — Next.js, SEO, landing, web app |
| `docs/Tasks.md` | Hammaga — ochiq vazifalar |
| `docs/Done.md` | Hammaga — bajarilgan ishlar |

---

*CLAUDE.md | CineSync — Ijtimoiy Onlayn Kinoteatr | v2.0 | 2026-03-02*
