# CineSync — OCHIQ VAZIFALAR

# Yangilangan: 2026-03-26

# 3 dasturchi: Saidazim (Backend) | Emirhan (Mobile) | Jafar (Mobile)

---

## 📌 QOIDALAR

```
1. Har topilgan bug/task → shu faylga DARHOL yoziladi
2. Sessiya boshida shu faylni O'QIB, oxirgi T-raqamdan davom
3. Fix bo'lgach → shu yerdan O'CHIRISH → docs/Done.md ga KO'CHIRISH
4. Prioritet: P0=kritik, P1=muhim, P2=o'rta, P3=past
5. Sprint: S1=hozir, S2=keyingi hafta, S3=keyingi sprint, S4-5=keyin
6. Oxirgi T-raqam: S→047, E→068, J→037, C→011
7. Yangilangan: 2026-03-26
```

---

# ═══════════════════════════════════════

# 🔴 SAIDAZIM — BACKEND + ADMIN

---

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

### T-S033 | P1 | [BACKEND] | Video Extract endpoint — production deploy + smoke test

- **Sana:** 2026-03-18
- **Mas'ul:** pending[Saidazim]
- **Sprint:** S6
- **Holat:** ⚠️ Код готов (2026-03-26) — нужен только Railway redeploy + smoke test

**Qolgan:**
- [ ] S33-5. Railway: trigger redeploy content service → проверить `POST /extract` с youtube и uzmovie.tv URL

---

### T-S043 | P1 | [BACKEND] | Playwright Headless Service — динамик сайтлардан видео URL қўлга киритиш

- **Sana:** 2026-03-26
- **Mas'ul:** pending[Saidazim]
- **Sprint:** S6
- **Fayl:** `services/content/src/services/playwright/`, `services/content/package.json`
- **Holat:** ❌ Boshlanmagan

**Контекст:**
vidlink.pro, smashystream.xyz, flixcdn.cyou — видео URL только после JS execution.
Playwright `page.on('response')` перехватывает `.m3u8`/`.mp4` автоматически.

**Subtasklar:**
- [ ] S43-1. `playwright-chromium` ни `services/content/package.json` га қўшиш
- [ ] S43-2. `playwrightExtractor.ts` — `page.on('response')` орқали `.m3u8`/`.mp4` URL тутиш
- [ ] S43-3. 30 секунд timeout + биринчи топилган медиа URL қайтариш
- [ ] S43-4. `PLAYWRIGHT_PLATFORMS` Set: `vidlink.pro`, `smashystream.xyz`, `flixcdn.cyou`, `streamlare.com`
- [ ] S43-5. `index.ts`: unknown platform → generic → yt-dlp → playwright (last resort)
- [ ] S43-6. Dockerfile: `chromium` + `chromium-driver` пакетлар (Alpine)
- [ ] S43-7. Concurrency limiter: max 3 Playwright instance параллел

**Эслатма:** 5-10x секин HTTP дан. Фақат бошқа методлар ишламаганда.

---

### T-S044 | P2 | [BACKEND] | HLS Reverse Proxy endpoint — токенли стримларни мобайл учун проксилаш

- **Sana:** 2026-03-26
- **Mas'ul:** pending[Saidazim]
- **Sprint:** S7
- **Fayl:** `services/content/src/controllers/hlsProxy.controller.ts`, `services/content/src/routes/content.routes.ts`
- **Holat:** ❌ Boshlanmagan

**Контекст:**
lookmovie2 CDN HLS сегментларида `Referer` header талаб қилади. expo-av
`.m3u8` га Referer бериши мумкин, лекин `.ts` сегментларга автоматик бермайди — 403.
`VideoExtractResult.proxyRequired=true` бўлса мобайл HLS proxy ишлатади.

**Subtasklar:**
- [ ] S44-1. `GET /api/v1/content/hls-proxy?url={encoded}&referer={encoded}` endpoint
- [ ] S44-2. m3u8 fetch → сегмент URL ларини `/hls-proxy?url=...&referer=...` га rewrite
- [ ] S44-3. `GET /api/v1/content/hls-proxy/segment?url={encoded}` — stream с Referer header
- [ ] S44-4. SSRF guard: `validateUrl()` (private IP блок)
- [ ] S44-5. Rate limit: 100 req/min per user

---

# ═══════════════════════════════════════

# 🟢 EMIRHAN — EXPO REACT NATIVE MOBILE

---

*(Sprint 1..7 TUGADI — yangi sprint tasklari quyida)*

---

### T-E064 | P1 | [MOBILE] | Smart Video Detector v2 — MutationObserver + src setter intercept

- **Sana:** 2026-03-26
- **Mas'ul:** pending[Emirhan]
- **Sprint:** S6
- **Fayl:** `apps/mobile/src/utils/mediaDetector.ts`
- **Holat:** ❌ Boshlanmagan

**Контекст:**
Ҳозирги detector `setTimeout(1500ms)` — Play тугмаси босилганда видео кейин юкланади,
timeout ўтиб кетади. `lastReportedUrl` — page URL эмас, video URL track қилиш керак.

**Subtasklar:**
- [ ] E64-1. `MutationObserver` — DOM га янги `<video>` қўшилса дарров аниқлаш
- [ ] E64-2. `HTMLMediaElement.src` setter intercept — `Object.defineProperty` орқали тутиш
- [ ] E64-3. `lastReportedUrl` → `lastReportedVideoUrl` (video URL deduplication)
- [ ] E64-4. `.mpd` (DASH) extension `isRealVideoSrc()` га қўшиш
- [ ] E64-5. `blob:` URL → `BLOB_VIDEO_FOUND` хабари (webview-session сигнали)
- [ ] E64-6. Timeout fallback: 5 секунд ичида топмаса → 500ms retry

---

### T-E065 | P1 | [MOBILE] | WebView Session Player — Type 3 сайтлар (Cinerama, Megogo)

- **Sana:** 2026-03-26
- **Mas'ul:** pending[Emirhan]
- **Sprint:** S6
- **Fayl:** `apps/mobile/src/screens/modal/MediaWebViewScreen.tsx`, `apps/mobile/src/utils/mediaDetector.ts`, `apps/mobile/src/components/video/UniversalPlayer.tsx`
- **Holat:** ❌ Boshlanmagan

**Контекст:**
Cinerama.uz, Megogo.net — DRM/auth. URL ажратиб бўлмайди.
WebView ўзи плеер — JS injection орқали play/pause/seek. Sync `pageUrl` орқали.

**Subtasklar:**
- [ ] E65-1. `MediaDetectedPayload` га `mode: 'extracted' | 'webview-session'`
- [ ] E65-2. blob/DRM URL → `mode: 'webview-session'` хабари
- [ ] E65-3. `MediaWebViewScreen.tsx` — webview-session: `pageUrl` → Watch Party
- [ ] E65-4. `UniversalPlayer.tsx` — webview-session: WebView + MOBILE_USER_AGENT
- [ ] E65-5. `mediaSources.ts` — Cinerama, Megogo: `'drm'` → `'webview-session'`
- [ ] E65-6. Watch Party — webview-session member ҳам WebView кўради (progress bar йўқ)
- [ ] E65-7. JS adapter: `cinerama.uz`, `megogo.net` — `play()`/`pause()`/`seek()` injection

---

### T-E066 | P2 | [MOBILE] | WebView Adapters v2 — Twitch, VK Video, Rutube, Vimeo, Dailymotion

- **Sana:** 2026-03-26
- **Mas'ul:** pending[Emirhan]
- **Sprint:** S7
- **Fayl:** `apps/mobile/src/components/video/WebViewAdapters.ts`
- **Holat:** ❌ Boshlanmagan

**Subtasklar:**
- [ ] E66-1. `buildTwitchHtml(channelOrVodId)` — Twitch Embed JS API: play/pause/seek/timeupdate
- [ ] E66-2. `buildVKVideoHtml(ownerId, videoId)` — VK Video JS SDK
- [ ] E66-3. `buildRutubeHtml(videoId)` — Rutube postMessage протокол
- [ ] E66-4. `buildVimeoHtml(videoId)` — Vimeo Player.js SDK
- [ ] E66-5. `buildDailymotionHtml(videoId)` — Dailymotion Player API
- [ ] E66-6. `UniversalPlayer.tsx` — URL дан platform аниқлаш → соответствующий build* функция
- [ ] E66-7. Ҳар адаптер: `PLAY`, `PAUSE`, `SEEK`, `PROGRESS` postMessage стандарти

---

### T-E067 | P2 | [MOBILE] | Cookie Forwarding — WebView cookies → Content Service

- **Sana:** 2026-03-26
- **Mas'ul:** pending[Emirhan]
- **Sprint:** S7
- **Fayl:** `apps/mobile/src/screens/modal/MediaWebViewScreen.tsx`, `apps/mobile/src/api/content.api.ts`
- **Holat:** ❌ Boshlanmagan

**Subtasklar:**
- [ ] E67-1. CookieManager орқали WebView cookies олиш
- [ ] E67-2. Netscape format конвертация
- [ ] E67-3. `contentApi.extractVideo({ url, cookies })` — request body га cookies
- [ ] E67-4. Фақат `webview-session` режимида юбориш
- [ ] E67-5. Cookie ни logs га ёзмаслик (privacy)

---

### T-E068 | P3 | [MOBILE] | Multi-Quality Source Selector — видео сифат танлаш UI

- **Sana:** 2026-03-26
- **Mas'ul:** pending[Emirhan]
- **Sprint:** S8
- **Fayl:** `apps/mobile/src/components/watchparty/`, `apps/mobile/src/screens/watchparty/WatchPartyScreen.tsx`
- **Holat:** ❌ Boshlanmagan

**Subtasklar:**
- [ ] E68-1. `QualityMenu` — bottom sheet, `[{label: '1080p', url}]` list
- [ ] E68-2. `EpisodeMenu` — сезон → эпизод аккордеон
- [ ] E68-3. "⚙ Сифат" кнопка Watch Party (owner only)
- [ ] E68-4. `CHANGE_MEDIA` socket event орқали барча members га янги URL
- [ ] E68-5. `VideoExtractResult.episodes` мобайлга узатиш

---

# ═══════════════════════════════════════

# 🔵 JAFAR — REACT NATIVE MOBILE

---

## ⚠️ MAS'ULSIZ WEB TASKLAR (Jafar endi mobile da)

### T-J015 | P1 | [WEB] | BUG: Auth hydration flash + socket stale token + middleware

- **Mas'ul:** ❌ MAS'UL YO'Q (Jafar mobile ga o'tdi 2026-03-18)
- **Holat:** ❌ Boshlanmagan
- **Fayllar:** `apps/web/src/store/auth.store.ts`, `apps/web/src/lib/socket.ts`, `apps/web/src/middleware.ts`
- **Muammo:** SSR hydration flash, stale socket token after refresh, middleware only checks cookie presence not validity

---

### T-J007 | P2 | [WEB] | SEO + i18n + PWA — qolgan qismi

- **Mas'ul:** ❌ MAS'UL YO'Q (Jafar mobile ga o'tdi 2026-03-18)
- **Holat:** ⚠️ QISMAN
- **Qolgan:** next-intl i18n, dynamic OG images, WCAG audit, Playwright E2E

---

# ═══════════════════════════════════════

# 🟣 UMUMIY — BARCHA JAMOA

---

### T-C006 | P1 | [IKKALASI] | WebView Video Player

- **Holat:** ✅ Mobile M1-M7 TUGADI | Backend B1-B2 TUGADI | Web W1 mas'ulsiz
- **Qolgan:**
  - [ ] **W1.** Web da "Bu video faqat CineSync mobile ilovasida ko'rish mumkin" xabar (mas'ul yo'q)

---

### T-C009 | P1 | [IKKALASI] | Socket event payload — web hardcoded strings

- **Holat:** ✅ Mobile TUGADI | Web qismi mas'ulsiz (Jafar mobile ga o'tdi)
- **Qolgan:**
  - [ ] Web: `@cinesync/shared` dan `SERVER_EVENTS`/`CLIENT_EVENTS` import (mas'ul yo'q)

---
