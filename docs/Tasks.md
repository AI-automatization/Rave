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

### T-E005 | P1 | [MOBILE] | MovieDetailScreen + VideoPlayerScreen (expo-av)

- **Sana:** 2026-03-07
- **Mas'ul:** pending[Emirhan]
- **Fayl:** `apps/mobile/src/screens/home/`
- **Holat:** ❌ Boshlanmagan
- **Bajarilishi kerak:**
  - [ ] `MovieDetailScreen.tsx` — parallax header, movie info, genre chips, RatingWidget (1-10)
  - [ ] `VideoPlayerScreen.tsx` — `expo-av` (Video) HLS m3u8, custom controls (play/pause/seek/fullscreen)
  - [ ] Progress save (debounced 30s), 90% → markComplete + checkAchievements
  - [ ] **Eslatma:** `react-native-video` EMAS — `expo-av` ishlatish

---

## SPRINT 3 — Ijtimoiy ekranlar

### T-E006 | P1 | [MOBILE] | WatchParty ekranlar

- **Sana:** 2026-03-07
- **Mas'ul:** pending[Emirhan]
- **Fayl:** `apps/mobile/src/screens/modal/`
- **Holat:** ❌ Boshlanmagan
- **Bajarilishi kerak:**
  - [ ] `WatchPartyCreateScreen.tsx` — movie tanlov, private/public, room yaratish
  - [ ] `WatchPartyScreen.tsx` — sync video player, chat panel, emoji float, owner/member controls, invite code

---

### T-E007 | P1 | [MOBILE] | Do'stlar ekranlar

- **Sana:** 2026-03-07
- **Mas'ul:** pending[Emirhan]
- **Fayl:** `apps/mobile/src/screens/friends/`
- **Holat:** ❌ Boshlanmagan
- **Bajarilishi kerak:**
  - [ ] `FriendsScreen.tsx` — friends list (online indicator), pending requests badge
  - [ ] `FriendSearchScreen.tsx` — debounced user search, do'st so'rov yuborish
  - [ ] `FriendProfileScreen.tsx` — public profile, stats, online status, friend actions

---

### T-E008 | P1 | [MOBILE] | Battle ekranlar

- **Sana:** 2026-03-07
- **Mas'ul:** pending[Emirhan]
- **Fayl:** `apps/mobile/src/screens/modal/`
- **Holat:** ❌ Boshlanmagan
- **Bajarilishi kerak:**
  - [ ] `BattleCreateScreen.tsx` — duration tanlov (3/5/7 kun), opponent invite
  - [ ] `BattleScreen.tsx` — active battles, leaderboard (progress bars), result (confetti)

---

## SPRINT 4 — Profil + Bildirishnoma

### T-E009 | P2 | [MOBILE] | Profil + Stats + Achievements + Settings

- **Sana:** 2026-03-07
- **Mas'ul:** pending[Emirhan]
- **Fayl:** `apps/mobile/src/screens/profile/`
- **Holat:** ❌ Boshlanmagan
- **Bajarilishi kerak:**
  - [ ] `ProfileScreen.tsx` — avatar, rank badge, stats grid (4 card), rank progress bar, logout
  - [ ] `AchievementsScreen.tsx` — FlatList 3 column, RARITY_COLORS, locked/unlocked, secret "???"
  - [ ] `StatsScreen.tsx` — rank card, stats grid (6 card), activity bar chart, rank yo'li
  - [ ] `SettingsScreen.tsx` — til (uz/ru/en), bildirishnoma togglelar (5), privacy togglelar (2)

---

### T-E010 | P2 | [MOBILE] | NotificationsScreen

- **Sana:** 2026-03-07
- **Mas'ul:** pending[Emirhan]
- **Fayl:** `apps/mobile/src/screens/modal/`
- **Holat:** ❌ Boshlanmagan
- **Bajarilishi kerak:**
  - [ ] FlatList, unread dot, icon per type (8 tur), formatDistanceToNow
  - [ ] mark single/all read, delete, WatchParty/Battle ga navigate (tap)

---

## SPRINT 5 — Sifat + Test

### T-E011 | P2 | [MOBILE] | Polish + Performance + ErrorBoundary + Sentry

- **Sana:** 2026-03-07
- **Mas'ul:** pending[Emirhan]
- **Holat:** ❌ Boshlanmagan
- **Bajarilishi kerak:**
  - [ ] FlatList optimizatsiya (getItemLayout, windowSize, maxToRenderPerBatch)
  - [ ] `React.memo` — MovieCard, HeroBanner kabi heavy componentlar
  - [ ] Accessibility: `accessibilityRole`, `accessibilityLabel`
  - [ ] `ErrorBoundary.tsx` — class-based, "Qayta urinish" tugmasi
  - [ ] `src/utils/crash.ts` — Sentry wrapper stub
  - [ ] Jest unit testlar (MovieCard, ErrorBoundary, crash utils)
  - [ ] Detox E2E: Auth flow (Splash → Onboarding → Login → Home)

---

### T-E012 | P1 | [MOBILE] | Google OAuth — expo-auth-session bilan native flow

- **Sana:** 2026-03-07
- **Mas'ul:** pending[Emirhan]
- **Holat:** ❌ Boshlanmagan
- **Sabab:** Bare React Native `@react-native-google-signin` Expo bilan murakkab. Expo `expo-auth-session` osonroq.
- **Bajarilishi kerak:**
  - [ ] `expo-auth-session` + `expo-web-browser` orqali Google OAuth
  - [ ] idToken → `POST /api/v1/auth/google/token` (T-S016 backend endpointi)
  - [ ] `LoginScreen.tsx` ga Google button integratsiya

---

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

### T-E014 | P1 | [MOBILE] | Theme — Web UI bilan ranglarni moslashtirish

- **Sana:** 2026-03-10
- **Mas'ul:** pending[Emirhan]
- **Fayl:** `apps/mobile/src/theme/index.ts`
- **Holat:** ❌ Boshlanmagan
- **Sabab:** Web `aqua` dark theme (Tailwind v4 + DaisyUI v5, `docs/UICOLORS.md`) ishlatmoqda.
  Mobile hozir Netflix red (`#E50914`) ishlatmoqda — platformalar orasida vizual inconsistency.
- **Manbaa:** `docs/UICOLORS.md` — Web token → Mobile hex konversiya
- **Bajarilishi kerak:**
  - [ ] OKLCH → HEX konversiya (`oklch.com` dan foydalanish)
  - [ ] `apps/mobile/src/theme/index.ts` — `colors` obyektini yangilash:

```
Web token                             → Mobile token           → HEX (taxminiy)
--color-base-100 oklch(14% 0.004 49)  → bgBase                → #211F1C
--color-base-200 oklch(26% 0.007 34)  → bgElevated            → #3E3B38
--color-base-300 oklch(45% 0.187 3)   → border                → #7A3B40
--color-base-content oklch(94% 0.028) → textPrimary           → #EFE6EB
--color-primary oklch(67% 0.182 276)  → primary               → #7B72F8
--color-primary-content oklch(25%)    → primaryContent        → #1A164A
--color-secondary oklch(74% 0.16 232) → secondary             → #49C4E5
--color-secondary-content oklch(29%)  → secondaryContent      → #163545
--color-neutral oklch(59% 0.249 0)    → neutral               → #C03040
--color-neutral-content oklch(97%)    → textMuted             → #F9F4F7
```

  - [ ] `bgVoid`, `bgSurface`, `bgOverlay` — Web base-100/200 dan derived qilish
  - [ ] `success`, `error`, `warning` — Web semantic tokenlar bilan moslashtirish
  - [ ] `RANK_COLORS`, `RARITY_COLORS` — o'zgartirmaslik (gamification-specific)
  - [ ] Barcha screenlarni vizual tekshirish (Expo Go da)
- **Eslatma:** Aniq HEX qiymatlar uchun `oklch.com` → Enter OKLCH → Copy HEX

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
