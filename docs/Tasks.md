# CineSync — OCHIQ VAZIFALAR

# Yangilangan: 2026-03-01

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

## SPRINT 2 — Content + Watch Party

### T-S005b | P2 | [BACKEND] | Content Service — HLS upload pipeline

- **Sana:** 2026-02-27
- **Mas'ul:** Saidazim
- **Fayl:** `services/content/src/`
- **Holat:** ❌ Boshlanmagan (requires FFmpeg + storage infra)
- **Qolgan ishlar:**
  - [ ] FFmpeg transcode endpoint — operator video yuklaydi → HLS m3u8 + .ts segments
  - [ ] Storage: local yoki S3-compatible (MinIO) video saqlash
  - [ ] Background job (Bull queue) — transcode async

---

## SPRINT 4 — Admin + Operator

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

# ═══════════════════════════════════════

# 🟢 EMIRHAN — REACT NATIVE MOBILE

# ═══════════════════════════════════════

## SPRINT 2 — Movie Detail + Player

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

## SPRINT 5 — SEO + i18n + PWA + Polish

### T-J007 | P2 | [WEB] | SEO + Performance + i18n + PWA — qolgan qismi

- **Sprint:** S5
- **Holat:** ⚠️ QISMAN (manifest.json + robots.txt ✅, Playwright tests qisman ✅)
- **Subtasks:** TASK-J-030..TASK-J-038
- **Qolgan ishlar:**
  - [ ] `next-intl` — uz/ru/en i18n setup
  - [ ] Dynamic OG images (`/api/og` endpoint)
  - [ ] WCAG AA accessibility audit + fixes
  - [ ] Playwright E2E to'liq test suite

---

# ═══════════════════════════════════════

# 🟣 UMUMIY — BARCHA JAMOA

# ═══════════════════════════════════════

### T-C004 | P2 | [IKKALASI] | Dizayn Tasklari

- **Sprint:** S2-S5
- **Subtasks:** TASK-D-002..TASK-D-010
- **Output:** MovieCard hover, Hero backdrop, online status vizual, emoji float, achievement animation, battle progress, skeleton loading, Storybook, dark mode QA

---

## 📊 STATISTIKA (2026-03-01 yangilandi)

| Jamoa    | Tugallandi | Qolgan | JAMI |
| -------- | ---------- | ------ | ---- |
| Saidazim | T-S001..T-S008, T-S010, T-S011, T-C001, T-C003, T-C005 ✅ | T-S005b, T-S009 (2 task) | — |
| Emirhan  | T-E001 ✅, T-E002 ✅, T-E003 ✅, T-E004 ✅ | T-E005..T-E011 (7 task) | 11 |
| Jafar    | T-J001..T-J006 ✅ | T-J007 (1 task, qisman) | 7 |
| Umumiy   | T-C001 ✅, T-C002 ✅, T-C003 ✅, T-C005 ✅ | T-C004 (1 task) | — |

---

_docs/Tasks.md | CineSync | Yangilangan: 2026-03-01_
