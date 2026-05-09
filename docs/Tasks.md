# CineSync — OCHIQ VAZIFALAR

# Yangilangan: 2026-05-08

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

### T-E116 | P1 | [MOBILE] | WatchParty — video_source_expired: улучшить UX для owner | pending[Emirhan]

- **Mas'ul:** pending[Emirhan]
- **Beruvchi:** Saidazim
- **Yaratilgan:** 2026-05-03 00:00
- **Holat:** ❌ Boshlanmagan
- **Tavsiya model:** haiku
- **Model sababi:** 1-2 fayl, oddiy UI o'zgarish — haiku optimal
- **Sabab:** Eski komnatada `room.videoUrl = googlevideo.com/...` bo'lganda foydalanuvchi "Видео источник устарел — обновите видео через «+»" ko'radi, lekin "+" tugmasi kam ko'rinadi
- **Qilish kerak:**
  - [ ] `WatchPartyScreen.tsx`: `video_source_expired` holatida owner uchun overlay ichiga to'g'ridan "Обновить источник" tugmasini qo'shish (SourcePicker ga yo'naltiradi)
  - [ ] Non-owner uchun: "Видео хозяин обновит источник" matni ko'rsatish
  - [ ] Backend endi `googlevideo.com` URLlarni rad etadi (T-S backend fix allaqachon tayyor)
- **Bog'liq:** services/watch-party — `googlevideo.com` validation added in fix(watch-party)

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

### T-E112 | P1 | [MOBILE] | WatchParty — show active members list with names in room

- **Mas'ul:** pending[Emirhan]
- **Beruvchi:** Saidazim
- **Yaratilgan:** 2026-05-01 03:10
- **Holat:** ❌ Boshlanmagan
- **Tavsiya model:** sonnet
- **Model sababi:** WatchPartyScreen UI component qo'shish — 2-3 fayl, o'rta murakkablik
- **Sabab:** Foydalanuvchi komnatada kim borligini ko'rishi kerak — hozir activeMembers ro'yxati ko'rsatilmaydi
- **Qilish kerak:**
  - [ ] WatchPartyScreen — aktiv a'zolar paneli (avatar + username)
  - [ ] Socket `activeMembers` arrayidan ma'lumot olish (allaqachon hook da bor)
  - [ ] UI: horizontal scroll yoki collapsed members strip
  - [ ] Owner badge ko'rsatish

---

### T-E113 | P1 | [MOBILE] | WatchParty Chat — show sender username on each message

- **Mas'ul:** pending[Emirhan]
- **Beruvchi:** Saidazim
- **Yaratilgan:** 2026-05-01 03:10
- **Holat:** ❌ Boshlanmagan
- **Tavsiya model:** haiku
- **Model sababi:** Oddiy UI o'zgarish — chat bubble ga username qo'shish, 1-2 fayl
- **Sabab:** Chat da kim yozganini bilish mumkin emas — sender ismi ko'rinmaydi
- **Qilish kerak:**
  - [ ] Chat message bubble — sender username ko'rsatish (o'z xabaringda emas, boshqalarda)
  - [ ] Message object da `senderName` yoki `sender.username` mavjudligini tekshirish
  - [ ] Agar backend da yo'q bo'lsa — T-S task yaratish

---

### T-E114 | P1 | [MOBILE] | WatchParty Chat — reply to message (Telegram style)

- **Mas'ul:** pending[Emirhan]
- **Beruvchi:** Saidazim
- **Yaratilgan:** 2026-05-01 03:10
- **Holat:** ❌ Boshlanmagan
- **Tavsiya model:** sonnet
- **Model sababi:** Swipe gesture + reply UI + Socket event — 3-5 fayl, o'rta murakkablik
- **Sabab:** Foydalanuvchi xabarga javob berolmaydi — Telegram uslubida reply kerak
- **Qilish kerak:**
  - [ ] Swipe right gesture — reply modega kirish
  - [ ] Long press → context menu → "Javob berish" tugmasi
  - [ ] Reply preview UI — input yuqorisida original xabar snippet
  - [ ] Message da `replyTo: { messageId, senderName, text }` maydon
  - [ ] Chat bubble da reply reference ko'rsatish (Telegram kabi)
  - [ ] Backend Socket event ga `replyTo` field qo'shish (T-S task kerak bo'lishi mumkin)

---

### T-E115 | P0 | [MOBILE] | Bug: push notification invite tap does not navigate to WatchParty room

- **Mas'ul:** pending[Emirhan] ✅ claimed
- **Beruvchi:** Saidazim
- **Yaratilgan:** 2026-05-01 03:10
- **Holat:** ❌ Boshlanmagan
- **Tavsiya model:** sonnet
- **Model sababi:** Deep link debug — notification payload + AppNavigator handler tekshirish, 2-3 fayl
- **Sabab:** Taklif kelganda bildirishnomaga bosish foydalanuvchini komnataga o'tkazmaydi
- **Qilish kerak:**
  - [ ] `useLastNotificationResponse` handler ni tekshirish (AppNavigator.tsx)
  - [ ] Notification payload da `inviteCode` / `roomId` mavjudligini console log bilan tasdiqlash
  - [ ] Backend — notification service invite push da payload fieldlarini tekshirish
  - [ ] iOS foreground vs background notification handling farqini tekshirish
  - [ ] `shouldShowAlert` Android handler bilan bog'liq muammo bormi tekshirish
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

