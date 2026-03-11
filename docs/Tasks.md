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
6. Oxirgi T-raqam: S→016, E→019, J→011, C→006
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

## SPRINT 2 — Asosiy ekranlar

---


## SPRINT 3 — Ijtimoiy ekranlar

## SPRINT 4 — Profil + Bildirishnoma

## SPRINT 5 — Sifat + Test




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

_docs/Tasks.md | CineSync | Yangilangan: 2026-03-11_
