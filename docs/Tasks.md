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

*T-E001..T-E011 — Done.md F-023..F-034 ga ko'chirildi*

## ✅ Barcha buglar tuzatildi (2026-03-01)

### ✅ T-E012 | P2 | [MOBILE] | O'rta buglar tuzatish (BUG-M009..M019) — TUGADI
### ✅ T-E013 | P3 | [MOBILE] | Past buglar tuzatish (BUG-M020..M024) — TUGADI

- **Sana:** 2026-03-01
- **Mas'ul:** Emirhan
- **Holat:** ⏳ Kutmoqda
- **Buglar:**
  - [ ] BUG-M009 — WatchPartyCreateScreen: goBack+navigate race
  - [ ] BUG-M010 — useSearch: JSON.parse catch yo'q
  - [ ] BUG-M011 — VideoPlayerScreen: stale closure progress
  - [ ] BUG-M012 — MovieDetailScreen: hasRated.current server tekshirilmaydi
  - [ ] BUG-M013 — WatchPartyScreen: FlatList keyExtractor index
  - [ ] BUG-M014 — MainTabs: notification badge noto'g'ri tabda
  - [ ] BUG-M015 — LoginScreen: GoogleSignin.configure har render da
  - [ ] BUG-M017 — useHomeData: progress < 90 chegarasi
  - [ ] BUG-M018 — FriendSearchScreen: dead code + keraksiz API
  - [ ] BUG-M019 — VideoPlayerScreen: setCurrentTime + seek ikki marta

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
| Emirhan  | T-E001..T-E011 ✅ (11 task) — HAMMASI TUGADI 🎉 | — | 11 |
| Jafar    | T-J001..T-J006 ✅ (6 task) | T-J007 (1 task, qisman) | 7 |
| Umumiy   | T-C001 ✅, T-C002 ✅, T-C003 ✅, T-C005 ✅ | T-C004 (1 task) | — |

---

_docs/Tasks.md | CineSync | Yangilangan: 2026-03-01_
