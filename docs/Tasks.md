# CineSync — OCHIQ VAZIFALAR
# Yangilangan: 2026-02-26
# 3 dasturchi: Saidazim (Backend) | Emirhan (Mobile) | Jafar (Web)

---

## 📌 QOIDALAR

```
1. Har topilgan bug/task → shu faylga DARHOL yoziladi
2. Sessiya boshida shu faylni O'QIB, oxirgi T-raqamdan davom
3. Fix bo'lgach → shu yerdan O'CHIRISH → docs/Done.md ga KO'CHIRISH
4. Prioritet: P0=kritik, P1=muhim, P2=o'rta, P3=past
5. Sprint: S1=hozir, S2=keyingi hafta, S3=keyingi sprint, S4-5=keyin
6. Oxirgi T-raqam: S→015, E→011, J→007, C→005
```

---

# ═══════════════════════════════════════
# 🔴 SAIDAZIM — BACKEND + ADMIN
# ═══════════════════════════════════════

## SPRINT 1 — Auth + User (boilerplate ready, real impl kerak)

### T-S001 | P0 | [BACKEND] | Auth Service — real ishlashini tekshirish
- **Sana:** 2026-02-26
- **Mas'ul:** Saidazim
- **Fayl:** `services/auth/`
- **Holat:** Boilerplate ✅ | npm install + test ❌
- **Qolgan ishlar:**
  - [ ] `npm install` + TypeScript build tekshirish (`npm run typecheck`)
  - [ ] `.env` faylni to'ldirish (JWT RS256 key pair generatsiya: `openssl genrsa -out private.pem 2048`)
  - [ ] Email verification — nodemailer orqali haqiqiy xat yuborish testi
  - [ ] Google OAuth callback URL ni production uchun sozlash
  - [ ] `POST /auth/register` → `POST /auth/login` → token refresh flow testi
- **Kerak:** RS256 key pair, SMTP credentials

---

### T-S002 | P0 | [BACKEND] | User Service — avatar upload + settings
- **Sana:** 2026-02-26
- **Mas'ul:** Saidazim
- **Fayl:** `services/user/src/`
- **Holat:** Boilerplate ✅ | Avatar upload ❌ | Settings endpoint ❌
- **Qolgan ishlar:**
  - [ ] `PATCH /users/me/avatar` — multer middleware + file validation (mimetype, max 5MB)
  - [ ] `GET/PATCH /users/me/settings` — notification preferences endpoint
  - [ ] `User.create()` — auth service register bo'lganda user service da ham profil yaratish (event-driven yoki direct call)
  - [ ] Auth ↔ User service sync mexanizmi (JWT userId orqali yoki event bus)

---

### T-S003 | P0 | [BACKEND] | MongoDB Schemas to'liq — 4 schema + seed
- **Sana:** 2026-02-26
- **Mas'ul:** Saidazim
- **Fayl:** `services/*/src/models/`
- **Holat:** 11/15 schema yaratildi ✅ | 4 ta schema + seed ❌
- **Yaratilgan:** User(auth), RefreshToken, User(user), Friendship, Movie, WatchHistory, Rating, WatchPartyRoom, Battle, BattleParticipant, Notification
- **Qolgan ishlar:**
  - [ ] `Achievement` model — key, title, description, rarity, points, condition
  - [ ] `UserAchievement` model — userId, achievementId, unlockedAt
  - [ ] `Feedback` model — userId, type (bug/feature/other), content, status, adminReply
  - [ ] `APILog` model — Winston MongoDB transport uchun (method, url, status, duration, userId)
  - [ ] `scripts/seed.ts` — demo movies (10+), admin user, test users

---

## SPRINT 2 — Content + Watch Party

### T-S004 | P1 | [BACKEND] | Watch Party — audio control + mute member
- **Sana:** 2026-02-26
- **Mas'ul:** Saidazim
- **Fayl:** `services/watch-party/src/socket/watchParty.socket.ts`
- **Holat:** Boilerplate ✅ | Audio control ❌
- **Qolgan ishlar:**
  - [ ] `CLIENT_EVENTS.MUTE_MEMBER` handler — owner boshqa a'zoning audio ni o'chirishi
  - [ ] `SERVER_EVENTS.MEMBER_MUTED` broadcast — muted userId + reason
  - [ ] Buffer event test: member buffer→ boshqalar pause qiladimi?
  - [ ] Socket.io room state Redis ga to'g'ri saqlanayaptimi tekshirish

---

### T-S005 | P1 | [BACKEND] | Content Service — Elasticsearch index setup
- **Sana:** 2026-02-26
- **Mas'ul:** Saidazim
- **Fayl:** `services/content/src/`
- **Holat:** Boilerplate ✅ | ES index mapping ❌
- **Qolgan ishlar:**
  - [ ] Elasticsearch `movies` index mapping yaratish (init script)
  - [ ] Analyzer: uzbek/russian text support uchun custom analyzer
  - [ ] Aggregation endpoint: `GET /content/movies/stats` — genre distribution, year histogram
  - [ ] HLS video upload pipeline (operator uchun): FFmpeg transcode + m3u8 generation

---

## SPRINT 3 — Achievement + Rating

### T-S006 | P1 | [BACKEND] | Achievement System to'liq
- **Sana:** 2026-02-26
- **Mas'ul:** Saidazim
- **Fayl:** `services/user/src/` (yoki alohida achievement service)
- **Holat:** ❌ Boshlanmagan
- **Muammo:** Achievement model yo'q, trigger tizimi yo'q
- **Kerak bo'ladi:**
  - [ ] `Achievement` + `UserAchievement` model (T-S003 dan)
  - [ ] 25+ achievement ta'rifi (movies_10, movies_50, watch_party_host, battle_winner, streak_7...)
  - [ ] Trigger service — movie watched, battle won, friend added hodisalarida tekshirish
  - [ ] Achievement unlock → notification + points
  - [ ] `GET /users/:id/achievements` endpoint
  - [ ] Secret achievements (hidden condition)

---

### T-S007 | P2 | [BACKEND] | Rating + Review to'liq
- **Sana:** 2026-02-26
- **Mas'ul:** Saidazim
- **Fayl:** `services/content/src/models/rating.model.ts`
- **Holat:** Boilerplate ✅ | Review list + moderation ❌
- **Qolgan ishlar:**
  - [ ] `GET /content/movies/:id/ratings` — pagination bilan ko'rsatish
  - [ ] Review moderation — operator review ni o'chirishi
  - [ ] User o'z review ini o'chirishi (`DELETE /content/movies/:id/rate`)
  - [ ] Rating + points award (8 ball per review, T-S003 points trigger bilan)

---

## SPRINT 4 — Admin + Operator

### T-S008 | P2 | [ADMIN] | Admin Service — to'liq funksionallik
- **Sana:** 2026-02-26
- **Mas'ul:** Saidazim
- **Fayl:** `services/admin/src/`
- **Holat:** User management ✅ | Content mgmt ❌ | Feedback ❌ | Analytics ❌
- **Qolgan ishlar:**
  - [ ] `GET/PATCH/DELETE /admin/movies` — content moderation (publish/unpublish)
  - [ ] `GET /admin/feedback` — user feedback list + reply
  - [ ] `GET /admin/analytics` — DAU, MAU, watch time, battle stats (MongoDB aggregation)
  - [ ] `GET /admin/logs` — APILog collection query (filter by level, service, date)
  - [ ] Operator role endpoints — movie management (faqat publish qila olmaydi)

---

### T-S009 | P2 | [ADMIN] | Admin Dashboard UI — React + Vite
- **Sana:** 2026-02-26
- **Mas'ul:** Saidazim
- **Fayl:** `apps/admin-ui/`
- **Holat:** ❌ Boshlanmagan (keyingi sprint)
- **Sprint:** S4-S5
- **Kerak bo'ladi:**
  - [ ] Vite + React + TypeScript + TailwindCSS setup
  - [ ] Login page (admin credentials, JWT)
  - [ ] Dashboard — stats cards, charts (Recharts)
  - [ ] Users table — filter, search, block/unblock actions
  - [ ] Content management table — publish/unpublish
  - [ ] Feedback list + reply form
  - [ ] Real-time stats (Socket.io yoki polling)

---

## SPRINT 4-5 — DevOps + Docs

### T-S010 | P2 | [DEVOPS] | CI/CD Pipeline
- **Sana:** 2026-02-26
- **Mas'ul:** Saidazim
- **Fayl:** `.github/workflows/`
- **Holat:** ❌ Boshlanmagan
- **Kerak bo'ladi:**
  - [ ] `lint.yml` — ESLint + TypeScript check (PR da)
  - [ ] `test.yml` — Jest unit tests (PR da)
  - [ ] `docker-build.yml` — Docker image build + push (Docker Hub/ECR)
  - [ ] `deploy-staging.yml` — develop branch → staging server
  - [ ] `deploy-prod.yml` — main branch → production (manual trigger)

---

### T-S011 | P3 | [BACKEND] | API Dokumentatsiya
- **Sana:** 2026-02-26
- **Mas'ul:** Saidazim
- **Fayl:** `docs/api/`
- **Holat:** ❌ Boshlanmagan
- **Kerak bo'ladi:**
  - [ ] Swagger/OpenAPI 3.0 spec har service uchun
  - [ ] `swagger-jsdoc` + `swagger-ui-express` integration
  - [ ] Postman collection export
  - [ ] `ARCHITECTURE.md` — service interaction diagram

---

# ═══════════════════════════════════════
# 🟢 EMIRHAN — REACT NATIVE MOBILE
# ═══════════════════════════════════════

## SPRINT 1 — Setup + Auth

### T-E001 | P0 | [MOBILE] | Loyiha setup + Navigation + State
- **Sprint:** S1
- **Subtasks:** TASK-E-001..TASK-E-007
- **Output:** RN init, React Navigation (Auth/Main/Modal stacks), Zustand stores, Axios + React Query, Socket.io client, Firebase FCM, UI component library

### T-E002 | P0 | [MOBILE] | Auth ekranlar
- **Sprint:** S1
- **Subtasks:** TASK-E-008..TASK-E-014
- **Output:** Splash, onboarding, register, login (+ Google + biometric), email verify, forgot password, profile setup

## SPRINT 2 — Home + Search + Movie Detail + Player

### T-E003 | P0 | [MOBILE] | Home ekran
- **Sprint:** S2
- **Subtasks:** TASK-E-015..TASK-E-020
- **Output:** Hero carousel, trending, top rated, continue watching, genres/categories

### T-E004 | P1 | [MOBILE] | Search ekran
- **Sprint:** S2
- **Subtasks:** TASK-E-021..TASK-E-022
- **Output:** Debounced search, results tabs, filters, search history

### T-E005 | P0 | [MOBILE] | Movie Detail + Video Player
- **Sprint:** S2
- **Subtasks:** TASK-E-023..TASK-E-028
- **Output:** Movie detail (parallax), rating widget, HLS player (quality/subtitle/audio), progress saving, PiP

## SPRINT 3 — Watch Party + Friends + Battle

### T-E006 | P1 | [MOBILE] | Watch Party ekranlar
- **Sprint:** S3
- **Subtasks:** TASK-E-029..TASK-E-034
- **Output:** Create room, invite modal, party room (sync player + chat + emoji), owner/member controls

### T-E007 | P1 | [MOBILE] | Do'stlar ekranlar
- **Sprint:** S3
- **Subtasks:** TASK-E-035..TASK-E-038
- **Output:** Friends list (online status), search, requests, friend profile

### T-E008 | P1 | [MOBILE] | Battle ekranlar
- **Sprint:** S3
- **Subtasks:** TASK-E-039..TASK-E-044
- **Output:** Active battles, create, invite, detail, result (confetti), global challenge

## SPRINT 4-5 — Profile + Notifications + Polish

### T-E009 | P2 | [MOBILE] | Profil + Stats + Achievements
- **Sprint:** S4
- **Subtasks:** TASK-E-045..TASK-E-048
- **Output:** Profile, stats (charts), achievements grid (unlock animation), settings

### T-E010 | P2 | [MOBILE] | Notifications
- **Sprint:** S4
- **Subtasks:** TASK-E-049..TASK-E-050
- **Output:** In-app list, push notification handling, tap → navigate

### T-E011 | P2 | [MOBILE] | Polish + Performance + Testing
- **Sprint:** S5
- **Subtasks:** TASK-E-051..TASK-E-055
- **Output:** React.memo, FastImage, animations, accessibility, Sentry, Jest + Detox E2E

---

# ═══════════════════════════════════════
# 🔵 JAFAR — NEXT.JS WEB CLIENT
# ═══════════════════════════════════════

## SPRINT 1 — Setup + Auth

### T-J001 | P0 | [WEB] | Next.js setup + SEO + Design System
- **Sprint:** S1
- **Subtasks:** TASK-J-001..TASK-J-006
- **Output:** Next.js App Router, SEO arxitekturasi (metadata, robots, sitemap, JSON-LD), Tailwind + Shadcn/ui, Zustand + React Query, Socket.io, Auth

## SPRINT 2 — Landing + Home + Movie

### T-J002 | P0 | [WEB] | Landing Page (SEO)
- **Sprint:** S2
- **Subtasks:** TASK-J-007..TASK-J-015
- **Output:** Hero, features, how it works, testimonials, pricing, download, FAQ, contact, 100% Lighthouse SEO

### T-J003 | P0 | [WEB] | App Layout + Home + Movie Detail
- **Sprint:** S2
- **Subtasks:** TASK-J-016..TASK-J-019
- **Output:** App layout (sidebar/topbar), home (SSR trending), movie catalog (filters, infinite scroll), movie detail (SSG, JSON-LD)

## SPRINT 3 — Player + Watch Party + Friends

### T-J004 | P1 | [WEB] | Video Player + Search
- **Sprint:** S3
- **Subtasks:** TASK-J-020..TASK-J-021
- **Output:** HLS player (hls.js), custom UI, keyboard shortcuts, quality/subtitle/audio, progress saving, PiP

### T-J005 | P1 | [WEB] | Watch Party + Friends
- **Sprint:** S3
- **Subtasks:** TASK-J-022..TASK-J-023
- **Output:** Split layout (video 70% + panel 30%), sync player, chat, emoji overlay, friends list (online status)

## SPRINT 4 — Battle + Profile + Stats

### T-J006 | P2 | [WEB] | Battle + Profile + Stats + Achievements
- **Sprint:** S4
- **Subtasks:** TASK-J-024..TASK-J-029
- **Output:** Battle (leaderboard, create, result confetti), profile (SSR, OG meta), stats (Recharts), achievements grid

## SPRINT 5 — SEO + i18n + PWA + Polish

### T-J007 | P2 | [WEB] | SEO + Performance + i18n + PWA
- **Sprint:** S5
- **Subtasks:** TASK-J-030..TASK-J-038
- **Output:** Dynamic OG images, Core Web Vitals, next-intl (uz/ru/en), PWA, WCAG AA, Playwright E2E

---

# ═══════════════════════════════════════
# 🟣 UMUMIY — BARCHA JAMOA
# ═══════════════════════════════════════

### T-C001 | P0 | [IKKALASI] | API Contract — OpenAPI spec + versioning
- **Sana:** 2026-02-26
- **Holat:** Shared types ✅ | OpenAPI spec ❌ | API versioning (/api/v1/) ❌
- **Qolgan:**
  - [ ] `swagger-jsdoc` integration har servicega
  - [ ] `/api/v1/` prefix qo'shish (breaking change — barcha team bilan kelishish)
  - [ ] Postman collection export

### T-C002 | P0 | [IKKALASI] | Design Tokens
- **Sprint:** S1
- **Subtasks:** TASK-C-002, TASK-D-001
- **Output:** globals.css, tailwind config, RN theme/index.ts, @cinesync/tokens

### T-C003 | P1 | [IKKALASI] | Git Workflow + PR Template
- **Sprint:** S1
- **Subtasks:** TASK-C-003
- **Output:** Branch strategy, commit convention, PR template, code review checklist

### T-C004 | P2 | [IKKALASI] | Dizayn Tasklari
- **Sprint:** S2-S5
- **Subtasks:** TASK-D-002..TASK-D-010
- **Output:** MovieCard hover, Hero backdrop, online status vizual, emoji float, achievement animation, battle progress, skeleton loading, Storybook, dark mode QA

### T-C005 | P1 | [IKKALASI] | Service-to-Service Communication
- **Sana:** 2026-02-26
- **Holat:** ❌ Boshlanmagan
- **Muammo:** Hozir har bir service mustaqil. Battle score → User service points, Watch party complete → Achievement trigger mexanizmi yo'q
- **Kerak:**
  - [ ] Inter-service call strategiyasi (HTTP yoki Redis pub/sub yoki message queue)
  - [ ] Battle win → User service `addPoints()` call
  - [ ] Movie watched → Achievement trigger
  - [ ] Event schema kelishish (barcha team)

---

## 📊 STATISTIKA

| Jamoa | Tugallandi | Qolgan | JAMI |
|-------|-----------|--------|------|
| Saidazim | T-S001, T-S007 (shared), F-003..F-009 (boilerplate) | T-S001..T-S011 (11 task) | — |
| Emirhan | 0 | T-E001..T-E011 (11 task) | 11 |
| Jafar | 0 | T-J001..T-J007 (7 task) | 7 |
| Umumiy | T-C001 (partial) | T-C001..T-C005 (5 task) | 5 |

---

*docs/Tasks.md | CineSync | Yangilangan: 2026-02-26*
