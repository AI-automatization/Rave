# CineSync — OCHIQ VAZIFALAR

# Yangilangan: 2026-03-01

# 3 dasturchi: Saidazim (Backend) | Emirhan (Mobile) | Jafar (Web)

---

## 📌 QOIDALAR

```
1. Har topilgan bug/task → shu faylga DARHOL yoziladi
2. Sessiya boshida shu faylni O'QIB, oxirgi T-raqamdan davom
3. Fix bo'lgach → shu yerdan O'CHIRISH → docs/Done.md ga KO'CHIRISH
4. Prioritet: P0=kritik, P1=muhim, P2=o'rta, P3=past
5. Sprint: S1=hozir, S2=keyingi hafta, S3=keyingi sprint, S4-5=keyin
6. Oxirgi T-raqam: S→015, E→011, J→011, C→005
```

---

# ═══════════════════════════════════════

# 🔴 SAIDAZIM — BACKEND + ADMIN

# ═══════════════════════════════════════

## SPRINT 2 — Content + Watch Party

### T-S005b | P2 | [BACKEND] | Content Service — HLS upload pipeline

- **Sana:** 2026-02-27
- **Mas'ul:** Saidazim
- **Fayl:** `services/content/src/`
- **Holat:** ❌ Boshlanmagan (requires FFmpeg + storage infra)
- **Qolgan ishlar:**
  - [ ] FFmpeg transcode endpoint — operator video yuklaydi → HLS m3u8 + .ts segments
  - [ ] Storage: local yoki S3-compatible (MinIO) video saqlash
  - [ ] Background job (Bull queue) — transcode async

---

## SPRINT 4 — Admin + Operator

### T-S009 | P2 | [ADMIN] | Admin Dashboard UI — React + Vite

- **Sana:** 2026-02-26
- **Mas'ul:** Saidazim
- **Fayl:** `apps/admin-ui/`
- **Holat:** ❌ Boshlanmagan (keyingi sprint)
- **Sprint:** S4-S5
- **Kerak bo'ladi:**
  - [ ] Vite + React + TypeScript + TailwindCSS setup
  - [ ] Login page (admin credentials, JWT)
  - [ ] Dashboard — stats cards, charts (Recharts)
  - [ ] Users table — filter, search, block/unblock actions
  - [ ] Content management table — publish/unpublish
  - [ ] Feedback list + reply form
  - [ ] Real-time stats (Socket.io yoki polling)

---

# ═══════════════════════════════════════

# 🟢 EMIRHAN — REACT NATIVE MOBILE

# ═══════════════════════════════════════

*T-E001..T-E011 — Done.md F-023..F-034 ga ko'chirildi*

## ✅ Barcha buglar tuzatildi (2026-03-01)

### ✅ T-E012 | P2 | [MOBILE] | O'rta buglar tuzatish (BUG-M009..M019) — TUGADI
### ✅ T-E013 | P3 | [MOBILE] | Past buglar tuzatish (BUG-M020..M024) — TUGADI

- **Sana:** 2026-03-01
- **Mas'ul:** Emirhan
- **Holat:** ⏳ Kutmoqda
- **Buglar:**
  - [ ] BUG-M009 — WatchPartyCreateScreen: goBack+navigate race
  - [ ] BUG-M010 — useSearch: JSON.parse catch yo'q
  - [ ] BUG-M011 — VideoPlayerScreen: stale closure progress
  - [ ] BUG-M012 — MovieDetailScreen: hasRated.current server tekshirilmaydi
  - [ ] BUG-M013 — WatchPartyScreen: FlatList keyExtractor index
  - [ ] BUG-M014 — MainTabs: notification badge noto'g'ri tabda
  - [ ] BUG-M015 — LoginScreen: GoogleSignin.configure har render da
  - [ ] BUG-M017 — useHomeData: progress < 90 chegarasi
  - [ ] BUG-M018 — FriendSearchScreen: dead code + keraksiz API
  - [ ] BUG-M019 — VideoPlayerScreen: setCurrentTime + seek ikki marta

---

# ═══════════════════════════════════════

# 🔵 JAFAR — NEXT.JS WEB CLIENT

# ═══════════════════════════════════════

## SPRINT 3 — UX + Auth + Profile

### T-J008 | P1 | [WEB] | Friends page — API error handling va toast xabarlari

- **Sana:** 2026-03-02
- **Mas'ul:** Jafar
- **Fayl:** `apps/web/src/app/(app)/friends/page.tsx`
- **Holat:** pending[Jafar]
- **Sabab:** Backend to'g'ri HTTP status qaytaradi, lekin web hech qanday xabar ko'rsatmaydi.
  Foydalanuvchi nima bo'lganini bilmaydi.
- **Bajarilishi kerak:**
  - [ ] `409 Conflict` → toast/alert: `"Bu foydalanuvchi allaqachon do'stingiz yoki so'rov yuborilgan"`
  - [ ] `404 Not Found` → toast: `"Foydalanuvchi topilmadi"`
  - [ ] `400 Bad Request` → toast: `"Do'stlik so'rovi yuborib bo'lmadi"`
  - [ ] `500` → toast: `"Server xatosi, qaytadan urinib ko'ring"`
  - [ ] Muvaffaqiyatli yuborilganda → `"So'rov yuborildi ✓"` + tugmani disable qilish
  - [ ] `sendRequest` tugmasi so'rov ketayotganda `loading` holati ko'rsatsin
- **Eslatma:** Backend javoblari `{ success, data, message, errors }` formatida.
  `error.response.data.message` orqali xabarni olish mumkin.
- **Backend status kodlari** (`POST /users/friends/request`):
  - `201` — muvaffaqiyat
  - `409` — allaqachon do'st yoki so'rov yuborilgan
  - `400` — o'ziga so'rov yuborganda yoki limit to'lsa
  - `404` — foydalanuvchi topilmadi

---

### T-J009 | P1 | [WEB] | Profile sahifasi — o'z va boshqalar profilini ko'rish

- **Sana:** 2026-03-02
- **Mas'ul:** Jafar
- **Fayl:** `apps/web/src/app/(app)/profile/` (yangi sahifa)
- **Holat:** pending[Jafar]
- **Bajarilishi kerak:**
  - [ ] `/profile/me` — o'z profili (`GET /users/me`)
    - Avatar, username, bio, rank badge, totalPoints
    - Do'stlar soni
    - Ro'yxatdan o'tgan sana
  - [ ] `/profile/[username]` — boshqa foydalanuvchi profili (`GET /users/:authId`)
    - Yuqoridagilar + `isOnline` indicator
    - "Do'st qo'shish" tugmasi (agar allaqachon do'st emas bo'lsa)
    - Do'st bo'lsa — "Do'stingiz" badge
  - [ ] Avatar: yo'q bo'lsa username bosh harfi (fallback)
  - [ ] Rank ranglari: Bronze/Silver/Gold/Platinum/Diamond (dizayn sistemasidan)
- **API:**
  - `GET /users/me` — o'z to'liq profili
  - `GET /users/:authId` — boshqa foydalanuvchi profili (authId bilan)
  - `GET /users/friends` — do'stlar soni uchun
- **Muhim:** Qidiruv natijalaridan profil sahifasiga o'tish `username` orqali emas,
  `authId` orqali bo'lishi kerak (BUG-B002 ga qarang: `docs/Done.md`)

---

### T-J010 | P3 | [WEB] | Logout funksiyasi — ✅ ALLAQACHON MAVJUD

- **Holat:** `apps/web/src/components/common/Sidebar.tsx` da `handleLogout()` bor
- **Qolgan:** Faqat test qilish + mobile bottom nav da ham ko'rinishini tekshirish

---

### T-J011 | P1 | [WEB] | Sahifalar arasi o'tish sekinligi — loading UI va React Query

- **Sana:** 2026-03-02
- **Mas'ul:** Jafar
- **Holat:** pending[Jafar]
- **Muammo:** Sahifaga o'tganda 4-5 soniya bo'sh ekran ko'rinadi. Sabablari:
  1. Hech bir route da `loading.tsx` fayl yo'q → Next.js data kelguncha hech narsa ko'rsatmaydi
  2. Data `useEffect` ichida fetch qilinadi → mount → fetch → render (ikki qadam)
  3. `@tanstack/react-query` o'rnatilgan lekin ishlatilmayapti → sahifaga qaytganda qayta fetch
- **Bajarilishi kerak:**

  **1. `loading.tsx` fayllar qo'shish (ASOSIY fix — tez natija)**
  ```
  apps/web/src/app/(app)/
  ├── loading.tsx          ← umumiy loading (barcha (app) sahifalari uchun)
  ├── friends/
  │   └── loading.tsx      ← friends sahifasi skeleton
  ├── home/
  │   └── loading.tsx      ← home skeleton
  ├── movies/
  │   └── loading.tsx      ← movies skeleton
  └── ...
  ```
  - `loading.tsx` — `<div className="animate-pulse">` skeleton cards
  - Next.js buni avtomatik ko'rsatadi navigatsiya paytida

  **2. `@tanstack/react-query` bilan data fetching (KESHLASHTIRISH)**
  - Hozir: `useEffect` → `apiClient.get(...)` → state
  - Kerak: `useQuery({ queryKey: ['friends'], queryFn: ... })`
  - Afzalligi: sahifaga qaytganda qayta fetch qilmaydi (staleTime ichida)
  - `QueryClient` allaqachon `providers.tsx` da sozlangan bo'lishi kerak,
    aks holda `app/layout.tsx` ga `QueryClientProvider` qo'shish kerak

  **3. `<Link prefetch={true}>` — Sidebar da allaqachon `Link` ishlatilgan ✅**
  - Development da prefetch ishlamaydi, production da avtomatik

- **Ustuvorlik:** Avval `loading.tsx` qo'sh (30 daqiqa) — eng tez natija
- **Fayl:** `apps/web/src/app/(app)/` ichidagi barcha sahifalar

---

## SPRINT 5 — SEO + i18n + PWA + Polish

### T-J007 | P2 | [WEB] | SEO + Performance + i18n + PWA — qolgan qismi

- **Sprint:** S5
- **Holat:** ⚠️ QISMAN (manifest.json + robots.txt ✅, Playwright tests qisman ✅)
- **Subtasks:** TASK-J-030..TASK-J-038
- **Qolgan ishlar:**
  - [ ] `next-intl` — uz/ru/en i18n setup
  - [ ] Dynamic OG images (`/api/og` endpoint)
  - [ ] WCAG AA accessibility audit + fixes
  - [ ] Playwright E2E to'liq test suite

---

# ═══════════════════════════════════════

# 🟣 UMUMIY — BARCHA JAMOA

# ═══════════════════════════════════════

### T-C004 | P2 | [IKKALASI] | Dizayn Tasklari

- **Sprint:** S2-S5
- **Subtasks:** TASK-D-002..TASK-D-010
- **Output:** MovieCard hover, Hero backdrop, online status vizual, emoji float, achievement animation, battle progress, skeleton loading, Storybook, dark mode QA

---

## 📊 STATISTIKA (2026-03-01 yangilandi)

| Jamoa    | Tugallandi | Qolgan | JAMI |
| -------- | ---------- | ------ | ---- |
| Saidazim | T-S001..T-S008, T-S010, T-S011, T-C001, T-C003, T-C005 ✅ | T-S005b, T-S009 (2 task) | — |
| Emirhan  | T-E001..T-E011 ✅ (11 task) — HAMMASI TUGADI 🎉 | — | 11 |
| Jafar    | T-J001..T-J006 ✅ (6 task) | T-J007 (qisman), T-J008, T-J009, T-J010 (3 yangi) | 7 |
| Umumiy   | T-C001 ✅, T-C002 ✅, T-C003 ✅, T-C005 ✅ | T-C004 (1 task) | — |

---

_docs/Tasks.md | CineSync | Yangilangan: 2026-03-01_
