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
6. Oxirgi T-raqam: S→063, E→105, C→016
7. Yangilangan: 2026-04-21
```

---

# ═══════════════════════════════════════

# 🔴 SAIDAZIM — BACKEND + ADMIN

---

### T-S060 | P2 | [BACKEND] | Video queue / playlist — Watch Party da ketma-ket videolar

- **Mas'ul:**
- **Yaratilgan:** 2026-04-21 21:04
- **Holat:** ❌ Boshlanmagan
- **Sabab:** Bekzod aka roadmap — Faza 1, effort M. "Bir epizod tugadi — keyingi" muammosi.
- **Qilish kerak:**
  - [ ] `WatchPartyRoom` modeliga `playlist: VideoItem[]` field qo'shish
  - [ ] `POST /rooms/:id/playlist` — video qo'shish (owner only)
  - [ ] `DELETE /rooms/:id/playlist/:index` — o'chirish
  - [ ] `POST /rooms/:id/playlist/next` — keyingi videoga o'tish
  - [ ] Socket event: `playlist:updated` barcha a'zolarga

---

### T-S061 | P2 | [BACKEND] | Recent rooms history — foydalanuvchi oxirgi xonalari

- **Mas'ul:**
- **Yaratilgan:** 2026-04-21 21:04
- **Holat:** ❌ Boshlanmagan
- **Qilish kerak:**
  - [ ] `GET /rooms/my/recent` — user ning oxirgi 10 ta room (member bo'lgan)
  - [ ] `WatchPartyRoom` da `members` array mavjud → filter by userId, sort by `lastActivityAt`
  - [ ] Redis cache: `recent_rooms:{userId}` TTL 5 min

---

### T-S062 | P2 | [BACKEND] | Active public rooms feed — discovery

- **Mas'ul:**
- **Yaratilgan:** 2026-04-21 21:04
- **Holat:** ❌ Boshlanmagan
- **Sabab:** Bekzod aka roadmap — Faza 2, cold-start fix. Redis sorted set.
- **Qilish kerak:**
  - [ ] `GET /rooms/public/active` — isPrivate=false, status=active, sort by memberCount
  - [ ] Redis sorted set: `public_rooms` — score = memberCount, TTL 30s cache
  - [ ] Room yaratilganda/yopilganda Redis set yangilanadi

---

### T-S063 | P3 | [BACKEND] | Telegram "Share room" bot — viral loop

- **Mas'ul:**
- **Yaratilgan:** 2026-04-21 21:04
- **Holat:** ❌ Boshlanmagan
- **Sabab:** Bekzod aka roadmap — Faza 1, effort S. CAC=0, MD Osiyo viral loop.
- **Qilish kerak:**
  - [ ] Telegram bot: `/shareroom <inviteCode>` → deep link yuboradi
  - [ ] `services/notification/` da bot command handler qo'shish
  - [ ] Deep link format: `t.me/RaveBot?start=room_{inviteCode}`
  - [ ] Room join page mobile da deep link bilan ochiladi
  - **Bog'liq:** T-S058 (reactions) birinchi, keyin bu

---

# ═══════════════════════════════════════

# 🟢 EMIRHAN — EXPO REACT NATIVE MOBILE + WEB

---

*(Sprint 1..7 TUGADI — Sprint 8: MVP Release — Sprint 9: Sync Optimizatsiya)*

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
