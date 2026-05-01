# CineSync — OCHIQ VAZIFALAR

# Yangilangan: 2026-05-01

---

### T-S067 | P0 | [ADMIN] | Admin UI — Production redesign: Sidebar + Layout + Header | pending[Saidazim]

- **Mas'ul:** pending[Saidazim]
- **Yaratilgan:** 2026-04-24 23:08
- **Holat:** 🔄 Bajarilmoqda
- **Sabab:** Sidebar'da ikonkalar yo'q, desktop header yo'q, UI "доска" ko'rinishida
- **Qilish kerak:**
  - [ ] lucide-react o'rnatish
  - [ ] Sidebar: ikonkalar, badge (error count), guruhlar, active state
  - [ ] Layout: desktop header (breadcrumb, search, notifications, avatar)
  - [ ] Login page redesign

---

### T-S068 | P0 | [ADMIN] | Admin UI — User Detail page (/users/:id) + Contact user | pending[Saidazim]

- **Mas'ul:** pending[Saidazim]
- **Yaratilgan:** 2026-04-24 23:08
- **Holat:** ❌ Boshlanmagan
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
- **Holat:** ❌ Boshlanmagan
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
- **Holat:** ❌ Boshlanmagan
- **Sabab:** Dashboard faqat statistika ko'rsatadi, real-time hodisalar yo'q
- **Qilish kerak:**
  - [ ] Real-time activity feed (yangi xatolar, yangi foydalanuvchilar)
  - [ ] Error trend chart (kunlik xatolar grafigi)
  - [ ] Quick stats — bugungi yangi userlar, xatolar

---

### T-S071 | P2 | [ADMIN] | Admin UI — Global search Cmd+K | pending[Saidazim]

- **Mas'ul:** pending[Saidazim]
- **Yaratilgan:** 2026-04-24 23:08
- **Holat:** ❌ Boshlanmagan
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

- **Mas'ul:** pending[Emirhan]
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

