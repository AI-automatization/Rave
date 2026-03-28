# CineSync — OCHIQ VAZIFALAR

# Yangilangan: 2026-03-26

# 3 dasturchi: Saidazim (Backend) | Emirhan (Mobile) | Jafar (Mobile)

---

## 📌 QOIDALAR

```
1. Har topilgan bug/task → shu faylga DARHOL yoziladi
2. Sessiya boshida shu faylni O'QIB, oxirgi T-raqamdan davom
3. Fix bo'lgach → shu yerdan O'CHIRISH → docs/Done.md ga KO'CHIRISH
4. Prioritet: P0=kritik, P1=muhim, P2=o'rta, P3=past
5. Sprint: S1=hozir, S2=keyingi hafta, S3=keyingi sprint, S4-5=keyin
6. Oxirgi T-raqam: S→047, E→070 (hammasi bajarildi), J→037, C→011
7. Yangilangan: 2026-03-27
```

---

# ═══════════════════════════════════════

# 🔴 SAIDAZIM — BACKEND + ADMIN

---




# ═══════════════════════════════════════

# 🟢 EMIRHAN — EXPO REACT NATIVE MOBILE

---

*(Sprint 1..7 TUGADI — yangi sprint tasklari quyida)*

---

### T-E071 | P1 | [MOBILE] | BUG: WebView popup 3 marta chiqyapti

- **Sana:** 2026-03-28
- **Mas'ul:** Emirhan
- **Holat:** ❌ Boshlanmagan
- **Muammo:** MediaWebViewScreen da video ochilganda popup faqat 1 marta chiqishi kerak, hozir 3 marta chiqyapti
- **Fayl:** `apps/mobile/src/screens/MediaWebViewScreen.tsx`

---

### T-E072 | P1 | [MOBILE] | WebView iframe popup — olib tashlash

- **Sana:** 2026-03-28
- **Mas'ul:** Emirhan
- **Holat:** ❌ Boshlanmagan
- **Muammo:** Hozir mobile barcha saytlar uchun popup/yangi tab ochyapti. Iframe ishlatadigan pirate saytlar uchun popup kerak emas — mobile o'zi aniqlasin qaysi sayt iframe, qaysi sayt to'g'ri video
- **Fayl:** `apps/mobile/src/screens/MediaWebViewScreen.tsx`
- **Eslatma:** Backend `/extract` endpoint ishlayapti — agar backend video URL qaytarsa → popup yo'q, agar `unsupported_site` → WebView ichida qolsin

---

### T-E073 | P1 | [MOBILE] | BUG: Google Auth — Network Error

- **Sana:** 2026-03-28
- **Mas'ul:** Emirhan
- **Holat:** ❌ Boshlanmagan
- **Muammo:** Google/Android OAuth da Network Error kelayapti, cookie/token handling muammo
- **Fayl:** `apps/mobile/src/services/authApi.ts`, Google Console OAuth config
- **Eslatma:** Saidazim: token backend da alohida chiqarilishi kerak (Android vs Web client)

---

### T-E074 | P2 | [MOBILE] | QualityMenu — real data bilan ulash

- **Sana:** 2026-03-28
- **Mas'ul:** Emirhan
- **Holat:** ❌ Boshlanmagan
- **Muammo:** `QualityMenu.tsx` va `EpisodeMenu.tsx` tayyor lekin hozir bo'sh `[]` ko'rsatayapti — `useVideoExtraction` hook dan `qualities`/`episodes` WatchPartyScreen ga uzatilmayapti
- **Fayl:** `apps/mobile/src/screens/WatchPartyScreen.tsx`, `apps/mobile/src/hooks/useVideoExtraction.ts`

---

### T-E075 | P2 | [MOBILE] | URL kiritish funksiyasi — SourcePicker da

- **Sana:** 2026-03-28
- **Mas'ul:** Emirhan
- **Holat:** ❌ Boshlanmagan
- **Maqsad:** Foydalanuvchi o'zi topgan link ni kiritsin → backend `/extract` → video
- **Fayl:** `apps/mobile/src/screens/SourcePickerScreen.tsx`
- **Backend:** `POST /api/v1/content/extract` — tayyor ✅

---

### T-E076 | P1 | [MOBILE] | WatchParty — video extraction + quality/episode menus | pending[Saidazim]

- **Sana:** 2026-03-28
- **Mas'ul:** Saidazim (tomonidan bajarilmoqda)
- **Holat:** 🔄 Bajarilmoqda
- **Muammo:**
  1. `WatchPartyScreen` `room.videoUrl` ni to'g'ridan foydalanadi — `/extract` chaqirilmaydi
  2. `uzmovie.tv`, `kinogo.cc`, Playerjs saytlar — extraction yo'q bo'lgani uchun video o'ynamaydi
  3. `extractQualities = []`, `extractEpisodes = []` — har doim bo'sh
- **Yechim:**
  - `WatchPartyScreen` da `useVideoExtraction` hook qo'shish
  - Room yuklanganda `extract(room.videoUrl)` chaqirish
  - Natija: `extractResult.videoUrl` → real MP4/HLS
  - `extractResult.qualities/episodes` → menyu to'ldirish
  - Extraction muvaffaqiyatsiz bo'lsa → WebView fallback
- **Fayllar:** `apps/mobile/src/screens/modal/WatchPartyScreen.tsx`

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
