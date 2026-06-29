# CineSync — OCHIQ VAZIFALAR

# Yangilangan: 2026-06-13

---

# 🟠 PLAY STORE COMPLIANCE — MVP uchun majburiy

---

### T-S094 | P2 | [DEVOPS] | Play Store: Privacy Policy + DMCA sahifasi | pending[Saidazim]

- **Mas'ul:** pending[Saidazim]
- **Beruvchi:** Saidazim
- **Yaratilgan:** 2026-05-11 13:39
- **Holat:** ✅ Bajarildi (2026-05-19)
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
- **Holat:** ✅ Bajarildi (2026-05-19)
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
- **Holat:** ✅ Bajarildi (2026-05-19)
- **Tavsiya model:** opus
- **Model sababi:** Ko'p fayllik refactor, SOLID, ichki arxitektura tushunish kerak
- **Sabab:** MEDIUM maintainability — 26 fayl 15KB dan oshgan
- **Qilish kerak:**
  - [ ] `find . -name "*.ts" | xargs wc -l | sort -rn | head -30` — eng katta fayllar
  - [ ] Top 3 faylni sub-modulga ajratish

---






# 2 dasturchi: Saidazim (Backend + Mobile) | Emirhan (Mobile + Web)

---

## 📌 QOIDALAR

```
1. Har topilgan bug/task → shu faylga DARHOL yoziladi
2. Sessiya boshida shu faylni O'QIB, oxirgi T-raqamdan davom
3. Fix bo'lgach → shu yerdan O'CHIRISH → docs/Done.md ga KO'CHIRISH
4. Prioritet: P0=kritik, P1=muhim, P2=o'rta, P3=past
5. Sprint: S1=hozir, S2=keyingi hafta, S3=keyingi sprint, S4-5=keyin
6. Oxirgi T-raqam: S→102, E→136, C→016
7. Yangilangan: 2026-05-24
```

---

# ═══════════════════════════════════════

# 🔴 SAIDAZIM — BACKEND + ADMIN

---

# 🏗️ Sprint 11: Migration — Единая БД cinesync (2026-05-23)

> Решение: [[decisions/2026-05-23-migration-единая-бд-cinesync-для-всех-сервисов]]
> Зависимости: T-S096 → T-S097 → T-S098 → T-S099 → T-S100 → T-S101 → T-S102

---

### T-S096 | P1 | [BACKEND] | Migration: Аудит — найти все authId references

- **Mas'ul:** done[Saidazim]
- **Beruvchi:** Saidazim
- **Yaratilgan:** 2026-05-23 00:00
- **Holat:** ✅ Bajarildi (2026-05-27) — authId source kodda YO'Q, faqat dist/ artifacts
- **Tavsiya model:** haiku
- **Natija:** 0 authId references in src/**/*.ts — migration already complete in code

---

### T-S097 | P1 | [BACKEND] | Migration: Объединённая схема users

- **Mas'ul:** done[Saidazim]
- **Beruvchi:** Saidazim
- **Yaratilgan:** 2026-05-23 00:00
- **Holat:** ✅ Bajarildi (2026-05-27) — ikkala model ham model('User', ...) → bitta cinesync.users
- **Tavsiya model:** sonnet
- **Natija:** auth model has rank/fcmTokens/settings; user model has no authId; same collection

---

### T-S098 | P1 | [BACKEND] | Migration: Auth service — .env cinesync + register full user

- **Mas'ul:** done[Saidazim]
- **Beruvchi:** Saidazim
- **Yaratilgan:** 2026-05-23 00:00
- **Holat:** ✅ Bajarildi (2026-05-27) — MONGO_URI=cinesync ✓, register: rank/fcmTokens/settings defaults ✓
- **Tavsiya model:** sonnet

---

### T-S099 | P1 | [BACKEND] | Migration: User service — .env cinesync + getMe по _id

- **Mas'ul:** done[Saidazim]
- **Beruvchi:** Saidazim
- **Yaratilgan:** 2026-05-23 00:00
- **Holat:** ✅ Bajarildi (2026-05-27) — profile.service.ts uses findById(userId) ✓
- **Tavsiya model:** sonnet

---

### T-S100 | P2 | [BACKEND] | Migration: 4 сервис — .env → cinesync

- **Mas'ul:** done[Saidazim]
- **Beruvchi:** Saidazim
- **Yaratilgan:** 2026-05-23 00:00
- **Holat:** ✅ Bajarildi (2026-05-27) — content/watch-party/notification/admin/auth/user — все cinesync ✓
- **Tavsiya model:** haiku

---

### T-S101 | P2 | [BACKEND] | Migration: Скрипт миграции данных

- **Mas'ul:** pending[Saidazim]
- **Beruvchi:** Saidazim
- **Yaratilgan:** 2026-05-23 00:00
- **Holat:** ❌ Boshlanmagan
- **Tavsiya model:** sonnet
- **Model sababi:** Migration script — bir marta ishga tushiriladi
- **Sabab:** Mavjud ma'lumotlarni cinesync_auth + cinesync_user → cinesync ga ko'chirish
- **Qilish kerak:**
  - [ ] `scripts/migrate-to-single-db.ts` yaratish
  - [ ] cinesync_auth.users + cinesync_user.users → email bo'yicha birlashtirish
  - [ ] Natijani cinesync.users ga yozish
  - [ ] Dry-run mode qo'shish (`--dry-run` flag)

---

### T-S102 | P3 | [BACKEND] | Migration: tsc clean + db-architecture.html yangilash

- **Mas'ul:** pending[Saidazim]
- **Beruvchi:** Saidazim
- **Yaratilgan:** 2026-05-23 00:00
- **Holat:** ❌ Boshlanmagan
- **Tavsiya model:** haiku
- **Model sababi:** tsc + HTML update, yakuniy tekshirish
- **Sabab:** Migratsiya tugagach — barcha servislar tsc clean bo'lishi kerak
- **Qilish kerak:**
  - [ ] `cd services/auth && npx tsc --noEmit`
  - [ ] `cd services/user && npx tsc --noEmit`
  - [ ] Boshqa 4 servis ham tsc clean
  - [ ] `docs/db-architecture.html` — yangi arxitektura (bitta cinesync, merged users)

---

# 🔄 Sprint 12: Mesh Sync Migration (2026-06-29)

> Kontekst: real qurilmada Socket.io sync ishladi, ammo 1-2s kechikish bilan.
> Mesh kodi YOZILGAN, ammo HALI ULANMAGAN — `SyncBroadcaster`/`MeshClient` faqat `services/mesh/` ichida, useWatchPartyRoom unga ulanmagan.
> Vazifa: mavjud mesh karkasni ulash + 2 blocker (clock-offset, TURN) yopish.
> Zo'rlik: T-S106 → T-S107 → T-C016 (ketma-ket)

---

### T-S106 | P1 | [MOBILE] | Mesh Faza 0: clock-sync handshake + TURN | pending[Saidazim]

- **Mas'ul:** pending[Saidazim]
- **Beruvchi:** Saidazim
- **Yaratilgan:** 2026-06-29
- **Holat:** ❌ Boshlanmagan
- **Tavsiya model:** sonnet
- **Model sababi:** 2-3 fayl, WebRTC DataChannel handshake + env config, o'rta murakkablik
- **Sabab:** BLOCKER — `SyncProtocol.calcDrift` peer soatlari bir xil deb hisoblaydi (`Date.now() - ownerTimestamp`), bu noto'g'ri. TURN creds bo'sh → mobil CGNAT'da mesh ulanmaydi. Bularsiz mesh Socket.io'dan tezroq ishlamaydi.
- **Qilish kerak:**
  - [ ] DataChannel ping/pong → clock offset + RTT baholash (NTP-style)
  - [ ] Offset'ni `SyncProtocol.calcDrift` va `scheduledAt` hisobiga qo'shish
  - [ ] TURN: metered.ca account → `EXPO_PUBLIC_TURN_*` env to'ldirish (`config.ts`)
  - [ ] 4G/sotuvchi tarmoqda 2 qurilma ICE connect tekshirish
- **Fayllar:** `apps/mobile/src/services/mesh/SyncProtocol.ts`, `MeshClient.ts`, `config.ts`

---

### T-S107 | P1 | [MOBILE] | Mesh Faza 1: SyncBroadcaster'ni useWatchPartyRoom'ga ulash | pending[Saidazim]

- **Mas'ul:** pending[Saidazim]
- **Beruvchi:** Saidazim
- **Yaratilgan:** 2026-06-29
- **Holat:** ❌ Boshlanmagan
- **Tavsiya model:** opus
- **Model sababi:** Ikkita parallel sync tizimini birlashtirish, owner-authority, late-join seed — arxitektura tushunish kerak
- **Sabab:** Asosiy gap — mesh kodi ulanmagan. Owner play/pause/seek/heartbeat `SyncBroadcaster` orqali ketishi, follower'lar mesh xabarlarni qo'llashi kerak.
- **Qilish kerak:**
  - [ ] `useWatchPartyRoom` → `SyncBroadcaster` instance (owner flag bilan)
  - [ ] Owner-only broadcast (echo-loop oldini olish)
  - [ ] Kech qo'shilgan peer → Redis `getSyncState` dan boshlang'ich pozitsiya seed
  - [ ] Socket.io fallback saqlanishini tekshirish (mesh fail → socket)
  - [ ] 2 qurilma WiFi'da sync kechikishni o'lchash (maqsad <300ms)
- **Bog'liq:** T-S106
- **Fayllar:** `apps/mobile/src/hooks/useWatchPartyRoom.ts`, `services/mesh/SyncBroadcaster.ts`

---

### T-C016 | P2 | [IKKALASI] | Mesh Faza 2: star-topology + QA matritsa (2/5/10 peer, drift, fallback)

- **Mas'ul:** pending[Saidazim] + pending[Emirhan]
- **Beruvchi:** Saidazim
- **Yaratilgan:** 2026-06-29
- **Holat:** ❌ Boshlanmagan
- **Tavsiya model:** sonnet
- **Model sababi:** Star-hub routing + E2E test matritsa, 2-3 fayl + manual test
- **Sabab:** `TopologyManager` 7-15 peer uchun `star` qaytaradi, ammo `MeshClient` doim full-mesh qiladi (n² ulanish). + T-C015 "done" deb belgilangan, ammo mesh ulanmagan edi — haqiqiy QA kerak.
- **Qilish kerak:**
  - [ ] Star-topology: owner hub orqali routing (7-15 peer)
  - [ ] QA: 2 peer / 5 peer / 10 peer full sync
  - [ ] Peer drop → qolganlar davom etadi | Owner drop → handling
  - [ ] Drift test: sun'iy 3s drift → tiklanish
  - [ ] Poor network → ICE fail → Socket.io fallback
  - [ ] Natijani Done.md ga matritsa sifatida
- **Bog'liq:** T-S107
- **Fayllar:** `apps/mobile/src/services/mesh/MeshClient.ts`, `TopologyManager.ts`

---

# ═══════════════════════════════════════

# 🟢 EMIRHAN — EXPO REACT NATIVE MOBILE + WEB

---

*(Sprint 1..7 TUGADI — Sprint 8: MVP Release — Sprint 9: Sync Optimizatsiya)*

---

# 🔧 Sprint 10: Mobile UI Refactor (2026-05-19 audit)

---

### T-E125 | P1 | [MOBILE] | WatchPartyScreen refactor — 638→3x200 qator + hardcoded colors

- **Mas'ul:** pending[Emirhan]
- **Beruvchi:** Emirhan
- **Yaratilgan:** 2026-05-19 12:00
- **Holat:** ✅ Bajarildi (2026-05-19)
- **Tavsiya model:** opus
- **Model sababi:** 638 qatorli screen — 3 ta komponentga bo'lish, 40+ hardcoded color, 60+ inline style, arxitektura tushunish kerak
- **Sabab:** Eng katta screen — 638 qator (limit 300). 40+ hardcoded hex color, 60+ inline style blok
- **Qilish kerak:**
  - [ ] Screen ni 3 komponentga ajratish (~200 qator har biri)
  - [ ] 40+ hardcoded hex → theme/colors.ts tokenlar
  - [ ] 60+ inline style → StyleSheet ga ko'chirish
  - [ ] Fayl: `apps/mobile/src/screens/modal/WatchPartyScreen.tsx`

---

### T-E126 | P1 | [MOBILE] | HomeScreen refactor — 629→2x300 qator + API call hookga

- **Mas'ul:** pending[Emirhan]
- **Beruvchi:** Emirhan
- **Yaratilgan:** 2026-05-19 12:00
- **Holat:** ✅ Bajarildi (2026-05-19)
- **Tavsiya model:** sonnet
- **Model sababi:** Screen split + hook yaratish, 3-4 fayl
- **Sabab:** 629 qator (limit 300). watchPartyApi.createRoom() to'g'ridan screen ichida (352-qator). 50+ inline style
- **Qilish kerak:**
  - [ ] Screen ni 2 komponentga ajratish
  - [ ] `watchPartyApi.createRoom()` → `useCreateWatchParty()` hook
  - [ ] 50+ inline style → StyleSheet
  - [ ] Fayl: `apps/mobile/src/screens/home/HomeScreen.tsx`

---

### T-E127 | P1 | [MOBILE] | FriendsScreen refactor — 562→2x280 qator + `as any` fix

- **Mas'ul:** pending[Emirhan]
- **Beruvchi:** Emirhan
- **Yaratilgan:** 2026-05-19 12:00
- **Holat:** ✅ Bajarildi (2026-05-19)
- **Tavsiya model:** sonnet
- **Model sababi:** Screen split + type fix, 2-3 fayl
- **Sabab:** 562 qator (limit 300). `as any` cast 156-qatorda. Hardcoded colors, 35+ inline style
- **Qilish kerak:**
  - [ ] Screen ni 2 komponentga ajratish
  - [ ] `icon as any` → `icon as keyof typeof Ionicons.glyphMap`
  - [ ] Hardcoded colors → theme tokens
  - [ ] Fayl: `apps/mobile/src/screens/friends/FriendsScreen.tsx`

---

### T-E128 | P1 | [MOBILE] | RoomsScreen refactor — 548→2x270 qator + inline styles

- **Mas'ul:** pending[Emirhan]
- **Beruvchi:** Emirhan
- **Yaratilgan:** 2026-05-19 12:00
- **Holat:** ✅ Bajarildi (2026-05-19)
- **Tavsiya model:** sonnet
- **Model sababi:** Screen split + styles, 2-3 fayl
- **Sabab:** 548 qator (limit 300). 40+ inline style blok
- **Qilish kerak:**
  - [ ] Screen ni 2 komponentga ajratish
  - [ ] 40+ inline style → StyleSheet
  - [ ] Fayl: `apps/mobile/src/screens/rooms/RoomsScreen.tsx`

---

### T-E129 | P2 | [MOBILE] | SupportChatScreen refactor — 445→2x220 qator

- **Mas'ul:** pending[Emirhan]
- **Beruvchi:** Emirhan
- **Yaratilgan:** 2026-05-19 12:00
- **Holat:** ✅ Bajarildi (2026-05-19)
- **Tavsiya model:** sonnet
- **Model sababi:** Screen split, 2 fayl
- **Sabab:** 445 qator (limit 300)
- **Qilish kerak:**
  - [ ] Screen ni 2 komponentga ajratish
  - [ ] Fayl: `apps/mobile/src/screens/modal/SupportChatScreen.tsx`

---

### T-E130 | P2 | [MOBILE] | FriendProfileScreen refactor — 427→2x210 qator

- **Mas'ul:** pending[Emirhan]
- **Beruvchi:** Emirhan
- **Yaratilgan:** 2026-05-19 12:00
- **Holat:** ✅ Bajarildi (2026-05-19)
- **Tavsiya model:** sonnet
- **Model sababi:** Screen split, 2 fayl
- **Sabab:** 427 qator (limit 300)
- **Qilish kerak:**
  - [ ] Screen ni 2 komponentga ajratish
  - [ ] Fayl: `apps/mobile/src/screens/friends/FriendProfileScreen.tsx`

---

### T-E131 | P2 | [MOBILE] | 3 ta kichik screen — VerifyEmail(338) + FriendSearch(330) + Settings(329)

- **Mas'ul:** pending[Emirhan]
- **Beruvchi:** Emirhan
- **Yaratilgan:** 2026-05-19 12:00
- **Holat:** ✅ Bajarildi (2026-05-19)
- **Tavsiya model:** sonnet
- **Model sababi:** 3 screen, har biri 30-40 qator kamaytirish, 3 fayl
- **Sabab:** Har biri 300+ (limit 300). SettingsScreen da API call to'g'ridan screen ichida
- **Qilish kerak:**
  - [ ] VerifyEmailScreen (338) — hook ajratish
  - [ ] FriendSearchScreen (330) — kichik komponent ajratish
  - [ ] SettingsScreen (329) — `userApi.updateSettings/deleteAccount` → hook
  - [ ] Fayllar: `screens/auth/VerifyEmailScreen.tsx`, `screens/friends/FriendSearchScreen.tsx`, `screens/profile/SettingsScreen.tsx`

---

### T-E132 | P2 | [MOBILE] | Katta komponentlar — VideoSection(413) + ChatPanel(352)

- **Mas'ul:** pending[Emirhan]
- **Beruvchi:** Emirhan
- **Yaratilgan:** 2026-05-19 12:00
- **Holat:** ✅ Bajarildi (2026-05-19)
- **Tavsiya model:** sonnet
- **Model sababi:** 2 komponent split, 4 fayl
- **Sabab:** Komponent limiti 150 qator — ikkalasi 2x+ oshgan
- **Qilish kerak:**
  - [ ] VideoSection (413) → 2-3 sub-komponent
  - [ ] ChatPanel (352) → 2 sub-komponent
  - [ ] Fayllar: `components/watchParty/VideoSection.tsx`, `components/watchParty/ChatPanel.tsx`

---

### T-E133 | P1 | [MOBILE] | VideoPlayerScreen.styles.ts — 25+ hardcoded color → theme tokens

- **Mas'ul:** pending[Emirhan]
- **Beruvchi:** Emirhan
- **Yaratilgan:** 2026-05-19 12:00
- **Holat:** ✅ Bajarildi (2026-05-19)
- **Tavsiya model:** haiku
- **Model sababi:** 1 fayl, faqat color almashtirish
- **Sabab:** 25+ hardcoded hex (#fff, rgba, #000) → colors.* tokenlar
- **Qilish kerak:**
  - [ ] Barcha hardcoded hex → `colors.*` import
  - [ ] Fayl: `apps/mobile/src/screens/home/VideoPlayerScreen.styles.ts`

---

### T-E134 | P1 | [WEB] | Branding: CineSync → WeWatch — barcha web fayllar

- **Mas'ul:** done[Emirhan]
- **Beruvchi:** Emirhan
- **Yaratilgan:** 2026-05-24 12:00
- **Holat:** ✅ Bajarildi (2026-05-24)
- **Tavsiya model:** sonnet
- **Model sababi:** 15 fayl, sodda find-replace, branding o'zgartirish
- **Sabab:** Web saytda CineSync nomi qolgan — WeWatch ga o'zgartirish kerak

---

### T-E135 | P1 | [WEB] | PhoneMockup UI fix — proportions, contrast, readability

- **Mas'ul:** done[Emirhan]
- **Beruvchi:** Emirhan
- **Yaratilgan:** 2026-05-24 13:00
- **Holat:** ✅ Bajarildi (2026-06-02)
- **Tavsiya model:** sonnet
- **Model sababi:** 1 fayl (LandingContent.tsx), UI fix, 4 ta funksiya o'zgartirish
- **Sabab:** Landing page dagi telefon mockup UI juda yomon ko'rinadi — kichik, kontrastsiz, o'qib bo'lmaydi
- **Qilish kerak:**
  - [x] PhoneMockup kengligini 240→280px, balandlikni 504→560px (width:280, height:580 — allaqachon)
  - [x] ScreenHome — elementlar kattaroq, spacing yaxshiroq
  - [x] ScreenRoom — video preview (68→90px), participants kattalash
  - [x] ScreenWatching — video area (42→45%), chat messages kontrast oshirish

---

# 🎬 MARKETING — HIGGSFIELD AI VIDEO GENERATION

> Bajarilganlar: T-E120 (Purple Pulse 8s) | T-E121 (Three Cities 4s) | T-E122 (Macro Mood 8s) | T-E123 (Macro Mood v2 + logo)
> Fayl yo'li: `marketing/videos/` | Qolgan kredit: ~32

---

### T-E124 | P2 | [MARKETING] | Play Store — Feature Graphic + 5 Screenshot

- **Mas'ul:** pending[Emirhan]
- **Beruvchi:** Emirhan
- **Yaratilgan:** 2026-05-19 15:20
- **Holat:** ❌ Boshlanmagan
- **Tavsiya model:** higgsfield / gpt_image_2
- **Model sababi:** Image generation, text rendering, Play Store format
- **Sabab:** MVP Play Store submission uchun majburiy — Feature Graphic (1024×500) va 5 ta screenshot
- **Qilish kerak:**
  - [ ] Feature Graphic — 16:9, dark purple, WeWatch logo + tagline
  - [ ] Screenshot 1 — HomeScreen (film lenta)
  - [ ] Screenshot 2 — WatchParty (split screen sync)
  - [ ] Screenshot 3 — Friends (online do'stlar)
  - [ ] Screenshot 4 — BattleScreen
  - [ ] Screenshot 5 — AchievementsScreen

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
- **Holat:** ✅ Bajarildi (2026-05-19)
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
- **Holat:** ✅ Bajarildi (2026-05-19)
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
- **Holat:** ✅ Bajarildi (2026-05-19)
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


---

# 🟣 НОВЫЕ ФИЧИ — 2026-06-13

---

## 💬 DM CHAT (Личные сообщения)

### T-S103 | P1 | [BACKEND] | DM Chat: DirectMessage schema + model

- **Mas'ul:** done[Saidazim]
- **Beruvchi:** Saidazim
- **Yaratilgan:** 2026-06-13
- **Holat:** ✅ Bajarildi (2026-06-14)
- **Tavsiya model:** haiku
- **Model sababi:** 1 fayl — faqat schema + model
- **Sabab:** DM uchun MongoDB schema kerak
- **Qilish kerak:**
  - [x] `services/user/src/models/directMessage.model.ts` yaratish
  - [x] Schema: senderId, receiverId, text, read, createdAt
  - [x] Index: (senderId + receiverId) + createdAt

---

### T-S104 | P1 | [BACKEND] | DM Chat: REST endpoints — tarix + yuborish + ro'yxat

- **Mas'ul:** done[Saidazim]
- **Beruvchi:** Saidazim
- **Yaratilgan:** 2026-06-13
- **Holat:** ✅ Bajarildi (2026-06-14)
- **Tavsiya model:** sonnet
- **Model sababi:** controller + routes, 2-3 fayl
- **Sabab:** DM uchun REST API
- **Qilish kerak:**
  - [x] `GET /messages/dm/:userId` — ikki user o'rtasidagi xabarlar tarixi
  - [x] `POST /messages/dm/:userId` — yangi xabar yuborish
  - [x] `GET /messages/dm/conversations` — barcha suhbatlar (so'nggi xabar + o'qilmagan soni)
  - [x] `PATCH /messages/dm/:userId/read` — xabarlarni o'qilgan deb belgilash
- **Bog'liq:** T-S103 (schema)

---

### T-S105 | P1 | [BACKEND] | DM Chat: Socket.io real-time + push notification

- **Mas'ul:** done[Saidazim]
- **Beruvchi:** Saidazim
- **Yaratilgan:** 2026-06-13
- **Holat:** ✅ Bajarildi (2026-06-14)
- **Tavsiya model:** sonnet
- **Model sababi:** Socket.io event + notification service, 2 fayl
- **Sabab:** Real-time yetkazish va push
- **Qilish kerak:**
  - [x] Socket.io event `dm:send` → `dm:message` (yetkazish)
  - [x] Agar qabul qiluvchi offline bo'lsa → FCM push notification
  - [x] `dm:read` event — o'qilganda xabar berish
- **Bog'liq:** T-S104

---

### T-E136 | P1 | [MOBILE] | DM Chat: WatchParty — user tap → BottomSheet

- **Mas'ul:** done[Saidazim]
- **Beruvchi:** Saidazim
- **Yaratilgan:** 2026-06-13
- **Holat:** ✅ Bajarildi (2026-06-14)
- **Tavsiya model:** haiku
- **Model sababi:** 1-2 fayl — faqat tap handler + BottomSheet
- **Sabab:** Komnata ichida boshqa userni bosib → menu chiqishi kerak
- **Qilish kerak:**
  - [x] VoiceChatParticipants yoki participantlar ro'yxatida userni bosish → BottomSheet
  - [x] BottomSheet ichida: "Profil ko'rish" | "Xabar yuborish"
  - [x] "Profil" → mavjud ProfileScreen ga navigate
  - [x] "Xabar" → DMChatScreen ga navigate (T-E137)
- **Bog'liq:** T-S104 (backend tayyor bo'lishi kerak), T-E137

---

### T-E137 | P1 | [MOBILE] | DM Chat: DMChatScreen ekrani

- **Mas'ul:** done[Saidazim]
- **Beruvchi:** Saidazim
- **Yaratilgan:** 2026-06-13
- **Holat:** ✅ Bajarildi (2026-06-14)
- **Tavsiya model:** sonnet
- **Model sababi:** Yangi screen — chat bubbles, input, API, socket
- **Sabab:** Ikki user o'rtasidagi personal chat ekrani
- **Qilish kerak:**
  - [x] `DMChatScreen.tsx` — chat bubbles (o'zim/boshqa), timestamp
  - [x] Xabar inputi + yuborish tugmasi
  - [x] `GET /messages/dm/:userId` — tarixni yuklash
  - [x] Socket.io `dm:message` — real-time yangi xabarlar
  - [x] O'qilmagan indicator
- **Bog'liq:** T-S103 + T-S104 + T-S105

---

### T-E138 | P2 | [MOBILE] | DM Chat: ConversationsScreen — barcha suhbatlar

- **Mas'ul:** done[Saidazim]
- **Beruvchi:** Saidazim
- **Yaratilgan:** 2026-06-13
- **Holat:** ✅ Bajarildi (2026-06-14)
- **Tavsiya model:** sonnet
- **Model sababi:** Yangi screen + navigation integration
- **Sabab:** Barcha DM suhbatlar ro'yxati kerak
- **Qilish kerak:**
  - [x] `ConversationsScreen.tsx` — avatar, ism, so'nggi xabar, vaqt, unread badge
  - [x] `GET /messages/dm/conversations` dan ma'lumot
  - [x] Bottom tab yoki Friends tab ichiga qo'shish
  - [x] Push notification tap → to'g'ri DMChatScreen ga o'tish
- **Bog'liq:** T-E137

---

## 🌐 WEB APP (Next.js — мобилка функционалини вебга кўчириш)

> apps/web/ — хозир фақат лендинг. Янги route group (app) ичига тўлиқ веб-илова қўшилади.
> Мобил скринларни веб учун адаптация қилиш — логика бир хил, UI Next.js/React.

