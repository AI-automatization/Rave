# CineSync — OCHIQ VAZIFALAR

# Yangilangan: 2026-03-03

# 3 dasturchi: Saidazim (Backend) | Emirhan (Mobile) | Jafar (Web)

---

## 📌 QOIDALAR

```
1. Har topilgan bug/task → shu faylga DARHOL yoziladi
2. Sessiya boshida shu faylni O'QIB, oxirgi T-raqamdan davom
3. Fix bo'lgach → shu yerdan O'CHIRISH → docs/Done.md ga KO'CHIRISH
4. Prioritet: P0=kritik, P1=muhim, P2=o'rta, P3=past
5. Sprint: S1=hozir, S2=keyingi hafta, S3=keyingi sprint, S4-5=keyin
6. Oxirgi T-raqam: S→016, E→013, J→011, C→005
```

---

# ═══════════════════════════════════════

# 🔴 SAIDAZIM — BACKEND + ADMIN

# ═══════════════════════════════════════

## SPRINT 1 — Auth (Mobile tomonidan kerak)

### T-S016 | P1 | [BACKEND] | Google OAuth native token endpoint

- **Sana:** 2026-03-03
- **Mas'ul:** Saidazim
- **Fayl:** `services/auth/src/`
- **Holat:** 🔄 pending[Saidazim]
- **Sabab:** Mobile `@react-native-google-signin` orqali idToken oladi — backendga yuboradi.
  Passport web-redirect flow mobile uchun mos emas.
- **Bajarilishi kerak:**
  - [ ] `POST /api/v1/auth/google/token` endpoint — body: `{ idToken: string }`
  - [ ] idToken → `google-auth-library` bilan verify → `findOrCreateGoogleUser(payload)`
  - [ ] Response: `{ success, data: { user, accessToken, refreshToken } }` — LoginResponse format
- **Eslatma:** `findOrCreateGoogleUser` metodi allaqachon `auth.service.ts` da bor — faqat endpoint kerak

---

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

# 🟢 EMIRHAN — EXPO REACT NATIVE MOBILE (QAYTA QURILMOQDA)

# ═══════════════════════════════════════

> **2026-03-07:** Bare React Native → Expo React Native ga to'liq ko'chirildi.
> Eski `apps/mobile` o'chirildi. Yangi Expo app `create-expo-app` bilan yaratildi.
> Quyidagi barcha tasklar `pending[Emirhan]` — boshidan bajariladi.

---

## SPRINT 1 — Expo Setup + Auth

## SPRINT 2 — Asosiy ekranlar

---


## SPRINT 3 — Ijtimoiy ekranlar

## SPRINT 4 — Profil + Bildirishnoma

## SPRINT 5 — Sifat + Test


### T-E013 | P2 | [MOBILE] | EAS Build + expo-notifications setup

- **Sana:** 2026-03-07
- **Mas'ul:** pending[Emirhan]
- **Holat:** ❌ Boshlanmagan
- **Bajarilishi kerak:**
  - [ ] `eas.json` — development/preview/production profillari
  - [ ] `expo-notifications` — FCM token olish, foreground/background handler
  - [ ] `app.json` — android package, ios bundleId, permissions, plugins
  - [ ] `docs/MOBILE_SETUP.md` yangilash (Expo Bare Workflow, EAS Build)

---


# ═══════════════════════════════════════

# 🔵 JAFAR — NEXT.JS WEB CLIENT

# ═══════════════════════════════════════

## SPRINT 3 — UX + Auth + Profile

---


---
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

## 📊 STATISTIKA (2026-03-07 yangilandi)

| Jamoa    | Tugallandi | Qolgan | JAMI |
| -------- | ---------- | ------ | ---- |
| Saidazim | T-S001..T-S008, T-S010, T-S011, T-C001, T-C003, T-C005 ✅ | T-S005b, T-S009, T-S016 (3 task) | — |
| Emirhan  | — (Expo ga ko'chirildi, boshidan) | T-E001..T-E014 (14 task) | 14 |
| Jafar    | T-J001..T-J006, T-J008, T-J009, T-J011 ✅ | T-J007 (qisman), T-J010 (verify) | — |
| Umumiy   | T-C001 ✅, T-C002 ✅, T-C003 ✅, T-C005 ✅ | T-C004 (1 task) | — |

---

_docs/Tasks.md | CineSync | Yangilangan: 2026-03-01_
