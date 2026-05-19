# CineSync — OCHIQ VAZIFALAR

# Yangilangan: 2026-05-11

---

# 🟠 PLAY STORE COMPLIANCE — MVP uchun majburiy

---

### T-S094 | P2 | [DEVOPS] | Play Store: Privacy Policy + DMCA sahifasi | pending[Saidazim]

- **Mas'ul:** pending[Saidazim]
- **Beruvchi:** Saidazim
- **Yaratilgan:** 2026-05-11 13:39
- **Holat:** ❌ Boshlanmagan
- **Tavsiya model:** sonnet
- **Model sababi:** Landing page yoki static page, o'rta murakkablik
- **Sabab:** Play Console submission uchun majburiy — Privacy Policy URL bo'lmasa app publish bo'lmaydi
- **Qilish kerak:**
  - [ ] Privacy Policy sahifasi yozish — nima yig'iladi, qanday ishlatiladi, kim bilan ulashiladi
  - [ ] DMCA / Copyright page — `copyright@wewatch.app` email + jarayon
  - [ ] Sahifani public URL da joylash (GitHub Pages yoki landing)
  - [ ] URL ni Play Console ga qo'shish

---

### T-S085 | P1 | [BACKEND] | Domain tracking — POST /domains/visit endpoint | done[Saidazim]

- **Mas'ul:** done[Saidazim]
- **Beruvchi:** Saidazim
- **Yaratilgan:** 2026-05-09 14:56
- **Holat:** ✅ Bajarildi
- **Tavsiya model:** sonnet
- **Model sababi:** Controller + route + validation, 2 fayl
- **Sabab:** Adminlar foydalanuvchilar qaysi domenlarni ochishini ko'ra olsin + bloklashi mumkin bo'lsin
- **O'zgarishlar:**
  - `services/content/src/controllers/domain.controller.ts` — `trackVisit` metodi qo'shildi (upsert, auto-flag, validate)
  - `services/content/src/routes/domain.routes.ts` — `POST /domains/visit` (verifyToken + rateLimit)

---



### T-S082 | P2 | [DEVOPS] | Security: Deploy workflows — CI/CD pipeline qo'shish | pending[Saidazim]

- **Mas'ul:** pending[Saidazim]
- **Beruvchi:** Абдулазиз (audit 2026-05-08, issue #10)
- **Yaratilgan:** 2026-05-08 23:55
- **Holat:** ❌ Boshlanmagan
- **Tavsiya model:** sonnet
- **Model sababi:** GitHub Actions workflow — yangi fayl, o'rta murakkablik
- **Sabab:** MEDIUM — deploy workflows TODO stub, haqiqiy CI/CD yo'q
- **Qilish kerak:**
  - [ ] `.github/workflows/ci.yml` — tsc + test har PR da
  - [ ] `.github/workflows/deploy.yml` — Railway deploy main ga merge bo'lganda

---

### T-S083 | P3 | [BACKEND] | Quality: 26 god files (>15KB) — split eng katta 3 tasi | pending[Saidazim]

- **Mas'ul:** pending[Saidazim]
- **Beruvchi:** Абдулазиз (audit 2026-05-08, issue #16)
- **Yaratilgan:** 2026-05-08 23:55
- **Holat:** ❌ Boshlanmagan
- **Tavsiya model:** opus
- **Model sababi:** Ko'p fayllik refactor, SOLID, ichki arxitektura tushunish kerak
- **Sabab:** MEDIUM maintainability — 26 fayl 15KB dan oshgan
- **Qilish kerak:**
  - [ ] `find . -name "*.ts" | xargs wc -l | sort -rn | head -30` — eng katta fayllar
  - [ ] Top 3 faylni sub-modulga ajratish

---






# 2 dasturchi: Saidazim (Backend) | Emirhan (Mobile + Web)

---

## 📌 QOIDALAR

```
1. Har topilgan bug/task → shu faylga DARHOL yoziladi
2. Sessiya boshida shu faylni O'QIB, oxirgi T-raqamdan davom
3. Fix bo'lgach → shu yerdan O'CHIRISH → docs/Done.md ga KO'CHIRISH
4. Prioritet: P0=kritik, P1=muhim, P2=o'rta, P3=past
5. Sprint: S1=hozir, S2=keyingi hafta, S3=keyingi sprint, S4-5=keyin
6. Oxirgi T-raqam: S→095, E→119, C→016
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

# 🎬 MARKETING — HIGGSFIELD AI VIDEO GENERATION

---

### T-E120 | P1 | [MARKETING] | WeWatch Promo Reel — Concept 1 "Purple Pulse" (8 sek)

- **Mas'ul:** pending[Emirhan]
- **Beruvchi:** Emirhan
- **Yaratilgan:** 2026-05-19 14:34
- **Holat:** 🔄 Bajarilmoqda
- **Tavsiya model:** higgsfield / seedance_1_5
- **Model sababi:** Higgsfield AI video generation, 9:16, 8 sek, 9.6 kredit
- **Sabab:** WeWatch uchun premium promo reel — dark cosmic, purple brand colors, split-screen sync konsepti
- **Qilish kerak:**
  - [x] Marketing papka tuzilmasi yaratish (`marketing/videos`, `marketing/images`, `marketing/briefs`)
  - [ ] Concept 1 videoni generate qilish (Seedance 1.5 Pro, 8s, 9:16)
  - [ ] Natijani `marketing/videos/concept1-purple-pulse.mp4` ga saqlash
  - [ ] Sifatni baholash va kerak bo'lsa qayta generate

---

### T-E121 | P2 | [MARKETING] | WeWatch Promo Reel — Concept 2 "Three Cities" (4 sek)

- **Mas'ul:** pending[Emirhan]
- **Beruvchi:** Emirhan
- **Yaratilgan:** 2026-05-19 14:34
- **Holat:** ❌ Boshlanmagan
- **Tavsiya model:** higgsfield / seedance_1_5
- **Model sababi:** Higgsfield AI video generation, 9:16, 4 sek, 4.8 kredit
- **Sabab:** TikTok/Instagram Reels uchun tez punchy versiya — 3 shahar, bir vaqtda reakciya
- **Qilish kerak:**
  - [ ] Concept 2 videoni generate qilish (Seedance 1.5 Pro, 4s, 9:16)
  - [ ] Natijani `marketing/videos/concept2-three-cities.mp4` ga saqlash

---

### T-E122 | P2 | [MARKETING] | WeWatch Promo Reel — Concept 3 "Macro Mood" (8 sek)

- **Mas'ul:** pending[Emirhan]
- **Beruvchi:** Emirhan
- **Yaratilgan:** 2026-05-19 14:34
- **Holat:** ❌ Boshlanmagan
- **Tavsiya model:** higgsfield / seedance_1_5
- **Model sababi:** Higgsfield AI video generation, 9:16, 8 sek, 9.6 kredit
- **Sabab:** Ultra-cinematic macro versiya — fingertip, glass reflection, premium feel
- **Qilish kerak:**
  - [ ] Concept 3 videoni generate qilish (Seedance 1.5 Pro, 8s, 9:16)
  - [ ] Natijani `marketing/videos/concept3-macro-mood.mp4` ga saqlash

---







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

- **Bog'liq:** services/notification — invite push payload

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

