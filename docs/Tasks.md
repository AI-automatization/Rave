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
- **Holat:** ❌ Boshlanmagan
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

### T-E001 | P0 | [MOBILE] | Expo loyiha setup — monorepo config, aliaslar, theme

- **Sana:** 2026-03-07
- **Mas'ul:** pending[Emirhan]
- **Fayl:** `apps/mobile/`
- **Holat:** ❌ Boshlanmagan
- **Bajarilishi kerak:**
  - [ ] `create-expo-app` bilan yaratilgan baza ustiga monorepo sozlash
  - [ ] `tsconfig.json` — strict mode, path aliases (@screens, @components, @api, @store, @socket, @theme, @utils, @types, @navigation)
  - [ ] `babel.config.js` — `babel-preset-expo` + `babel-plugin-module-resolver`
  - [ ] `metro.config.js` — `expo/metro-config` + monorepo `watchFolders` (shared/*)
  - [ ] `src/theme/index.ts` — colors, spacing, borderRadius, typography, RANK_COLORS
  - [ ] `src/types/index.ts` — IUser, IMovie, IWatchPartyRoom, IBattle, INotification, IAchievement, ApiResponse
  - [ ] `src/utils/storage.ts` — `expo-secure-store` token storage (accessToken, refreshToken, userId)
  - [ ] `src/utils/notifications.ts` — FCM permission, token registration, NOTIFICATION_ROUTES
  - [ ] `src/api/client.ts` — per-service Axios instances (6 ta), auto-refresh interceptor, token rotation
  - [ ] Barcha API fayllar: auth, user, content, watchParty, battle, notification
  - [ ] Zustand stores: auth, movies, friends, watchParty, battle, notification
  - [ ] Navigation types + AppNavigator (auth-aware routing)
  - [ ] Expo paketlar: `expo-image`, `expo-linear-gradient`, `@expo/vector-icons`, `expo-haptics`, `expo-splash-screen`, `expo-av`, `expo-secure-store`
- **Eslatma:** Expo Go emas — `expo run:android` / `expo run:ios` ishlatish (Bare Workflow)

---

### T-E002 | P0 | [MOBILE] | Auth ekranlar (Expo)

- **Sana:** 2026-03-07
- **Mas'ul:** pending[Emirhan]
- **Fayl:** `apps/mobile/src/screens/auth/`
- **Holat:** ❌ Boshlanmagan
- **Bajarilishi kerak:**
  - [ ] `SplashScreen.tsx` — animated logo, token hydration, Onboarding ga redirect
  - [ ] `OnboardingScreen.tsx` — 3 slide FlatList (pagingEnabled), dot indicators
  - [ ] `LoginScreen.tsx` — email+password, Google SignIn (expo-auth-session), toast xatolar
  - [ ] `RegisterScreen.tsx` — username+email+password+confirm, client validation
  - [ ] `VerifyEmailScreen.tsx` — token input, authApi.verifyEmail
  - [ ] `ForgotPasswordScreen.tsx` — email input, enumeration-safe message
  - [ ] `ProfileSetupScreen.tsx` — bio (200 char), avatar placeholder, skip

---

## SPRINT 2 — Asosiy ekranlar

### T-E003 | P1 | [MOBILE] | HomeScreen + MovieRow + HeroBanner

- **Sana:** 2026-03-07
- **Mas'ul:** pending[Emirhan]
- **Fayl:** `apps/mobile/src/screens/home/`
- **Holat:** ❌ Boshlanmagan
- **Bajarilishi kerak:**
  - [ ] `HomeScreen.tsx` — header, notification badge, RefreshControl
  - [ ] `hooks/useHomeData.ts` — React Query (trending, topRated, continueWatching, staleTime 10min)
  - [ ] `components/HeroBanner.tsx` — top 5, `expo-linear-gradient` overlay, auto-scroll
  - [ ] `components/MovieRow.tsx` — horizontal FlatList, optimized (getItemLayout)
  - [ ] `components/HomeSkeleton.tsx` — loading skeleton

---

### T-E004 | P1 | [MOBILE] | SearchScreen + SearchResultsScreen

- **Sana:** 2026-03-07
- **Mas'ul:** pending[Emirhan]
- **Fayl:** `apps/mobile/src/screens/search/`
- **Holat:** ❌ Boshlanmagan
- **Bajarilishi kerak:**
  - [ ] `SearchScreen.tsx` — debounced search (500ms), genre filter chips, search history (expo-secure-store)
  - [ ] `SearchResultsScreen.tsx` — results list, movie cards, pagination

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

# ═══════════════════════════════════════

# 🔵 JAFAR — NEXT.JS WEB CLIENT

# ═══════════════════════════════════════

## SPRINT 3 — UX + Auth + Profile

---


### T-J012 | P1 | [WEB] | React hydration error #418 / #423 — /home sahifasi

- **Sana:** 2026-03-07
- **Mas'ul:** Jafar
- **Fayl:** `apps/web/src/app/(app)/home/page.tsx`, `apps/web/src/components/`
- **Holat:** ❌ Boshlanmagan
- **Xato:** React error #418 (hydration mismatch) + #423 (state update during render)
  - `home` sahifasida server render va client hydration orasida farq bor
  - Server: ISR bilan pre-render (revalidate=600), statik HTML
  - Client: hydrate qilganda HTML farq qilsa React #418 tashlaydi
- **Sabab (taxmin):**
  - `HeroBanner` yoki boshqa `'use client'` komponent server HTML bilan mos kelmaydi
  - Ehtimol `localStorage`, `window`, yoki browser-only API server-side ishlatilmoqda
  - Yoki conditional render server/client da farqli natija bermoqda
- **Bajarilishi kerak:**
  - [ ] Hydration mismatch qaysi komponentda ekanini aniqlash (dev mode da batafsil xabar ko'rinadi)
  - [ ] `suppressHydrationWarning` kerak bo'lgan joylarda qo'shish YOKI
  - [ ] Server/client render farqini bartaraf etish
  - [ ] React #423 — render paytida state o'zgartirish joyi topib tuzatish
- **Test:** `http://localhost:3000/home` ochib browser console da xato yo'q bo'lishi kerak

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
| Emirhan  | — (Expo ga ko'chirildi, boshidan) | T-E001..T-E013 (13 task) | 13 |
| Jafar    | T-J001..T-J006, T-J008, T-J009, T-J011 ✅ | T-J007 (qisman), T-J010 (verify) | — |
| Umumiy   | T-C001 ✅, T-C002 ✅, T-C003 ✅, T-C005 ✅ | T-C004 (1 task) | — |

---

_docs/Tasks.md | CineSync | Yangilangan: 2026-03-01_
