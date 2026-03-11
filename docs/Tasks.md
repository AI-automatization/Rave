# CineSync — OCHIQ VAZIFALAR

# Yangilangan: 2026-03-11

# 3 dasturchi: Saidazim (Backend) | Emirhan (Mobile) | Jafar (Web)

---

## 📌 QOIDALAR

```
1. Har topilgan bug/task → shu faylga DARHOL yoziladi
2. Sessiya boshida shu faylni O'QIB, oxirgi T-raqamdan davom
3. Fix bo'lgach → shu yerdan O'CHIRISH → docs/Done.md ga KO'CHIRISH
4. Prioritet: P0=kritik, P1=muhim, P2=o'rta, P3=past
5. Sprint: S1=hozir, S2=keyingi hafta, S3=keyingi sprint, S4-5=keyin
6. Oxirgi T-raqam: S→022, E→023, J→014, C→007
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

## CODE REVIEW — 2026-03-11 (Bekzod QA)

### T-S017 | P0 | [BACKEND] | SECURITY: Internal endpointlar autentifikatsiyasiz ochiq

- **Sana:** 2026-03-11
- **Mas'ul:** Saidazim
- **Holat:** ❌ Boshlanmagan
- **Fayllar:**
  - `services/user/src/routes/user.routes.ts` (90-94-qator)
  - `services/user/src/routes/achievement.routes.ts` (22-qator)
  - `shared/src/utils/serviceClient.ts` (118-qator)
  - `services/auth/src/services/auth.service.ts` (319-330-qator)
- **Muammo:**
  - `/internal/profile`, `/internal/add-points`, `/achievements/internal/trigger` endpointlari **hech qanday** auth middleware siz ochiq
  - `validateInternalSecret()` — `INTERNAL_SECRET` env bo'sh bo'lsa **barcha** so'rovlarni o'tkazib yuboradi (production da xavfli!)
  - `syncUserProfile` (auth service) `fetch` ishlatadi, `X-Internal-Secret` header **yubormas**
  - Har qanday tashqi mijoz `/internal/add-points` ga so'rov yuborib **istalgan** foydalanuvchiga ball qo'shishi mumkin
- **Bajarilishi kerak:**
  - [ ] Barcha `/internal/*` route larga `requireInternalSecret` middleware qo'shish
  - [ ] `validateInternalSecret()` — production da `INTERNAL_SECRET` bo'sh bo'lsa `false` qaytarish
  - [ ] `auth.service.ts` da `syncUserProfile` ni `serviceClient` utility orqali chaqirish
  - [ ] `/internal/add-points` da `points > 0` validation qo'shish

---

### T-S018 | P0 | [BACKEND] | SECURITY: Google OAuth tokenlar URL da, forgotPassword token leak

- **Sana:** 2026-03-11
- **Mas'ul:** Saidazim
- **Holat:** ❌ Boshlanmagan
- **Fayllar:**
  - `services/auth/src/controllers/auth.controller.ts` (124-qator)
  - `services/auth/src/services/auth.service.ts` (257-qator)
- **Muammo:**
  - Google OAuth callback: `accessToken` + `refreshToken` to'g'ridan URL query params da:
    `?token=${accessToken}&refresh=${refreshToken}` — brauzer history, server loglar, Referer header orqali oqadi
  - `forgotPassword` service metodi raw `resetToken` ni return qiladi — controller ignore qilsa ham, kelajakda xavfli
- **Bajarilishi kerak:**
  - [ ] OAuth callback: short-lived authorization code yaratish → client POST bilan token almashish. Yoki `Set-Cookie` (`httpOnly`, `Secure`, `SameSite`) ishlatish
  - [ ] `forgotPassword()` return type ni `Promise<void>` ga o'zgartirish, token faqat email orqali yuborilishi

---

### T-S019 | P0 | [BACKEND] | BUG: watchProgress `userId` undefined + viewCount noto'g'ri

- **Sana:** 2026-03-11
- **Mas'ul:** Saidazim
- **Fayllar:**
  - `services/content/src/controllers/watchProgress.controller.ts` (5-12-qator)
  - `services/content/src/services/content.service.ts` (20-35-qator)
- **Muammo:**
  - `watchProgressController` — `req.userId` ishlatadi, lekin `verifyToken` middleware `req.user.userId` ga yozadi → **har doim undefined** → watch progress butunlay ishlamaydi
  - `getMovieById` — cache dan qaytarilgan film eski `viewCount` ko'rsatadi; cache active bo'lganda `viewCount` increment bo'lmaydi
- **Bajarilishi kerak:**
  - [ ] `req.userId` → `(req as AuthenticatedRequest).user.userId` ga o'zgartirish
  - [ ] viewCount ni Redis counter da alohida saqlash, cache bilan aralashmaslik

---

### T-S020 | P1 | [BACKEND] | SECURITY: CORS wildcard + mass assignment + validation yo'q

- **Sana:** 2026-03-11
- **Mas'ul:** Saidazim
- **Fayllar:**
  - `services/user/src/app.ts`, `services/content/src/app.ts`, `services/battle/src/app.ts`, `services/notification/src/app.ts`, `services/watch-party/src/app.ts`
  - `services/admin/src/services/admin.service.ts` (311-318-qator)
  - `services/content/src/controllers/content.controller.ts` (51-qator)
  - `services/admin/src/app.ts` (22-qator)
- **Muammo:**
  - 5 ta service da `cors({ origin: '*', credentials: true })` — xavfsiz emas
  - `operatorUpdateMovie` — faqat `isPublished` bloklangan, operator `viewCount`, `rating`, `_id` o'zgartira oladi
  - `createMovie` — hech qanday Joi/Zod validation siz `req.body` to'g'ridan MongoDB ga o'tadi
  - Admin CORS faqat `localhost:5173` ga hardcode — production da ishlamaydi
- **Bajarilishi kerak:**
  - [ ] Barcha servislarda CORS origin whitelist (env dan olish)
  - [ ] `operatorUpdateMovie` da allowed fields whitelist
  - [ ] `createMovie` uchun Joi validation schema
  - [ ] Admin CORS ga `config.adminUrl` env qo'shish

---

### T-S021 | P1 | [BACKEND] | Socket.io: polling-only + rate limit yo'q + XSS sanitization yo'q

- **Sana:** 2026-03-11
- **Mas'ul:** Saidazim
- **Fayllar:**
  - `services/watch-party/src/app.ts` (29-qator)
  - `services/watch-party/src/socket/watchParty.socket.ts` (188-195-qator)
  - `services/content/src/services/externalVideo.service.ts`, `services/user/src/services/user.service.ts`
- **Muammo:**
  - `transports: ['polling']` — WebSocket o'chirilgan! Barcha real-time HTTP long-polling orqali — sekin, ko'p bandwidth
  - Chat message va emoji reaction da **rate limit yo'q** — 1 client sekundiga minglab xabar yubora oladi (DoS)
  - User bio, review, chat message, OG tag metadata **sanitize qilinmagan** — stored XSS xavfi
- **Bajarilishi kerak:**
  - [ ] `transports: ['websocket', 'polling']` qo'shish
  - [ ] Socket event rate limiter (10 msg/5sek per user)
  - [ ] `sanitize-html` yoki `xss` bilan server-side sanitization

---

### T-S022 | P1 | [BACKEND] | Performance: Redis KEYS, achievement 2x query, multer memory 2GB

- **Sana:** 2026-03-11
- **Mas'ul:** Saidazim
- **Fayllar:**
  - `services/admin/src/services/admin.service.ts` (78, 270-qator)
  - `services/user/src/services/achievement.service.ts` (97-100-qator)
  - `services/content/src/routes/content.routes.ts` (10-12-qator)
  - `services/content/src/services/ytdl.service.ts` (19-20-qator)
  - `services/content/src/services/externalVideo.service.ts` (157-169-qator)
- **Muammo:**
  - `redis.keys('heartbeat:*')` — production da Redis ni bloklaydi
  - `getAchievementStats` — `UserAchievement.find({ userId })` 2 marta chaqiriladi
  - `multer.memoryStorage()` 2GB limit — Node.js OOM crash
  - YouTube info cache — hajm limitsiz, memory leak
  - External video rating — race condition, user bir nechta marta baholashi mumkin
- **Bajarilishi kerak:**
  - [ ] `KEYS` → `SCAN` yoki Redis Set ishlatish
  - [ ] Achievement query ni optimizatsiya qilish (bir marta fetch)
  - [ ] Video upload — `diskStorage` yoki Cloudinary direct upload
  - [ ] ytdl cache — `lru-cache` bilan limit qo'yish
  - [ ] External video rating — per-user tekshirish, `$inc` atomic update

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

# ═══════════════════════════════════════

# 🟢 EMIRHAN — EXPO REACT NATIVE MOBILE (QAYTA QURILMOQDA)

# ═══════════════════════════════════════

> **2026-03-07:** Bare React Native → Expo React Native ga to'liq ko'chirildi.
> Eski `apps/mobile` o'chirildi. Yangi Expo app `create-expo-app` bilan yaratildi.
> Quyidagi barcha tasklar `pending[Emirhan]` — boshidan bajariladi.

---

## SPRINT 1 — Expo Setup + Auth

### T-E019 | P2 | [MOBILE] | ProfileSetup auth flow — foydalanuvchi hech qachon bu ekranga etib bormaydi | pending[Emirhan]

- **Sana:** 2026-03-11
- **Mas'ul:** Emirhan
- **Fayl:** `apps/mobile/src/screens/auth/ProfileSetupScreen.tsx`, `apps/mobile/src/screens/auth/VerifyEmailScreen.tsx`, `apps/mobile/src/screens/auth/LoginScreen.tsx`
- **Holat:** 🔄 pending[Emirhan]
- **Sabab:** `VerifyEmailScreen` emailni tasdiqlagandan so'ng to'g'ridan `Login` ga o'tadi, `ProfileSetup` ni o'tkazib yuboradi.
  `LoginScreen`da `setAuth()` chaqirilgach `isAuthenticated = true` bo'lib AppNavigator Main ga o'tadi — `ProfileSetup` ekrani hech qachon ko'rsatilmaydi.
  Bundan tashqari `ProfileSetupScreen`da `navigation.replace('Login')` noto'g'ri — foydalanuvchi allaqachon tizimga kirgan bo'lsa qayta Login ko'rsatiladi.
- **Bajarilishi kerak:**
  - [ ] `LoginScreen` da login muvaffaqiyatli bo'lgach: `user.bio` bo'sh bo'lsa → `navigation.navigate('ProfileSetup')` (login + profileSetup ketma-ket)
  - [ ] `ProfileSetupScreen` da save/skip: `navigation.replace('Login')` o'rniga foydalanuvchini Main ga o'tkazish (`useAuthStore().setAuth` yoki rootNavigation)
  - [ ] Yoki: `ProfileSetup` ni `AuthStack`dan `MainStack`ga ko'chirish (cleaner yondashuv)
- **Eslatma:** Hozircha app ishlaydi (ProfileSetup skip bo'ladi), bu UX muammo — first-time foydalanuvchilar bio o'rnatishga imkon topilmaydi

---

## CODE REVIEW — 2026-03-11 (Bekzod QA)

### T-E020 | P0 | [MOBILE] | BUG: Token refresh race condition — concurrent 401 lar bir-birini buzadi

- **Sana:** 2026-03-11
- **Mas'ul:** Emirhan
- **Holat:** ❌ Boshlanmagan
- **Fayl:** `apps/mobile/src/api/client.ts` (30-60-qator)
- **Muammo:** Har bir axios client (`authClient`, `userClient`, `contentClient`) **mustaqil** 401 interceptor ga ega. App resume da 5+ so'rov bir vaqtda 401 olib, parallel refresh boshlanadi → tokenlar bir-birini bekor qiladi → auth loop / logout storm
- **Bajarilishi kerak:**
  - [ ] Shared `isRefreshing` flag + `failedQueue` pattern — birinchi 401 refresh boshlaydi, qolganlari kutadi
  - [ ] Refresh tugagach queue dagi so'rovlar yangi token bilan replay qilinadi

---

### T-E021 | P0 | [MOBILE] | BUG: Seek bar thumb noto'g'ri pozitsiya + Search pagination buzilgan

- **Sana:** 2026-03-11
- **Mas'ul:** Emirhan
- **Holat:** ❌ Boshlanmagan
- **Fayllar:**
  - `apps/mobile/src/screens/home/VideoPlayerScreen.tsx` (199-qator)
  - `apps/mobile/src/screens/search/SearchResultsScreen.tsx` (30-42, 110-114-qator)
- **Muammo:**
  - Seek bar: `left: '${pct}%' as unknown as number` — React Native `%` qo'llab-quvvatlamaydi → thumb har doim 0 da
  - Search: `useQuery` bilan pagination — yangi sahifa eski natijalarni **almashtiradi** (accumulate qilmaydi)
  - `getItemLayout` noto'g'ri hisoblangan (21px — aslida 150+ px) → scroll jumping
- **Bajarilishi kerak:**
  - [ ] Seek bar: `left: progressRatio * seekBarWidth - 6` (pixel hisob)
  - [ ] Search: `useInfiniteQuery` ga o'tish yoki local `allMovies` state bilan accumulate
  - [ ] `getItemLayout` ni to'g'ri card height ga moslashtirish yoki olib tashlash

---

### T-E022 | P1 | [MOBILE] | SECURITY + BUG: Logout server invalidate yo'q, socket tozalanmaydi, API null crash

- **Sana:** 2026-03-11
- **Mas'ul:** Emirhan
- **Holat:** ❌ Boshlanmagan
- **Fayllar:**
  - `apps/mobile/src/store/auth.store.ts` (32-35-qator)
  - `apps/mobile/src/hooks/useSocket.ts`
  - `apps/mobile/src/api/*.ts` (barcha API fayllar)
- **Muammo:**
  - `logout()` faqat local storage tozalaydi — server da refresh token **invalidate bo'lmaydi** → o'g'irlangan token ishlay beradi
  - Logout da socket connection **uzilmaydi** — eski JWT bilan eventlar oqib ketadi
  - Barcha API fayllarida `res.data.data!` (non-null assertion) — server null qaytarsa **crash**
  - `WatchPartyScreen` da `setPositionAsync` reject `.catch()` yo'q → `isSyncing` abadiy `true` qoladi
- **Bajarilishi kerak:**
  - [ ] `logout()` da `authApi.logout(refreshToken)` chaqirish (fire-and-forget)
  - [ ] `logout()` da `disconnectSocket()` chaqirish
  - [ ] Barcha `res.data.data!` → null check + descriptive error throw
  - [ ] `setPositionAsync` ga `.catch()` + `.finally(() => isSyncing.current = false)`

---

### T-E023 | P1 | [MOBILE] | BUG: HeroBanner auto-scroll, HomeScreen refresh, notification count, settings persist

- **Sana:** 2026-03-11
- **Mas'ul:** Emirhan
- **Holat:** ❌ Boshlanmagan
- **Fayllar:**
  - `apps/mobile/src/components/movie/HeroBanner.tsx` (34-46, 108-112-qator)
  - `apps/mobile/src/screens/home/HomeScreen.tsx` (31-35-qator)
  - `apps/mobile/src/store/notification.store.ts` (33-39-qator)
  - `apps/mobile/src/screens/profile/SettingsScreen.tsx`
  - `apps/mobile/src/screens/auth/VerifyEmailScreen.tsx`
- **Muammo:**
  - HeroBanner: manual swipe dan keyin auto-scroll **abadiy to'xtaydi** (interval restart yo'q)
  - HomeScreen: `handleRefresh` — `refetch()` await qilinmagan, spinner 1 sek keyin fake to'xtaydi
  - Notification: `markRead` — allaqachon o'qilgan notification uchun ham count kamayadi
  - Settings: barcha sozlamalar **faqat local state** — mount da reset, hech narsa saqlanmaydi
  - VerifyEmail: `keyboardType` ko'rsatilmagan (alfabetik klaviatura), "Resend code" tugmasi yo'q
- **Bajarilishi kerak:**
  - [ ] HeroBanner: `onMomentumScrollEnd` da interval qayta boshlash
  - [ ] HomeScreen: `await Promise.all([...refetch()])` → keyin `setRefreshing(false)`
  - [ ] notification `markRead`: faqat `isRead: false` bo'lsa decrement
  - [ ] Settings: AsyncStorage bilan persist + backend API bilan sync
  - [ ] VerifyEmail: `keyboardType="number-pad"` + resend code button + cooldown timer

---

## SPRINT 2 — Asosiy ekranlar

---


## SPRINT 3 — Ijtimoiy ekranlar

## SPRINT 4 — Profil + Bildirishnoma

## SPRINT 5 — Sifat + Test




# ═══════════════════════════════════════

# 🔵 JAFAR — NEXT.JS WEB CLIENT

# ═══════════════════════════════════════

## CODE REVIEW — 2026-03-11 (Bekzod QA)

### T-J012 | P0 | [WEB] | SECURITY: Token storage XSS xavfi + cookie konfiguratsiya xato

- **Sana:** 2026-03-11
- **Mas'ul:** Jafar
- **Holat:** ❌ Boshlanmagan
- **Fayl:** `apps/web/src/store/auth.store.ts` (35-37-qator)
- **Muammo:**
  - Refresh token `localStorage` da — XSS hujumida **o'g'irlanadi** va attacker doimiy kirish oladi
  - Access token cookie da `httpOnly` yo'q, `Secure` yo'q, `max-age=30 kun` (token 15 min amal qiladi!)
  - XSS topilsa ikkala token ham olinadi
- **Bajarilishi kerak:**
  - [ ] Refresh token → faqat `httpOnly; Secure; SameSite=Strict` cookie (server-side set)
  - [ ] Access token cookie → `Secure` flag qo'shish, `max-age` ni 15 min ga tushirish
  - [ ] Next.js API route `/api/auth/login` da cookie ni server-side o'rnatish

---

### T-J013 | P0 | [WEB] | Security headers yo'q + TypeScript/ESLint build da o'chirilgan

- **Sana:** 2026-03-11
- **Mas'ul:** Jafar
- **Holat:** ❌ Boshlanmagan
- **Fayl:** `apps/web/next.config.mjs` (3-4-qator va butun fayl)
- **Muammo:**
  - `ignoreDuringBuilds: true` + `ignoreBuildErrors: true` — **type xatolar production ga o'tadi!** CLAUDE.md: "QA FAIL → merge TAQIQLANGAN"
  - `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `HSTS` **hech biri yo'q**
  - Clickjacking, MIME sniffing hujumlariga ochiq
- **Bajarilishi kerak:**
  - [ ] `ignoreDuringBuilds` va `ignoreBuildErrors` ni **o'chirish**
  - [ ] Barcha tsc xatolarini tuzatish
  - [ ] `next.config.mjs` da `headers()` funksiya qo'shish: X-Frame-Options, CSP, HSTS, referrer-policy

---

### T-J014 | P0 | [WEB] | SECURITY: postMessage wildcard origin + JSON-LD XSS injection

- **Sana:** 2026-03-11
- **Mas'ul:** Jafar
- **Holat:** ❌ Boshlanmagan
- **Fayllar:**
  - `apps/web/src/components/video/UniversalPlayer.tsx` (83, 92-qator va boshqalar)
  - `apps/web/src/app/(app)/movies/[slug]/page.tsx` (63-82-qator)
  - `apps/web/src/app/(app)/profile/[username]/page.tsx` (86-95-qator)
- **Muammo:**
  - YouTube iframe `postMessage('*')` — har qanday origin ga yuboradi; `message` listener `e.origin` tekshirmaydi → fake event injection mumkin
  - JSON-LD `dangerouslySetInnerHTML` — movie title/bio da `</script>` bo'lsa **arbitrary HTML/JS inject** bo'ladi
- **Bajarilishi kerak:**
  - [ ] `postMessage` target → `'https://www.youtube.com'`
  - [ ] Message listener da `e.origin === 'https://www.youtube.com'` tekshirish
  - [ ] JSON-LD da `.replace(/<\//g, '<\\/')` escape qo'shish

---

### T-J015 | P1 | [WEB] | BUG: Auth hydration flash + authFetch duplicate + socket stale token + middleware

- **Sana:** 2026-03-11
- **Mas'ul:** Jafar
- **Holat:** ❌ Boshlanmagan
- **Fayllar:**
  - `apps/web/src/store/auth.store.ts` (25-75-qator)
  - `apps/web/src/app/(app)/friends/page.tsx` (21-36-qator)
  - `apps/web/src/app/(app)/battle/page.tsx` (12-27-qator)
  - `apps/web/src/lib/socket.ts` (7-16-qator)
  - `apps/web/src/middleware.ts` (9-qator)
  - `apps/web/src/app/(app)/watch/[movieId]/page.tsx` (37, 50-61-qator)
- **Muammo:**
  - Zustand `persist` hydration: SSR da `user=null` → client da `user=obj` → **flash of unauthenticated UI** + hydration mismatch
  - `friends/page.tsx` va `battle/page.tsx` da **duplicate** `authFetch` utility — `apiClient` ishlatmaydi → token refresh interceptor **bypass**
  - Socket: birinchi token bilan yaratiladi, refresh dan keyin **eski token** qoladi
  - Middleware: cookie **mavjudligini** tekshiradi, **validligini** emas — expired token bilan protected page flash
  - Watch page: raw `fetch` auth header siz — progress saqlash **ishlamaydi**
- **Bajarilishi kerak:**
  - [ ] Zustand `onRehydrateStorage` + `_hasHydrated` flag qo'shish
  - [ ] `authFetch` larni o'chirish → `apiClient` ishlatish
  - [ ] Socket: token o'zgarganda reconnect qilish
  - [ ] Middleware: JWT expiry tekshirish (decode, exp field)
  - [ ] Watch page: `apiClient` ga o'tish

---

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

### T-C006 | P1 | [IKKALASI] | WebView Video Player — har qanday saytdan video ko'rish

- **Sana:** 2026-03-11
- **Mas'ul:** Emirhan (Mobile — asosiy), Saidazim (Backend — minimal), Jafar (Web — fallback UI)
- **Holat:** ❌ Boshlanmagan
- **Sprint:** S2-S3
- **Prioritet:** P1 — foydalanuvchilar faqat YouTube ko'ra olmoqda, boshqa saytlar ishlamayapti

---

#### MUAMMO

Hozirda CineSync da video faqat 2 xil manba bilan ishlaydi:
1. **YouTube** — embed iframe API orqali ✅
2. **Direct .mp4/.m3u8** — VideoPlayer (HLS.js) orqali ✅

Boshqa saytlar (uzmovi.tv, kinogo.cc, filmix va h.k.) **ishlamaydi** chunki:
- `X-Frame-Options: SAMEORIGIN` — iframe da ochib bo'lmaydi
- yt-dlp — faqat ~30% saytlarni qo'llab-quvvatlaydi, CORS/Referer muammo qoladi
- Headless browser (Puppeteer) — server resursi og'ir, sekin, bandwidth qimmat

**Yechim:** React Native **WebView** yondashuvi (Rave.io modeli).
WebView = ichki brauzer. Saytni to'g'ridan-to'g'ri ichida ochadi, X-Frame-Options muammo emas.
Video URL ni extract qilish KERAK EMAS — sayt o'zi video ni o'ynatadi, biz faqat JS injection
orqali `<video>` elementni topib, play/pause/seek ni boshqaramiz.

---

#### ARXITEKTURA

```
Foydalanuvchi URL kiritadi (uzmovi.tv/..., kinogo.cc/..., har qanday sayt)
        │
        ▼
┌────────────────────── React Native ──────────────────────┐
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  react-native-webview                                │ │
│  │                                                      │ │
│  │  Sayt sahifasi yuklangan (uzmovi.tv/...)            │ │
│  │  Sayt O'ZI video ni o'ynatadi                       │ │
│  │  X-Frame-Options MUAMMO EMAS (WebView ≠ iframe)     │ │
│  └──────────────┬──────────────────────────────────────┘ │
│                 │                                         │
│  ┌──────────────▼──────────────────────────────────────┐ │
│  │  JS Injection Layer                                  │ │
│  │                                                      │ │
│  │  1. MutationObserver — <video> element paydo         │ │
│  │     bo'lishini kuzatadi (nested iframe ham)          │ │
│  │  2. video.play/pause/seek — boshqarish               │ │
│  │  3. video.currentTime/duration — holatni olish       │ │
│  │  4. postMessage → React Native ga yuborish           │ │
│  └──────────────┬──────────────────────────────────────┘ │
│                 │                                         │
│  ┌──────────────▼──────────────────────────────────────┐ │
│  │  Sync Engine (mavjud Watch Party infra)              │ │
│  │                                                      │ │
│  │  Owner: WebView → JS inject → video event →          │ │
│  │         postMessage → React Native → Socket.io →     │ │
│  │         Backend → Members                            │ │
│  │                                                      │ │
│  │  Member: Socket.io → React Native →                  │ │
│  │          injectJavaScript → video.currentTime =      │ │
│  │          video.play()/pause()                        │ │
│  └──────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────┘
```

---

#### MOBILE TASKLARI (Emirhan — `apps/mobile/`)

**Fayl:** `apps/mobile/src/components/video/WebViewPlayer.tsx` (yangi)
**Fayl:** `apps/mobile/src/components/video/UniversalPlayer.tsx` (o'zgartirish)
**Fayl:** `apps/mobile/src/screens/party/WatchPartyScreen.tsx` (o'zgartirish)

- [ ] **M1. `WebViewPlayer` komponenti yaratish**
  - `react-native-webview` asosida
  - Props: `url`, `isOwner`, `onPlay`, `onPause`, `onSeek`, `onProgress`, `syncTime`, `syncIsPlaying`
  - `javaScriptEnabled`, `domStorageEnabled`, `allowsInlineMediaPlayback` = true
  - `mediaPlaybackRequiresUserAction` = false

- [ ] **M2. JS Injection — video elementni topish**
  - `injectedJavaScript` orqali sahifaga JS kiritish
  - `MutationObserver` bilan `<video>` element paydo bo'lishini kutish
  - Agar video nested `<iframe>` ichida bo'lsa:
    - Avval barcha `<iframe>` larning `src` URL larini `postMessage` orqali yuborish
    - React Native da iframe URL ni aniqlash → to'g'ridan iframe URL ni WebView da ochish
    - Bu usul bilan iframe ichidagi video ga to'g'ridan kirish mumkin
  - `document.querySelector('video')` + fallback: `document.querySelectorAll('video')[0]`

- [ ] **M3. JS Injection — video boshqarish (Owner)**
  - `video.addEventListener('play', ...)` → `postMessage({ type: 'PLAY', currentTime })`
  - `video.addEventListener('pause', ...)` → `postMessage({ type: 'PAUSE', currentTime })`
  - `video.addEventListener('seeked', ...)` → `postMessage({ type: 'SEEK', currentTime })`
  - Har 2 sekundda `postMessage({ type: 'PROGRESS', currentTime, duration })`
  - `onMessage` handler React Native da — Socket.io ga yuborish

- [ ] **M4. JS Injection — video boshqarish (Member)**
  - Socket dan `sync:play` kelganda → `webviewRef.injectJavaScript('video.play()')`
  - Socket dan `sync:pause` kelganda → `webviewRef.injectJavaScript('video.pause()')`
  - Socket dan `sync:seek` kelganda → `webviewRef.injectJavaScript('video.currentTime = X')`
  - Sync aniqligi: ~150-400ms kechikish (JS injection + postMessage overhead)

- [ ] **M5. UniversalPlayer ga WebView integratsiya**
  - `detectPlatform(url)` logikasini yangilash:
    - `youtube` → YouTubePlayer (mavjud)
    - `.mp4/.m3u8` → DirectPlayer (mavjud)
    - **boshqa hammasi** → `WebViewPlayer` (yangi)
  - `videoPlatform === 'webview'` holat qo'shish

- [ ] **M6. UX yaxshilash**
  - Loading overlay — sahifa yuklanayotganda spinner
  - Sayt reklamalarini bloklash (reklama domainlarni intercept qilish)
  - `onNavigationStateChange` — sayt redirect qilsa ogohlantirish
  - Fullscreen mode — statusbar yashirish, WebView to'liq ekran
  - Error handling — sayt yuklanmasa fallback UI

- [ ] **M7. Saytga moslashgan adapterlar (keyingi bosqich)**
  - uzmovi.tv uchun maxsus adapter (iframe tuzilishi ma'lum)
  - kinogo.cc uchun maxsus adapter
  - Generic fallback — `<video>` tag qidirish
  - Adapter registry: `{ hostname: adapterFunction }`

---

#### BACKEND TASKLARI (Saidazim — `services/watch-party/`)

**Backend o'zgarishlar MINIMAL — mavjud sync engine allaqachon ishlaydi.**

- [ ] **B1. Room model — `videoPlatform` ga `'webview'` qo'shish**
  - `services/watch-party/src/models/` — enum ga `'webview'` qo'shish
  - Room yaratishda `videoPlatform: 'webview'` qabul qilish
  - Validation: URL format tekshirish (http/https boshlanishi)

- [ ] **B2. Sync event tolerance**
  - WebView yondashuv ~150-400ms kechikish beradi
  - Sync threshold ni sozlash: `SYNC_TOLERANCE_MS = 500` (webview uchun kengaytirish)
  - Bu ixtiyoriy — hozirgi sync engine generic, ishlashi kerak

---

#### SHARED TYPES (kelishib o'zgartirish — LOCK PROTOCOL)

- [ ] **SH1. `shared/types/` — VideoPlatform type yangilash**
  - `VideoPlatform` ga `'webview'` qo'shish
  - `IWatchPartyRoom.videoPlatform` ni yangilash
  - **MUHIM:** Saidazim + Emirhan + Jafar kelishishi kerak (shared file protocol)

---

#### WEB FALLBACK (Jafar — `apps/web/`)

Web brauzerda WebView yondashuvi **IMKONSIZ** (brauzer sandbox). Shuning uchun:

- [ ] **W1. "Faqat mobile da" xabar**
  - `UniversalPlayer` da `platform === 'other'` bo'lganda:
  - "Bu video faqat CineSync mobile ilovasida ko'rish mumkin" xabar ko'rsatish
  - App Store / Play Store havola berish
  - Bu faqat 1 ta UI o'zgartirish

---

#### MA'LUM MUAMMOLAR VA CHEKLOVLAR

```
⚠️ Nested iframe: Same-origin policy tufayli cross-domain iframe ichidagi
   <video> ga JS injection bilan kirish MUMKIN EMAS. Yechim: iframe src URL
   ni aniqlash va to'g'ridan WebView da ochish.

⚠️ DRM kontentlar: Netflix, Disney+ kabi Widevine DRM himoyalangan saytlar
   ISHLAMAYDI (rasmiy shartnoma kerak — Rave.io modeli). Bu task faqat
   DRM-SIZ saytlar uchun (uzmovi.tv, kinogo.cc va shu kabilar).

⚠️ Sync aniqligi: ~150-400ms kechikish (JS inject + postMessage + Socket).
   YouTube embed (~50ms) dan past. Ko'p hollarda sezilmaydi.

⚠️ Sayt tuzilishi o'zgarsa: Adapter buzilishi mumkin. Maintenance kerak.

⚠️ Reklama/popup: Ba'zi saytlar aggressive reklama ko'rsatadi.
   Ad-blocker logika kerak (ixtiyoriy).

⚠️ Expo compatibility: react-native-webview Expo da ishlaydi
   (expo-dev-client kerak, Expo Go da cheklov bor).
```

---

#### TESTLASH REJASI

```
1. uzmovi.tv → WebView da ochilishi, video topilishi, play/pause ishlashi
2. YouTube → mavjud YouTubePlayer ishlatilishi (regresiya tekshirish)
3. Direct .mp4 → mavjud DirectPlayer ishlatilishi (regresiya tekshirish)
4. Watch Party sync — Owner WebView da play → Member sinxron ko'rishi
5. Nested iframe sayt — iframe URL aniqlanishi, video topilishi
6. Xato URL — error handling, fallback UI ko'rinishi
```

---

#### KUTILGAN NATIJA

Foydalanuvchi **har qanday** video sayt URL ni kiritganda:
- Mobile: WebView ochiladi → sayt o'zi video o'ynatadi → sync ishlaydi
- Web: "Mobile da ko'ring" xabar ko'rinadi
- Watch Party: Owner WebView da ko'radi → Members sinxron ko'radi

---

### T-C007 | P1 | [IKKALASI] | Shared middleware buglar: error handler + requireVerified + Mongoose 11000

- **Sana:** 2026-03-11
- **Mas'ul:** Saidazim (shared/ egasi)
- **Holat:** ❌ Boshlanmagan
- **Fayllar:**
  - `shared/src/middleware/error.middleware.ts` (44-qator)
  - `shared/src/middleware/auth.middleware.ts` (90-104-qator)
- **Muammo:**
  - Mongoose duplicate key error: `code === '11000'` (string) — MongoDB **numeric** `11000` qaytaradi → **hech qachon match bo'lmaydi** → duplicate key xato generic 500 sifatida qaytadi
  - `requireVerified` middleware — har doim `next()` chaqiradi, **hech narsani tekshirmaydi** → email verification soxta himoya
- **Bajarilishi kerak:**
  - [ ] `'11000'` → `11000` (yoki `== 11000` loose comparison)
  - [ ] `requireVerified` — JWT payload da `isEmailVerified` tekshirish yoki DB query, yoki bu middleware ni olib tashlash

---

### T-C004 | P2 | [IKKALASI] | Dizayn Tasklari

- **Sprint:** S2-S5
- **Subtasks:** TASK-D-002..TASK-D-010
- **Output:** MovieCard hover, Hero backdrop, online status vizual, emoji float, achievement animation, battle progress, skeleton loading, Storybook, dark mode QA

---

## 📊 STATISTIKA (2026-03-11 yangilandi)

| Jamoa    | Tugallandi | Qolgan | Code Review (yangi) |
| -------- | ---------- | ------ | ---- |
| Saidazim | T-S001..T-S008, T-S010, T-S011 ✅ | T-S005b, T-S009, T-S016 | T-S017(P0), T-S018(P0), T-S019(P0), T-S020(P1), T-S021(P1), T-S022(P1) |
| Emirhan  | T-E015..T-E018 ✅ | T-E019 | T-E020(P0), T-E021(P0), T-E022(P1), T-E023(P1) |
| Jafar    | T-J001..T-J006, T-J008, T-J009, T-J011 ✅ | T-J007, T-J010 | T-J012(P0), T-J013(P0), T-J014(P0), T-J015(P1) |
| Umumiy   | T-C001..T-C003, T-C005 ✅ | T-C004, T-C006 | T-C007(P1) |

### Code Review Summary — 2026-03-11

```
Jami topilgan muammolar:  ~100 ta (3 zona)
P0 (kritik):              14 ta  → DARHOL tuzatish kerak
P1 (muhim):               30 ta  → Sprint ichida tuzatish
P2 (o'rta):               30 ta  → Keyingi sprint
P3 (past):                26 ta  → Backlog

Eng xavfli:
  🔴 Internal API autentifikatsiyasiz (T-S017) — har kim ball qo'sha oladi
  🔴 Token URL da (T-S018) — brauzer history da tokenlar
  🔴 watchProgress ishlamaydi (T-S019) — userId undefined
  🔴 Mobile token refresh race (T-E020) — auth loop
  🔴 Web token XSS xavfi (T-J012) — localStorage da refresh token
  🔴 Build da tsc o'chirilgan (T-J013) — xatolar production ga o'tadi
```

---

_docs/Tasks.md | CineSync | Yangilangan: 2026-03-11_
