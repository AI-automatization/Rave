# CineSync — OCHIQ VAZIFALAR

# Yangilangan: 2026-03-30

# 3 dasturchi: Saidazim (Backend) | Emirhan (Mobile) | Jafar (Mobile)

---

## 📌 QOIDALAR

```
1. Har topilgan bug/task → shu faylga DARHOL yoziladi
2. Sessiya boshida shu faylni O'QIB, oxirgi T-raqamdan davom
3. Fix bo'lgach → shu yerdan O'CHIRISH → docs/Done.md ga KO'CHIRISH
4. Prioritet: P0=kritik, P1=muhim, P2=o'rta, P3=past
5. Sprint: S1=hozir, S2=keyingi hafta, S3=keyingi sprint, S4-5=keyin
6. Oxirgi T-raqam: S→049, E→081, J→037, C→013
7. Yangilangan: 2026-03-30
```

---

# ═══════════════════════════════════════

# 🔴 SAIDAZIM — BACKEND + ADMIN

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




# ═══════════════════════════════════════

# 🟢 EMIRHAN — EXPO REACT NATIVE MOBILE

---

*(Sprint 1..7 TUGADI — Sprint 8: MVP Release)*

---

### T-E080 | P1 | [MOBILE] | App icon + Splash screen branding

- **Mas'ul:** pending[Emirhan]
- **Holat:** ❌ Boshlanmagan
- **Sabab:** Default Expo icon va splash → CineSync branding kerak
- **Qilish kerak:**
  - [ ] App icon (1024x1024) — CineSync logo
  - [ ] Splash screen — CineSync branding (app.json da sozlash)
  - [ ] Adaptive icon (Android) — foreground + background layer

---

### T-E081 | P1 | [MOBILE] | Real qurilmada smoke test (Expo Go)

- **Mas'ul:** pending[Emirhan]
- **Holat:** ❌ Boshlanmagan
- **Sabab:** Emulator da ishlaydi ≠ real telefonda ishlaydi. MVP chiqarishdan oldin majburiy
- **Qilish kerak:**
  - [ ] Auth flow: Register → Verify → Login → ProfileSetup
  - [ ] SourcePicker → YouTube → video detect → Watch Party yaratish
  - [ ] Do'st qo'shish → invite → birga ko'rish (2 ta qurilma)
  - [ ] Push notification kelishi
  - [ ] Chat + Voice (dev build kerak)
  - [ ] Topilgan buglarni Tasks.md ga yozish

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
