# CineSync — OCHIQ VAZIFALAR

# Yangilangan: 2026-04-20

# 2 dasturchi: Saidazim (Backend) | Emirhan (Mobile + Web)

---

## 📌 QOIDALAR

```
1. Har topilgan bug/task → shu faylga DARHOL yoziladi
2. Sessiya boshida shu faylni O'QIB, oxirgi T-raqamdan davom
3. Fix bo'lgach → shu yerdan O'CHIRISH → docs/Done.md ga KO'CHIRISH
4. Prioritet: P0=kritik, P1=muhim, P2=o'rta, P3=past
5. Sprint: S1=hozir, S2=keyingi hafta, S3=keyingi sprint, S4-5=keyin
6. Oxirgi T-raqam: S→057, E→105, C→016
7. Yangilangan: 2026-04-20
```

---

# ═══════════════════════════════════════

# 🔴 SAIDAZIM — BACKEND + ADMIN

---

*(Barcha backend tasklari TUGADI — T-S050..T-S057 Done.md da)*

---

# ═══════════════════════════════════════

# 🟢 EMIRHAN — EXPO REACT NATIVE MOBILE + WEB

---

*(Sprint 1..7 TUGADI — Sprint 8: MVP Release — Sprint 9: Sync Optimizatsiya)*

---

### T-E103 | P1 | [MOBILE] | Watch Party: WebView pendingSync — Rutube + boshqa WebView saytlarda sync muammosi

- **Mas'ul:** pending[Saidazim]
- **Yaratilgan:** 2026-04-20 09:04
- **Holat:** ❌ Boshlanmagan
- **Sabab:** Yangi a'zo xonaga qo'shilganda syncState darhol seekTo bajaradi. Lekin WebView (Rutube) hali reklama ko'rsatmoqda — seek reklama vaqtida ignored yoki fails. Reklama tugagach video boshlanmaydi, oxirgi kadrda qotib qoladi.
- **Fayl:** `apps/mobile/src/hooks/useWatchPartyRoom.ts`
- **Qilish kerak:**
  - [ ] `isWebViewMode` bo'lsa: `pendingSync` ref qo'shish — syncState ni saqlab qo'yish
  - [ ] Birinchi `handleWebViewPlay` event kelganda (reklama tugab, haqiqiy video boshlanganda) pendingSync ni apply qilish
  - [ ] `handleWebViewPlay` ichida: `if (pendingSync) { seekTo(pendingSync.currentTime); pendingSync = null; }`
  - [ ] Timeout (30s): agar pendingSync apply bo'lmasa — discard (reklama juda uzun bo'lsa)
- **Ehtiyot:** Faqat `isWebViewMode === true` bo'lganda ishlaydi. expo-av (YouTube extracted, .mp4) ga tegmaydi — ular seekTo ni to'g'ri qabul qiladi

---


### T-E105 | P2 | [MOBILE] | Rutube WebView adapter — noto'g'ri postMessage metodlari

- **Mas'ul:**
- **Yaratilgan:** 2026-04-20 16:16
- **Holat:** ❌ Boshlanmagan
- **Sabab:** `WebViewAdapters.ts` `buildRutubeHtml()` da play/pause/seek buyruqlari YouTube API nomlari bilan yuborilmoqda. Rutube boshqa API format ishlatadi — komandalar ignore qilinadi.
  - `sendCmd('playVideo')` → Rutube `{ method: 'play' }` kutadi
  - `sendCmd('pauseVideo')` → Rutube `{ method: 'pause' }` kutadi
  - `sendCmd('seekTo', t)` → Rutube `{ method: 'setCurrentTime', value: t }` kutishi mumkin
  - Event listener da `onStateChange` + `playerState: 1/2` — bu YouTube formatiga o'xshaydi, Rutube boshqacha yuborishi mumkin
- **Fayl:** `apps/mobile/src/components/video/WebViewAdapters.ts` (line 380-431)
- **Qilish kerak:**
  - [ ] Rutube embed API rasmiy docs yoki DevTools orqali tekshirish — haqiqiy event va metod nomlarini aniqlash
  - [ ] `sendCmd('playVideo')` → `sendCmd('play')`
  - [ ] `sendCmd('pauseVideo')` → `sendCmd('pause')`
  - [ ] `sendCmd('seekTo', t)` → to'g'ri metod nomi bilan almashtirish
  - [ ] `onStateChange` event listenerni Rutube haqiqiy eventlariga moslashtirish
- **Ehtiyot:** Faqat `buildRutubeHtml()` ni o'zgartirish — boshqa platformalar (YouTube, VK, Vimeo, Dailymotion) tegmaydi

---

### T-E081 | P1 | [MOBILE] | Real qurilmada smoke test (Expo Go)

- **Mas'ul:** pending[Emirhan]
- **Yaratilgan:** 2026-03-14 (retroaktiv)
- **Holat:** ⚠️ Qisman (manual check kerak)
- **Qilish kerak (manual):**
  - [ ] Auth flow: Register → Verify → Login → ProfileSetup
  - [ ] SourcePicker → YouTube → video detect → Watch Party yaratish
  - [ ] Do'st qo'shish → invite → birga ko'rish (2 ta qurilma)
  - [ ] Push notification kelishi
  - [ ] Topilgan yangi buglarni Tasks.md ga yozish

---

# ═══════════════════════════════════════

# 🟣 UMUMIY — BARCHA JAMOA

---

### T-C012 | P0 | [IKKALASI] | MVP End-to-end test — register → video → WatchParty → sync

- **Mas'ul:** pending[Emirhan] + pending[Saidazim]
- **Yaratilgan:** 2026-04-19 (retroaktiv)
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
- **Yaratilgan:** 2026-04-19 (retroaktiv)
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
- **Yaratilgan:** 2026-04-19 (retroaktiv)
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
- **Yaratilgan:** 2026-04-19 (retroaktiv)
- **Holat:** ❌ Boshlanmagan
- **Sabab:** `CLAUDE.md` → `#E50914`, `WEB_DESIGN_GUIDE.md` → `#7C3AED`, mobile kod → `#7B72F8`. Yagona rang kerak.
- **Qilish kerak:**
  - [ ] `#7B72F8` violet tanlash (mobile koddagi rang)
  - [ ] `CLAUDE.md` §Design System yangilash
  - [ ] `WEB_DESIGN_GUIDE.md` yangilash
  - [ ] `apps/web/` kodida unification
- **Reference:** `docs/RAVE_TRANSFORMATION_PLAN.md` §2.3 #6

---
