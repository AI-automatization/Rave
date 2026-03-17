# CineSync — OCHIQ VAZIFALAR

# Yangilangan: 2026-03-15

# 3 dasturchi: Saidazim (Backend) | Emirhan (Mobile) | Jafar (Web)

---

## 📌 QOIDALAR

```
1. Har topilgan bug/task → shu faylga DARHOL yoziladi
2. Sessiya boshida shu faylni O'QIB, oxirgi T-raqamdan davom
3. Fix bo'lgach → shu yerdan O'CHIRISH → docs/Done.md ga KO'CHIRISH
4. Prioritet: P0=kritik, P1=muhim, P2=o'rta, P3=past
5. Sprint: S1=hozir, S2=keyingi hafta, S3=keyingi sprint, S4-5=keyin
6. Oxirgi T-raqam: S→032, E→039, J→014, C→009
```

---

# ═══════════════════════════════════════

# 🔴 SAIDAZIM — BACKEND + ADMIN

# ═══════════════════════════════════════

## SPRINT 2 — Content + Watch Party

### ✅ T-S026 | TUGADI → Done.md F-118
### ✅ T-S027 | TUGADI → Done.md F-118
### ✅ T-S028 | TUGADI → Done.md F-118
### ✅ T-S029 | TUGADI → Done.md F-118

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

## ARXITEKTURA REVIEW — 2026-03-11 (Bekzod QA)



### T-S009 | P2 | [ADMIN] | Admin Dashboard UI — React + Vite

- **Sana:** 2026-02-26
- **Mas'ul:** Saidazim
- **Fayl:** `apps/admin-ui/`
- **Holat:** ✅ TUGADI (2026-03-14)
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

### ✅ T-E039 | TUGADI → Done.md F-121
### ✅ T-E038 | TUGADI → Done.md F-120

---

### ✅ T-E031 | TUGADI → Done.md F-109

**Backend tayyor** — faqat mobile UI va flow kerak.

**Flow:**
```
1. LoginScreen → "Telegram bilan kirish" tugmasi
2. POST /auth/telegram/init → { state, botUrl }
3. Linking.openURL(botUrl)  ← Telegram ilovasi ochiladi
4. Foydalanuvchi botda /start bosadi
5. Poll: GET /auth/telegram/poll?state=STATE (har 2 sek, max 2 daqiqa)
6. Response 200 (not 202) → { accessToken, refreshToken, user }
7. Token saqlash → HomeScreen ga o'tish
8. Background: Linking.openURL("https://t.me/gatsCinema_bot?start=USER_ID")
   ← Notification linking uchun (ixtiyoriy, user rozi bo'lsa)
```

**API Endpoints (production):**
```
POST https://auth-production-47a8.up.railway.app/api/v1/auth/telegram/init
  Response: { success: true, data: { state: "abc123", botUrl: "https://t.me/gatsCinema_bot?start=abc123" } }

GET  https://auth-production-47a8.up.railway.app/api/v1/auth/telegram/poll?state=abc123
  Pending:  { success: true, data: null, message: "Pending" }   → HTTP 202
  Success:  { success: true, data: { accessToken, refreshToken, user } } → HTTP 200
```

**UI:**
```tsx
// LoginScreen da qo'shish:
<TouchableOpacity onPress={handleTelegramLogin}>
  <Text>Telegram bilan kirish</Text>
</TouchableOpacity>

// handleTelegramLogin:
// 1. POST /init → botUrl olish
// 2. Linking.openURL(botUrl)
// 3. setInterval poll (har 2000ms)
// 4. 202 → kutish | 200 → login | error → xato ko'rsatish
// 5. Timeout 2 daqiqadan keyin "Amal qilmadi, qayta urinib ko'ring"
```

**Kerakli packages:** faqat `Linking` (Expo built-in), axios (allaqachon bor)

---

## SPRINT 2 — Asosiy ekranlar



## SPRINT 3 — Ijtimoiy ekranlar

## SPRINT 4 — Profil + Bildirishnoma





## SPRINT 5 — Sifat + Test




# ═══════════════════════════════════════

# 🔵 JAFAR — NEXT.JS WEB CLIENT

# ═══════════════════════════════════════

## CODE REVIEW — 2026-03-11 (Bekzod QA)

### ✅ T-J012 | TUGADI → Done.md F-122
### ✅ T-J013 | TUGADI → Done.md F-123

---

### T-J014 | P0 | [WEB] | SECURITY: postMessage wildcard origin + JSON-LD XSS injection

- **Sana:** 2026-03-11
- **Mas'ul:** Jafar
- **Holat:** 🔄 pending[Jafar]
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
- **Holat:** ✅ Mobile M1-M7 TUGADI (2026-03-17) | Backend B1-B2 pending[Saidazim] | Web W1 pending[Jafar]
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

- [x] **M6. UX yaxshilash** ✅ 2026-03-17
  - Loading overlay — sahifa yuklanayotganda spinner
  - Sayt reklamalarini bloklash (reklama domainlarni intercept qilish)
  - `onNavigationStateChange` — sayt redirect qilsa ogohlantirish
  - Fullscreen mode — statusbar yashirish, WebView to'liq ekran
  - Error handling — sayt yuklanmasa fallback UI

- [x] **M7. Saytga moslashgan adapterlar** ✅ 2026-03-17
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

### T-C008 | P0 | [IKKALASI] | ARCHITECTURE: Web client shared types ishlatmaydi — 20+ type divergence

- **Sana:** 2026-03-11
- **Mas'ul:** Jafar (Web) + Saidazim (Shared types yangilash)
- **Holat:** 🔄 pending[Jafar]
- **Fayllar:**
  - `apps/web/package.json` — `@cinesync/shared` dependency **yo'q**
  - `apps/web/src/types/index.ts` — barcha typelar **qo'lda duplicate** qilingan
  - `shared/src/types/index.ts` — asl typelar
- **Muammo (ROOT CAUSE):** Web client `@cinesync/shared` package ni **umuman import qilmaydi**. 7 ta backend service va mobile app shared dan oladi, lekin web client barcha type larni local yozgan. Natijada **20+ field divergence**:
  - `ApiResponse.data`: shared da `T | null`, web da `T` → server `null` qaytarsa **crash**
  - `IMovie`: 15+ field farq (slug, poster, backdrop, genres, director, cast — web da bor, shared da yo'q yoki boshqacha)
  - `IUser.rank`: shared `'Bronze'|'Silver'|'Gold'|'Platinum'|'Diamond'`, web `'bronze'|'silver'|...|'legend'` → **case mismatch + noto'g'ri qiymatlar**
  - `INotification`: web da `'system'` type bor (shared da yo'q), `'friend_online'` yo'q (shared da bor)
  - `IAchievement.rarity`: web da `'secret'` yo'q
  - `IBattle`: 4+ field yo'q, `'cancelled'` status yo'q
  - `PaginationMeta`: web da `pages` field bor (server hech qachon bermaydi)
- **Bajarilishi kerak:**
  - [ ] `apps/web/package.json` ga `"@cinesync/shared": "*"` qo'shish
  - [ ] `tsconfig.json` paths → `@shared/*` resolve qilish
  - [ ] `apps/web/src/types/index.ts` → shared dan re-export (mobile qilganidek)
  - [ ] Shared `IMovie` ni yangilash: `slug`, `director`, `cast`, `reviewCount` qo'shish (Saidazim bilan kelishib)
  - [ ] Shared `IUser` ni yangilash: `isOnline`, `lastSeenAt` qo'shish
  - [ ] Barcha local type duplicate larni o'chirish
  - **MUHIM:** Bu task barcha web type-related buglarning **asosiy sababi**. Birinchi tuzatilishi kerak.

---

### T-C009 | P1 | [IKKALASI] | Socket event payload mismatch + web hardcoded event strings

- **Sana:** 2026-03-11
- **Mas'ul:** Emirhan (Mobile) + Jafar (Web) + Saidazim (Backend payload)
- **Holat:** ✅ Mobile qismi TUGADI (2026-03-12) | Web qismi pending[Jafar] (T-C008 dan keyin)
- **Fayllar:**
  - `apps/web/src/hooks/useWatchParty.ts` — 14+ hardcoded event string
  - `apps/web/src/hooks/useVoiceChat.ts` — 8+ hardcoded event string
  - `services/watch-party/src/socket/watchParty.socket.ts` (93, 116-119-qator)
  - `shared/src/constants/socketEvents.ts`
- **Qolgan ishlar (Jafar):**
  - [ ] **Web:** `@cinesync/shared` dan `SERVER_EVENTS`/`CLIENT_EVENTS` import qilish (T-C008 dan keyin)
  - [ ] **Web:** barcha hardcoded event string larni shared constant bilan almashtirish
  - [ ] **Backend (ixtiyoriy):** Server payload ga `members[]` qo'shish

---


### T-C004 | P2 | [IKKALASI] | Dizayn Tasklari

- **Sprint:** S2-S5
- **Subtasks:** TASK-D-002..TASK-D-010
- **Output:** MovieCard hover, Hero backdrop, online status vizual, emoji float, achievement animation, battle progress, skeleton loading, Storybook, dark mode QA

---

## 📊 STATISTIKA (2026-03-15 yangilandi)

| Jamoa    | Tugallandi | Qolgan | Yangi (2026-03-15) |
| -------- | ---------- | ------ | ---- |
| Saidazim | T-S001..T-S008, T-S010, T-S011, T-S030, T-S031, T-S032 ✅ | T-S005b, T-S016 | T-S032 (video extractor) |
| Emirhan  | T-E015..T-E037 ✅ | T-E038, T-E039 | T-E038 (search crash), T-E039 (video extractor) |
| Jafar    | T-J001..T-J006, T-J008, T-J009, T-J011 ✅ | T-J007, T-J010 | Code: T-J012..T-J015 |
| Umumiy   | T-C001..T-C003, T-C005 ✅ | T-C004, T-C006 | Code: T-C007 \| Arch: T-C008, T-C009 |

### Code Review + Architecture Review Summary — 2026-03-11

```
JAMI TOPILGAN MUAMMOLAR:  ~160 ta (kod + arxitektura)

Code Review:     ~100 ta (3 zona)
Architecture:     ~60 ta (infra + types + events)

P0 (kritik):              17 ta  → DARHOL tuzatish kerak
P1 (muhim):               38 ta  → Sprint ichida tuzatish
P2 (o'rta):               42 ta  → Keyingi sprint
P3 (past):                32 ta  → Backlog

22 ta YANGI TASK yaratildi:
  Backend (Saidazim):  T-S017..T-S025 (9 task)
  Mobile (Emirhan):    T-E020..T-E023 (4 task)
  Web (Jafar):         T-J012..T-J015 (4 task)
  Umumiy (IKKALASI):   T-C007..T-C009 (3 task)
  + oldingi:           T-C006 (WebView)

TOP 5 XAVFLI:
  🔴 T-S017 — Internal API ochiq (har kim ball qo'sha oladi)
  🔴 T-C008 — Web shared types yo'q (20+ type divergence)
  🔴 T-S023 — Admin DB anti-pattern + Docker healthcheck yo'q
  🔴 T-J012 — Token XSS xavfi (localStorage)
  🔴 T-J013 — tsc/ESLint build da o'chirilgan

TOP 3 ARXITEKTURA:
  🏗️ T-S023 — Admin shared DB anti-pattern → REST API ga o'tish
  🏗️ T-S024 — Socket.io scale qilolmaydi (Redis adapter yo'q)
  🏗️ T-C008 — Web client shared package bilan bog'lanmagan (ROOT CAUSE)
```

---

_docs/Tasks.md | CineSync | Yangilangan: 2026-03-11_
