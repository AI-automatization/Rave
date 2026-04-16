# CineSync — OCHIQ VAZIFALAR

# Yangilangan: 2026-04-16

# 3 dasturchi: Saidazim (Backend) | Emirhan (Mobile) | Jafar (Mobile)

---

## 📌 QOIDALAR

```
1. Har topilgan bug/task → shu faylga DARHOL yoziladi
2. Sessiya boshida shu faylni O'QIB, oxirgi T-raqamdan davom
3. Fix bo'lgach → shu yerdan O'CHIRISH → docs/Done.md ga KO'CHIRISH
4. Prioritet: P0=kritik, P1=muhim, P2=o'rta, P3=past
5. Sprint: S1=hozir, S2=keyingi hafta, S3=keyingi sprint, S4-5=keyin
6. Oxirgi T-raqam: S→053, E→097, J→037, C→016
7. Yangilangan: 2026-04-16
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




# ═══════════════════════════════════════

# 🟢 EMIRHAN — EXPO REACT NATIVE MOBILE

---

*(Sprint 1..7 TUGADI — Sprint 8: MVP Release)*

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

### T-E092 | P1 | [MOBILE] | WatchPartyScreen "+" FAB — Source Picker launcher (Rave UX flow)

- **Mas'ul:** pending[Emirhan]
- **Holat:** 🔄 Jarayonda
- **Sabab:** Rave UX: room ichida "+" tugma → Source Picker. Hozirgi `changeMediaBtn` kichik text-button, Rave style'ga mos emas. MVP entry point fix (plan §2.3 #2).
- **Qilish kerak:**
  - [ ] `WatchPartyScreen.tsx:394-403` — `changeMediaBtn` → FAB style "+" tugma
  - [ ] Faqat `isOwner` da ko'rinadi (mavjud)
  - [ ] `add-circle-outline` → `add` (katta icon, 28px)
  - [ ] `handleOpenSourcePicker` → `navigation.navigate('SourcePicker', { mode: 'change', roomId })`
- **Fayllar:** `apps/mobile/src/screens/modal/WatchPartyScreen.tsx`
- **Reference:** `docs/RAVE_TRANSFORMATION_PLAN.md` §4.2 Fayl 1

---

### T-E093 | P1 | [MOBILE] | SourcePicker `mode: 'create' | 'change'` prop + navigation

- **Mas'ul:** pending[Emirhan]
- **Holat:** 🔄 Jarayonda
- **Sabab:** Hozir SourcePicker faqat "create new room" mode da ishlaydi. Rave UX da mavjud roomdan ochib CHANGE_MEDIA yuborilishi kerak.
- **Qilish kerak:**
  - [ ] `ModalStackParamList.SourcePicker: { mode: 'create' | 'change'; roomId?: string }`
  - [ ] `SourcePickerScreen.tsx` — `mode` va `roomId` navigation param qabul qiladi
  - [ ] `navigation.navigate('MediaWebView', { mode, roomId, defaultUrl })` ga uzatadi
- **Fayllar:** `apps/mobile/src/types/index.ts`, `apps/mobile/src/screens/modal/SourcePickerScreen.tsx`
- **Reference:** `docs/RAVE_TRANSFORMATION_PLAN.md` §4.2 Fayl 2
- **Bog'liq:** T-E092 dan keyin

---

### T-E094 | P1 | [MOBILE] | MediaWebView — CHANGE_MEDIA vs createRoom ajratish

- **Mas'ul:**
- **Holat:** ❌ Boshlanmagan
- **Sabab:** Video topilganda `mode='change'` bo'lsa — `CHANGE_MEDIA` socket event; `mode='create'` bo'lsa — `createRoom`. Hozirgi kod faqat bitta yo'lni bajaradi (plan §2.3 #4).
- **Qilish kerak:**
  - [ ] `MediaWebViewScreen.tsx` `handleSendToRoom`: `params.mode === 'change'` → `socket.emit(CLIENT_EVENTS.CHANGE_MEDIA, { roomId, videoUrl, ... })` + `navigation.goBack()`
  - [ ] `params.mode === 'create'` → eski flow (createRoom + navigation.replace)
  - [ ] Popup qaytarish (hozirgi bottom bar o'rniga) yoki ikki variantni ham qoldirish — UX qarori
- **Fayllar:** `apps/mobile/src/screens/modal/MediaWebViewScreen.tsx`
- **Reference:** `docs/RAVE_TRANSFORMATION_PLAN.md` §4.2 Fayl 3
- **Bog'liq:** T-E093 dan keyin

---

### T-E095 | P2 | [MOBILE] | HomeScreen Rave CTA — "Birga ko'rish" tugmasi

- **Mas'ul:**
- **Holat:** ❌ Boshlanmagan
- **Sabab:** Hozirgi HomeScreen Netflix stili (catalog-first). Rave da entry point Rooms/Source Picker. Plan §4.2 Fayl 4 variant A — catalog qoldirib, eng ko'zga tashlanadigan "Watch together" CTA qo'shish.
- **Qilish kerak:**
  - [ ] `HomeScreen.tsx` yuqorisida "Birga ko'rish" hero CTA qo'shish
  - [ ] Tugma → `navigation.navigate('Rooms', { screen: 'RoomsScreen' })` yoki to'g'ridan SourcePicker
  - [ ] Movie catalog rows pastroqqa
- **Fayllar:** `apps/mobile/src/screens/home/HomeScreen.tsx`
- **Reference:** `docs/RAVE_TRANSFORMATION_PLAN.md` §4.2 Fayl 4

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
