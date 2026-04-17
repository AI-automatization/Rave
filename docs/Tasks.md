# CineSync — OCHIQ VAZIFALAR

# Yangilangan: 2026-04-17

# 3 dasturchi: Saidazim (Backend) | Emirhan (Mobile) | Jafar (Mobile)

---

## 📌 QOIDALAR

```
1. Har topilgan bug/task → shu faylga DARHOL yoziladi
2. Sessiya boshida shu faylni O'QIB, oxirgi T-raqamdan davom
3. Fix bo'lgach → shu yerdan O'CHIRISH → docs/Done.md ga KO'CHIRISH
4. Prioritet: P0=kritik, P1=muhim, P2=o'rta, P3=past
5. Sprint: S1=hozir, S2=keyingi hafta, S3=keyingi sprint, S4-5=keyin
6. Oxirgi T-raqam: S→056, E→101, J→037, C→016
7. Yangilangan: 2026-04-17
```

---

# ═══════════════════════════════════════

# 🔴 SAIDAZIM — BACKEND + ADMIN

---

### T-S051 | P1 | [BACKEND] | Video extractor — Playwright bot detection fix (captcha blokirovkasi)

- **Mas'ul:** pending[Saidazim]
- **Holat:** ❌ Boshlanmagan
- **Sabab:** `playwrightExtractor.ts` headless Chromium `--no-sandbox` flag bilan ishlaydi → Cloudflare/DDoS-Guard uni bot deb bloklaydi. Railway server IP hammaning so'rovlari uchun bitta — bir necha urinishdan keyin IP block-listga tushadi va captcha chiqadi.
- **Qilish kerak:**
  - [ ] `playwrightExtractor.ts`: stealth plugin qo'shish (`playwright-stealth` yoki `puppeteer-extra-plugin-stealth` analog)
  - [ ] `genericExtractor.ts`: tasodifiy User-Agent rotation (har so'rovda boshqa UA)
  - [ ] `genericExtractor.ts`: iframe recursion orasiga 100-300ms tasodifiy delay
  - [ ] Geo-blocked domenlar uchun Redis cache TTL oshirish: `hdrezka`, `filmix`, `kinogo` → 6-12 soat (hozirda qisqa)
  - [ ] Railway deploy uchun proxy rotation imkoniyatini ko'rish (agar IP blok davom etsa)
- **Fayllar:** `services/content/src/services/videoExtractor/playwrightExtractor.ts`, `genericExtractor.ts`, `index.ts`

---

### T-S050 | P1 | [BACKEND] | Push notification E2E test — Expo Push Token → FCM delivery

- **Mas'ul:** pending[Saidazim]
- **Holat:** ❌ Boshlanmagan
- **Sabab:** Mobile da Expo Push Token yuboriladi, lekin real qurilmada push notification kelishi hech qachon test qilinmagan
- **Qilish kerak:**
  - [ ] Expo Push Token → notification service da to'g'ri qabul qilinishini tekshirish
  - [ ] Friend request / WatchParty invite / Battle invite push larni real qurilmada test
  - [ ] FCM vs Expo Push Server — qaysi biri ishlatilayotganini aniqlash va test

---

### T-S052 | P1 | [BACKEND] | Mesh signalling handler — peer:offer/answer/ice routing (Rave Hybrid sync)

- **Mas'ul:**
- **Holat:** ❌ Boshlanmagan
- **Sabab:** Hybrid (Socket.io + WebRTC DataChannel) sync arxitekturasi uchun backend peer-to-peer SDP va ICE candidate almashinuvini routing qilishi kerak. Hozirgi Socket.io da 50-150ms lag — mesh orqali 5-30ms ga tushadi (Rave-darajada).
- **Qilish kerak:**
  - [ ] `services/watch-party/src/socket/mesh.handlers.ts` yaratish
  - [ ] `peer:offer` → `getUserSocket(toUserId).emit('peer:offer', { fromUserId, sdp })`
  - [ ] `peer:answer` va `peer:ice` uchun ham xuddi shunday routing
  - [ ] `mesh:join` → boshqa a'zolarga `mesh:peer-joined` broadcast
  - [ ] `services/watch-party/src/socket/index.ts` da `registerMeshHandlers(io, socket)` chaqirilishi
- **Fayllar:** `services/watch-party/src/socket/mesh.handlers.ts` (yangi), `services/watch-party/src/socket/index.ts`
- **Reference:** `docs/RAVE_TRANSFORMATION_PLAN.md` §6.2 Qadam 1
- **Bog'liq:** T-C014 (shared socket events) birinchi bo'lishi shart

---

### T-S053 | P2 | [BACKEND] | Scope cleanup — Battle service maintenance mode + feature flag

- **Mas'ul:**
- **Holat:** ❌ Boshlanmagan
- **Sabab:** Rave transformation plan (§7.2) Battle/Achievement/Stats Rave'da yo'q → MVP uchun ikkinchi darajaga tushirish. Hozirgi Battle service Redis + MongoDB + Bull resource iste'mol qiladi.
- **Qilish kerak:**
  - [ ] `services/battle/src/app.ts`: `FEATURE_BATTLES=false` bo'lsa barcha endpoint 503 qaytaradi
  - [ ] Railway env var qo'shish — `FEATURE_BATTLES=false` MVP uchun
  - [ ] Achievement trigger'lar non-blocking bo'lishi (serviceQueue fail bo'lsa log qilmasdan skip)
  - [ ] Admin panel'dan Battle/Achievement bo'limini yashirish (feature flag)
- **Fayllar:** `services/battle/src/app.ts`, `services/admin/src/routes/*.ts`, `.env.example`
- **Reference:** `docs/RAVE_TRANSFORMATION_PLAN.md` §7.2

---

## 🎬 BOSQICH A — Video Sync Optimizatsiya (Socket.io + Predictive + Drift)

> **Maqsad:** Sync lag ni 150ms+ dan 20-40ms ga tushirish. WebRTC/Mesh KUTMASDAN hoziroq qilish mumkin.
> **Natija:** Rave bilan 65% funksional o'xshashlik (hozir 30%).
> **Tartib:** T-S054 → T-E098 → T-S056 → T-E099 → T-E100 → T-S055 → T-E101

---

### T-S054 | P1 | [BACKEND] | Predictive sync — SyncState ga `scheduledAt` field qo'shish

- **Mas'ul:**
- **Holat:** ❌ Boshlanmagan
- **Sabab:** Hozir server SyncState da faqat `serverTimestamp` yuboradi (dedup uchun). Peer'lar event kelgan zahoti play/seek qiladi — lekin network delay tufayli 50-150ms kechikadi. `scheduledAt = Date.now() + 150` qo'shsak, barcha peer'lar ANIQ BIR VAQTDA play bosadi.
- **Qilish kerak:**
  - [ ] `watchParty.service.ts` → `syncState()` funksiyaga `scheduledAt: Date.now() + 150` field qo'shish
  - [ ] `SyncState` interface ga `scheduledAt: number` qo'shish (shared/types yoki service ichida)
  - [ ] PLAY, PAUSE, SEEK eventlarda scheduledAt broadcast qilinishi
  - [ ] Heartbeat (VIDEO_SYNC) da scheduledAt bo'lmasligi kerak (faqat correction uchun)
- **Fayllar:** `services/watch-party/src/services/watchParty.service.ts`
- **Natija:** Mobile (T-E098) bu field dan foydalanib aniq vaqtda sync qiladi
- **BLOCKS:** T-E098

---

### T-S055 | P1 | [BACKEND] | Democratic buffer wait — bir kishi buffer bo'lsa hammani pause

- **Mas'ul:**
- **Holat:** ❌ Boshlanmagan
- **Sabab:** Hozir BUFFER_START/BUFFER_END eventlar faqat notification sifatida broadcast qilinadi. Peer'lar video ko'rishda davom etadi → buffer bo'lgan kishi 5-10 sekund orqada qoladi → sync buziladi.
- **Qilish kerak:**
  - [ ] `videoEvents.handler.ts` → `BUFFER_START` kelganda: room uchun `bufferingUsers` Set yaratish (Redis yoki in-memory)
  - [ ] Birinchi buffer event kelganda → `io.to(roomId).emit(SERVER_EVENTS.VIDEO_PAUSE, syncState)` — hammani pause
  - [ ] `BUFFER_END` kelganda → `bufferingUsers` dan o'chirish. Agar set bo'sh → `io.to(roomId).emit(SERVER_EVENTS.VIDEO_PLAY, syncState)` — hammani play
  - [ ] Edge case: buffer bo'lgan user disconnect bo'lsa → bufferingUsers dan o'chirish
  - [ ] Max buffer wait: 30 sekund. 30s dan keyin majburiy play (buffer bo'lgan userni skip)
- **Fayllar:** `services/watch-party/src/socket/videoEvents.handler.ts`
- **Natija:** Bir kishining interneti sekinlashsa — hammasi kutadi, keyin birga davom etadi
- **BLOCKS:** T-E101

---

### T-S056 | P1 | [BACKEND] | Heartbeat alohida event — VIDEO_HEARTBEAT (PLAY dan ajratish)

- **Mas'ul:**
- **Holat:** ❌ Boshlanmagan
- **Sabab:** Hozir owner heartbeat (5 sek) oddiy PLAY event sifatida yuboriladi. Member'lar buni PLAY deb qabul qilib `seekTo()` qiladi → video har 5 sekundda "sakraydi". Heartbeat alohida event bo'lishi kerak — member faqat drift correction qiladi, jump qilmaydi.
- **Qilish kerak:**
  - [ ] `shared/constants/socket-events.ts` → `CLIENT_EVENTS.HEARTBEAT = 'video:heartbeat'`, `SERVER_EVENTS.VIDEO_HEARTBEAT = 'video:heartbeat'`
  - [ ] `videoEvents.handler.ts` → `HEARTBEAT` handler: owner check + position saqlash + broadcast (scheduledAt YO'Q)
  - [ ] `HEARTBEAT` payload: `{ currentTime, timestamp: Date.now() }` — peer drift hisoblash uchun
  - [ ] Redis/MongoDB update qilish (position saqlash), lekin isPlaying o'zgartirmaslik
- **Fayllar:** `services/watch-party/src/socket/videoEvents.handler.ts`, `shared/constants/socket-events.ts` (yoki `shared/src/constants/socketEvents.ts`)
- **Natija:** Mobile (T-E099) heartbeat ni PLAY dan farqlaydi va drift correction qiladi
- **BLOCKS:** T-E099

---


# ═══════════════════════════════════════

# 🟢 EMIRHAN — EXPO REACT NATIVE MOBILE

---

*(Sprint 1..7 TUGADI — Sprint 8: MVP Release — Sprint 9: Sync Optimizatsiya)*

---


### T-E081 | P1 | [MOBILE] | Real qurilmada smoke test (Expo Go)

- **Mas'ul:** pending[Emirhan]
- **Holat:** ⚠️ Qisman (bug fixes done: F-174/F-175/F-176, manual check kerak)
- **Sabab:** Emulator da ishlaydi ≠ real telefonda ishlaydi. MVP chiqarishdan oldin majburiy
- **Ilgari tuzatilgan** (2026-04-01): srcdoc warn, DDoS-Guard, WebM iOS, blank.mp4, cross-origin iframe, filmx.fun, TS errors
- **Qilish kerak (manual):**
  - [ ] Auth flow: Register → Verify → Login → ProfileSetup
  - [ ] SourcePicker → YouTube → video detect → Watch Party yaratish
  - [ ] Do'st qo'shish → invite → birga ko'rish (2 ta qurilma)
  - [ ] Push notification kelishi
  - [ ] Chat + Voice (dev build kerak)
  - [ ] Topilgan yangi buglarni Tasks.md ga yozish

---

### T-E096 | P1 | [MOBILE] | MeshClient + SyncProtocol — WebRTC DataChannel sync

- **Mas'ul:**
- **Holat:** ❌ Boshlanmagan
- **Sabab:** Rave'ning 5-30ms sync uchun WebRTC DataChannel. `react-native-webrtc` allaqachon o'rnatilgan (voice chat uchun). Socket.io fallback qoladi. **Expo Go da ishlamaydi → development build kerak.**
- **Qilish kerak:**
  - [ ] `apps/mobile/src/services/mesh/MeshClient.ts` — `RTCPeerConnection` + `DataChannel` full implementation
  - [ ] `apps/mobile/src/services/mesh/SyncProtocol.ts` — play/pause/seek/heartbeat + drift correction (2s threshold → force seek, 0.3s → playbackRate 0.95/1.05)
  - [ ] `apps/mobile/src/services/mesh/config.ts` — ICE servers (Google STUN + TURN)
  - [ ] `apps/mobile/src/services/mesh/types.ts` — `SyncMessage`, `MeshConfig`
  - [ ] `useWatchParty.ts` integration — MeshClient lifecycle
  - [ ] TURN server kerak: Metered.ca bepul tier (50GB/oy) yoki Coturn VPS ($10/oy)
- **Fayllar:** `apps/mobile/src/services/mesh/*` (yangi papka), `apps/mobile/src/hooks/useWatchParty.ts`
- **Reference:** `docs/RAVE_TRANSFORMATION_PLAN.md` §6.2 Qadam 2-3
- **Bog'liq:** T-C014 + T-S052 birinchi bo'lishi shart

---

### T-E097 | P2 | [MOBILE] | SyncBroadcaster + TopologyManager — fallback + mesh/star/socket

- **Mas'ul:**
- **Holat:** ❌ Boshlanmagan
- **Sabab:** Mesh connected peers soniga qarab topology tanlash: ≤6 full mesh, 7-15 star (owner hub), 16+ Socket.io fallback. Mobile background'da mesh destroy → Socket.io fallback.
- **Qilish kerak:**
  - [ ] `SyncBroadcaster.ts` — mesh + Socket.io ikki yo'nalish; `viaMesh` flag
  - [ ] `TopologyManager.ts` — `FULL_MESH_LIMIT=6`, `STAR_LIMIT=15` constantalar
  - [ ] `AppState.addEventListener` — background → `meshClient.destroy()`, active → `reconnect()`
  - [ ] Testing: 2/5/10 peer room, peer drop, owner drop, poor network ICE fail
- **Fayllar:** `apps/mobile/src/services/mesh/SyncBroadcaster.ts`, `TopologyManager.ts`
- **Reference:** `docs/RAVE_TRANSFORMATION_PLAN.md` §6.2 Qadam 4-5-6
- **Bog'liq:** T-E096 dan keyin

---

## 🎬 BOSQICH A — Mobile Sync Optimizatsiya

---

### T-E098 | P1 | [MOBILE] | Predictive sync — `scheduledAt` bilan aniq vaqtda play/pause/seek

- **Mas'ul:**
- **Holat:** ❌ Boshlanmagan
- **Sabab:** Hozir `useWatchPartyRoom.ts` da syncState kelganda DARHOL `seekTo() + play()` qiladi. Network delay tufayli har peer boshqa-boshqa vaqtda play bosadi (50-150ms farq). `scheduledAt` field kelganda, peer'lar `setTimeout` bilan ANIQ BIR VAQTDA play qilishi kerak.
- **Qilish kerak:**
  - [ ] `useWatchPartyRoom.ts` → syncState `useEffect` ichida `scheduledAt` tekshirish:
    - `delay = syncState.scheduledAt - Date.now()`
    - `delay > 0` → `setTimeout(() => play(), delay)` (kelajakda play)
    - `delay <= 0` → `position + |delay|/1000` hisoblab seek (o'tib ketgan vaqtni qo'shish)
  - [ ] PAUSE uchun ham: `scheduledAt` vaqtda pause qilish
  - [ ] SEEK uchun: position + network delay kompensatsiya
  - [ ] Heartbeat (VIDEO_HEARTBEAT) da scheduledAt bo'lmaydi → eski mantiq saqlanadi
- **Fayllar:** `apps/mobile/src/hooks/useWatchPartyRoom.ts`
- **Bog'liq:** T-S054 birinchi bo'lishi SHART (backend scheduledAt yuborishi kerak)
- **Natija:** Lag 150ms → 40-60ms. Barcha peer'lar bir vaqtda play/pause bosadi.

---

### T-E099 | P1 | [MOBILE] | Drift correction — playbackRate bilan sekin tuzatish (sakramasdan)

- **Mas'ul:**
- **Holat:** ❌ Boshlanmagan
- **Sabab:** Hozir heartbeat oddiy PLAY event sifatida keladi → member'lar `seekTo()` qiladi → video har 5 sekundda "sakraydi" (jump). Heartbeat alohida event bo'lgandan keyin (T-S056), member faqat drift correction qilishi kerak — KO'ZGA KO'RINMAS tuzatish.
- **Qilish kerak:**
  - [ ] `useWatchPartyRoom.ts` → `VIDEO_HEARTBEAT` event listener qo'shish
  - [ ] Heartbeat kelganda drift hisoblash:
    - `expected = ownerPosition + (Date.now() - ownerTimestamp) / 1000`
    - `myPosition = await playerRef.getPositionMs() / 1000`
    - `drift = myPosition - expected`
  - [ ] Drift > 2.0s → force `seekTo()` (boshqa iloji yo'q)
  - [ ] Drift 0.3-2.0s → `playbackRate = drift > 0 ? 0.95 : 1.05` + 3 sekunddan keyin `1.0` qaytarish
  - [ ] Drift < 0.3s → hech narsa (yetarli darajada sync)
  - [ ] Heartbeat interval ni 5s → 10s ga o'zgartirish (owner emit qismida)
  - [ ] expo-av: `setRateAsync(rate, shouldCorrectPitch: true)` ishlatish
  - [ ] WebView: JS injection `video.playbackRate = 0.95/1.05` ishlatish
- **Fayllar:** `apps/mobile/src/hooks/useWatchPartyRoom.ts`
- **Bog'liq:** T-S056 birinchi bo'lishi SHART (backend HEARTBEAT event yuborishi kerak)
- **Natija:** Video hech qachon "sakramaydi". 1 sekund orqada = bir oz tezroq o'ynab quvib yetadi. Foydalanuvchi sezmaydi.

---

### T-E100 | P1 | [MOBILE] | WebView periodic position polling — sync uchun aniq pozitsiya

- **Mas'ul:**
- **Holat:** ❌ Boshlanmagan
- **Sabab:** Hozir WebView da `getPositionMs()` faqat `currentTimeMsRef.current` qaytaradi — bu faqat WebView message kelganda yangilanadi. Owner heartbeat uchun YANGI va TO'G'RI position kerak, lekin cached (eski) qiymat keladi. Bu sync xatoligiga olib keladi.
- **Qilish kerak:**
  - [ ] `useWebViewPlayer.ts` → har 2 sekundda WebView ga JS injection yuborish:
    ```
    const video = document.querySelector('video');
    if (video) postMessage({ type: 'POSITION_POLL', currentTime: video.currentTime, duration: video.duration });
    ```
  - [ ] `POSITION_POLL` message handler: `currentTimeMsRef.current` yangilash
  - [ ] `setInterval(2000)` — component mount da boshlash, unmount da tozalash
  - [ ] YouTube uchun: `player.getCurrentTime()` ishlatish (YouTube IFrame API)
  - [ ] Polling faqat isPlaying = true bo'lganda ishlashi (battery tejash)
- **Fayllar:** `apps/mobile/src/hooks/useWebViewPlayer.ts`
- **Bog'liq:** MUSTAQIL — hech qanday backend taskni kutish kerak emas ✅
- **Natija:** WebView mode da sync aniqroq bo'ladi. Hozir 2-5 sek xatolik → keyin 0.5-1 sek.

---

### T-E101 | P1 | [MOBILE] | Buffer event — buffering bo'lganda server ga signal yuborish

- **Mas'ul:**
- **Holat:** ❌ Boshlanmagan
- **Sabab:** Hozir video buffer (loading spinner) bo'lganda hech qanday signal yuborilmaydi. Boshqa peer'lar ko'rishda davom etadi → buffer bo'lgan kishi 5-10 sek orqada qoladi. Server (T-S055) buffer signal olsa hammani pause qilishi kerak.
- **Qilish kerak:**
  - [ ] `useWatchPartyRoom.ts` → `onPlaybackStatusUpdate` da `isBuffering` state tekshirish:
    - expo-av: `status.isLoaded && status.isBuffering` → `socket.emit(CLIENT_EVENTS.BUFFER_START)`
    - expo-av: buffer tugaganda → `socket.emit(CLIENT_EVENTS.BUFFER_END)`
  - [ ] WebView uchun: `waiting` event → `postMessage({ type: 'BUFFER' })` → socket emit
  - [ ] WebView `playing` event → buffer end signal
  - [ ] Debounce: 500ms — qisqa buffer'lar uchun signal yubormaslik (tez-tez on/off oldini olish)
  - [ ] UI: "Do'stingiz buffering..." xabari ko'rsatish (boshqa peer buffer qilganda)
- **Fayllar:** `apps/mobile/src/hooks/useWatchPartyRoom.ts`, `apps/mobile/src/hooks/useWebViewPlayer.ts`
- **Bog'liq:** T-S055 birinchi bo'lishi SHART (backend buffer wait logic kerak)
- **Natija:** Bir kishida internet sekin = hammasi kutadi. Tiklanganda birga davom.

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

### T-C012 | P0 | [IKKALASI] | MVP End-to-end test — register → video → WatchParty → sync

- **Mas'ul:** pending[Emirhan] + pending[Saidazim]
- **Holat:** ❌ Boshlanmagan
- **Sabab:** MVP chiqarishdan oldin to'liq flow ishlashini 2 qurilmada tasdiqlash kerak
- **Qilish kerak:**
  - [ ] Register → Login → ProfileSetup (backend + mobile)
  - [ ] SourcePicker → YouTube → video detect → Room yaratish (mobile + backend WP service)
  - [ ] Do'st qo'shish → invite yuborish → push notification kelishi (mobile + backend notification)
  - [ ] 2 qurilmada Watch Party — play/pause/seek sync ishlaydi
  - [ ] Chat xabar yuborish va ko'rish
  - [ ] Room yopish → ROOM_CLOSED event kelishi

---

### T-C013 | P1 | [IKKALASI] | Video extractor — top 5 saytni production da test

- **Mas'ul:** pending[Emirhan] + pending[Saidazim]
- **Holat:** ❌ Boshlanmagan
- **Sabab:** Video extraction dev da ishlaydi, lekin Railway production da har sayt uchun test kerak
- **Qilish kerak:**
  - [ ] YouTube — extract + play + sync
  - [ ] Rutube — extract + play + sync
  - [ ] VK Video — extract + play + sync
  - [ ] kinogo.cc (yoki o'xshash CIS sayt) — extract + play + sync
  - [ ] Direct .mp4 URL — play + sync
  - [ ] Natijalarni matritsa sifatida Done.md ga yozish

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

### T-C014 | P1 | [IKKALASI] | Shared socket events — PEER_OFFER/ANSWER/ICE + MESH (Rave Hybrid)

- **Mas'ul:**
- **Holat:** ❌ Boshlanmagan
- **Sabab:** WebRTC signalling event nomlari backend + mobile da bir xil bo'lishi shart. Birinchi qadam — T-S052 va T-E096 ga dependency.
- **Qilish kerak:**
  - [ ] `shared/constants/socket-events.ts` — `CLIENT_EVENTS.PEER_OFFER`, `PEER_ANSWER`, `PEER_ICE`, `MESH_JOIN`
  - [ ] `SERVER_EVENTS.PEER_OFFER`, `PEER_ANSWER`, `PEER_ICE`, `MESH_PEER_JOINED`
  - [ ] `shared/types/index.ts` — `SyncMessage`, `MeshSignalPayload` types
  - [ ] Kelishish: Saidazim + Emirhan birga (shared file lock protocol)
- **Fayllar:** `shared/constants/socket-events.ts`, `shared/types/index.ts`
- **Reference:** `docs/RAVE_TRANSFORMATION_PLAN.md` §4.3, §6.2 Qadam 1
- **BLOCKS:** T-S052, T-E096

---

### T-C015 | P1 | [IKKALASI] | Rave Hybrid sync — QA matritsa (2/5/10 peer, drift, fallback)

- **Mas'ul:**
- **Holat:** ❌ Boshlanmagan
- **Sabab:** Mesh implementatsiya tugagach MAJBURIY E2E test matritsa. 2 qurilmada emas — 10 gacha. Rave-darajada sync (5-30ms) isbotlash.
- **Qilish kerak:**
  - [ ] 2 peer — full mesh, 1 connection/peer
  - [ ] 5 peer — full mesh, 4 connection/peer
  - [ ] 10 peer — star topology (owner 9 conn, a'zo 1 conn)
  - [ ] Peer drop — qolganlar davom etadi
  - [ ] Owner drop — new owner election yoki room yopish
  - [ ] Mobile background — Socket.io fallback ishlashi
  - [ ] Poor network — ICE fails → Socket.io fallback
  - [ ] Drift test — artificial 3s drift → tiklanishi
  - [ ] Natijalarni Done.md da matritsa sifatida
- **Reference:** `docs/RAVE_TRANSFORMATION_PLAN.md` §6.2 Qadam 6
- **Bog'liq:** T-E096 + T-E097 dan keyin

---

### T-C016 | P2 | [IKKALASI] | Brand rang yagona manbaga — 3 hujjat kelishmovchiligi

- **Mas'ul:**
- **Holat:** ❌ Boshlanmagan
- **Sabab:** Uch hujjatda 3 xil brand rang — kod bilan hujjat nomuvofiq:
  - `CLAUDE.md`: `#E50914` (Netflix red — ESKI)
  - `WEB_DESIGN_GUIDE.md`: `#7C3AED` (purple)
  - `SCREENFLOW_DESIGN_PROMPT.md`: `#7B72F8` (violet)
  - Mobile `theme/index.ts`: `#7B72F8` ishlatadi (F-065 da Netflix red'dan o'zgartirilgan)
- **Qilish kerak:**
  - [ ] Yagona rang tanlash (tavsiya: `#7B72F8` violet — mobile koddagi rang)
  - [ ] `CLAUDE.md` §Design System yangilash (`#E50914` → tanlangan rang)
  - [ ] `WEB_DESIGN_GUIDE.md` yangilash
  - [ ] `apps/web/` kodida hex rang unification (`#7C3AED` → tanlangan)
  - [ ] 3 hujjatda va 2 platformada (mobile+web) bir xil brand rang
- **Reference:** `docs/RAVE_TRANSFORMATION_PLAN.md` §2.3 #6

---
