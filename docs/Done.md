# CineSync — BAJARILGAN ISHLAR ARXIVI

# Yangilangan: 2026-03-19

---

### F-135 | 2026-03-19 | [MOBILE] | T-C010 — Universal Video Sync extract→play→sync pipeline [Emirhan]

- **Bug 1 tuzatildi** — `detectVideoPlatform` YouTube proxy URL ni 'webview' deb aniqlardi; `/youtube/stream` pattern qo'shildi → 'direct' qaytaradi, expo-av to'g'ridan o'ynaydi
- **Bug 2 tuzatildi** — `buildYouTubeProxyUrl` auth token yo'q edi; `useAuthStore(s => s.accessToken)` import + `&token=` query param qo'shildi
- **Flow endi to'liq ishlaydi:** URL kiritiladi → extraction (debounce 800ms) → extracted URL room ga saqlanadi → WatchPartyScreen → UniversalPlayer → to'g'ri player tanlaydi

### F-134 | 2026-03-19 | [MOBILE] | T-E041 — WebViewPlayer member lock overlay + bug tekshiruv [Emirhan]

- **Member lock overlay** — `!isOwner` bo'lganda `StyleSheet.absoluteFill` shaffof View qo'shildi; member WebView ni ko'radi lekin hech narsani bosa olmaydi
- **B5 tuzatildi** — redirect warning faqat owner uchun ko'rinadi (`!isOwner` return qo'shildi `handleNavigationStateChange` ga)
- **webviewWrapper** style qo'shildi — WebView + overlay wrapper uchun `flex: 1`
- **B1-B4, B6 tasdiqlandi** — `if (isOwner) onPlay/onPause/onSeek` to'g'ri, `injectWithRetry` ishlaydi, `youtubeVideoId` berilmaydi (IFrame API yo'q), `onProgress?.()` optional chaining bor, member retry bosa oladi

### F-133 | 2026-03-18 | [BACKEND] | T-S033 — yt-dlp deploy + sayt ishonchliligi + strukturali error [Saidazim]

- **S33-1**: `services/content/Dockerfile` — yt-dlp musl static binary (Alpine uchun) production stage ga qo'shildi
- **S33-2**: O'zbek saytlar (uzmovi.tv, tv.mover.uz) — `genericExtractor` depth=2 + Referer header iframe follow orqali yaxshi ishlaydi
- **S33-3**:
  - `ytDlpExtractor.ts`: timeout 30s → 20s; DRM stderr detection → `YtDlpDrmError` throw
  - `genericExtractor.ts`: `MAX_IFRAME_DEPTH` 1 → 2; recursive iframe follow + Referer header (parent URL)
  - `videoExtractor/index.ts`: DRM → `VideoExtractError('drm')`; all fail → `VideoExtractError('unsupported_site')`
  - `types.ts`: `VideoExtractError` class + `VideoExtractErrorReason` type qo'shildi
  - `videoExtract.controller.ts`: `VideoExtractError` catch → `{ success, reason, message }` response (HTTP 422)
- **S33-4**: YouTube proxy Range request — `ytdl.controller.ts` da allaqachon implementatsiya qilingan (tekshirildi)

### F-132 | 2026-03-18 | [BACKEND] | T-C006 B1-B2 + SH1 — WebView platform support (allaqachon mavjud) [Saidazim]

- **watchPartyRoom.model.ts:32** — `videoPlatform` enum ga `'webview'` allaqachon qo'shilgan
- **watchParty.service.ts** — `SYNC_THRESHOLD_WEBVIEW_SECONDS = 2.5` + `needsResync(platform?)` WebView toleransi allaqachon implementatsiya qilingan
- **shared/src/types/index.ts:134** — `VideoPlatform = 'youtube' | 'direct' | 'webview'` allaqachon bor
- Yangi kod yozilmadi — tekshirib tasdiqlandi

### F-131 | 2026-03-18 | [MOBILE] | T-E040 — Universal Video Extraction mobile qismi [Emirhan]

- **E40-1 `extractVideo()` API:** allaqachon tayyor edi (`content.api.ts:93-97`)
- **E40-5 `VideoExtractResult` type:** allaqachon tayyor edi (`content.api.ts:5-14`)
- **E40-2 `useVideoExtraction` hook:** yangi yaratildi (`hooks/useVideoExtraction.ts`)
  - Direct URL (.mp4/.m3u8) → skip extraction, darhol natija
  - Backend `POST /content/extract` chaqirish (15s timeout, AbortController)
  - YouTube proxy URL rewrite (`useProxy: true` bo'lsa)
  - Fallback mode (extraction fail → WebView)
- **E40-3 `UniversalPlayer` yangilandi:** `extractedUrl`, `extractedType`, `isExtracting` proplar qo'shildi
- **E40-4 `WatchPartyCreateScreen` UX:** URL kiritganda avtomatik extraction
- **E40-6 Error handling:** timeout, network error, unsupported site → fallback mode

### F-128 | 2026-03-18 | [MOBILE] | Build fix — UniversalPlayer import xatolar + component prop mismatches [Emirhan]

- **UniversalPlayer.tsx:** `../../api/content` → `../../api/content.api` (named export), `../../storage/token` → `../../utils/storage` (named export)
- **MovieDetailScreen.tsx:** 4 ta component prop mismatch tuzatildi (MovieDetailActions, MovieCastList, MovieSimilarList, MovieRatingWidget)
- **SearchScreen.tsx:** SearchInput `onSubmit` → `onSubmitEditing` + `onClear`, GenreChips `genres` prop olib tashlandi, SearchHistory `onPress` → `onItemPress`
- **VideoSection.tsx:** `RefObject<UniversalPlayerRef | null>` type fix
- **ProfileAnimations.tsx:** React 19 + Animated.View children type fix

### F-129 | 2026-03-18 | [MOBILE] | YouTube Error 152 fix — IFrame API → mobile WebView [Emirhan]

- YouTube IFrame Embed API (Error 152-4) o'rniga `m.youtube.com/watch?v=ID` to'g'ridan WebView da ochish
- `MOBILE_USER_AGENT` (Chrome Mobile, "wv" markersiz) barcha WebView larga yuboriladi
- YouTube backend proxy 5s timeout qo'shildi — fail bo'lsa darhol WebView ga tushadi
- WebViewAdapters YouTube adapter `.html5-main-video` selektori bilan video topadi

### F-130 | 2026-03-18 | [MOBILE] | WatchParty do'st taklif qilish + video sync yaxshilash [Emirhan]

- **InviteCard:** invite code + nusxalash (expo-clipboard) + ulashish (Share API) + do'stlar ro'yxati + taklif yuborish (`POST /watch-party/rooms/:id/invite`)
- **watchParty.api:** `inviteFriend(roomId, friendId, inviterName)` metodi qo'shildi
- **RoomInfoBar:** invite tugma endi barcha a'zolarga ko'rinadi (avval faqat owner)
- **WebViewPlayer:** `injectWithRetry()` — video element topilmagan bo'lsa 500ms kutib qayta urinadi (sync ishonchliligi)
- **i18n:** codeCopied, inviteSent, inviteFailed, noFriendsYet, shareInvite, shareText tarjimalari
- **expo-clipboard** package qo'shildi

---

### F-127 | 2026-03-17 | [MOBILE] | T-C006 M6+M7 — WebViewPlayer UX + Site Adapters [Emirhan]

- **M6 — UX yaxshilash:**
  - Loading overlay: hostname + spinner, `bgVoid` fon
  - Ad blocker: `onShouldStartLoadWithRequest` — 11 ta reklama domeni blok (`doubleclick.net`, `exoclick.com` va h.k.)
  - Redirect warning: `onNavigationStateChange` — domen o'zgarsa sariq banner, bosib yopiladi
  - Fullscreen: `StatusBar.setHidden(true, 'slide')` mount da, unmount da tiklanadi
  - Error + Retry: HTTP 4xx/5xx + `onError` — hostname + "Qayta urinish" tugmasi, `reload()` chaqiradi
- **M7 — Site adapterlar (`WebViewAdapters.ts` yangi fayl):**
  - `uzmovi.tv`: `.plyr video`, `#player video`, popup yopish, `scanDelay: 2000ms`
  - `kinogo.cc`: `#oframep video`, `.player-box video`, popup yopish, `scanDelay: 1500ms`
  - `filmix.net`: `.vjs-tech`, `.video-js video`, `scanDelay: 1000ms`
  - `hdrezka.ag`: `#player video`, `.pjsplayer video`, `scanDelay: 2500ms`
  - Generic fallback: `video` selector, `scanDelay: 0`
  - `INJECT_JS` hardcoded → `buildInjectJs(getAdapter(url))` dinamik (useMemo)
- **Fayllar:** `apps/mobile/src/components/video/WebViewPlayer.tsx`, `apps/mobile/src/components/video/WebViewAdapters.ts` (yangi)

---

### F-126 | 2026-03-16 | [MOBILE] | Backend ↔ Mobile API alignment + missing endpoints fix [Emirhan]

- **Barcha 6 ta servis tekshirildi** — route/method mos kelmasliklar topilmadi ✅
- **VerifyEmailScreen resend bug:** `handleResend` `navigation.replace('Register')` chaqirar edi (API chaqirmasdan)
  - **Fix:** `authApi.resendVerification(email)` qo'shildi (`auth.api.ts`), 60 soniya cooldown timer (`VerifyEmailScreen.tsx`)
- **Online status bug:** `POST /users/heartbeat` hech qachon chaqirilmasdi → foydalanuvchi doim offline ko'rinar edi
  - **Fix:** `userApi.heartbeat()` qo'shildi (`user.api.ts`), har 2 daqiqada interval `AppNavigator.tsx` da (`isAuthenticated` ga bog'liq)
- **Fayllar:** `auth.api.ts`, `user.api.ts`, `AppNavigator.tsx`, `VerifyEmailScreen.tsx`

---

### F-125 | 2026-03-16 | [MOBILE] | WatchParty black screen + chat socket mismatch fix [Emirhan]

- **Sabab 1 — Qora ekran:** `room` null bo'lganida (socket `ROOM_JOINED` kelmasdanoldin) `videoUrl=''` → `UniversalPlayer` hech narsa ko'rsatmasdi
  - **Fix:** `WatchPartyScreen.tsx` da `room` null bo'lsa `<ActivityIndicator>` ko'rsatish, player faqat room yuklangandan keyin render qilish
- **Sabab 2 — Chat crash (backend):** `sendMessage` `{ roomId, text }` yuborar edi, lekin backend `data.message` kutgan (`data.message.slice(0,500)`) → `undefined.slice()` → backend crash
  - **Fix:** `useWatchParty.ts` `sendMessage`: `{ roomId, text }` → `{ message: text }` (roomId socket da `authSocket.roomId` sifatida saqlanadi)
- **Sabab 3 — Xabarlar ko'rinmasdi:** Backend `ROOM_MESSAGE` `{ userId, message, timestamp }` yuboradi, lekin mobile `text` polini kutgan (`MessageEvent.text`) → xabarlar store ga tushmasdi
  - **Fix:** `MessageEvent` interfeysi yangilandi (`text` → `message`), handler `msg.message` → `text` mapping qiladi
- **Fayllar:** `apps/mobile/src/hooks/useWatchParty.ts`, `apps/mobile/src/screens/modal/WatchPartyScreen.tsx`

---

### F-124 | 2026-03-16 | [MOBILE] | UniversalPlayer — YouTube WebView embed fallback [Emirhan]

- **Sabab:** `ytdl.getInfo()` Railway serverida YouTube tomonidan bloklanadi → `GET /youtube/stream-url` 500 qaytaradi → `resolveError=true` → "Video yuklashda xato"
- **Fix:** `resolveError=true` bo'lganda expo-av o'rniga `WebViewPlayer` fallback ishlaydi
  - `getYouTubeEmbedUrl(url)`: `youtube.com/watch?v=ID` / `youtu.be/ID` / `youtube.com/shorts/ID` → `youtube.com/embed/ID`
  - `useWebview = platform === 'webview' || (platform === 'youtube' && resolveError)`
  - `useImperativeHandle` endi `useWebview` asosida ref metodlarini yo'naltiradi
  - WatchParty owner play/pause/seek WebViewPlayer JS injection orqali ishlaydi
- **Oqim:** YouTube URL → proxy sinab ko'radi → ✅ muvaffaqiyat (expo-av) | ❌ blokland (WebView embed)
- **Fayl:** `apps/mobile/src/components/video/UniversalPlayer.tsx`

---

### F-125 | 2026-03-16 | [IKKALASI] | T-C008 — Web shared types integration (already resolved) [Jafar]

- **Статус:** Все пункты уже были реализованы ранее
- tsconfig paths: `@shared/*` → `../../shared/src/*` ✅
- `apps/web/src/types/index.ts` — все типы re-export из `@shared/types` с web-specific extensions (Date→string)
- IUser, IMovie, IBattle, IWatchPartyRoom, IAchievement, ApiResponse — все extend shared
- Shared types уже имеют: `slug`, `director`, `cast`, `reviewCount` (IMovie), `isOnline`, `lastSeenAt` (IUser), `secret` (AchievementRarity)

---

### F-124 | 2026-03-16 | [WEB] | T-J014 — postMessage + JSON-LD XSS fix (already resolved) [Jafar]

- **Статус:** Все 3 пункта уже были исправлены ранее
- postMessage wildcard: YouTube используется через IFrame API (window.YT.Player), не через raw postMessage — проблема отсутствует
- Message listener без origin: нет addEventListener('message') в коде — проблема отсутствует
- JSON-LD XSS: `.replace(/<\//g, '<\\/')` escape уже в `movies/[slug]/page.tsx:80` и `profile/[username]/page.tsx:94`

---

### F-123 | 2026-03-16 | [WEB] | T-J013 — Security headers + ESLint/TypeScript build fix [Jafar]

- **Fayl:** `apps/web/next.config.mjs`, `apps/web/src/app/(app)/home/page.tsx`, `apps/web/src/app/api/auth/register/route.ts`
- **Fix:**
  - HSTS header qo'shildi: `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  - `ignoreDuringBuilds` / `ignoreBuildErrors` — allaqachon mavjud emas ✅
  - ESLint xatolar tuzatildi: unused `room` param (home/page.tsx), unused `_omit` var (register/route.ts)
  - `next build` — 0 xato ✅, tsc — 0 xato ✅
- **Security headers (to'liq):** CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-XSS-Protection, HSTS ✅

---

### F-122 | 2026-03-16 | [WEB+MOBILE] | T-J012 — Token storage XSS fix + mobile auth error handling [Jafar]

- **Web:** 4 ta API route (`login`, `refresh`, `google`, `logout`) da `access_token` cookie httpOnly+Secure+SameSite=strict qo'shildi
- **Mobile:** LoginScreen, RegisterScreen, VerifyEmailScreen — `errors[]` array parsing tuzatildi
- **Mobile:** VerifyEmailScreen — barcha hardcoded string lar i18n (`useT()`) ga o'tkazildi
- **Mobile:** `auth.api.ts` — resend endpoint `/auth/register/resend` ga tuzatildi

---

### F-121 | 2026-03-16 | [MOBILE] | T-E039 — Video Extractor Mobile Integration [Emirhan]

- **API:** `contentApi.extractVideo(url)` → `POST /api/v1/content/extract` qo'shildi (`content.api.ts`)
- **Type:** `VideoExtractResult` interface qo'shildi (`content.api.ts`)
- **Screen:** `VideoExtractScreen` yaratildi (`screens/home/VideoExtractScreen.tsx`)
  - Input state: URL validatsiya (http/https), extract tugmasi
  - Loading state: ActivityIndicator + "3-30 soniya" ogohlantirish
  - Error state: backend xato xabaridan foydalanuvchi-do'stona matn
  - Ready state: platformBadge + JONLI EFIR badge + UniversalPlayer + Watch Party tugmasi
  - `useProxy=true` → UniversalPlayer ga original YouTube URL (YouTube proxy flow)
  - `useProxy=false` → `result.videoUrl` to'g'ridan UniversalPlayer ga
- **Navigation:** `VideoExtract: undefined` → `HomeStackParamList` + `MainNavigator.tsx` da ro'yxatdan o'tdi
- **tsc:** `npx tsc --noEmit` → 0 xato ✅

---

### F-120 | 2026-03-16 | [MOBILE] | T-E038 — SearchScreen crash fix (`data.movies` undefined) [Emirhan]

- **Fayl:** `apps/mobile/src/api/content.api.ts`
- **Sabab:** `getMovies()` va `search()` da `ApiResponse<MoviesResponse>` (noto'g'ri generic)
  - Backend `data` = `IMovie[]` (array), `meta` = top-level field qaytaradi
  - Lekin kod `res.data.data.movies` kutgan → `data.movies = undefined` → SearchScreen crash
- **Fix:** Generic ni `ApiResponse<IMovie[]>` ga o'zgartirish + response object qo'lda qurish:
  `{ movies: res.data.data ?? [], meta: res.data.meta ?? {...} }`
- **tsc:** 0 xato ✅

---

### F-119 | 2026-03-16 | [BACKEND] | T-S032 — Universal Video Extractor `POST /api/v1/content/extract` [Saidazim]

- **Endpoint:** `POST /api/v1/content/extract` — `verifyToken` + `apiRateLimiter`
- **Qo'llab-quvvatlagan platformalar:** YouTube, Vimeo, TikTok, Dailymotion, Rutube, Facebook, Instagram, Twitch, VK, Streamable, Reddit, Twitter/X, generic (HTML scraping), unknown (yt-dlp fallback)
- **Faylllar yaratildi:**
  - `services/content/src/services/videoExtractor/types.ts` — `VideoExtractResult`, `VideoPlatform`, `VideoType`
  - `services/content/src/services/videoExtractor/detectPlatform.ts` — URL SSRF validation + platform regex detection
  - `services/content/src/services/videoExtractor/genericExtractor.ts` — HTML scraping: `<video>`, `og:video`, `.mp4/.m3u8` URL search
  - `services/content/src/services/videoExtractor/ytDlpExtractor.ts` — yt-dlp binary fallback via `child_process.spawn`, 30s timeout, best format picker
  - `services/content/src/services/videoExtractor/index.ts` — orchestrator: validateUrl → detectPlatform → extract → Redis cache (2h TTL)
  - `services/content/src/controllers/videoExtract.controller.ts` — HTTP controller
- **content.routes.ts** — `router.post('/extract', verifyToken, apiRateLimiter, videoExtractController.extract)` qo'shildi
- **YouTube:** mavjud `ytdlService.getStreamInfo()` orqali, `useProxy: true` — frontend `/api/v1/youtube/stream` dan oynashi kerak
- **SSRF himoya:** private IP rangelari (10.x, 192.168.x, 172.16-31.x, 127.x, ::1) va `file://`/`ftp://` bloklangan
- **Cache:** Redis `vextract:{base64url-key}` 2 soat TTL

---

### F-118 | 2026-03-16 | [BACKEND] | T-S026..T-S029 + Mobile Endpoint Alignment [Saidazim]

- **T-S026** — Content: `GET /content/trending`, `GET /content/top-rated`, `GET /content/continue-watching` (Redis cache 10min) ✅
- **T-S027** — Content: `POST/GET /content/movies/:id/progress` alias routes ✅
- **T-S028** — WatchParty: `DELETE /watch-party/rooms/:id` (closeRoom + Socket ROOM_CLOSED emit) ✅
- **T-S029** — Battle: `POST/PUT /battles/:id/reject` (rejectInvite + notification to challenger) ✅
- Content: `POST /movies/:id/complete`, `GET /internal/user-watch-stats/:userId` (streak + weeklyActivity) ✅
- Content: `rateMovie` endi `rating` va `score` ikkisini ham qabul qiladi ✅
- User routes: `/me/stats`, `/:id/stats`, `/me/achievements`, `/me/friend-requests`, `/:id/public`, `/:userId/friend-request`, `/friend-requests/:id/accept|reject`, `DELETE /me`, `DELETE /me/friends/:userId` qo'shildi ✅
- User: FCM token `fcmToken` va `token` ikki xil field nomini qabul qiladi ✅
- Notification: PUT aliases (`put /:id/read`, `put /read-all`) qo'shildi ✅
- Battle: PUT aliases (`put /:id/accept`, `put /:id/reject`) qo'shildi ✅
- WatchParty: `POST /join/:inviteCode`, `POST /rooms/:id/leave` aliases qo'shildi ✅
- shared/serviceClient: `getUserWatchStats`, `getUserBattleStats` internal helpers ✅

---

### F-117 | 2026-03-15 | [BACKEND] | T-S030 + T-S031 — Auth change-password + resend-verification [Saidazim]

- **T-S030** (`POST /auth/change-password`) — `verifyToken` + `changePasswordSchema` validator, `AuthService.changePassword()`: bcrypt compare → hash → update + `RefreshToken.deleteMany()` (barcha sessiyalar invalidate)
- **T-S031** (`POST /auth/resend-verification`) — allaqachon mavjud edi: route, controller `resendVerification`, service `resendVerificationCode()` — barchasi ishlaydi. Mobile `authApi.resendVerification()` to'g'ri path (`/auth/resend-verification`) ga murojaat qilmoqda ✅

---

### F-116 | 2026-03-15 | [MOBILE] | T-E037 — Post-pull regressions fix [Emirhan]

- **RegisterScreen.tsx** — `handleTelegramLogin` boshida `clearInterval` guard qo'shildi (T-E033 regressiyasi)
- **RegisterScreen.tsx** — `validate()`: username max 20 + `/^[a-zA-Z0-9]+$/` pattern tekshiruvi qaytarildi (T-E035 regressiyasi)
- **translations.ts** — `errUsernameMax` va `errUsernameChars` kalitlari qo'shildi (uz/ru/en)
- **LanguageSelectScreen.tsx** — `useState(storedLang)`: saqlangan tildan default olinadi (hardcoded 'uz' o'rniga)
- **npm install** — `@react-native-masked-view/masked-view` va `expo-image-picker` o'rnatildi

---

### F-110..F-115 | 2026-03-15 | [MOBILE] | T-E032..T-E036 + Jafar zone bug — Auth audit fixes [Emirhan]

- **T-E032** (auth.api.ts) — `resetPassword` body: `{ token, password }` → `{ token, newPassword }` (Jafar tomonidan allaqachon tuzatilgan, verified ✅)
- **T-E033** (LoginScreen.tsx) — Telegram double-tap race condition: `handleTelegramLogin` boshida avvalgi intervalni tozalash qo'shildi
- **T-E034** (ProfileSetupScreen.tsx) — `'#7C3AED'` hardcoded hex ikki joyda → `colors.primary` ga o'zgartirildi
- **T-E035** (RegisterScreen.tsx) — `validate()` kuchaytirildi: username max 20 + `[a-zA-Z0-9_]` + password uppercase/lowercase/digit tekshiruvi
- **T-E036** (VerifyEmailScreen.tsx + types/index.ts) — resend bug: Jafar `navigation.replace('Register')` qilgan edi (to'g'ri), lekin mavjud bo'lmagan `@i18n/index` import qoldirilgan edi → `useT` olib tashlandi, hardcoded strings qaytarildi. `devOtp` auto-fill (dev mode) saqlab qolindi.
- **Bonus** (RegisterScreen.tsx) — register API `_dev_otp` response → `devOtp` sifatida VerifyEmail ga o'tkaziladi; `AuthStackParamList.VerifyEmail` tipi `{ email, devOtp? }` ga to'g'irlandi

---

### F-109 | 2026-03-15 | [MOBILE] | T-E031 — Telegram Login ekrani va polling flow [Emirhan]

- `authApi.telegramInit()` — POST /auth/telegram/init → `{ state, botUrl }`
- `authApi.telegramPoll(state)` — GET /auth/telegram/poll?state (202→null, 200→LoginResponse)
- `LoginScreen` — `handleTelegramLogin`: Linking.openURL(botUrl) + setInterval poll har 2s, max 60 urinish (2 daqiqa)
- Telegram tugmasi (#2CA5E0 rang) Google tugmasidan keyin
- useEffect unmount da interval tozalash (memory leak yo'q)

---

### F-108 | 2026-03-14 | [ADMIN] | T-S009 — Admin Dashboard UI [Saidazim]

- Vite + React 18 + TypeScript + TailwindCSS (dark mode, CineSync design system)
- Login page — JWT auth, role tekshirish (admin/superadmin/operator)
- Dashboard — 5 ta StatCard, Recharts (Top Movies, Janr taqsimoti, Bugungi faollik), auto-refresh 30s
- Foydalanuvchilar sahifasi — qidirish, role/holat filter, block/unblock, role o'zgartirish, o'chirish
- Kontent sahifasi — publish/unpublish, filter, superadmin delete
- Feedback sahifasi — javob berish modal, status o'zgartirish
- Loglar sahifasi — level/servis filter, pagination
- Railway deploy: `Dockerfile` + `nginx.conf` (SPA routing), `.env` production URL lar bilan
- `VITE_AUTH_API_URL` = auth-production-47a8.up.railway.app
- `VITE_ADMIN_API_URL` = admin-production-8d2a.up.railway.app

---

### F-107 | 2026-03-14 | [BACKEND] | T-S029 — Battle reject endpoint [Saidazim]

- `POST /battles/:id/reject` — faqat `hasAccepted: false` bo'lgan participant rad eta oladi
- Participant record o'chiriladi, battle `status: 'rejected'` ga o'tadi
- `shared/src/types/index.ts`: `BattleStatus`ga `'rejected'` qo'shildi
- `battle.model.ts`: enum yangilandi
- Challenger (creatorId) ga `battle_result` notification yuboriladi (non-blocking)

---

### F-106 | 2026-03-14 | [BACKEND] | T-S028 — Watch Party room yopish endpoint [Saidazim]

- `DELETE /watch-party/rooms/:id` — faqat owner yopishi mumkin
- Service: `closeRoom()` — status `'ended'`, Redis cache tozalanadi
- Controller: `io.to(roomId).emit(ROOM_CLOSED, { reason: 'owner_closed' })` barcha a'zolarga
- Router: `io: SocketServer` parametri qo'shildi, `app.ts` ga `io` uzatildi

---

### F-105 | 2026-03-14 | [BACKEND] | T-S027 — Watch Progress alias route [Saidazim]

- `POST /content/movies/:id/progress` — body: `{ progress: 0-1, duration }` → `currentTime = progress * duration`
- `GET /content/movies/:id/progress` → `{ progress, currentTime, duration }` response
- Key: `movieid:${movieId}` prefix (watchProgressService da mavjud infra ishlatiladi)

---

### F-104 | 2026-03-14 | [BACKEND] | T-S026 — Content trending/top-rated/continue-watching [Saidazim]

- `GET /content/trending?limit=N` — `viewCount` desc, Redis cache `trending:${limit}` TTL 10 min
- `GET /content/top-rated?limit=N` — `rating` desc, Redis cache `top-rated:${limit}` TTL 10 min
- `GET /content/continue-watching` — `verifyToken`, `WatchProgress` (prefix `movieid:`, percent 0-90) + Movie join, response `{ ...movie, progress }`

---

### F-103 | 2026-03-14 | [MOBILE] | T-E030 — StatsScreen real API faollik grafigi [Emirhan]

- `IUserStats`: `weeklyActivity?: number[]` qo'shildi
- `ActivityChart`: mock random data o'chirildi → `weeklyActivity` prop ga asoslangan real bars
- Empty state: "Hali faollik yo'q" (icon + text) — agar barcha 7 kun 0 bo'lsa
- Backend `weeklyActivity` bermasa → bo'sh grafik ko'rsatiladi (graceful fallback)

---

### F-102 | 2026-03-14 | [MOBILE] | T-E029 — SettingsScreen profil tahrirlash + parol + hisob o'chirish [Emirhan]

- HISOB bo'limi qo'shildi: "Profilni tahrirlash" + "Parolni o'zgartirish" navigatsiya satrlar
- `authApi.changePassword(oldPassword, newPassword)` — `POST /auth/change-password`
- `userApi.deleteAccount()` — `DELETE /users/me`
- Hisob o'chirish: 2 bosqichli tasdiqlash (Alert → "TASDIQLASH" so'zi → `userApi.deleteAccount()` → logout)
- Parol o'zgartirish modal: eski/yangi/tasdiqlash input, validatsiya
- Profil tahrirlash modal: username + bio input (ProfileScreen kabi)

---

### F-101 | 2026-03-14 | [MOBILE] | T-E028 — ProfileScreen avatar edit + profil edit modal [Emirhan]

- Avatar ustida kamera icon overlay (absolute, bottom-right, primary rang)
- Tap → `expo-image-picker` (1:1 crop) → `userApi.updateProfile({ avatar })`
- Username yonida pencil icon — modal ochadi
- Profil edit bottom sheet modal: username + bio input, Saqlash tugmasi
- `useMyProfile.updateProfileMutation` kengaytirildi: `avatar` field qo'shildi

---

### F-100 | 2026-03-14 | [MOBILE] | T-E027 — ProfileSetupScreen avatar picker + genre chips [Emirhan]

- `shared/types`: `IUser.favoriteGenres?: ContentGenre[]` qo'shildi
- `userApi.updateProfile`: `favoriteGenres` qo'shildi
- Avatar picker: `expo-image-picker` (1:1 crop, 0.8 quality) — galereya, violet camera overlay
- Genre chips: 10 ta janr multi-select toggle (active: violet filled, inactive: outline)
- `handleSave`: bio + avatar + favoriteGenres birga yuboriladi

---

### F-099 | 2026-03-14 | [MOBILE] | T-E026 — MovieDetailScreen cast + o'xshash filmlar [Emirhan]

- `shared/types`: `ICastMember { name, photoUrl? }` + `IMovie.cast?`, `IMovie.director?` qo'shildi
- `useMovieDetail`: `similarMovies` query qo'shildi — `contentApi.getMovies({ genre })`, o'zini filtr qiladi, max 10
- Cast section: circular avatars (60px), actor ism, photoUrl bo'lmasa fallback icon — horizontal ScrollView
- Cast bo'sh bo'lsa yashiriladi
- O'xshash filmlar: poster (100x148) + title + rating — horizontal ScrollView, tap → boshqa MovieDetail

---

### F-098 | 2026-03-14 | [MOBILE] | T-E025 — WatchPartyCreateScreen redesign [Emirhan]

- `watchParty.api.ts`: `createRoom()` ga `videoUrl?` field qo'shildi
- `WatchPartyCreateScreen.tsx`: to'liq qayta yozildi
  - Film tanlash: Katalogdan (debounced search, `contentApi.search()`, 400ms, 5 natija) / URL orqali (toggle) mode toggle
  - Tanlangan film: poster + title + yil/janr chip, clear button
  - Do'stlarni taklif: `userApi.getFriends()` → checkbox list (avatar initial + username + checkbox)
  - Tanlangan do'stlar: violet chips row (tap to remove)
  - `handleCreate`: `movieId + videoUrl` (catalog) yoki `videoUrl` (URL mode) yuboradi

---

### F-097 | 2026-03-13 | [MOBILE] | T-E024 — YouTube expo-av proxy + LIVE badge + seek disable [Emirhan]

- `content.api.ts`: `YtStreamInfo` interface + `getYouTubeStreamInfo(url)` metodi qo'shildi
- `UniversalPlayer.tsx`: `VideoPlatform` ga `'youtube'` qo'shildi; `detectVideoPlatform` YouTube REGEX bilan yangilandi; `onStreamResolved` prop qo'shildi; YouTube URL → `getYouTubeStreamInfo()` → backend proxy URL (`/youtube/stream?url=...&token=...`) → expo-av `<Video>`; loading/error state UI
- `WatchPartyScreen.tsx`: `videoIsLive` state; `onStreamResolved` callback; `handleSeek` da `videoIsLive` guard; LIVE badge (absolute top:12 left:12, `colors.error` bg, `colors.textPrimary` dot, "JONLI EFIR"); seek tugmalari live da yashiriladi

---

### F-096 | 2026-03-13 | [BACKEND+INFRA] | T-C006 B1-B2 + T-S025b [Saidazim]

**T-C006 B1-B2 — WebView platform support:**
- `VideoPlatform` type: `'youtube'|'direct'|'webview'` shared/types ga qo'shildi
- Room model: `videoPlatform` Mongoose enum ga `'webview'` qo'shildi
- Service: `videoUrl` http/https validation; `needsResync()` webview uchun 2.5s threshold

**T-S025b — Bull queue + Dockerfile:**
- `shared/utils/serviceQueue.ts`: `addUserPoints`/`triggerAchievement` Bull queue (5 retry, exponential backoff)
- `serviceClient.ts`: queue bor bo'lsa queue, yo'q bo'lsa direct HTTP fallback
- battle/content/user `server.ts`: `initServiceQueues(redisUrl)` qo'shildi
- 7 ta Production Dockerfile: `npm ci -w @cinesync/shared -w @cinesync/[service]` — faqat kerakli deps

---

### F-095 | 2026-03-13 | [BACKEND+DOCKER] | T-S025 (qisman) — Docker + env fixes [Saidazim]

- Web container: `network_mode: host` → `cinesync_network` + `ports: 3000:3000`
- Web service env: `localhost:300x` → Docker DNS (`auth:3001`, `user:3002`, ...)
- Root `package.json`: `expo` devDep o'chirildi (faqat `apps/mobile/package.json` da)
- `apps/web/.env.example` yaratildi
- Qolgan: Bull event queue (inter-service reliability), Production Dockerfile optimizatsiya

---

### F-094 | 2026-03-13 | [BACKEND+INFRA] | T-S024 — Socket.io Redis adapter + Nginx TLS + rate limit [Saidazim]

- `@socket.io/redis-adapter` o'rnatildi; `pubClient`/`subClient` (redis.duplicate()) bilan adapter sozlandi
- `nginx.conf`: HTTP→HTTPS 301 redirect server block qo'shildi
- `nginx.conf`: HTTPS server block — TLS 1.2/1.3, ssl_session_cache, ssl_ciphers
- `nginx.conf`: HSTS header qo'shildi (`max-age=31536000; includeSubDomains`)
- `nginx.conf`: rate limit `30r/m` → `10r/s` (api), `10r/m` → `5r/m` (auth)

---

### F-093 | 2026-03-13 | [BACKEND+SHARED] | T-C007 — Shared middleware buglar tuzatildi [Saidazim]

- `error.middleware.ts`: Mongoose 11000 code `'11000'` (string) → `11000 || '11000'` (ikkisini ham tekshirish)
- `auth.middleware.ts`: `requireVerified` endi `user.isEmailVerified` ni JWT payload dan tekshiradi
- `shared/types`: `JwtPayload` ga `isEmailVerified?: boolean` qo'shildi
- `auth.service.ts`: `login`, `refreshTokens`, `generateAndStoreTokens` — payload ga `isEmailVerified` qo'shildi

---

### F-092 | 2026-03-13 | [BACKEND] | T-S016 — Google OAuth native token endpoint [Saidazim]

- `POST /api/v1/auth/google/token` endpoint qo'shildi — body: `{ idToken: string }`
- `google-auth-library` o'rnatildi; `verifyGoogleIdToken()` service metodi yozildi
- idToken verify → `findOrCreateGoogleUser` → `generateAndStoreTokens` → `{ user, accessToken, refreshToken }` response
- `googleIdTokenSchema` Joi validator + `authRateLimiter` qo'shildi

---

### F-091 | 2026-03-12 | [MOBILE] | T-C009 + T-C006 — Socket payload fix + WebView Video Player [Emirhan]

**T-C009 — Socket event payload mismatch (Mobile qismi):**
- `useWatchParty.ts` — `ROOM_JOINED`: `{ room, members }` → `{ room, syncState }` payload fix; `setActiveMembers(data.room.members)` + `setSyncState(data.syncState)` qo'shildi
- `useWatchParty.ts` — `MEMBER_JOINED`/`MEMBER_LEFT`: `setActiveMembers(data.members)` → `addMember`/`removeMember` (incremental, server faqat `userId` yuboradi)
- `watchParty.store.ts` — `addMember` (duplicate check bilan) va `removeMember` action lari qo'shildi

**T-C006 — WebView Video Player (Mobile qismi M1-M5):**
- `components/video/WebViewPlayer.tsx` (yangi) — `react-native-webview` asosida; MutationObserver JS injection; play/pause/seek/progress postMessage; nested iframe URL detect va redirect; loading overlay + error fallback; `forwardRef` bilan `play`/`pause`/`seekTo`/`getPositionMs` ref API
- `components/video/UniversalPlayer.tsx` (yangi) — `detectVideoPlatform(url)`: `.mp4/.m3u8/.webm` → expo-av, boshqa hammasi → WebViewPlayer; `forwardRef` bilan unifikatsiya qilingan ref API
- `screens/modal/WatchPartyScreen.tsx` — `Video` (expo-av) → `UniversalPlayer` ga o'tkazildi; sync useEffect `seekTo`/`play`/`pause` ref orqali; WebView `onPlay`/`onPause`/`onSeek` callbacklari socket emit bilan ulandi
- `package.json` — `react-native-webview@~13.16.1` qo'shildi; npm install qilindi

---

### F-093 | 2026-03-12 | [BACKEND] | T-S020, T-S021, T-S022, T-S023 — Security + Perf + Arch [Saidazim]

**T-S020 — CORS + mass assignment + validation:**
- Barcha 5 servislarda `origin:'*'` → `CORS_ORIGINS` env whitelist
- `updateMovie`: operator role uchun `OPERATOR_SAFE_FIELDS` whitelist
- `createMovie`: Joi validation schema (`content.validator.ts`)
- Admin CORS: hardcoded → `config.adminUrl` env

**T-S021 — Socket.io WebSocket + rate limit + XSS:**
- `transports: ['websocket', 'polling']` (WebSocket yoqildi)
- Socket message/emoji: 10 msg/5sek rate limit per user
- chat message, emoji, user bio, movie review: `xss` package bilan sanitize

**T-S022 — Performance:**
- `getAchievementStats`: `UserAchievement.find` 1x (avval 2x edi)
- Video upload: `memoryStorage(2GB)` → `diskStorage(500MB)`
- ytdl cache: `Map` → `LRUCache(max:100, ttl:2h)` (memory leak yo'q)
- External video rating: `ratedBy[]` + atomic `$inc` (race condition yo'q)

**T-S023 — Admin DB anti-pattern + Docker healthcheck:**
- admin.service.ts: `mongoose.createConnection` → serviceClient REST API
- User/Content servislarida admin internal endpointlar qo'shildi
- admin/config: hardcoded dev credentials olib tashlandi
- docker-compose.prod.yml: healthcheck + `depends_on: service_healthy`

---

### F-090 | 2026-03-12 | [BACKEND] | T-S017, T-S018, T-S019 — Security + Bug fixes [Saidazim]

**T-S017 — Internal endpoint security:**
- `shared/utils/serviceClient.ts` — `validateInternalSecret`: `INTERNAL_SECRET` bo'sh bo'lsa `false` qaytaradi (eski: `true` — production da xavfli)
- `user.routes.ts` — `/internal/profile` va `/internal/add-points` ga `requireInternalSecret` middleware qo'shildi
- `achievement.routes.ts` — `/internal/trigger` ga `requireInternalSecret` qo'shildi
- `serviceClient.ts` — `createUserProfile()` funksiyasi qo'shildi (X-Internal-Secret header bilan)
- `auth.service.ts` — `syncUserProfile`: raw `fetch` → `createUserProfile` serviceClient orqali
- `user.controller.ts` — `addPoints`: `userId` va `points > 0` validation qo'shildi

**T-S018 — OAuth tokens URL dan olib tashlandi:**
- `auth.controller.ts` — `googleCallback`: tokenlar URL query params da emas, Redis short-lived code (2 daqiqa TTL) orqali redirect
- `auth.service.ts` — `createOAuthTempCode()` + `exchangeOAuthCode()` metodlari qo'shildi
- `auth.routes.ts` — `POST /auth/google/exchange` — code → tokens (one-time use)
- `auth.service.ts` — `forgotPassword()`: `Promise<void>` — raw token return qilmaydi

**T-S019 — watchProgress + viewCount:**
- `watchProgress.controller.ts` — `req.userId` → `(req as AuthenticatedRequest).user.userId` (verifyToken `req.user` ga yozadi)
- `content.service.ts` — viewCount: Redis counter `viewcount:{movieId}` bilan alohida tracking, cache bilan aralashmaslik
- `shared/constants/index.ts` — `REDIS_KEYS.movieViewCount` qo'shildi

---

### F-087 | 2026-03-11 | [MOBILE] | T-E023 — HeroBanner auto-scroll, HomeScreen refresh, notification count, settings persist, VerifyEmail UX [Emirhan]

- `HeroBanner.tsx` — `onMomentumScrollEnd` da interval qayta ishga tushiriladi (manual swipe keyin auto-scroll to'xtab qolish bug)
- `hooks/useHomeData.ts` — `refetch()` `Promise.all` qaytaradigan qilindi
- `HomeScreen.tsx` — `await refetch()` + `try/finally setRefreshing(false)` (fake 1s timeout olib tashlandi)
- `notification.store.ts` — `markRead`: allaqachon o'qilgan notification uchun `unreadCount` kamaymasligini ta'minlandi
- `SettingsScreen.tsx` — `expo-secure-store` bilan persist: mount da yuklanadi, o'zgarganda saqlanadi
- `VerifyEmailScreen.tsx` — `keyboardType="number-pad"` + "Kodni qayta yuborish" tugmasi + 60s cooldown timer

### F-086 | 2026-03-11 | [MOBILE] | T-E022 — Logout server invalidate, socket tozalash, API null crash, WatchParty isSyncing [Emirhan]

- `auth.store.ts logout()` — `authApi.logout(refreshToken)` fire-and-forget chaqiriladi (server refresh token invalidate qiladi)
- `auth.store.ts logout()` — `disconnectSocket()` chaqiriladi (eski JWT bilan socket oqib ketmaslik uchun)
- `auth.api.ts` — `login()` va `googleToken()` da `!` null assertion → `if (!res.data.data) throw new Error(...)`
- `user.api.ts` — `getMe()`, `updateProfile()`, `getPublicProfile()`, `getStats()` da null assertion fix
- `WatchPartyScreen.tsx` — `setPositionAsync` ga `.catch(() => {})` + `.finally(() => isSyncing.current = false)` qo'shildi

### F-085 | 2026-03-11 | [MOBILE] | T-E021 — Seek bar thumb pozitsiya fix, Search pagination accumulate, getItemLayout olib tashlandi [Emirhan]

- `VideoPlayerScreen.tsx:198` — `left: \`${progressRatio * 100}%\` as unknown as number` → `left: progressRatio * seekBarWidth - 6` (pixel hisob, React Native `%` qabul qilmaydi)
- `SearchResultsScreen.tsx` — `allMovies` state bilan accumulate: page 1 da almashtiradi, keyingi page da qo'shadi
- `SearchResultsScreen.tsx` — query o'zgarganda `page=1` va `allMovies=[]` reset qilinadi
- `SearchResultsScreen.tsx` — noto'g'ri `getItemLayout` olib tashlandi (21px ≠ asl card height)

### F-084 | 2026-03-11 | [MOBILE] | T-E020 — Token refresh race condition: shared isRefreshing + failedQueue [Emirhan]

- `api/client.ts` — module-level `isRefreshing` flag va `failedQueue` pattern qo'shildi
- Birinchi 401 refresh boshlaydi, qolgan parallel so'rovlar queue ga tushadi
- Refresh tugagach queue dagi barcha so'rovlar yangi token bilan replay qilinadi
- `processQueue(null, token)` / `processQueue(err, null)` pattern — oldingi: har bir client mustaqil refresh boshlardi → token invalidation loop

### F-083 | 2026-03-11 | [MOBILE] | T-E019 — ProfileSetup auth flow fix: needsProfileSetup flag + AppNavigator [Emirhan]

- `auth.store.ts` — `needsProfileSetup: boolean` + `clearProfileSetup()` qo'shildi
- `auth.store.ts setAuth()` — `needsProfileSetup: !user.bio` (bio yo'q yangi foydalanuvchi uchun)
- `AppNavigator.tsx` — `needsProfileSetup=true` bo'lsa Main o'rniga `ProfileSetupScreen` ko'rsatiladi
- `ProfileSetupScreen.tsx` — `navigation.replace('Login')` o'chirildi → `clearProfileSetup()` chaqiriladi → AppNavigator Main ga o'tadi
- `types/index.ts` — `RootStackParamList` ga `ProfileSetup: undefined` qo'shildi

### F-082 | 2026-03-11 | [MOBILE] | T-E020 — Oq ekran root fix: hideAsync App.tsx + hydrate timeout [Emirhan]

- `App.tsx` — `hideAsync()` `isHydrated=true` bo'lganda darhol chaqiriladi (SplashScreen.tsx dan ko'chirildi)
- `SplashScreen.tsx` — `expo-splash-screen` import olib tashlandi, faqat navigatsiya vazifasi qoldi
- `auth.store.ts hydrate()` — SecureStore Android emulator da hang qilmaslik uchun 5s race timeout
- Sabab: `preventAutoHideAsync()` chaqirilgan, lekin `hideAsync()` navigation render bo'lmasa chaqirilmasdi → abadiy oq ekran

### F-081 | 2026-03-11 | [MOBILE] | Bug audit — StatsScreen, HomeScreen nav type, app.json [Emirhan]

- `StatsScreen.tsx:241` — `right: -'50%'.length` (= -3px) → `right: '-50%'` (to'g'ri % qiymati)
- `StatsScreen.tsx:39` — `ActivityChart` `Math.random()` har render → `useMemo([hours])`
- `HomeScreen.tsx` — navigation type `ModalStackParamList` → `RootStackParamList`, navigate call fix
- `types/index.ts` — `Modal: undefined` → `Modal: { screen, params? }` typed
- `app.json` — `expo-image` plugin (PluginError) va `googleServicesFile` (fayl yo'q) olib tashlandi
- `docs/Tasks.md` — T-E019 qo'shildi (ProfileSetup auth flow muammosi)

### F-079 | 2026-03-11 | [MOBILE] | T-E018 — Oq ekran bug fix (SplashScreen + hydration) [Emirhan]

- `index.ts` — `SplashScreen.preventAutoHideAsync()` eng birinchi chaqiriladi
- `SplashScreen.tsx` — modul darajasidagi takroriy `preventAutoHideAsync()` olib tashlandi
- `AppNavigator.tsx` — `!isHydrated` paytida `null` o'rniga `#0A0A0F` qora background
- `auth.store.ts` — `hydrate()` try/finally — `isHydrated: true` har doim o'rnatiladi

### F-076 | 2026-03-11 | [MOBILE] | T-E015 — auth.store hydrate() user tiklanishi [Emirhan]

- `auth.store.ts` — `hydrate()` ichida `userApi.getMe()` chaqirib `user` state tiklanadi
- Token expired/invalid bo'lsa `logout()` state set qilinadi
- App qayta ishga tushganda `user?._id` endi `undefined` emas

### F-077 | 2026-03-11 | [MOBILE] | T-E016 — client.ts 401 handler auth store reset [Emirhan]

- `api/client.ts` — refresh token fail bo'lganda `useAuthStore.getState().logout()` chaqiriladi
- `tokenStorage.clear()` o'rniga store orqali to'liq logout — `isAuthenticated: false` bo'ladi
- Dynamic import bilan circular dep muammosi hal qilindi

### F-078 | 2026-03-11 | [MOBILE] | T-E017 — VerifyEmailScreen OTP endpoint fix [Emirhan]

- `auth.api.ts` — `verifyEmail(token)` → `confirmRegister(email, code)` rename + endpoint `/auth/register/confirm`
- `VerifyEmailScreen.tsx` — `{ email, code }` yuboriladi, javobda `{ userId }` qayta ishlashga o'zgartirildi
- OTP tasdiqlangach Login screen ga yo'naltiriladi
- `@types/react-test-renderer` qo'shildi + test faylida `unknown` cast fix (typecheck PASS)

---

### F-075 | 2026-03-11 | [MOBILE] | T-E013 — eas.json + app.json plugins + EAS setup [Emirhan]

- `eas.json` — development (APK/iOS sim) / preview / production (AAB) profillari
- `app.json` — expo-notifications (#E50914, default channel), expo-secure-store, expo-av, expo-image plugins; iOS infoPlist + Android permissions
- `.env.example` — EXPO_PUBLIC_PROJECT_ID, EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID template
- **Qolgan (user tomonidan):** `eas init` → projectId to'ldirish, google-services.json qo'shish

---

### F-074 | 2026-03-11 | [MOBILE] | T-E011 — ErrorBoundary + crash utils + Jest 9/9 [Emirhan]

- `utils/crash.ts` — Sentry stub (captureException, captureMessage, setUser, clearUser, __DEV__ guard)
- `components/common/ErrorBoundary.tsx` — class-based, getDerivedStateFromError, "Qayta urinish" tugmasi
- `App.tsx` — root `<ErrorBoundary>` bilan o'raldi
- `__tests__/crash.test.ts` — 5 unit test ✅
- `__tests__/ErrorBoundary.test.tsx` — 4 unit test ✅
- `package.json` — jest-expo ~54.0.0, react moduleNameMapper (React 19 dedup), jest@29
- **Jest:** 9/9 tests PASS ✅

---

### F-073 | 2026-03-11 | [MOBILE] | T-E010 — NotificationsScreen [Emirhan]

- `screens/modal/NotificationsScreen.tsx` — 8 NotificationType icons, unread dot + left border, timeAgo helper, markRead on press, WatchParty/Battle navigate, delete confirm, markAllRead, pull-to-refresh
- `navigation/ModalNavigator.tsx` — Notifications → real screen
- **tsc --noEmit:** ✅ 0 xato

---

### F-072 | 2026-03-11 | [MOBILE] | T-E009 — ProfileScreen + StatsScreen + AchievementsScreen + SettingsScreen [Emirhan]

- `hooks/useProfile.ts` — useMyProfile (getMe, getStats, getMyAchievements, updateProfile)
- `api/user.api.ts` — getMyAchievements() endpoint qo'shildi
- `screens/profile/ProfileScreen.tsx` — avatar, rank badge + progress bar, 4-stat grid, nav links, logout
- `screens/profile/AchievementsScreen.tsx` — 3-ustun FlatList, RARITY_COLORS, locked "???" cells
- `screens/profile/StatsScreen.tsx` — rank card, 6-stat grid, weekly bar chart (Views), rank yo'li
- `screens/profile/SettingsScreen.tsx` — 3 til, 5 notif toggle, 2 privacy toggle
- `navigation/MainNavigator.tsx` → real screens ulandi
- **tsc --noEmit:** ✅ 0 xato

---

### F-071 | 2026-03-11 | [MOBILE] | T-E012 — Google OAuth expo-auth-session [Emirhan]

- `screens/auth/LoginScreen.tsx` — WebBrowser.maybeCompleteAuthSession(), Google.useAuthRequest, useEffect (id_token → authApi.googleToken → setAuth), Google button UI (divider, G icon)
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` env variable kerak (`.env`ga qo'shiladi)
- **tsc --noEmit:** ✅ 0 xato

---

### F-070 | 2026-03-11 | [MOBILE] | T-E008 — BattleCreateScreen + BattleScreen [Emirhan]

- `hooks/useBattle.ts` — useMyBattles (accept/reject), useBattleDetail (60s refetch), useCreateBattle
- `screens/modal/BattleCreateScreen.tsx` — friend picker FlatList, duration chips (3/5/7 kun), optional title
- `screens/modal/BattleScreen.tsx` — dual mode: battleId→detail, no id→list; BattleCard animated progress bars, accept/reject, winner badge, days left
- `navigation/ModalNavigator.tsx` — BattleCreate + Battle → real screens
- **tsc --noEmit:** ✅ 0 xato

---

### F-069 | 2026-03-11 | [MOBILE] | T-E007 — FriendsScreen + FriendSearchScreen + FriendProfileScreen [Emirhan]

- `hooks/useFriends.ts` — useFriends (getFriends, getPendingRequests, accept/reject/remove), useFriendSearch (debounce 500ms, min 2 chars), useFriendProfile (publicProfile + stats + sendRequest/remove)
- `screens/friends/FriendsScreen.tsx` — 2 tab (Do'stlar/So'rovlar), online dot, pending badge, accept/reject alert
- `screens/friends/FriendSearchScreen.tsx` — debounce search, add/sent/friend state UI, online dot, rank badge
- `screens/friends/FriendProfileScreen.tsx` — avatar, rank, online status, bio, 4-stat grid, add/remove friend actions
- `navigation/MainNavigator.tsx` — FriendsStack → real screens
- **tsc --noEmit:** ✅ 0 xato

---

### F-068 | 2026-03-11 | [MOBILE] | T-E006 — WatchPartyCreateScreen + WatchPartyScreen [Emirhan]

- `hooks/useWatchParty.ts` — Socket.io: JOIN_ROOM, VIDEO_SYNC/PLAY/PAUSE/SEEK, ROOM_MESSAGE, MEMBER events, ROOM_CLOSED; owner controls emitPlay/Pause/Seek/sendMessage/sendEmoji
- `components/watchParty/ChatPanel.tsx` — chat FlatList, own/other bubble, KeyboardAvoidingView, send input
- `components/watchParty/EmojiFloat.tsx` — Animated float (translateY+opacity), 8-emoji quick picker bar
- `screens/modal/WatchPartyCreateScreen.tsx` — room name, private/public Switch, max members chips (2/4/6/8/10), invite code info, create API call
- `screens/modal/WatchPartyScreen.tsx` — expo-av sync video (isSyncing ref, owner controls overlay), emoji float, chat panel toggle, invite code card, leave/close room
- `navigation/ModalNavigator.tsx` — Modal stack (WatchPartyCreate, WatchParty, Battle*, Notifications* placeholder)
- `navigation/AppNavigator.tsx` — Modal stack (presentation: modal, slide_from_bottom) ulandi
- **tsc --noEmit:** ✅ 0 xato

---

### F-067 | 2026-03-11 | [MOBILE] | Expo start fix + Railway env setup [Emirhan]

- `package.json` (root) — noto'g'ri `expo: ~55.0.5` + `babel-preset-expo` olib tashlandi, `expo: ~54.0.0` qo'shildi (npm workspace hoisting muammosi hal qilindi)
- `apps/mobile/.env` — Railway production API URLlari to'ldirildi (auth, user, content, notification, watch-party, battle, admin)
- Metro Bundler muvaffaqiyatli ishga tushdi

---

### F-066 | 2026-03-10 | [MOBILE] | T-E005 — MovieDetailScreen + VideoPlayerScreen [Emirhan]

- `hooks/useMovieDetail.ts` — React Query: movie (stale 5min) + watchProgress (stale 0)
- `screens/home/MovieDetailScreen.tsx` — Animated parallax backdrop (LinearGradient fade), poster+info row, genre chips, desc, Watch button, 5-star RatingWidget (→ 1-10 backend)
- `screens/home/VideoPlayerScreen.tsx` — expo-av Video, custom controls overlay (auto-hide 3.5s), play/pause/±10s skip, seek bar (touch-to-seek), progress throttle 30s, 90%→markComplete
- `navigation/MainNavigator.tsx` — MovieDetailScreen + VideoPlayerScreen ulandi

---

### F-065 | 2026-03-10 | [MOBILE] | T-E014 — Theme ranglarini Web UI (aqua) bilan moslashtirish [Emirhan]

- `apps/mobile/src/theme/index.ts` — `colors` obyekti to'liq yangilandi
- OKLCH → HEX konversiya: base-100→bgBase(#211F1C), base-200→bgElevated(#3E3B38), base-300→border(#7A3B40)
- primary: #E50914 (Netflix red) → #7B72F8 (violet, oklch 67% 0.182 276)
- secondary: #49C4E5 (aqua), neutral: #C03040, textPrimary: #EFE6EB
- Yangi tokenlar qo'shildi: primaryContent, primaryHover, secondary, secondaryContent, neutral
- RANK_COLORS, RARITY_COLORS — o'zgartirilmadi (gamification-specific)

---

### F-064 | 2026-03-10 | [MOBILE] | T-E004 — SearchScreen + SearchResultsScreen [Emirhan]

- `hooks/useSearch.ts` — useSearchHistory (expo-secure-store, 10 ta limit), useSearchResults (React Query, stale 2min), useDebounce (500ms), GENRES array
- `screens/search/SearchScreen.tsx` — debounced search, genre chips (10ta), quick results preview (4ta), search history (add/remove/clear), genre browse grid
- `screens/search/SearchResultsScreen.tsx` — FlatList 2-ustun, pagination (onEndReached), loading state, empty state
- `navigation/MainNavigator.tsx` — SearchScreen + SearchResultsScreen ulandi
- **tsc --noEmit:** ✅ 0 xato

---

### F-063 | 2026-03-09 | [MOBILE] | T-E003 — HomeScreen + MovieRow + HeroBanner [Emirhan]

- `hooks/useHomeData.ts` — React Query: trending (stale 10min), topRated, continueWatching
- `components/movie/MovieCard.tsx` — expo-image, rating badge, navigation to MovieDetail, React.memo
- `components/movie/MovieRow.tsx` — horizontal FlatList, getItemLayout, windowSize, React.memo
- `components/movie/HeroBanner.tsx` — top 5, LinearGradient overlay, auto-scroll 4s, dot indicators, Watch tugmasi
- `components/movie/HomeSkeleton.tsx` — pulse animation skeleton (hero + 2 row)
- `screens/home/HomeScreen.tsx` — header, notification badge, RefreshControl, continueWatching (shartli)
- **tsc --noEmit:** ✅ 0 xato

---

### F-062 | 2026-03-09 | [MOBILE] | T-E002 — Auth ekranlar [Emirhan]

- `SplashScreen.tsx` — animated logo (fade+scale), token hydration, Onboarding ga redirect
- `OnboardingScreen.tsx` — 3 slide FlatList (pagingEnabled), dot indicators, Keyingi/Boshlash/O'tkazib
- `LoginScreen.tsx` — email+password, show/hide parol, xato xabarlar, authApi.login → setAuth
- `RegisterScreen.tsx` — username+email+password+confirm, client validation (8 belgi, email format)
- `VerifyEmailScreen.tsx` — token input, authApi.verifyEmail, enumeration-safe xabar
- `ForgotPasswordScreen.tsx` — email input, enumeration-safe success message
- `ProfileSetupScreen.tsx` — bio (200 char), skip tugmasi, updateProfile
- `AuthNavigator.tsx` — real screen larga ulandi
- **tsc --noEmit:** ✅ 0 xato

---

### F-061 | 2026-03-09 | [MOBILE] | T-E001 — Expo loyiha foundation [Emirhan]

- `src/theme/index.ts` — colors, spacing, borderRadius, typography, shadows, RANK_COLORS, RARITY_COLORS
- `src/types/index.ts` — shared types re-export + mobile-specific (AuthStackParamList, nav types, LoginRequest, IWatchProgress, IUserStats)
- `src/utils/storage.ts` — expo-secure-store: saveTokens, getAll, clear
- `src/utils/notifications.ts` — expo-notifications: requestPermission, getExpoPushToken, NOTIFICATION_ROUTES, Android channel
- `src/api/client.ts` — 6 ta per-service Axios instance, auto-refresh interceptor, token rotation
- `src/api/auth.api.ts` — login, register, verifyEmail, forgotPassword, refresh, logout, googleToken
- `src/api/user.api.ts` — getMe, updateProfile, updateFcmToken, search, friends CRUD
- `src/api/content.api.ts` — trending, topRated, search, progress, markComplete, rate
- `src/api/watchParty.api.ts` — createRoom, getRooms, joinByInviteCode, leave, close
- `src/api/battle.api.ts` — createBattle, getMyBattles, accept, reject, leaderboard
- `src/api/notification.api.ts` — getAll, markRead, markAllRead, delete, unreadCount
- `src/store/auth.store.ts` — Zustand: user, accessToken, isAuthenticated, isHydrated, hydrate
- `src/store/movies.store.ts` — trending, topRated, continueWatching, currentMovie
- `src/store/friends.store.ts` — friends, pendingRequests, onlineStatus
- `src/store/watchParty.store.ts` — room, syncState, messages, activeMembers
- `src/store/battle.store.ts` — activeBattles, currentBattle
- `src/store/notification.store.ts` — notifications, unreadCount, markRead/All
- `src/socket/client.ts` — Socket.io: connectSocket, disconnectSocket, getSocket
- `src/hooks/useSocket.ts` — auth-aware socket connect/disconnect
- `src/navigation/AppNavigator.tsx` — auth-aware root navigator, hydration wait
- `src/navigation/AuthNavigator.tsx` — AuthStack (Splash→Onboarding→Login→Register→Verify→ForgotPw→Setup)
- `src/navigation/MainNavigator.tsx` — BottomTabs (Home/Search/Friends/Profile) + nested stacks
- `src/navigation/PlaceholderScreen.tsx` — vaqtinchalik placeholder
- `App.tsx` — QueryClient + GestureHandlerRootView + hydration
- **tsc --noEmit:** ✅ 0 xato

---

### F-060 | 2026-03-08 | [WEB] | T-J012 — React hydration errors #418 / #423 [Jafar]

- **Sabab 1 (asosiy):** `Providers.tsx` — Zustand `persist` middleware localStorage ni gidratatsiya paytida sinxron o'qib, `NextIntlClientProvider` locale ni o'zgartiradi → server va client HTML mos kelmaydi (#418) + render paytida state yangilanishi (#423)
- **Yechim:** `useState('uz')` boshlang'ich qiymat (server HTML bilan mos), `useEffect` da persisted locale qo'llaniladi — faqat mount dan keyin
- **Sabab 2 (ikkilamchi):** `HeroBanner.tsx` — `viewCount.toLocaleString()` Node.js vs browser lokali farqli → HTML mismatch (#418)
- **Yechim:** `formatViews()` — deterministik K/M formatlashtirish (`toLocaleString()` o'rniga)
- **Commit:** `15652a6`

---

### F-057 | 2026-03-07 | [WEB] | T-J008 — Friends page API error handling + React Query [Jafar]

- `toast.store.ts` (Zustand) — success/error/warning/info toastlar, 4s avtomatik yopiladi
- `Toaster.tsx` (DaisyUI `toast`+`alert`) — Providers.tsx ga ulandi
- `friends/page.tsx` — `useQuery` bilan do'stlar/so'rovlar, `useMutation` accept uchun
- `sendRequest`: 201✓ / 409 / 404 / 400 / 500 status kodlariga mos toast xabarlar
- Har foydalanuvchi uchun alohida loading spinner, yuborilgandan keyin disable + ✓ icon

### F-058 | 2026-03-07 | [WEB] | T-J009 — Profile sahifalari [Jafar]

- `profile/me/page.tsx` — React Query bilan `/users/me` + achievements + do'stlar soni
- `profile/[username]/page.tsx` — `AddFriendButton` (client component) qo'shildi
- `components/profile/AddFriendButton.tsx` — o'z profili bo'lsa yashiriladi, 409→"allaqachon" badge

### F-059 | 2026-03-07 | [WEB] | T-J011 — Loading UI + React Query [Jafar]

- `(app)/loading.tsx` — umumiy skeleton
- `home/loading.tsx`, `friends/loading.tsx`, `movies/loading.tsx`, `profile/loading.tsx`
- Next.js navigatsiya paytida avtomatik Suspense skeleton ko'rsatadi (4-5s bo'sh ekran yo'q)

---

## 📱 MOBILE RUN GUIDE (Emirhan)
> To'liq guide: `docs/MOBILE_SETUP.md`
> Yangi PC dan git clone qilganda yoki loyihani birinchi marta ishga tushirganda

### Talablar
| Tool | Versiya | Tekshirish |
|------|---------|------------|
| Node.js | >= 18.18 | `node --version` |
| npm | >= 10.0 | `npm --version` |
| Android Studio | Yangi | Emulator uchun |
| Java JDK | 17 | `java --version` |

---

### 1-qadam: Clone va install

```bash
# 1. Clone
git clone https://github.com/AI-automatization/Rave.git
cd Rave

# 2. MUHIM: apps/package.json yaratish (git da yo'q!)
echo '{"name":"cinesync-apps","private":true}' > apps/package.json

# 3. Root dan install (apps/mobile dan EMAS!)
npm install

# Agar peer-dep xatosi chiqsa:
npm install --legacy-peer-deps
```

---

### 2-qadam: Environment fayllari

```bash
# apps/mobile/ papkasida .env yaratish:
cd apps/mobile

# .env fayli (Saidazim dan so'rash — backend URL lar)
API_BASE_URL=http://10.0.2.2:3001       # Android emulator uchun
# API_BASE_URL=http://localhost:3001    # iOS simulator uchun
# API_BASE_URL=http://192.168.x.x:3001 # Real qurilma uchun (wifi IP)

# Firebase uchun (Saidazim dan olish):
# google-services.json → apps/mobile/android/app/google-services.json
# GoogleService-Info.plist → apps/mobile/ios/GoogleService-Info.plist
```

---

### 3-qadam: Metro Bundler ishga tushirish

```  
cd apps/mobile

# Standard ishga tushirish:
npx expo start

# Yoki development mode:
npx expo start --dev-client

# Cache tozalab ishga tushirish (xato chiqsa):
npx expo start --clear
```

Metro muvaffaqiyatli ishga tushganda:
```
Starting Metro Bundler
Waiting on http://localhost:8081
```

---

### 4-qadam: Qurilmaga ulash

**Android Emulator (tavsiya qilinadi):**
```bash
# Android Studio → AVD Manager → emulator ishga tushir
# Keyin yangi terminалда:
cd apps/mobile
npx expo run:android
```

**Real Android qurilma (USB):**
```bash
# USB debugging yoqilgan bo'lsin
adb devices   # qurilma ko'rinishini tekshir
npx expo run:android
```

**Expo Go ishlamaydi** — loyiha Bare Workflow, faqat native build kerak.

---

### Tez-tez uchraydigan xatolar

| Xato | Yechim |
|------|--------|
| `Cannot find module 'react-native/package.json'` | `apps/package.json` yo'q → 2-qadamga qayt |
| `TypeError: Cannot read properties of undefined (reading 'push')` | `cd /c/Rave && npm install` (root dan) |
| `Metro bundler version mismatch` | Root `package.json` da barcha `metro-*: ~0.82.0` bo'lishi kerak |
| `TypeScript errors` | `cd apps/mobile && npm run typecheck` |
| `EADDRINUSE: port 8081` | `npx expo start --port 8082` |
| `Unable to find module` | `npx expo start --clear` |

---

### Fayllar strukturasi (muhim fayllar)

```
Rave/
├── package.json          ← metro-* ~0.82.0 + overrides: react-native 0.79.6
├── apps/
│   ├── package.json      ← YARATISH KERAK (git da yo'q!)
│   └── mobile/
│       ├── package.json  ← react-native 0.79.6, expo ~53.0.0
│       ├── tsconfig.json ← expo/tsconfig.base
│       ├── babel.config.js ← @app-types alias (not @types!)
│       ├── metro.config.js ← watchFolders + lottie ext
│       └── eas.json      ← EAS Build profillari (git da yo'q)
```

---

## ✅ BAJARILGAN FEATURELAR

### F-001 | 2026-02-26 | [DEVOPS] | Monorepo + Docker + Nginx setup

- **Mas'ul:** Saidazim
- **Sprint:** S1
- **Task:** T-S001
- **Bajarildi:**
  - `package.json` — npm workspaces (services/_, apps/_, shared)
  - `tsconfig.base.json` — strict mode, @shared/\* path aliases
  - `docker-compose.dev.yml` — MongoDB 7, Redis 7 (AOF), Elasticsearch 8.11
  - `docker-compose.prod.yml` — barcha service container + nginx
  - `nginx/nginx.conf` — reverse proxy (3001-3008), WebSocket support, rate limiting zones
- **Commit:** `379c2cd` → github.com:AI-automatization/Rave.git

---

### F-002 | 2026-02-26 | [BACKEND] | Shared utilities — types, logger, middleware, constants

- **Mas'ul:** Saidazim
- **Sprint:** S1
- **Task:** T-S007 (Logging), T-C001 (partial)
- **Bajarildi:**
  - `shared/src/types/index.ts` — ApiResponse<T>, IUser, IMovie, IWatchPartyRoom, IBattle, INotification, IFriendship, JwtPayload, pagination types
  - `shared/src/utils/logger.ts` — Winston (console + file transports, MongoDB prod-da), sensitive field redaction (password/token/secret → [REDACTED])
  - `shared/src/utils/apiResponse.ts` — success(), error(), paginated() helpers
  - `shared/src/utils/errors.ts` — AppError, NotFoundError, UnauthorizedError, ForbiddenError, ValidationError, ConflictError, TooManyRequestsError, BadRequestError
  - `shared/src/middleware/auth.middleware.ts` — verifyToken (RS256), optionalAuth, requireRole, requireVerified
  - `shared/src/middleware/error.middleware.ts` — global Express error handler
  - `shared/src/middleware/rateLimiter.middleware.ts` — Redis-based: apiRateLimiter, authRateLimiter, userRateLimiter
  - `shared/src/constants/index.ts` — POINTS, RANKS, PORTS, REDIS_KEYS, TTL, LIMITS, PATTERNS
  - `shared/src/constants/socketEvents.ts` — SERVER_EVENTS, CLIENT_EVENTS (freeze qilingan)
- **Commit:** `379c2cd`

---

### F-003 | 2026-02-26 | [BACKEND] | Auth Service boilerplate (port 3001)

- **Mas'ul:** Saidazim
- **Sprint:** S1
- **Task:** T-S002 (boilerplate qismi)
- **Bajarildi:**
  - `services/auth/src/models/user.model.ts` — Mongoose schema (email, username, passwordHash, role, isEmailVerified, googleId, fcmTokens, resetToken)
  - `services/auth/src/models/refreshToken.model.ts` — TTL index, tokenHash, ip, userAgent
  - `services/auth/src/services/auth.service.ts` — hashPassword (bcrypt 12 rounds), comparePassword, generateTokens (RS256), register, login, refreshTokens (rotation), logout, verifyEmail, forgotPassword, resetPassword, findOrCreateGoogleUser, bruteForce protection
  - `services/auth/src/controllers/auth.controller.ts` — register, login, refresh, logout, logoutAll, verifyEmail, forgotPassword, resetPassword, googleCallback, getMe
  - `services/auth/src/routes/auth.routes.ts` — barcha endpoint + Passport Google OAuth
  - `services/auth/src/validators/auth.validator.ts` — Joi schemas
  - `services/auth/src/app.ts` — Express, helmet, cors, passport init
  - `services/auth/src/server.ts` — MongoDB connect, Redis connect, graceful shutdown
  - `.env.example`, `Dockerfile`, `tsconfig.json`, `package.json`
- **Commit:** `379c2cd`

---

### F-004 | 2026-02-26 | [BACKEND] | User Service boilerplate (port 3002)

- **Mas'ul:** Saidazim
- **Sprint:** S1
- **Task:** T-S003 (boilerplate qismi)
- **Bajarildi:**
  - `services/user/src/models/user.model.ts` — authId ref, rank, totalPoints, lastSeenAt
  - `services/user/src/models/friendship.model.ts` — requesterId, receiverId, status (pending/accepted/blocked)
  - `services/user/src/services/user.service.ts` — getProfile, getPublicProfile, updateProfile, heartbeat (Redis TTL 3min), isUserOnline, sendFriendRequest, acceptFriendRequest (points award), removeFriend, getFriends, addPoints, recalculateRank
  - `services/user/src/controllers/user.controller.ts` + routes + app + server
- **Commit:** `379c2cd`

---

### F-005 | 2026-02-26 | [BACKEND] | Content Service boilerplate (port 3003)

- **Mas'ul:** Saidazim
- **Sprint:** S2
- **Task:** T-S005
- **Bajarildi:**
  - `services/content/src/models/movie.model.ts` — title, genre, year, duration, HLS videoUrl, isPublished, viewCount, elasticId
  - `services/content/src/models/watchHistory.model.ts` — progress (0-100%), completed (≥90%), durationWatched, TTL index yo'q
  - `services/content/src/models/rating.model.ts` — score (1-10), review, unique (userId+movieId)
  - `services/content/src/services/content.service.ts` — getMovieById (Redis cache), listMovies, searchMovies (Elasticsearch multi_match + fuzzy), createMovie (ES index), updateMovie (cache invalidate), deleteMovie, recordWatchHistory (upsert), getWatchHistory, rateMovie (avg recalc)
  - `services/content/src/controllers/content.controller.ts` + routes (operator/admin guard) + app + server
- **Commit:** `379c2cd`

---

### F-006 | 2026-02-26 | [BACKEND] | Watch Party Service boilerplate (port 3004)

- **Mas'ul:** Saidazim
- **Sprint:** S2
- **Task:** T-S006 (boilerplate qismi)
- **Bajarildi:**
  - `services/watch-party/src/models/watchPartyRoom.model.ts` — inviteCode, members, maxMembers (10), status, currentTime, isPlaying
  - `services/watch-party/src/services/watchParty.service.ts` — createRoom (random inviteCode), joinRoom, leaveRoom (owner→close), syncState (±2s threshold), getSyncState, needsResync, kickMember
  - `services/watch-party/src/socket/watchParty.socket.ts` — JWT auth middleware, join/leave/play/pause/seek/buffer/chat/emoji/kick handlers, latency compensation
  - HTTP controllers + routes + app (Socket.io init) + server
- **Commit:** `379c2cd`

---

### F-007 | 2026-02-26 | [BACKEND] | Battle Service boilerplate (port 3005)

- **Mas'ul:** Saidazim
- **Sprint:** S3
- **Task:** T-S008
- **Bajarildi:**
  - `services/battle/src/models/battle.model.ts` — duration (3/5/7 kun), status, startDate, endDate, winnerId
  - `services/battle/src/models/battleParticipant.model.ts` — score, moviesWatched, minutesWatched, hasAccepted
  - `services/battle/src/services/battle.service.ts` — createBattle, inviteParticipant, acceptInvite, addMovieScore (Redis ZINCRBY), getLeaderboard (Redis sorted set ZREVRANGEBYSCORE), getUserActiveBattles, cron hourly resolution (BATTLE_WIN points award)
  - Controllers + routes + app + server
- **Commit:** `379c2cd`

---

### F-008 | 2026-02-26 | [BACKEND] | Notification Service boilerplate (port 3007)

- **Mas'ul:** Saidazim
- **Sprint:** S3
- **Task:** T-S010
- **Bajarildi:**
  - `services/notification/src/models/notification.model.ts` — 8 NotificationType, data (Mixed), TTL 90 kun
  - `services/notification/src/queues/email.queue.ts` — Bull queue, nodemailer transporter, 3 retries (exponential backoff)
  - `services/notification/src/services/notification.service.ts` — sendInApp, sendPush (FCM multicast), sendEmail (Bull enqueue), getNotifications, markAsRead, markAllAsRead, getUnreadCount, deleteNotification
  - `services/notification/src/app.ts` — Firebase Admin init
  - Controllers + routes + server
- **Commit:** `379c2cd`

---

### F-009 | 2026-02-26 | [BACKEND] | Admin Service boilerplate (port 3008)

- **Mas'ul:** Saidazim
- **Sprint:** S4
- **Task:** T-S011 (boilerplate qismi)
- **Bajarildi:**
  - `services/admin/src/services/admin.service.ts` — getDashboardStats (totalUsers, activeUsers via Redis keys), listUsers (filter: role, isBlocked, search), blockUser (Redis session invalidate), unblockUser, changeUserRole, deleteUser
  - requireRole('admin', 'superadmin') guard barcha route
  - Controllers + routes + app + server
- **Commit:** `379c2cd`

---

### F-010 | 2026-02-27 | [BACKEND] | User Service — avatar upload + settings + profile sync (T-S002)

- **Mas'ul:** Saidazim
- **Sprint:** S1
- **Bajarildi:**
  - `services/user/src/models/user.model.ts` — `settings.notifications` (8 ta toggle) qo'shildi
  - `services/user/src/validators/user.validator.ts` — updateProfile, updateSettings, createProfile, fcmToken Joi schemas
  - `services/user/src/services/user.service.ts` — `updateAvatar`, `getSettings`, `updateSettings`, `createProfile`, `addFcmToken`, `removeFcmToken` metodlar
  - `services/user/src/controllers/user.controller.ts` — `uploadAvatar`, `getSettings`, `updateSettings`, `createProfile`, `addFcmToken`, `removeFcmToken` handlerlar
  - `services/user/src/routes/user.routes.ts` — multer (JPEG/PNG/WebP, max 5MB), `PATCH /me/avatar`, `GET/PATCH /me/settings`, `POST/DELETE /me/fcm-token`, `POST /internal/profile`
  - `services/user/src/app.ts` — `/uploads` static file serving
  - `services/auth/src/services/auth.service.ts` — register/Google OAuth da `syncUserProfile()` chaqiradi (user service `/internal/profile`)
  - `services/auth/src/config/index.ts` — `USER_SERVICE_URL` env var qo'shildi
  - `services/auth/.env.example` — `USER_SERVICE_URL` qo'shildi

---

### F-011 | 2026-02-27 | [BACKEND] | Missing MongoDB Schemas + Seed Script (T-S003)

- **Mas'ul:** Saidazim
- **Sprint:** S1
- **Bajarildi:**
  - `services/user/src/models/achievement.model.ts` — key, title, description, iconUrl, rarity (5 daraja), points, condition, isSecret; key+rarity index
  - `services/user/src/models/userAchievement.model.ts` — userId, achievementId, achievementKey, unlockedAt; (userId+achievementKey) unique index
  - `services/admin/src/models/feedback.model.ts` — userId, type (bug/feature/other), content, status (4 holat), adminReply, repliedAt, repliedBy
  - `services/admin/src/models/apiLog.model.ts` — service, method, url, statusCode, duration, userId, level, meta; TTL index (30 kun)
  - `scripts/seed.ts` — Auth+User+Content DB ga ulangan seed: 4 user (superadmin, operator, 2 test), 25 achievement, 12 demo film (IMDB top filmlar)
  - `scripts/tsconfig.json` — seed script uchun TypeScript config
  - `package.json` — `npm run seed` script qo'shildi

---

### F-012 | 2026-02-27 | [BACKEND] | Watch Party — audio mute control (T-S004)

- **Mas'ul:** Saidazim
- **Sprint:** S2
- **Bajarildi:**
  - `services/watch-party/src/socket/watchParty.socket.ts` — `CLIENT_EVENTS.MUTE_MEMBER` handler: owner tekshiruvi, member mavjudligi tekshiruvi, `SERVER_EVENTS.MEMBER_MUTED` broadcast (userId, mutedBy, reason, timestamp)
  - `services/watch-party/src/services/watchParty.service.ts` — `setMuteState()` (Redis Set: `watch_party:muted:{roomId}`), `getMutedMembers()`, `isMuted()` metodlar; TTL: WATCH_PARTY_ROOM (24h)
  - Buffer/sync flow allaqachon ishlagan: `BUFFER_START` → boshqa a'zolarga `VIDEO_BUFFER` (buffering: true) broadcast ✅
  - Redis room state cache allaqachon ishlagan: `cacheRoomState()` `watch_party:{roomId}` da ✅

---

### F-013 | 2026-02-27 | [BACKEND] | Content Service — Elasticsearch init + stats (T-S005)

- **Mas'ul:** Saidazim
- **Sprint:** S2
- **Bajarildi:**
  - `services/content/src/utils/elastic.init.ts` — `movies` index mapping: custom analyzer (cinesync_standard, cinesync_autocomplete, cinesync_search, cinesync_russian), Russian stemmer/stopwords, edge n-gram tokenizer (prefix search), field mappings (title^3, originalTitle^2, description, genre keyword, year integer, rating float, TTL index)
  - `services/content/src/server.ts` — startup da `initElasticsearchIndex()` chaqirish (idempotent — mavjud bo'lsa skip)
  - `services/content/src/services/content.service.ts` — `getStats()` metod: genre distribution aggregation, year histogram (top 20), top 10 rated movies, total/published count
  - `services/content/src/controllers/content.controller.ts` — `getStats` handler
  - `services/content/src/routes/content.routes.ts` — `GET /movies/stats` (operator+ role)
  - **Qolgan:** HLS upload pipeline → T-S005b ga ko'chirildi

---

### F-014 | 2026-02-27 | [BACKEND] | Achievement System (T-S006)

- **Mas'ul:** Saidazim
- **Sprint:** S3
- **Bajarildi:**
  - `services/user/src/services/achievement.service.ts` — `AchievementService`: `checkAndUnlock(userId, event)` metod (10 event turi: movie_watched, watch_party, battle, friend, review, streak, rank, watch_time, daily_minutes), `getUserAchievements(includeSecret)`, `getAchievementStats()`
  - `services/user/src/controllers/achievement.controller.ts` — `getMyAchievements`, `getMyStats`, `getUserAchievements` (public, secret hidden), `triggerEvent` (internal)
  - `services/user/src/routes/achievement.routes.ts` — `GET /achievements/me`, `GET /achievements/me/stats`, `GET /achievements/:id`, `POST /achievements/internal/trigger`
  - `services/user/src/app.ts` — `/achievements` routerini qo'shildi
  - Models (T-S003 dan): `Achievement` + `UserAchievement` ✅
  - 25 achievement ta'rifi (seed.ts da) ✅
  - Secret achievement: isSecret flag, caller ga yashiriladi ✅

---

### F-015 | 2026-02-27 | [BACKEND] | Rating + Review to'liq (T-S007)
- **Mas'ul:** Saidazim
- **Sprint:** S3
- **Bajarildi:**
  - `services/content/src/services/content.service.ts` — `getMovieRatings(movieId, page, limit)`, `deleteUserRating(userId, movieId)`, `deleteRatingByModerator(ratingId)`, `recalculateRating()` private metod (rating avg qayta hisobl + Redis cache invalidate)
  - `services/content/src/controllers/content.controller.ts` — `getMovieRatings`, `deleteMyRating`, `deleteRatingModerator` handlerlar
  - `services/content/src/routes/content.routes.ts` — `GET /movies/:id/ratings`, `DELETE /movies/:id/rate`, `DELETE /ratings/:ratingId` (operator+)
  - Movie not found check `rateMovie()` da qo'shildi

---

### F-016 | 2026-02-27 | [BACKEND] | Admin Service — to'liq funksionallik (T-S008)
- **Mas'ul:** Saidazim
- **Sprint:** S4
- **Bajarildi:**
  - `services/admin/src/config/index.ts` — `CONTENT_MONGO_URI`, `USER_MONGO_URI` env var qo'shildi
  - `services/admin/src/services/admin.service.ts` — `getMovieModel()` (content DB inline schema), movie: `listMovies`, `publishMovie`, `unpublishMovie`, `deleteMovie`, `operatorUpdateMovie`; feedback: `listFeedback`, `replyFeedback`, `submitFeedback`; analytics: `getAnalytics` (totalUsers, newUsersToday, newUsersThisMonth, activeUsers via Redis, movie counts); logs: `getLogs` (filter: level, service, dateFrom, dateTo)
  - `services/admin/src/controllers/admin.controller.ts` — 11 ta yangi handler: listMovies, publishMovie, unpublishMovie, deleteMovie, operatorUpdateMovie, listFeedback, replyFeedback, submitFeedback, getAnalytics, getLogs
  - `services/admin/src/routes/admin.routes.ts` — movies (list/publish/unpublish/delete), feedback (list/reply), analytics, logs endpointlari
  - `services/admin/src/routes/operator.routes.ts` — `/operator/*`: movie list+edit (publish yo'q), feedback submit
  - `services/admin/src/app.ts` — `/operator` router qo'shildi

---

## 🐛 TUZATILGAN BUGLAR

| #   | Sana | Tur | Muammo        | Yechim |
| --- | ---- | --- | ------------- | ------ |
| BUG-001 | 2026-02-27 | TS2349 | `admin.service.ts` `getMovieModel()`/`getUserModel()` not callable (union type) | Explicit `Model<Record<string, unknown>>` return type |
| BUG-002 | 2026-02-27 | TS2322/TS2556 | `rateLimiter.middleware.ts` SendCommandFn type mismatch | `sendRedisCommand` helper + `unknown as SendCommandFn` |
| BUG-003 | 2026-02-27 | TS2352 | `error.middleware.ts` Error → Record<string, unknown> cast | `as unknown as Record<string, unknown>` |
| BUG-004 | 2026-02-27 | TS2352 | `user.service.ts` lean() → IUserDocument cast | `as unknown as IUserDocument & ...` |
| BUG-005 | 2026-02-27 | TS2352 | `content.service.ts` Query → Promise cast | `as unknown as Promise<...>` |
| BUG-006 | 2026-02-27 | TS2790 | 13 model faylda `delete ret.__v` | `Reflect.deleteProperty(ret, '__v')` |
| BUG-007 | 2026-02-27 | TS6133 | `logger.ts` `simple` unused import | Import o'chirildi |
| BUG-008 | 2026-02-27 | TS6133 | `auth.service.ts` `NotFoundError` unused | Import o'chirildi |
| BUG-009 | 2026-02-27 | TS6133 | `battle.service.ts` `ForbiddenError` unused | Import o'chirildi |
| BUG-010 | 2026-02-27 | TS6133 | `admin.service.ts` `blockedUsers` unused | Ortiqcha query o'chirildi |
| BUG-012 | 2026-02-28 | Runtime | `elastic.init.ts` apostrophe_filter duplicate mappings (ASCII `'` 2x) | Unicode escape: `\\u2018=>\\u0027`, `\\u2019=>\\u0027` |
| BUG-013 | 2026-02-28 | Runtime | `elastic.init.ts` `boost` ES 8.x da qabul qilinmaydi | `title` va `originalTitle` fieldlaridan `boost` o'chirildi |

---

### F-017 | 2026-02-27 | [BACKEND] | Debug Log + TypeScript fixes + Logging config

- **Mas'ul:** Saidazim
- **Bajarildi:**
  - `docs/DebugLog.md` — barcha TypeScript xatolar hujjatlashtirildi (BUG-001..BUG-011)
  - 16 ta TypeScript xato tuzatildi (7 ta service, 13 ta fayl)
  - `shared/src/utils/logger.ts` — `fs.mkdirSync('logs', {recursive:true})` qo'shildi (har doim logs/ papka yaratiladi)
  - `shared/src/utils/logger.ts` — `LOG_LEVEL` env variable qo'llab-quvvatlandi
  - Barcha 7 service `.env.example` — `LOG_LEVEL=debug` qo'shildi
  - Winston: `logs/error.log` (10MB×5) + `logs/combined.log` (10MB×30) har doim yozadi

---

### F-018 | 2026-02-27 | [BACKEND] | Service-to-Service Communication (T-C005)

- **Mas'ul:** Saidazim
- **Bajarildi:**
  - `shared/src/utils/serviceClient.ts` — typed HTTP client (axios): `addUserPoints()`, `triggerAchievement()`, `sendInternalNotification()`, `getMovieInfo()`, `validateInternalSecret()`, `requireInternalSecret()` middleware
  - `shared/src/index.ts` — serviceClient export qo'shildi
  - `services/battle/src/services/battle.service.ts` — `resolveBattle()` da battle win → `addUserPoints()` + `triggerAchievement('battle')` (non-blocking)
  - `services/user/src/services/user.service.ts` — `acceptFriendRequest()` da → `triggerAchievement('friend')` (har ikkala user uchun, non-blocking)
  - `services/content/src/services/content.service.ts` — `recordWatchHistory()` da completed=true → `triggerAchievement('movie_watched')` (non-blocking)
  - `services/user/src/controllers/user.controller.ts` — `addPoints` handler qo'shildi (internal endpoint)
  - `services/user/src/routes/user.routes.ts` — `POST /internal/add-points` route qo'shildi
  - Barcha 7 service `.env.example` — `INTERNAL_SECRET` qo'shildi

---

### F-019 | 2026-02-27 | [BACKEND] | Git Workflow + PR Template (T-C003)

- **Mas'ul:** Saidazim
- **Bajarildi:**
  - `.github/PULL_REQUEST_TEMPLATE.md` — TypeScript, security, zone, API format tekshiruv ro'yxati
  - `.github/ISSUE_TEMPLATE/bug_report.md` — servis, fayl, qayta ishlab chiqarish, log maydonlari
  - `.github/ISSUE_TEMPLATE/feature_request.md` — prioritet, zona, texnik yondashuv maydonlari

---

### F-020 | 2026-02-27 | [DEVOPS] | CI/CD GitHub Actions (T-S010)

- **Mas'ul:** Saidazim
- **Bajarildi:**
  - `.github/workflows/lint.yml` — PR da barcha 8 service typecheck (matrix strategy, fail-fast: false)
  - `.github/workflows/test.yml` — PR da Jest tests (MongoDB + Redis service containers)
  - `.github/workflows/docker-build.yml` — develop/main push da Docker build + GHCR push (7 service, cache-from/to gha)
  - `.github/workflows/deploy-staging.yml` — develop branch → staging (environment: staging, manual trigger placeholder)
  - `.github/workflows/deploy-prod.yml` — main branch → production (workflow_dispatch confirm='yes' + push, environment: production)

---

### F-021 | 2026-02-27 | [BACKEND] | Swagger API Docs + /api/v1/ prefix (T-S011 + T-C001)

- **Mas'ul:** Saidazim
- **Bajarildi:**
  - Barcha 7 service `src/utils/swagger.ts` — swagger-jsdoc config (OpenAPI 3.0, bearerAuth, tags)
  - Barcha 7 service `app.ts` — `GET /api-docs` (Swagger UI) + `GET /api-docs.json` (spec) route qo'shildi
  - **API versioning** — barcha 7 service `/api/v1/` prefix:
    - auth: `/api/v1/auth`
    - user: `/api/v1/users`, `/api/v1/achievements`
    - content: `/api/v1/movies`
    - watch-party: `/api/v1/watch-party`
    - battle: `/api/v1/battles`
    - notification: `/api/v1/notifications`
    - admin: `/api/v1/admin`, `/api/v1/operator`
  - `swagger-jsdoc` + `swagger-ui-express` — root workspace da o'rnatildi

---

### F-022 | 2026-02-28 | [BACKEND] | Auth E2E login testi + Services startup + ES index yaratildi (T-S001)

- **Mas'ul:** Saidazim
- **Bajarildi:**
  - Barcha 7 service ishga tushirildi (ports 3001-3008, hammasi `/health` → 200 OK)
  - `services/content/src/utils/elastic.init.ts` — BUG-012 tuzatildi: apostrophe_filter mappings ASCII → Unicode escape sequences
  - `services/content/src/utils/elastic.init.ts` — BUG-013 tuzatildi: `boost` parametri ES 8.x incompatible, o'chirildi
  - Elasticsearch `movies` index muvaffaqiyatli yaratildi (green, 1 shard, 0 replica)
  - Auth login E2E test o'tdi: `POST /api/v1/auth/login` → `accessToken` + `refreshToken` + `user` qaytadi
  - Seed credentials (test1@cinesync.app / Test123!) bilan login ✅ ishladi
  - **SMTP (email):** mailtrap.io dan credentials kerak bo'lganda to'ldirish (ixtiyoriy dev uchun)

---

---

---

### F-035 | 2026-02-28 | [WEB] | Next.js Web App — Sprint 1-4 (T-J001..T-J006)

- **Mas'ul:** Jafar
- **Sprint:** S1-S4
- **Commit:** `f32c5e5 feat(web): add Next.js web app — Sprint 1-5 (T-J001..T-J007)`
- **Bajarildi:**
  - **T-J001** — Next.js App Router setup, Tailwind v4, Shadcn/ui, Zustand + React Query, Socket.io client, JWT auth middleware
  - **T-J002** — Landing page: Hero, Features, How it works, Testimonials, Pricing, FAQ, JSON-LD schema, SEO metadata
  - **T-J003** — App layout (sidebar/topbar), `(app)/home/page.tsx` (SSR+ISR), `(app)/movies/[slug]/page.tsx` (dynamic metadata + Movie JSON-LD)
  - **T-J004** — `VideoPlayer.tsx` (hls.js, custom controls, keyboard shortcuts Space/Arrow/F/M, ±2s Watch Party sync), `(app)/search/page.tsx` (debounced, infinite scroll)
  - **T-J005** — `(app)/party/[roomId]/page.tsx` (70% video + 30% chat split layout, sync state, floating emoji, members list), `ChatPanel.tsx`
  - **T-J006** — `(app)/battle/page.tsx` (create modal, filter), `(app)/profile/[username]/page.tsx` (SSR, OG meta, achievements grid, rank badge), `(app)/stats/page.tsx`
  - `manifest.json` + `robots.txt` + PWA icons (72..512px)
  - Playwright test suite (`/tests/auth.spec.ts`) + `playwright.config.ts`
  - API rewrites (`next.config.mjs`) → backend services (3001-3007)

---

### F-036 | 2026-02-28 | [IKKALASI] | Design Tokens — T-C002

- **Mas'ul:** Saidazim + Emirhan + Jafar
- **Sprint:** S1
- **Bajarildi:**
  - **Mobile:** `apps/mobile/src/theme/index.ts` — colors (#E50914, #0A0A0F, #111118...), spacing, borderRadius, typography (Bebas Neue / DM Sans), shadows, RANK_COLORS
  - **Web:** `apps/web/src/app/globals.css` — Tailwind v4 `@theme` block, CSS custom properties
  - Dark mode ONLY — barcha platform

---

---

---

---

---

---

### F-041 | 2026-03-02 | [DEVOPS] | Docker — web hot-reload va bitta komanda setup

- **Mas'ul:** Saidazim
- **Bajarildi:**
  - `apps/web/Dockerfile.dev` — `WATCHPACK_POLLING=true` qo'shildi (Docker FS polling)
  - `docker-compose.dev.yml` — web service ga volumes qo'shildi: `./apps/web/src`, `./apps/web/public`, `web_node_modules`, `web_next_cache`
  - `apps/web/package.json` — `@tailwindcss/oxide-linux-x64-gnu` o'chirildi (Alpine musl bilan mos kelmaydi)
  - Bitta komanda: `docker compose -f docker-compose.dev.yml up -d --build`

---

### F-042 | 2026-03-02 | [BACKEND] | User Service — do'stlik endpointlari qo'shildi

- **Mas'ul:** Saidazim
- **Bajarildi:**
  - `GET /api/v1/users/search?q=` — username bo'yicha qidiruv + `isOnline` holati
  - `GET /api/v1/users/friends` — do'stlar ro'yxati (avval faqat `/me/friends` bor edi)
  - `GET /api/v1/users/friends/requests` — pending so'rovlar, requester profili bilan populate qilingan
  - `POST /api/v1/users/friends/request` — body `{userId}` bilan so'rov yuborish
  - `PATCH /api/v1/users/friends/accept/:friendshipId` — friendship `_id` bilan qabul qilish

---

### BUG-B001 | 2026-03-02 | [BACKEND] | Express route ordering — `/:id` statik routelarni yutib olishi

- **Mas'ul:** Saidazim
- **Muammo:** `GET /:id` dinamik route `GET /friends`, `GET /search` kabi statik routelardan OLDIN
  ro'yxatdan o'tgan edi. Express `/friends` ni `id="friends"` deb qabul qilgan →
  `User.findOne({ authId: "friends" })` → 404 "User not found".
- **Yechim:** Barcha statik routelar `/:id` dan OLDIN ro'yxatdan o'tkazildi.
- **QOIDA — UCHALA DASTURCHI UCHUN:**

```
❌ NOTO'G'RI:
  router.get('/:id', ...)        ← dinamik birinchi
  router.get('/search', ...)     ← hech qachon yetmaydi
  router.get('/me/friends', ...) ← hech qachon yetmaydi

✅ TO'G'RI:
  router.get('/me', ...)         ← statik — /me
  router.get('/me/friends', ...) ← statik — /me/friends
  router.get('/search', ...)     ← statik — /search
  router.get('/friends', ...)    ← statik — /friends
  router.get('/:id', ...)        ← dinamik — ENG OXIRIDA
```

---

### BUG-B002 | 2026-03-02 | [BACKEND] | User identifier mismatch — `_id` vs `authId`

- **Mas'ul:** Saidazim
- **Muammo:** Web `u._id` (MongoDB profile ObjectId) yuboradi, backend `authId` (auth service userId)
  bo'yicha qidiradi → 404 "User not found".
- **Yechim:** `sendFriendRequestByProfileId()` metodi qo'shildi — `_id` orqali `authId` ni
  topib keyin operatsiyani bajaradi.
- **QOIDA — UCHALA DASTURCHI UCHUN:**

```
User collection da IKKI xil identifier bor:

  _id     → MongoDB profile ObjectId  (69a54b70f808cfa9413654f0)
              - faqat user service ichki ishlatish uchun
              - frontend ga expose qilmang (to'g'ridan foydalanmang)

  authId  → Auth service user._id     (69a545eee6496cf6ac946ecc)
              - servislar arasi muloqot uchun STANDART identifier
              - JWT ichida userId = authId
              - Friendship, Battle, WatchParty — barchasi authId ishlatadi

QOIDALAR:
  ✅ Servislar arasi: authId ishlatish
  ✅ Frontend → backend: authId yuborish (search response da authId bor)
  ✅ u.authId — to'g'ri
  ❌ u._id   — foydalanuvchini identify qilish uchun XATO
```

---

### BUG-B003 | 2026-03-02 | [DEVOPS] | root package.json ga react/react-dom qo'shish XATO

- **Mas'ul:** Saidazim
- **Muammo:** `react: 18.3.1` va `react-dom: 18.3.1` monorepo root `package.json` ga
  `dependencies` sifatida qo'shilgan. npm workspaces hoisting natijasida `apps/web` ning
  React versiyasi bilan collision → 129 TypeScript xatosi.
- **Yechim:** Root `package.json` dan o'chirish kerak — `apps/web/package.json` da allaqachon bor.
- **QOIDA:**

```
Root package.json dependencies:
  ✅ swagger-jsdoc, swagger-ui-express  — backend uchun shared dev tools
  ✅ @playwright/test                   — test uchun
  ❌ react, react-dom                   — faqat apps/web/package.json da bo'lishi kerak
  ❌ react-native, expo                 — faqat apps/mobile/package.json da bo'lishi kerak
```

---

---

---

---

---

_docs/Done.md | CineSync | Yangilangan: 2026-03-07 (Mobile Expo ga ko'chirildi, qayta qurilmoqda)_
