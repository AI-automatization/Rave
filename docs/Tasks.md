# CineSync — OCHIQ VAZIFALAR

# Yangilangan: 2026-05-09

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

### T-E120 | P1 | [MOBILE] | Domain tracking — WebView da tashrif buyurilgan domenni backendga yuborish | pending[Emirhan]

- **Mas'ul:** pending[Emirhan]
- **Beruvchi:** Saidazim
- **Yaratilgan:** 2026-05-09 14:56
- **Holat:** ❌ Boshlanmagan
- **Tavsiya model:** haiku
- **Model sababi:** 2 fayl, oddiy API call — fire-and-forget
- **Sabab:** Backend T-S085 tayyor — endi mobile domenni yuborishi kerak, aks holda UrlVisit kolleksiyasi bo'm-bo'sh qoladi
- **Qilish kerak:**
  - [ ] `apps/mobile/src/api/content.api.ts` — `trackDomainVisit(domain: string): Promise<void>` funksiyasi qo'shish (`contentClient.post('/domains/visit', { domain })`)
  - [ ] `apps/mobile/src/screens/modal/MediaWebViewScreen.tsx` — `onShouldStartLoadWithRequest` da domen blocked emas bo'lsa hostname ajratib fire-and-forget yuborish
  - Import: `import { contentApi } from '@api/content.api'`
  - Tracking faqat bloklenmagan domenlar uchun, xato bo'lsa `.catch(() => {})` bilan yutib yuborish
- **Bog'liq:** T-S085 (backend tayyor)

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


### T-S068 | P0 | [ADMIN] | Admin UI — User Detail page (/users/:id) + Contact user | pending[Saidazim]

- **Mas'ul:** pending[Saidazim]
- **Yaratilgan:** 2026-04-24 23:08
- **Holat:** ⏸️ Paused
- **Sabab:** Admin xatosi bo'lgan foydalanuvchi bilan bog'lana olmaydi
- **Qilish kerak:**
  - [ ] /users/:id sahifasi — avatar, email, username, role, joined
  - [ ] Foydalanuvchi xatolari tarixi (userId bilan bog'liq errors)
  - [ ] "Xabar yuborish" — mailto: email link
  - [ ] Block/unblock, role o'zgartirish

---

### T-S069 | P0 | [ADMIN] | Admin UI — ErrorsPage: user info + contact button in EventDrawer | pending[Saidazim]

- **Mas'ul:** pending[Saidazim]
- **Yaratilgan:** 2026-04-24 23:08
- **Holat:** ⏸️ Paused
- **Sabab:** Xato bo'lgan foydalanuvchining kontakt ma'lumotlari ko'rinmaydi
- **Qilish kerak:**
  - [ ] EventDrawer: userId bo'lsa → user API dan email/username olish
  - [ ] "Foydalanuvchi profili" → /users/:id link
  - [ ] "Bog'lanish" → mailto: email tugmasi
  - [ ] Xato jadvalida Foydalanuvchi ustuni qo'shish

---

### T-S070 | P1 | [ADMIN] | Admin UI — Dashboard redesign: activity feed + error trend chart | pending[Saidazim]

- **Mas'ul:** pending[Saidazim]
- **Yaratilgan:** 2026-04-24 23:08
- **Holat:** ⏸️ Paused
- **Sabab:** Dashboard faqat statistika ko'rsatadi, real-time hodisalar yo'q
- **Qilish kerak:**
  - [ ] Real-time activity feed (yangi xatolar, yangi foydalanuvchilar)
  - [ ] Error trend chart (kunlik xatolar grafigi)
  - [ ] Quick stats — bugungi yangi userlar, xatolar

---

### T-S071 | P2 | [ADMIN] | Admin UI — Global search Cmd+K | pending[Saidazim]

- **Mas'ul:** pending[Saidazim]
- **Yaratilgan:** 2026-04-24 23:08
- **Holat:** ⏸️ Paused
- **Sabab:** Foydalanuvchilarni, xatolarni, filmlarni tezda topish imkoni yo'q
- **Qilish kerak:**
  - [ ] Cmd+K / Ctrl+K shortcut → modal
  - [ ] Users, Errors, Movies bo'yicha qidiruv
  - [ ] Natijani bosish → tegishli sahifaga o'tish

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

### T-E111 | P1 | [MOBILE] | Content Filter — Dynamic blocked-domains + WebView protection

- **Mas'ul:** pending[Emirhan]
- **Beruvchi:** Emirhan
- **Yaratilgan:** 2026-05-07 00:00
- **Holat:** 🔄 Qisman (static blacklist ✅) — T-S074 tugagandan keyin dinamik qism boshlanadi
- **Tavsiya model:** sonnet
- **Model sababi:** hook + AsyncStorage + WebView callback — 3-4 fayl
- **Sabab:** Play Store adult kontentga ruxsat beruvchi WebView ilovalarni bloklaydi. Ro'yxat endi dinamik — backenddan keladi.
- **Bog'liq:** T-S074 tugagandan keyin (GET /api/v1/content/blocked-domains tayyor bo'lishi kerak)
- **Qilish kerak:**
  - [x] `blockedDomains.ts` — 150+ static domen + `isDomainBlocked()` utility (DONE F-190)
  - [x] `MediaWebViewScreen.tsx` — `onShouldStartLoadWithRequest` + blocked overlay (DONE F-190)
  - [ ] `useBlockedDomains.ts` hook — app start da `GET /api/v1/content/blocked-domains` → AsyncStorage cache, 24h refresh
  - [ ] `isDomainBlocked` ni dinamik ro'yxat bilan yangilash
  - [ ] Fallback: network yo'q bo'lsa → static blacklist dan foydalanish
- **Kontekst himoyasi:**
  - `MEDIA_DETECTION_JS` — O'ZGARTIRMA
  - `useWatchParty.ts` / socket events — O'ZGARTIRMA
  - `useVideoExtraction.ts` — O'ZGARTIRMA

---

### T-E117 | P2 | [MOBILE] | Background domain list refresh — AppState foreground trigger

- **Mas'ul:** pending[Emirhan]
- **Beruvchi:** Saidazim
- **Yaratilgan:** 2026-05-08 22:30
- **Holat:** ❌ Boshlanmagan — T-E111 tugagandan keyin
- **Tavsiya model:** haiku
- **Model sababi:** AppState listener qo'shish — 1 fayl, oddiy
- **Sabab:** Foydalanuvchi ilovani background dan qaytarsa — yangilangan bloklangan ro'yxatni olishi kerak
- **Bog'liq:** T-E111 tugagandan keyin
- **Qilish kerak:**
  - [ ] `AppState` change listener — `active` holatga o'tganda va oxirgi refreshdan 24h o'tgan bo'lsa → yangilash
  - [ ] `useBlockedDomains` hook ichiga qo'shish

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

