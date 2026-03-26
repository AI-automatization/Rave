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

### T-S033 | P1 | [BACKEND] | Video Extract endpoint — yt-dlp deploy + sayt qo'llab-quvvatlash

- **Sana:** 2026-03-18
- **Mas'ul:** pending[Saidazim]
- **Sprint:** S6
- **Fayl:** `services/content/src/services/videoExtractor/`
- **Holat:** ⚠️ Endpoint mavjud, subtasklar bajarildi — deploy va test kerak

**Subtasklar:**
- [x] S33-1. yt-dlp musl binary Dockerfile ✅
- [x] S33-2. O'zbek saytlar — depth=2 + Referer ✅
- [x] S33-3. timeout 20s, structured errors ✅
- [x] S33-4. YouTube proxy Range request ✅
- [ ] S33-5. Production deploy + smoke test (uzmovi.tv, youtube)

---

### T-S040 | P1 | [BACKEND] | Video Extractor — Playerjs сайтлар учун парсер (uzmovie.tv типи)

- **Sana:** 2026-03-26
- **Mas'ul:** pending[Saidazim]
- **Sprint:** S6
- **Fayl:** `services/content/src/services/videoExtractor/playerjsExtractor.ts`, `services/content/src/services/videoExtractor/detectPlatform.ts`
- **Holat:** ❌ Boshlanmagan

**Контекст:**
Uzmovie.tv, uzmovi.uz, kinooteka.uz, kinolenta.uz — Playerjs плеерини ишлатади.
Barcha epizod/film URLlari `<script>` ичида `new Playerjs({file: [...]})` форматида
текст сифатида сақланади — CDN хамояси йўқ, сайтга кириш керак эмас.

**Subtasklar:**
- [ ] S40-1. `playerjsExtractor.ts` — HTML fetch → `<script>` тагидан Playerjs JSON конфигини regex билан ажратиш
- [ ] S40-2. `parsePlayerjsFile()` — `[label]url` форматини рекурсив парс қилиш (сериаллар: сезон → эпизод дарахти)
- [ ] S40-3. `pickBestQuality()` — 1080p → 720p → 480p приоритет тартиби
- [ ] S40-4. `detectPlatform.ts` га домен руйхат қўшиш: `uzmovie.tv`, `uzmovi.uz`, `kinooteka.uz`, `kinolenta.uz` → platform `'playerjs'`
- [ ] S40-5. `index.ts` оркестраторга `'playerjs'` кейсини қўшиш
- [ ] S40-6. `VideoExtractResult` га `episodes?: {label: string; url: string}[]` опционал поле қўшиш (сезонлар учун)
- [ ] S40-7. Smoke test: Harry Potter уzmovie.tv дан MP4 URL олиш

**Кутилаётган натижа:**
```json
{
  "title": "Гарри Поттер ва фалсафа тоши",
  "videoUrl": "https://cdn.uzmovie.tv/.../harry1_1080p.mp4",
  "platform": "playerjs",
  "type": "mp4",
  "quality": "1080p"
}
```

---

### T-S041 | P1 | [BACKEND] | Video Extractor — lookmovie2.to Security API экстрактор

- **Sana:** 2026-03-26
- **Mas'ul:** pending[Saidazim]
- **Sprint:** S6
- **Fayl:** `services/content/src/services/videoExtractor/lookmovie2Extractor.ts`, `services/content/src/services/videoExtractor/detectPlatform.ts`
- **Holat:** ❌ Boshlanmagan

**Контекст:**
lookmovie2.to HLS URL ни `/api/v1/security/movie-access?id_movie={ID}&hash={HMAC}&expires={ts}`
орқали беради. Браузер автоматик чақиради. Жавоб мисоли:
`{"hls":"https://stream.lookmovie2.to/cdn-cgi/.../master.m3u8"}` — 29 соат действителен.
Сайт ID ва HMAC hash ни фильм страницаси JS кодида ҳисоблайди.

**Subtasklar:**
- [ ] S41-1. `lookmovie2Extractor.ts` — HTML fetch → `id_movie` ва `hash` regex билан топиш
- [ ] S41-2. Security API ни чақириш: `GET /api/v1/security/movie-access?id_movie={}&hash={}&expires={}` — `expires` = `Date.now()/1000 + 100000`
- [ ] S41-3. Жавобдан `hls` URL ни ажратиш → `VideoExtractResult{type: 'hls'}` қайтариш
- [ ] S41-4. Fallback: hash топилмаса → `ytDlpExtractor()` га ўтиш
- [ ] S41-5. `detectPlatform.ts` га: `lookmovie2.to`, `lookmovie2.ag` → platform `'lookmovie2'`
- [ ] S41-6. Smoke test: 1 та фильм HLS URL олиш ва `curl` билан текшириш

---

### T-S042 | P2 | [BACKEND] | Video Extractor — moviesapi.club JSON API + vidlink.pro HLS

- **Sana:** 2026-03-26
- **Mas'ul:** pending[Saidazim]
- **Sprint:** S7
- **Fayl:** `services/content/src/services/videoExtractor/moviesapiExtractor.ts`
- **Holat:** ❌ Boshlanmagan

**Контекст:**
moviesapi.club — TMDB ID билан тоза JSON API беради:
`GET https://moviesapi.club/api/movie/{TMDB_ID}` → `{video_url, quality, subtitles}`
vidlink.pro — `storm.vodvidl.site` CDN орқали 1080p HLS, лекин Cloudflare бот хамоясида.

**Subtasklar:**
- [ ] S42-1. `moviesapiExtractor.ts` — TMDB ID параметрини URL дан ажратиш (`?tmdb=` ёки `/movie/{id}`)
- [ ] S42-2. `GET https://moviesapi.club/api/movie/{TMDB_ID}` — CORS ўтказиш учун `Referer: https://moviesapi.club` header
- [ ] S42-3. `video_url` олиш → `VideoExtractResult{type: 'mp4' | 'hls'}` қайтариш
- [ ] S42-4. `detectPlatform.ts` га: `moviesapi.club` → platform `'moviesapi'`
- [ ] S42-5. vidlink.pro учун Playwright-based fallback (T-S043 га боғлиқ)

---

### T-S043 | P1 | [BACKEND] | Playwright Headless Service — динамик сайтлардан видео URL қўлга киритиш

- **Sana:** 2026-03-26
- **Mas'ul:** pending[Saidazim]
- **Sprint:** S6
- **Fayl:** `services/content/src/services/playwright/`, `services/content/package.json`
- **Holat:** ❌ Boshlanmagan

**Контекст:**
Баъзи сайтлар (vidlink.pro, smashystream.xyz, flixcdn.cyou) видео URL ни фақат
JS ишлагандан кейин беради — оддий HTTP fetch ишламайди. Playwright `page.on('response')`
орқали network request ларни тутиш мумкин — `.m3u8` ёки `.mp4` URL ни автоматик топади.

**Subtasklar:**
- [ ] S43-1. `playwright-chromium` ни `services/content/package.json` га қўшиш
- [ ] S43-2. `playwrightExtractor.ts` — браузер контекст очиш, URL га кириш, `page.on('response')` орқали `.m3u8`/`.mp4` response URL ларни йиғиш
- [ ] S43-3. 30 секунд timeout + биринчи топилган медиа URL ни қайтариш
- [ ] S43-4. `MOBILE_USER_AGENT` ишлатиш, `mediaPlaybackRequiresUserAction=false` имитацияси
- [ ] S43-5. Playwright extractorни `index.ts` га fallback сифатида қўшиш: generic extractor → yt-dlp → playwright
- [ ] S43-6. `PLAYWRIGHT_PLATFORMS` Set: `vidlink.pro`, `smashystream.xyz`, `flixcdn.cyou`, `streamlare.com`
- [ ] S43-7. Dockerfile: `chromium` + `chromium-driver` пакетлар (Alpine musl)
- [ ] S43-8. Concurrency limiter: бир вақтда максимум 3 та Playwright instance

**Эслатма:** Playwright Headless одатдаги HTTP дан 5-10x секин. Фақат бошқа методлар ишламаганда ишлатилади.

---

### T-S044 | P2 | [BACKEND] | HLS Reverse Proxy endpoint — токенли стримларни мобайл учун проксилаш

- **Sana:** 2026-03-26
- **Mas'ul:** pending[Saidazim]
- **Sprint:** S7
- **Fayl:** `services/content/src/controllers/hlsProxy.controller.ts`, `services/content/src/routes/content.routes.ts`
- **Holat:** ❌ Boshlanmagan

**Контекст:**
Lookmovie2 ва баъзи CDN лар HLS сегментларини `Referer` ёки `Origin` header талаб қилади.
expo-av `headers: {Referer: ...}` ни `.m3u8` плейлистга бериши мумкин, лекин
сегментларга (`/seg001.ts`) автоматик бермайди — стрим ўртасида 403 чиқади.

**Subtasklar:**
- [ ] S44-1. `GET /api/v1/content/hls-proxy?url={encoded_m3u8}&referer={encoded_referer}` endpoint
- [ ] S44-2. `m3u8` файлини fetch → сегмент URL ларини `/hls-proxy?url=...&referer=...` га rewrite → клиентга бериш
- [ ] S44-3. Сегмент проксиси: `GET /api/v1/content/hls-proxy/segment?url={encoded_ts}` — `Referer` header билан stream
- [ ] S44-4. SSRF guard: `validateUrl()` ишлатиш (уйдаги IP/localhost блок)
- [ ] S44-5. Rate limit: per user, 100 req/min
- [ ] S44-6. `VideoExtractResult` га `proxyRequired: boolean` поле қўшиш → мобайл шу поле бўйича HLS proxy URL ишлатади

---

### T-S045 | P2 | [BACKEND] | Video Extractor — WebView Cookie forwarding (Type 3 сайтлар учун)

- **Sana:** 2026-03-26
- **Mas'ul:** pending[Saidazim]
- **Sprint:** S7
- **Fayl:** `services/content/src/controllers/videoExtract.controller.ts`, `services/content/src/services/videoExtractor/index.ts`
- **Holat:** ❌ Boshlanmagan

**Контекст:**
Cinerama.uz, Megogo.net, Kinopoisk.ru — фойдаланувчи логин керак.
Мобайл WebView да фойдаланувчи ўзи логин қилади → cookies ўша WebView да сақланади.
Агар cookies ни backend га юборсак — yt-dlp `--cookies-from-browser` эмас,
`--add-header "Cookie: ..."` орқали URL ни ажратиш мумкин бўлади.

**Subtasklar:**
- [ ] S45-1. `POST /api/v1/content/extract` — request body га `cookies?: string` (Netscape format) поле қўшиш
- [ ] S45-2. `ytDlpExtractor.ts` — `cookies` бор бўлса `--add-header "Cookie: {value}"` флаги қўшиш
- [ ] S45-3. Cookie санитизация: max 4096 char, XSS pattern текшириш
- [ ] S45-4. Cookie ни Redis cache га сақламаслик (персональ маълумот)
- [ ] S45-5. Shared types: `VideoExtractRequest { url: string; cookies?: string }` типини экспорт қилиш

---

### T-S046 | P3 | [BACKEND] | Video Extractor — гео-блок текшириш ва фойдаланувчига хабар

- **Sana:** 2026-03-26
- **Mas'ul:** pending[Saidazim]
- **Sprint:** S8
- **Fayl:** `services/content/src/services/videoExtractor/index.ts`, `services/content/src/services/videoExtractor/types.ts`
- **Holat:** ❌ Boshlanmagan

**Контекст:**
hdrezka.ag, filmix.net, kinogo.cc, seasonvar.ru — Россия IP блоки бор.
Бизнинг сервер UAE да — бу сайтлар connection reset беради.
Фойдаланувчига "бу сайт бизнинг серверда ишламайди" деган аниқ хабар бериш керак.

**Subtasklar:**
- [ ] S46-1. `GEO_BLOCKED_DOMAINS` константаси: `hdrezka.ag`, `filmix.net`, `kinogo.cc`, `seasonvar.ru`, `rezka.ag`
- [ ] S46-2. `extractVideo()` бошида домен текшириш → `VideoExtractError('geo_blocked')` ташлаш
- [ ] S46-3. `videoExtract.controller.ts` — `geo_blocked` reason учун 451 HTTP status ва тушунтирувчи хабар
- [ ] S46-4. `VideoExtractError` типига `'geo_blocked'` reason қўшиш

---

### T-S047 | P2 | [BACKEND] | Video Extractor — cache стратегияси v2 (TTL by type)

- **Sana:** 2026-03-26
- **Mas'ul:** pending[Saidazim]
- **Sprint:** S7
- **Fayl:** `services/content/src/services/videoExtractor/index.ts`
- **Holat:** ❌ Boshlanmagan

**Контекст:**
Ҳозир барча экстракция натижалари 2 соат cache да. Лекин:
- YouTube URL лар 6 соат яроқли (бизда 2h — OK)
- lookmovie2 Security API URL лари 29 соат яроқли (2h — жуда қисқа, ортиқча запрос)
- Playerjs MP4 URL лари доимий (2h — жуда қисқа)
- Tokenized HLS URL лари 1-5 дақиқа яроқли (2h — жуда узун, эскирган URL берилади)

**Subtasklar:**
- [ ] S47-1. `CACHE_TTL_BY_PLATFORM` map: `youtube→7200`, `playerjs→86400`, `lookmovie2→86400`, `generic→3600`, `tokenized→0` (кэшламаслик)
- [ ] S47-2. `VideoExtractResult` га `cacheable: boolean` поле қўшиш
- [ ] S47-3. `tokenized: true` бўлса Redis га сақламаслик
- [ ] S47-4. Platform-specific TTL ни `setex()` да ишлатиш

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
Ҳозирги detector `setTimeout(1500ms)` ишлатади — кўп сайтларда видео Play тугмаси
босилгандан кейин юкланади, timeout ўтиб кетади ва видео топилмайди.
`lastReportedUrl` — сахифа URL (page URL), видео URL эмас — бу deduplication ни бузади.

**Subtasklar:**
- [ ] E64-1. `MutationObserver` — DOM га янги `<video>` элемент қўшилса дарров аниқлаш
- [ ] E64-2. `HTMLMediaElement.src` setter intercept — `Object.defineProperty` орқали `src` ўзгартирилса дарров тутиш
- [ ] E64-3. `lastReportedUrl` ни `lastReportedVideoUrl` га ўзгартириш — сахифа URL эмас, видео URL ни track қилиш
- [ ] E64-4. `.mpd` (DASH) extension ни `isRealVideoSrc()` га қўшиш
- [ ] E64-5. Blob URL detection: `blob:` URL бўлса `BLOB_VIDEO_FOUND` хабари юбориш (backend га кетмайди, WebView player режимига ўтиш сигнали)
- [ ] E64-6. Timeout fallback сақлаш: MutationObserver 5 секунд ичида топмаса 500ms retry (эски логика)

---

### T-E065 | P1 | [MOBILE] | WebView Session Player — Type 3 сайтлар (Cinerama, Megogo)

- **Sana:** 2026-03-26
- **Mas'ul:** pending[Emirhan]
- **Sprint:** S6
- **Fayl:** `apps/mobile/src/screens/modal/MediaWebViewScreen.tsx`, `apps/mobile/src/utils/mediaDetector.ts`, `apps/mobile/src/components/video/UniversalPlayer.tsx`
- **Holat:** ❌ Boshlanmagan

**Контекст:**
Cinerama.uz, Megogo.net, Kinopoisk.ru — DRM ёки auth-protected контент.
Видео URL ни ажратиб бўлмайди. Ечим: WebView ўзи плеер — пауза/плей/seek
JS injection орқали бошқарилади. Watch Party sync `videoUrl` эмас, `pageUrl` орқали.
Барча members бир хил URL да, ҳар бири ўзи логин қилган — синхронизация JS injection орқали.

**Subtasklar:**
- [ ] E65-1. `MediaDetectedPayload` га `mode: 'extracted' | 'webview-session'` поле қўшиш
- [ ] E65-2. `mediaDetector.ts` — видео URL ажратиб бўлмаса (только blob ёки DRM) → `mode: 'webview-session'` хабари юбориш
- [ ] E65-3. `MediaWebViewScreen.tsx` — `webview-session` режимида `videoUrl` ўрнига `pageUrl` ни Watch Party га узатиш
- [ ] E65-4. `UniversalPlayer.tsx` — `mode: 'webview-session'` бўлса URL ни WebView да очиш + MOBILE_USER_AGENT
- [ ] E65-5. `mediaSources.ts` — `'drm'` support турини `'webview-session'` га ўзгартириш: Cinerama, Megogo (Netflix, Prime — ҳали ҳам `'drm'`)
- [ ] E65-6. Watch Party screen — `webview-session` режимида member ҳам WebView кўради (progress bar чиқмайди)
- [ ] E65-7. JS injection adapter ёзиш: `cinerama.uz`, `megogo.net` учун нативный плеер `play()`/`pause()`/`seek()` вызовлари

---

### T-E066 | P2 | [MOBILE] | WebView Adapters v2 — Twitch, VK Video, Rutube, Vimeo, Dailymotion

- **Sana:** 2026-03-26
- **Mas'ul:** pending[Emirhan]
- **Sprint:** S7
- **Fayl:** `apps/mobile/src/components/video/WebViewAdapters.ts`, `apps/mobile/src/components/video/webviewYouTube.ts`
- **Holat:** ❌ Boshlanmagan

**Контекст:**
YouTube IFrame API адаптери ишлайди. Xuddi шундай Twitch Embed JS,
VK Video JS API, Rutube JS API орқали play/pause/seek/progress контролини
йўлга қўйиш керак — Watch Party sync учун.

**Subtasklar:**
- [ ] E66-1. `buildTwitchHtml(channelOrVodId)` — Twitch Embed JS API: `play()`, `pause()`, `seek(t)`, `getCurrentTime()` → `postMessage`
- [ ] E66-2. `buildVKVideoHtml(ownerId, videoId)` — VK Video JS SDK: `play()`, `pause()`, `seek(t)` + `timeupdate` events
- [ ] E66-3. `buildRutubeHtml(videoId)` — Rutube Player API: iframe + postMessage протокол
- [ ] E66-4. `buildVimeoHtml(videoId)` — Vimeo Player.js: `player.play()`, `player.pause()`, `player.setCurrentTime(t)`, `player.on('timeupdate')`
- [ ] E66-5. `buildDailymotionHtml(videoId)` — Dailymotion Player API
- [ ] E66-6. `UniversalPlayer.tsx` — URL дан platform ни аниқлаш: `twitch.tv` → `buildTwitchHtml`, `vk.com/video` → `buildVKVideoHtml`, ва ҳоказо
- [ ] E66-7. Ҳар адаптер учун `PLAY`, `PAUSE`, `SEEK`, `PROGRESS` postMessage форматига moslashtириш

---

### T-E067 | P2 | [MOBILE] | Cookie Forwarding — WebView cookies → Content Service

- **Sana:** 2026-03-26
- **Mas'ul:** pending[Emirhan]
- **Sprint:** S7
- **Fayl:** `apps/mobile/src/screens/modal/MediaWebViewScreen.tsx`, `apps/mobile/src/api/content.api.ts`
- **Holat:** ❌ Boshlanmagan

**Контекст:**
Cinerama/Megogo auth cookies WebView да сақланади. Агар ўша cookies ни
backend `/api/v1/content/extract` га юборсак — yt-dlp улар орқали видео URL ажратиши мумкин.
T-S045 га боғлиқ (backend cookie support).

**Subtasklar:**
- [ ] E67-1. `react-native-webview` `CookieManager` орқали ҳозирги сайт cookies ни олиш
- [ ] E67-2. Netscape cookie format га конвертация: `domain\tFALSE\t/\tFALSE\t0\tname\tvalue`
- [ ] E67-3. `contentApi.extractVideo({ url, cookies })` — cookies ни request body га қўшиш
- [ ] E67-4. Фақат `webview-session` режимида cookies юборилади (`extracted` режимида — йўқ)
- [ ] E67-5. Cookie ни console ва logs га ёзмаслик (privacy)

---

### T-E068 | P3 | [MOBILE] | Multi-Quality Source Selector — видео сифат танлаш UI

- **Sana:** 2026-03-26
- **Mas'ul:** pending[Emirhan]
- **Sprint:** S8
- **Fayl:** `apps/mobile/src/components/watchparty/`, `apps/mobile/src/screens/watchparty/WatchPartyScreen.tsx`
- **Holat:** ❌ Boshlanmagan

**Контекст:**
Playerjs сайтлар (T-S040) бир нечта сифат ва эпизод беради.
Фойдаланувчи 360p/720p/1080p ни танлаши ва сериал учун эпизодни алмаштириши керак.

**Subtasklar:**
- [ ] E68-1. `QualityMenu` компоненти — bottom sheet, `[{label: '1080p', url: '...'}, ...]` list
- [ ] E68-2. `EpisodeMenu` компоненти — сезон → эпизод аккордеон UI
- [ ] E68-3. Watch Party screen да "⚙ Сифат" тугмаси (фақат owner кўради)
- [ ] E68-4. Танланган URL ни `CHANGE_MEDIA` socket event орқали барча members га юбориш
- [ ] E68-5. `VideoExtractResult.episodes` массивини мобайлга узатиш учун Watch Party API ни янгилаш

---

# ═══════════════════════════════════════

# 🔵 JAFAR — REACT NATIVE MOBILE

---

### T-J028 | P1 | [MOBILE] | Film reytingi — 201/200 response toast fix

- **Sana:** 2026-03-22
- **Mas'ul:** pending[Jafar]
- **Sprint:** S4
- **Fayllar:** `apps/mobile/src/screens/home/MovieDetailScreen.tsx`, `apps/mobile/src/i18n/translations.ts`
- **Holat:** ✅ TUGADI 2026-03-24 → Done.md F-157

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

### T-C011 | P1 | [IKKALASI] | Shared Types — VideoSource v2 (sourceType + extractionMethod)

- **Sana:** 2026-03-26
- **Mas'ul:** pending[Saidazim] (Emirhan keyin import qiladi)
- **Sprint:** S6
- **Fayl:** `shared/types/src/video.types.ts` (yoki `shared/types/src/index.ts`)
- **Holat:** ❌ Boshlanmagan

**Контекст:**
3 турдаги сайт аниқланди. Shared типлар бўлмаса backend ва мобайл турли форматда ишлайди.

**Subtasklar:**
- [ ] C11-1. `VideoSourceType: 'type1' | 'type2' | 'type3'` экспорт
  - `type1` = Direct MP4/HLS (playerjs, lookmovie2, moviesapi)
  - `type2` = Embed API (YouTube, Twitch, VK, Rutube, Vimeo, Dailymotion)
  - `type3` = Auth/DRM WebView session (Cinerama, Megogo, Kinopoisk)
- [ ] C11-2. `ExtractionMethod: 'playerjs' | 'security-api' | 'yt-dlp' | 'playwright' | 'webview-session' | 'embed-api'`
- [ ] C11-3. `VideoExtractResult` га қўшиш: `sourceType: VideoSourceType`, `extractionMethod: ExtractionMethod`, `proxyRequired?: boolean`, `cacheable?: boolean`, `episodes?: EpisodeInfo[]`
- [ ] C11-4. `EpisodeInfo: { label: string; url: string; quality?: string }` типи
- [ ] C11-5. `VideoExtractRequest: { url: string; cookies?: string; tmdbId?: string }` экспорт
- [ ] C11-6. Барча сервислар typecheck: `npm run typecheck` ўтиши керак

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
