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
```

---

# ═══════════════════════════════════════
# 🔴 SAIDAZIM — BACKEND + ADMIN
# ═══════════════════════════════════════

## SPRINT 1 — Arxitektura + Auth + User

### T-S001 | P0 | [BACKEND] | Monorepo + Microservice setup
- **Sprint:** S1
- **Subtasks:** TASK-S-001 (loyiha strukturasi), TASK-S-002 (Docker), TASK-S-003 (Nginx), TASK-S-005 (shared utils/middleware)
- **Output:** Ishlayotgan monorepo, docker-compose dev, shared logger/response/validator

### T-S002 | P0 | [BACKEND] | Auth Service to'liq
- **Sprint:** S1
- **Subtasks:** TASK-S-007..TASK-S-014
- **Output:** Register, login, JWT (RS256), refresh token, Google OAuth, email verify, password reset, auth middleware

### T-S003 | P0 | [BACKEND] | User Service to'liq
- **Sprint:** S1-S2
- **Subtasks:** TASK-S-015..TASK-S-020
- **Output:** Profile CRUD, avatar upload, friends system, online status (Redis heartbeat), user settings

### T-S004 | P0 | [BACKEND] | MongoDB Schemas + Indexes
- **Sprint:** S1
- **Subtasks:** TASK-S-006
- **Output:** Barcha 13 ta schema (User, Movie, WatchHistory, Friendship, WatchPartyRoom, Battle, Achievement, UserAchievement, Notification, Feedback, Rating, Log, RefreshToken), indexes, seed script

## SPRINT 2 — Content + Watch Party + Logging

### T-S005 | P0 | [BACKEND] | Content Service + Elasticsearch
- **Sprint:** S2
- **Subtasks:** TASK-S-021..TASK-S-026
- **Output:** Movie CRUD, Elasticsearch full-text search, watch history, ratings, Redis caching

### T-S006 | P1 | [BACKEND] | Watch Party Service (Socket.io)
- **Sprint:** S2-S3
- **Subtasks:** TASK-S-027..TASK-S-032
- **Output:** Room CRUD, invite system, real-time sync (play/pause/seek), chat, emoji, latency compensation, audio control

### T-S007 | P1 | [BACKEND] | Logging + Monitoring
- **Sprint:** S2
- **Subtasks:** TASK-S-054..TASK-S-056
- **Output:** Winston logger, request/response logging, health check, security (helmet, CORS, rate limit)

## SPRINT 3 — Battle + Achievement + Notification

### T-S008 | P1 | [BACKEND] | Battle Service
- **Sprint:** S3
- **Subtasks:** TASK-S-033..TASK-S-037
- **Output:** Battle CRUD (1v1, group, global), cron jobs, score tracking, leaderboard (Redis sorted set)

### T-S009 | P1 | [BACKEND] | Achievement + Rating System
- **Sprint:** S3
- **Subtasks:** TASK-S-038..TASK-S-041
- **Output:** 25+ achievements, trigger system, point calculation, rank badges (Bronze→Diamond)

### T-S010 | P1 | [BACKEND] | Notification Service
- **Sprint:** S3
- **Subtasks:** TASK-S-042..TASK-S-045
- **Output:** In-app (MongoDB + Socket.io), Push (FCM), Email (SendGrid + Bull queue)

## SPRINT 4-5 — Admin + Operator + CI/CD

### T-S011 | P2 | [BACKEND] | Admin Service Backend
- **Sprint:** S4
- **Subtasks:** TASK-S-046..TASK-S-053
- **Output:** User management, content management, feedback, analytics, AI integration (Claude), ads analytics, operator panel

### T-S012 | P2 | [ADMIN] | Admin Dashboard UI
- **Sprint:** S4-S5
- **Subtasks:** TASK-S-057..TASK-S-065
- **Output:** React admin panel — login, dashboard, users, content, feedback, analytics, AI chat, operator UI

### T-S013 | P2 | [DEVOPS] | CI/CD Pipeline
- **Sprint:** S4
- **Subtasks:** TASK-S-004
- **Output:** GitHub Actions (lint, test, docker build, staging deploy, production deploy)

### T-S014 | P3 | [BACKEND] | API Dokumentatsiya
- **Sprint:** S5
- **Subtasks:** TASK-S-066, TASK-S-067
- **Output:** Swagger UI har service uchun, Postman collection, PROJECT_OVERVIEW.md, ARCHITECTURE.md

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
- **Output:** Next.js App Router, SEO arxitekturasi (metadata, robots, sitemap, JSON-LD), Tailwind + Shadcn/ui, Zustand + React Query, Socket.io, Auth (NextAuth yoki custom)

## SPRINT 2 — Landing + Home + Movie

### T-J002 | P0 | [WEB] | Landing Page (SEO)
- **Sprint:** S2
- **Subtasks:** TASK-J-007..TASK-J-015
- **Output:** Hero, features, how it works, testimonials, pricing, download, FAQ, contact form, 100% Lighthouse SEO

### T-J003 | P0 | [WEB] | App Layout + Home + Movie Detail
- **Sprint:** S2
- **Subtasks:** TASK-J-016..TASK-J-019
- **Output:** App layout (sidebar/topbar), home (SSR trending), movie catalog (filters, infinite scroll), movie detail (SSG, JSON-LD Movie schema)

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
- **Output:** Battle (leaderboard, create, result confetti), profile (SSR, OG meta), stats (Recharts charts), achievements grid

## SPRINT 5 — SEO + i18n + PWA + Polish

### T-J007 | P2 | [WEB] | SEO + Performance + i18n + PWA
- **Sprint:** S5
- **Subtasks:** TASK-J-030..TASK-J-038
- **Output:** Dynamic OG images, JSON-LD all pages, Core Web Vitals optimization, next-intl (uz/ru/en), PWA manifest + service worker, accessibility (WCAG AA), Playwright E2E

---

# ═══════════════════════════════════════
# 🟣 UMUMIY — BARCHA JAMOA
# ═══════════════════════════════════════

### T-C001 | P0 | [IKKALASI] | API Contract + Shared Types
- **Sprint:** S1
- **Subtasks:** TASK-C-001
- **Output:** OpenAPI 3.0 spec, @cinesync/types npm paketi, API versioning (/api/v1/)

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

---

## 📊 STATISTIKA

| Jamoa | Sprint 1 | Sprint 2 | Sprint 3 | Sprint 4 | Sprint 5 | JAMI |
|-------|----------|----------|----------|----------|----------|------|
| Saidazim | 4 task | 3 task | 3 task | 2 task | 2 task | **14** |
| Emirhan | 2 task | 3 task | 3 task | 2 task | 1 task | **11** |
| Jafar | 1 task | 2 task | 2 task | 1 task | 1 task | **7** |
| Umumiy | 3 task | — | — | — | 1 task | **4** |
| **JAMI** | **10** | **8** | **8** | **5** | **5** | **36** |

---

*docs/Tasks.md | CineSync | v1.0*
