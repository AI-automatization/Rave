# CineSync — OCHIQ VAZIFALAR

# Yangilangan: 2026-04-17

# 2 dasturchi: Saidazim (Backend) | Emirhan (Mobile + Web)

---

## 📌 QOIDALAR

```
1. Har topilgan bug/task → shu faylga DARHOL yoziladi
2. Sessiya boshida shu faylni O'QIB, oxirgi T-raqamdan davom
3. Fix bo'lgach → shu yerdan O'CHIRISH → docs/Done.md ga KO'CHIRISH
4. Prioritet: P0=kritik, P1=muhim, P2=o'rta, P3=past
5. Sprint: S1=hozir, S2=keyingi hafta, S3=keyingi sprint, S4-5=keyin
6. Oxirgi T-raqam: S→056, E→101, C→016
7. Yangilangan: 2026-04-17
```

---

# ═══════════════════════════════════════

# 🔴 SAIDAZIM — BACKEND + ADMIN

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
- **Bog'liq:** T-C014 birinchi bo'lishi shart

---

### T-S051 | P1 | [BACKEND] | Video extractor — Playwright bot detection fix (captcha blokirovkasi)

- **Mas'ul:** pending[Saidazim]
- **Holat:** ❌ Boshlanmagan
- **Sabab:** `playwrightExtractor.ts` headless Chromium `--no-sandbox` flag bilan ishlaydi → Cloudflare/DDoS-Guard uni bot deb bloklaydi. Railway server IP hammaning so'rovlari uchun bitta — bir necha urinishdan keyin IP block-listga tushadi va captcha chiqadi.
- **Qilish kerak:**
  - [ ] `playwrightExtractor.ts`: stealth plugin qo'shish (`playwright-stealth` yoki `puppeteer-extra-plugin-stealth` analog)
  - [ ] `genericExtractor.ts`: tasodifiy User-Agent rotation (har so'rovda boshqa UA)
  - [ ] `genericExtractor.ts`: iframe recursion orasiga 100-300ms tasodifiy delay
  - [ ] Geo-blocked domenlar uchun Redis cache TTL oshirish: `hdrezka`, `filmix`, `kinogo` → 6-12 soat
  - [ ] Railway deploy uchun proxy rotation imkoniyatini ko'rish (agar IP blok davom etsa)
- **Fayllar:** `services/content/src/services/videoExtractor/playwrightExtractor.ts`, `genericExtractor.ts`, `index.ts`

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

### T-S050 | P1 | [BACKEND] | Push notification E2E test — Expo Push Token → FCM delivery

- **Mas'ul:** pending[Saidazim]
- **Holat:** ❌ Boshlanmagan
- **Sabab:** Mobile da Expo Push Token yuboriladi, lekin real qurilmada push notification kelishi hech qachon test qilinmagan
- **Qilish kerak:**
  - [ ] Expo Push Token → notification service da to'g'ri qabul qilinishini tekshirish
  - [ ] Friend request / WatchParty invite push larni real qurilmada test
  - [ ] FCM vs Expo Push Server — qaysi biri ishlatilayotganini aniqlash va test

---

## 🎬 BOSQICH A — Video Sync Optimizatsiya (Socket.io + Predictive + Drift)

> **Maqsad:** Sync lag ni 150ms+ dan 20-40ms ga tushirish. WebRTC/Mesh KUTMASDAN hoziroq qilish mumkin.
> **Natija:** Rave bilan 65% funksional o'xshashlik (hozir 30%).
> **Tartib:** T-S054 → T-E098 → T-S056 → T-E099 → T-E100 → T-S055 → T-E101

---

# ═══════════════════════════════════════

# 🟢 EMIRHAN — EXPO REACT NATIVE MOBILE + WEB

---

*(Sprint 1..7 TUGADI — Sprint 8: MVP Release — Sprint 9: Sync Optimizatsiya)*

---

### T-E096 | P1 | [MOBILE] | MeshClient + SyncProtocol — WebRTC DataChannel sync

- **Mas'ul:**
- **Holat:** ❌ Boshlanmagan
- **Sabab:** Rave'ning 5-30ms sync uchun WebRTC DataChannel. `react-native-webrtc` allaqachon o'rnatilgan. **Expo Go da ishlamaydi → development build kerak.**
- **Qilish kerak:**
  - [ ] `apps/mobile/src/services/mesh/MeshClient.ts` — `RTCPeerConnection` + `DataChannel` full implementation
  - [ ] `apps/mobile/src/services/mesh/SyncProtocol.ts` — play/pause/seek/heartbeat + drift correction
  - [ ] `apps/mobile/src/services/mesh/config.ts` — ICE servers (Google STUN + TURN)
  - [ ] `apps/mobile/src/services/mesh/types.ts` — `SyncMessage`, `MeshConfig`
  - [ ] `useWatchParty.ts` integration — MeshClient lifecycle
  - [ ] TURN server: Metered.ca bepul tier (50GB/oy)
- **Fayllar:** `apps/mobile/src/services/mesh/*` (yangi papka), `apps/mobile/src/hooks/useWatchParty.ts`
- **Reference:** `docs/RAVE_TRANSFORMATION_PLAN.md` §6.2 Qadam 2-3
- **Bog'liq:** T-C014 + T-S052 birinchi bo'lishi shart

---

### T-E097 | P2 | [MOBILE] | SyncBroadcaster + TopologyManager — fallback + mesh/star/socket

- **Mas'ul:**
- **Holat:** ❌ Boshlanmagan
- **Sabab:** Mesh peers soniga qarab topology tanlash: ≤6 full mesh, 7-15 star, 16+ Socket.io fallback.
- **Qilish kerak:**
  - [ ] `SyncBroadcaster.ts` — mesh + Socket.io ikki yo'nalish; `viaMesh` flag
  - [ ] `TopologyManager.ts` — `FULL_MESH_LIMIT=6`, `STAR_LIMIT=15` constantalar
  - [ ] `AppState.addEventListener` — background → `meshClient.destroy()`, active → `reconnect()`
- **Fayllar:** `apps/mobile/src/services/mesh/SyncBroadcaster.ts`, `TopologyManager.ts`
- **Reference:** `docs/RAVE_TRANSFORMATION_PLAN.md` §6.2 Qadam 4-5-6
- **Bog'liq:** T-E096 dan keyin

---

### T-E095 | P2 | [MOBILE] | HomeScreen Rave CTA — "Birga ko'rish" tugmasi

- **Mas'ul:**
- **Holat:** ❌ Boshlanmagan
- **Sabab:** Hozirgi HomeScreen Netflix stili. Rave da entry point Rooms/Source Picker.
- **Qilish kerak:**
  - [ ] `HomeScreen.tsx` yuqorisida "Birga ko'rish" hero CTA qo'shish
  - [ ] Tugma → `navigation.navigate('Rooms', { screen: 'RoomsScreen' })`
  - [ ] Movie catalog rows pastroqqa
- **Fayllar:** `apps/mobile/src/screens/home/HomeScreen.tsx`
- **Reference:** `docs/RAVE_TRANSFORMATION_PLAN.md` §4.2 Fayl 4

---

### T-E081 | P1 | [MOBILE] | Real qurilmada smoke test (Expo Go)

- **Mas'ul:** pending[Emirhan]
- **Holat:** ⚠️ Qisman (manual check kerak)
- **Qilish kerak (manual):**
  - [ ] Auth flow: Register → Verify → Login → ProfileSetup
  - [ ] SourcePicker → YouTube → video detect → Watch Party yaratish
  - [ ] Do'st qo'shish → invite → birga ko'rish (2 ta qurilma)
  - [ ] Push notification kelishi
  - [ ] Topilgan yangi buglarni Tasks.md ga yozish

---

## 🎬 BOSQICH A — Mobile Sync Optimizatsiya

---

### T-E101 | P1 | [MOBILE] | Buffer event — buffering bo'lganda server ga signal yuborish

- **Mas'ul:**
- **Holat:** ❌ Boshlanmagan
- **Sabab:** Video buffer bo'lganda hech signal yuborilmaydi → boshqa peer'lar davom etadi → buffer bo'lgan 5-10 sek orqada qoladi.
- **Qilish kerak:**
  - [ ] `useWatchPartyRoom.ts` → `isBuffering` → `socket.emit(CLIENT_EVENTS.BUFFER_START)`
  - [ ] Buffer tugaganda → `socket.emit(CLIENT_EVENTS.BUFFER_END)`
  - [ ] WebView: `waiting` event → buffer signal
  - [ ] Debounce: 500ms (qisqa buffer'lar uchun)
  - [ ] UI: "Do'stingiz buffering..." xabari
- **Fayllar:** `apps/mobile/src/hooks/useWatchPartyRoom.ts`, `apps/mobile/src/hooks/useWebViewPlayer.ts`
- **Bog'liq:** T-S055 birinchi bo'lishi SHART

---

# ═══════════════════════════════════════

# 🟣 UMUMIY — BARCHA JAMOA

---

### T-C012 | P0 | [IKKALASI] | MVP End-to-end test — register → video → WatchParty → sync

- **Mas'ul:** pending[Emirhan] + pending[Saidazim]
- **Holat:** ❌ Boshlanmagan
- **Sabab:** MVP chiqarishdan oldin to'liq flow ishlashini 2 qurilmada tasdiqlash kerak
- **Qilish kerak:**
  - [ ] Register → Login → ProfileSetup
  - [ ] SourcePicker → YouTube → video detect → Room yaratish
  - [ ] Do'st qo'shish → invite → push notification kelishi
  - [ ] 2 qurilmada Watch Party — play/pause/seek sync ishlaydi
  - [ ] Chat xabar yuborish va ko'rish
  - [ ] Room yopish → ROOM_CLOSED event kelishi

---

### T-C013 | P1 | [IKKALASI] | Video extractor — top 5 saytni production da test

- **Mas'ul:** pending[Emirhan] + pending[Saidazim]
- **Holat:** ❌ Boshlanmagan
- **Qilish kerak:**
  - [ ] YouTube — extract + play + sync
  - [ ] Rutube — extract + play + sync
  - [ ] VK Video — extract + play + sync
  - [ ] kinogo.cc — extract + play + sync
  - [ ] Direct .mp4 URL — play + sync
  - [ ] Natijalarni matritsa sifatida Done.md ga yozish

---

### T-C015 | P1 | [IKKALASI] | Rave Hybrid sync — QA matritsa (2/5/10 peer, drift, fallback)

- **Mas'ul:**
- **Holat:** ❌ Boshlanmagan
- **Sabab:** Mesh implementatsiya tugagach MAJBURIY E2E test matritsa.
- **Qilish kerak:**
  - [ ] 2 peer — full mesh
  - [ ] 5 peer — full mesh
  - [ ] 10 peer — star topology
  - [ ] Peer drop — qolganlar davom etadi
  - [ ] Owner drop — room yopiladi yoki yangi owner
  - [ ] Mobile background — Socket.io fallback
  - [ ] Poor network — ICE fails → Socket.io fallback
  - [ ] Drift test — artificial 3s drift → tiklanishi
  - [ ] Natijalarni Done.md da matritsa sifatida
- **Bog'liq:** T-E096 + T-E097 dan keyin

---

### T-C016 | P2 | [IKKALASI] | Brand rang yagona manbaga — 3 hujjat kelishmovchiligi

- **Mas'ul:**
- **Holat:** ❌ Boshlanmagan
- **Sabab:** `CLAUDE.md` → `#E50914`, `WEB_DESIGN_GUIDE.md` → `#7C3AED`, mobile kod → `#7B72F8`. Yagona rang kerak.
- **Qilish kerak:**
  - [ ] `#7B72F8` violet tanlash (mobile koddagi rang)
  - [ ] `CLAUDE.md` §Design System yangilash
  - [ ] `WEB_DESIGN_GUIDE.md` yangilash
  - [ ] `apps/web/` kodida unification
- **Reference:** `docs/RAVE_TRANSFORMATION_PLAN.md` §2.3 #6

---
