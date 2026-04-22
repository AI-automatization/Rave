# CineSync — OCHIQ VAZIFALAR

# Yangilangan: 2026-04-21

# 2 dasturchi: Saidazim (Backend) | Emirhan (Mobile + Web)

---

## 📌 QOIDALAR

```
1. Har topilgan bug/task → shu faylga DARHOL yoziladi
2. Sessiya boshida shu faylni O'QIB, oxirgi T-raqamdan davom
3. Fix bo'lgach → shu yerdan O'CHIRISH → docs/Done.md ga KO'CHIRISH
4. Prioritet: P0=kritik, P1=muhim, P2=o'rta, P3=past
5. Sprint: S1=hozir, S2=keyingi hafta, S3=keyingi sprint, S4-5=keyin
6. Oxirgi T-raqam: S→064, E→110, C→016
7. Yangilangan: 2026-04-22
```

---

# ═══════════════════════════════════════

# 🔴 SAIDAZIM — BACKEND + ADMIN

---

# ═══════════════════════════════════════

# 🟢 EMIRHAN — EXPO REACT NATIVE MOBILE + WEB

---

*(Sprint 1..7 TUGADI — Sprint 8: MVP Release — Sprint 9: Sync Optimizatsiya)*

---


### T-E106 | P1 | [MOBILE] | Live reactions UI — floating emoji during watch party

- **Mas'ul:**
- **Yaratilgan:** 2026-04-22 12:20
- **Holat:** ❌ Boshlanmagan
- **Sabab:** Backend T-S058 tayyor — socket events `reaction:send` + `reaction:broadcast` ishlaydi
- **Qilish kerak:**
  - [ ] `WatchPartyScreen` da emoji picker (bottom bar yoki floating button)
  - [ ] `CLIENT_EVENTS.SEND_REACTION` emit: `{ emoji }` — socket ga yuborish
  - [ ] `SERVER_EVENTS.REACTION_BROADCAST` listener: `{ userId, emoji, timestamp }` qabul qilish
  - [ ] Floating emoji animation: ekranda yuqoriga ko'tariluvchi emoji (Animated.Value)
  - [ ] Whitelist: ❤️ 😂 🔥 👏 😮 😢 🎉 👍 💯 🍿 (qisqa picker)
  - [ ] Rate limit UI: 10/sec dan ortiq yuborishni frontend da ham cheklash

---

### T-E107 | P1 | [MOBILE] | Playlist UI — Watch Party queue (owner controls)

- **Mas'ul:**
- **Yaratilgan:** 2026-04-22 12:20
- **Holat:** ❌ Boshlanmagan
- **Sabab:** Backend T-S060 tayyor — playlist CRUD + `playlist:updated` socket event
- **Qilish kerak:**
  - [ ] `SERVER_EVENTS.PLAYLIST_UPDATED` listener → playlist state yangilash
  - [ ] Owner uchun: "Add to queue" tugmasi (SourcePicker flow ga bog'lash)
  - [ ] `POST /rooms/:id/playlist` — video qo'shish
  - [ ] `DELETE /rooms/:id/playlist/:index` — o'chirish
  - [ ] `POST /rooms/:id/playlist/next` — keyingi video (owner only)
  - [ ] Playlist UI: WatchPartyScreen da collapsible list (non-owner faqat ko'radi)
  - [ ] `ROOM_UPDATED` event qabul → yangi videoUrl ni player ga uzatish

---

### T-E108 | P2 | [MOBILE] | Recent rooms screen — oxirgi ko'rilgan xonalar

- **Mas'ul:**
- **Yaratilgan:** 2026-04-22 12:20
- **Holat:** ❌ Boshlanmagan
- **Sabab:** Backend T-S061 tayyor — `GET /watch-party/rooms/my/recent` endpoint
- **Qilish kerak:**
  - [ ] `GET /watch-party/rooms/my/recent` API chaqiruvi
  - [ ] WatchPartyCreateScreen yoki HomeScreen da "Recent rooms" tab/section
  - [ ] Room card: name/title, memberCount, status, lastActivityAt
  - [ ] Tap → joinRoom (inviteCode orqali)
  - [ ] Empty state: "Hali xona yo'q"

---

### T-E109 | P2 | [MOBILE] | Public rooms discovery — ochiq xonalar lenti

- **Mas'ul:**
- **Yaratilgan:** 2026-04-22 12:20
- **Holat:** ❌ Boshlanmagan
- **Sabab:** Backend T-S062 tayyor — `GET /watch-party/rooms/public/active` (memberCount bo'yicha)
- **Qilish kerak:**
  - [ ] `GET /watch-party/rooms/public/active` API chaqiruvi
  - [ ] SourcePickerScreen yoki yangi DiscoverScreen da "Live rooms" section
  - [ ] Room card: videoTitle, memberCount badge, status indicator (🟢 playing / 🟡 waiting)
  - [ ] Pull-to-refresh (30s cache bo'lgani uchun)
  - [ ] Tap → joinRoom flow (private room bo'lsa password modal)

---

### T-E110 | P2 | [MOBILE] | Telegram Share room — native share sheet

- **Mas'ul:**
- **Yaratilgan:** 2026-04-22 12:20
- **Holat:** ❌ Boshlanmagan
- **Sabab:** Backend T-S063 tayyor — `@gatsCinema_bot` webhook ishlaydi
- **Qilish kerak:**
  - [ ] `GET /notifications/telegram/share-link?inviteCode=XXXX` API chaqiruvi
  - [ ] WatchPartyScreen da "Share" tugmasi (owner + member uchun)
  - [ ] `Share.share()` (React Native built-in) — link + "Join me on Rave!"
  - [ ] Deep link handler: `cinesync://join/:inviteCode` → joinRoom flow
  - [ ] `app.json` da `scheme: "cinesync"` va Linking config tekshirish

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

