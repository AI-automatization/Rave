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
6. Oxirgi T-raqam: S→047, E→070, J→037, C→011
7. Yangilangan: 2026-03-27
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

### T-E069 | P1 | [MOBILE] | ashdi.vip + bazon.tv WebView Adapter

- **Sana:** 2026-03-27
- **Mas'ul:** pending[Emirhan]
- **Sprint:** S8
- **Fayl:** `apps/mobile/src/components/video/WebViewAdapters.ts`
- **Holat:** ❌ Boshlanmagan

**Контекст:**
O'zbekiston va Rossiya saytlarining 60-70% (kinogo, turk123, animego, rezka va boshqalar)
o'z ichida **ashdi.vip** yoki **bazon.tv** iframidan foydalanadi.
Hozir: IFRAME_FOUND → o'sha sahifaga o'tiladi → adapter yo'q → video topilmaydi.
Keyin: adapter → Playerjs JSON parse → .m3u8 / .mp4 topiladi.

**Subtasklar:**
- [ ] E69-1. `ashdi.vip` adapter — selectors: `.jw-video`, `.plyr video`, `video`; scanDelay 2500ms
- [ ] E69-2. `bazon.tv` adapter — selectors: `.video-js video`, `.vjs-tech`, `video`; scanDelay 2000ms
- [ ] E69-3. `MEDIA_DETECTION_JS` — Playerjs format aniqlash:
  `new Playerjs({file: [...]})` yoki `Playerjs({file:"url"})` → src setter intercept bilan tutiladi (T-E064 da bor)
- [ ] E69-4. `cdnvideohub.xyz`, `videocdn.me` adapterlar (keng tarqalgan CDN providerlar)
- [ ] E69-5. Test: kinogo.cc sahifasida video topilishini tekshirish (WebView orqali)

**Natija:** kinogo, turk123, animego va yana 10+ sayt ishlaydi

---

### T-E070 | P1 | [MOBILE] | URL kiritish funksiyasi — Facebook, Instagram, Reddit, Streamable

- **Sana:** 2026-03-27
- **Mas'ul:** pending[Emirhan]
- **Sprint:** S8
- **Fayl:** `apps/mobile/src/screens/modal/SourcePickerScreen.tsx`
- **Holat:** ❌ Boshlanmagan

**Контекст:**
Backend allaqachon quyidagi saytlarni qo'llab-quvvatlaydi (yt-dlp orqali):
- **Facebook** — post/reel videolar
- **Instagram** — post/reel/story videolar (login bo'lmasa ochiq kontent)
- **Reddit** — video postlar (v.redd.it)
- **Streamable** — to'g'ridan video hostlar

Muammo: mobilda bu saytlarga kirish yo'li yo'q. "Web" saytidan ochsa ham
video URL avtomatik topilmasligi mumkin (SPA, auth).
**Eng to'g'ri yo'l:** foydalanuvchi o'zi URL nusxalab kiritadi → backend extract qiladi.

**Subtasklar:**
- [ ] E70-1. `SourcePickerScreen.tsx` — pastki qismga "URL kiritish" bo'lim qo'shish
  ```
  [ https://... ni shu yerga joylashtiring ] [→]
  ```
- [ ] E70-2. URL validate qilish — `http://` yoki `https://` bilan boshlanishi kerak
- [ ] E70-3. `contentApi.extractVideo(url)` chaqirish — loading spinner ko'rsatish
- [ ] E70-4. Muvaffaqiyatli → `normalizeExtractResult(result)` → `RoomMedia` ga aylantirish
- [ ] E70-5. Natija `context` ga qarab:
  - `new_room` → `watchPartyApi.createRoom()` → `WatchPartyScreen`
  - `change_media` → socket `CHANGE_MEDIA` emit → `WatchPartyScreen`
- [ ] E70-6. Xato holatlari:
  - Geo-block (HTTP 451) → "Bu sayt mintaqangizda mavjud emas"
  - DRM → "Bu kontent himoyalangan (DRM)"
  - Topilmadi → "Video topilmadi. Boshqa URL kiriting"
- [ ] E70-7. Qo'llab-quvvatlanadigan saytlar ko'rsatkich (hint text):
  `"Facebook, Instagram, Reddit, Streamable va 700+ sayt"`

**Natija:**
- Foydalanuvchi istalgan video linkini nusxalab joylashtiradi
- Backend yt-dlp orqali video URL ni topadi
- expo-av da native o'ynatadi (tez, seek ishlaydi, sifat tanlash mumkin)

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
