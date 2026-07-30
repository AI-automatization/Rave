# CineSync — OCHIQ VAZIFALAR

# Yangilangan: 2026-07-27

---

# 🚨 PROD — DARHOL HAL QILINISHI KERAK

- **Mas'ul:** pending[Jasur]
- **Beruvchi:** prod test (2026-07-27, app.wewatch.uz)
- **Yaratilgan:** 2026-07-27 08:30
- **Holat:** ❌ Boshlanmagan — **kod emas, env muammosi**
- **Tavsiya model:** —
- **Model sababi:** kod o'zgarishi kerak emas, Railway env sozlash
- **Sabab:** `/api/notifications` va `/api/notifications/unread-count` prod'da **401 `{"message":"Invalid token"}`** qaytaradi. Bir xil cookie bilan `/api/auth/me` 200 beradi, xona yaratish/qo'shilish (watch-party, user servislari) ham ishlaydi — ya'ni token yaroqli, uni faqat notification servisi rad etadi. `shared/src/middleware/auth.middleware.ts:32` `JWT_PUBLIC_KEY` bilan RS256 tekshiradi, `services/notification/src/config` esa `requireEnv('JWT_PUBLIC_KEY')` — kalit bor (aks holda servis ko'tarilmasdi), lekin **auth servisi imzolayotgan kalitga mos emas** (eski juftlik qolgan).
- **Ta'siri:** web va mobil'da bildirishnomalar umuman ishlamaydi; xona sahifasida har 30 soniyada konsolga 401 yozadi.
- **Qilish kerak:**
  - [ ] Railway → notification servisi → `JWT_PUBLIC_KEY` ni auth servisidagi qiymat bilan bir xil qilish (`JWT_PRIVATE_KEY` juftligi)
  - [ ] Redeploy, so'ng `GET /api/notifications/unread-count` 200 qaytarishini tekshirish
- **Fayllar:** kod o'zgarmaydi — Railway env

---

✅ T-S194 tugadi (2026-07-30) — Done.md'ga ko'chirildi (F-290).

> ⚠️ **Deploy'dan keyin qilinishi kerak:** `apps/web` prod'ga chiqqach `curl -I https://wewatch.uz/`
> ni `ru-RU` / `en-US` / `pt-BR` bilan tekshirish — hozir (deploy'gacha) prod uchalasiga ham `/uz`
> qaytaradi. Shu bilan birga T-S193 `/ru` migratsiyasi ham chiqadi → GSC'ga yangi sitemap yuborish.

---

# 🎬 Room Redesign — 3 fazali reja (2026-07-24 planning session)

> To'liq research + reja: memory `project_room_redesign_3phases.md`. FAZA 1 tugadi (2026-07-26, Jasur — T-S160..T-S166 + T-S168, Done.md F-265..F-272); qolgani — pastdagi tartib bo'yicha claim qilib boshlash kerak. Fazalar orasida bog'liqlik bor: T-S171 (link) → T-S177/T-S178 (Instagram share stikerida shu link ishlatiladi).

## FAZA 1 — Room chat + voice UI

✅ T-S167 tugadi (2026-07-28) — Done.md'ga ko'chirildi.

---

## FAZA 2 — Deep link (Smart App Link) + video queue/Virtual Browser

### T-S170 | P1 | [MOBILE] | iOS Universal Links: associatedDomains + apple-app-site-association

- **Mas'ul:** pending[Saidazim]
- **Beruvchi:** Saidazim (room redesign planning)
- **Yaratilgan:** 2026-07-24
- **Holat:** ⛔ Bloklangan — Apple Developer Program akkaunti hali yo'q (2026-07-24: Saidazim tasdiqladi), demak Team ID ham yo'q. ETA yo'q — akkaunt ochilgunicha bu task kutadi, boshqa tasklarga bog'liq emas (parallel davom etish mumkin).
- **Tavsiya model:** sonnet
- **Model sababi:** noldan, lekin standart konfiguratsiya
- **Sabab:** iOS'da `associatedDomains` entitlement yo'q, `apple-app-site-association` fayli umuman yo'q.
- **Fayllar:** `apps/mobile/app.json`, yangi `apps/app-web/public/.well-known/apple-app-site-association`

✅ T-S178 + T-S179 tugadi (2026-07-28) — Done.md'ga ko'chirildi.

✅ T-S188 tugadi (2026-07-28) — Done.md'ga ko'chirildi.

✅ T-S189 tugadi (2026-07-28) — Done.md'ga ko'chirildi.

---

### T-E209 | P2 | [WEB] | GEO/AEO/SEO texnik baza — robots, sitemap, IndexNow, crawler checker

- **Mas'ul:** pending[Jasur]
- **Beruvchi:** Jasur
- **Yaratilgan:** 2026-07-23 (PHASE 0 audit tugadi)
- **Holat:** ⏸ Kutishda — PHASE 1 + ichki havola ishi tugadi va main'ga deploy bo'ldi (9a526a1c).
  **2026-07-30 da** Search Console natijasi qayta tekshiriladi. Google qayta crawl qilmaguncha
  yangi kod yozish behuda — o'lchov bo'lmaydi.
- **Tavsiya model:** opus
- **Model sababi:** ko'p faylli SEO infratuzilma + mavjud bazani buzmasdan yamash
- **Sabab:** wewatch.uz'ni AI answer engine'lar (ChatGPT, Claude, Perplexity, AI Overviews) iqtibos qila
  oladigan holatga keltirish. PHASE 0 audit topilmalari: robots.txt/robots.ts konflikti, sitemap
  dublikatlari, 12 ta AI crawler robots'da yo'q, IndexNow yo'q, crawler-visibility tekshiruvi yo'q.
- **Qilish kerak (PHASE 1):** ✅ TUGADI (commit bd2c72c9)
  - [x] robots.txt / app/robots.ts konflikti — statik fayl o'chirildi, 22 bot generatsiya qilinadi
  - [x] sitemap.ts — dublikatsiz 38 URL, ru/uz hreflang, real lastmod
  - [x] Legal sahifalarga canonical (team/[slug] da metadata allaqachon bor edi, title dublikati tuzatildi)
  - [x] IndexNow (lib + API route + kalit fayl + .env.example + README)
  - [x] public/llms.txt — faktlar shared/constants bilan moslashtirildi
  - [x] scripts/check-crawler-visibility.mjs — 7 route × 5 UA, hammasi PASS
- **Qo'lda qilinishi kerak (TODO human):**
  - [ ] Railway'da `INDEXNOW_SECRET` env o'rnatish (`openssl rand -hex 24`) + `INDEXNOW_KEY=b7a4e5408d77764d08338835ee8cdd0e`,
        keyin `curl -X POST https://wewatch.uz/api/indexnow -H "x-indexnow-secret: ..."` (jonli tekshirildi: kalit fayli 200, env yo'q)
  - [ ] GSC: sitemap.xml ni qayta yuborish + URL Inspection'da qayta indekslash so'rovi
        (/guides, /uz/guides, /how-it-works, rutube/vk/film-vdvoem/serialy gaydlari, /en)
  - [ ] Pro tarif (29 000 so'm, /pricing) haqiqatan faolmi? llms.txt da TODO qoldirilgan
  - [ ] `.claude/scripts/tg-notify.sh` — Windows'da `python3` topilmayapti, xabar yuborilmadi
- **⛔ TEGMASLIK KERAK:** apps/mobile, services/*, watch-party sinxronizatsiya logikasi. Faqat apps/web.
- **Keyingi fazalar:** PHASE 2 (rendering), 3 (schema), 4 (kontent sahifalari), 5 (performance)

---

### T-E208 | P1 | [MOBILE] | Play Store'ga chiqishga tayyorlik — to'liq audit A dan Z gacha

- **Mas'ul:** pending[Jasur]
- **Beruvchi:** Saidazim
- **Yaratilgan:** 2026-07-21
- **Holat:** 🔄 Bajarilmoqda — kod audit + emulyator test tugadi, real qurilma testi va production EAS build qoldi
- **Tavsiya model:** sonnet
- **Model sababi:** ko'p ekran/config tekshirish, lekin bitta katta refactor emas
- **Sabab:** Play Store'ga chiqarishdan oldin mobil ilovani boshidan oxirigacha tekshirish kerak — ilova holati, config, real qurilmada sinov.
- **Qilish kerak:**
  - [x] Butun ilovani A dan Z gacha audit qilish (ekranlar, navigatsiya, crash/xato holatlar, permissions, ikonka/splash, app.json/eas.json config)
  - [ ] APK yig'ish (EAS build, production profile) — MAJBURIY, hali qilinmagan (lokal EAS CLI login qilinmagan, gh CLI yo'q — Jasur login qilishi yoki GitHub Actions'dan qo'lda ishga tushirishi kerak)
  - [x] Emulyatorda (Pixel_8_Pro, Android SDK) `expo run:android` debug build orqali test — HomeScreen, Friends, Profile, Settings, SourcePicker, **Watch Party room yaratish/ochish (video URL kiritish → SYNC badge, chat, emoji reactions render)**, Notifications, orqaga qaytish — barchasi crashsiz, logcat'da fatal xato yo'q
  - [ ] Real qurilmada test qilish — MAJBURIY (emulyator YETARLI EMAS, faqat oraliq tekshiruv sifatida ishlatildi)
  - [~] Auth flow — session allaqachon faol (Jasur akkaunti bilan login qilingan holatda ishga tushdi), parol talab qiladigan logout→login sikli test qilinmadi (real akkauntdan chiqib qolish xavfi bor edi, parol ma'lumoti yo'q)
  - [x] Play Store talablariga moslikni qisman tekshirish (privacy policy URL ishlaydi, app.wewatch.uz/.well-known/assetlinks.json to'g'ri)
- **2026-07-21 topilmalar:**
  - **FIX qilindi:** `SettingsScreen.tsx:252` — versiya raqami hardcoded `'1.0.0'` edi (app.json'da haqiqiy versiya 1.0.1), `Constants.expoConfig?.version` orqali tuzatildi, emulyatorda tasdiqlandi.
  - **✅ HAL QILINDI (2026-07-22, Jasur qarori):** `CAMERA` permission ishlatilmayotgan edi — kamera funksiyasi qo'shildi. Yangi `apps/mobile/src/utils/avatarPicker.ts` (umumiy: kamera/galereya tanlovi + ruxsatlar), `ProfileSetupScreen` + `ProfileScreen` shunga o'tkazildi. Endi CAMERA + `NSCameraUsageDescription` oqlangan. i18n kalitlar qo'shildi (uz/ru/en). tsc: CLEAN.
  - **✅ HAL QILINDI (2026-07-22):** `RECEIVE_BOOT_COMPLETED` permission app.json'dan olib tashlandi (ishlatilmasdi, BroadcastReceiver yo'q).
  - **P2:** 13-14 ta `console.log` `__DEV__` bilan o'ralmagan (`MeshClient.ts`, `useWatchParty.ts`, `usePushNotifications.ts` va h.k. — bular watch-party/mesh zonasida, TEGILMADI).
  - **tsc --noEmit:** toza, xato yo'q.
  - Play Console akkaunt, Service Account key, Feature Graphic + 5 screenshot (T-E124, Emirhan) — hali yo'q, RELEASE-CHECKLIST.md bo'yicha submission uchun bloklovchi.
- **⛔ TEGMASLIK KERAK:** watch-party sinxronizatsiya logikasi, backend, video ekstraktsiya bilan bog'liq har qanday kod — faqat mobil UI/config/tayyorlik tomoni. (Rioya qilindi — mesh/watch-party console.log'lariga tegilmadi.)
- **Bog'liq:** Telegram orqali Jasur'ga yuborildi (2026-07-21)

---

### T-S138 | P1 | [MOBILE] | Web'da topilgan video-player fix'larni mobile'ga ko'chirish

- **Mas'ul:** pending[Saidazim]
- **Beruvchi:** Saidazim (web live-test session)
- **Yaratilgan:** 2026-07-19
- **Holat:** 🔄 Bajarilmoqda (Twitch+Dailymotion kod tomondan tugadi 2026-07-20, VK/Rutube scope'dan
  chiqarildi, real qurilma testi qolgan)
- **Tavsiya model:** sonnet
- **Model sababi:** kod qismi tugadi, qolgani faqat real device test
- **Sabab:** 2026-07-19 web session'da jonli sinov orqali tasdiqlangan fix'lar — mobile'da xuddi
  shu assumption'lar hech qachon tekshirilmagan edi.
- **2026-07-20 topilma:** `UniversalPlayer.tsx:84-90` — VK/Rutube **Android'da umuman
  buildVKVideoHtml/buildRutubeHtml ishlatmaydi** (`Platform.OS==='android' → return null`) — ular
  alohida CDN-sniffing + ExoPlayer pipeline orqali ishlaydi (iframe/postMessage emas). Shuning
  uchun Rutube protokol-fix'i Android'ga umuman aloqasi yo'q (faqat iOS uchun buildRutubeHtml hali
  ham ishlatiladi, lekin bu safar tegilmadi). Foydalanuvchi tasdiqladi: VK/Rutube'ni tegmaslik,
  faqat Twitch+Dailymotion.
- **Qilish kerak:**
  - [x] **Twitch live** — `buildTwitchHtml()` endi VIDEO_PLAY/VIDEO_PAUSE faqat `type==='vod'`
    bo'lganda ro'yxatdan o'tkaziladi (live kanal uchun sync yo'q — web bilan bir xil sabab).
  - [x] **Dailymotion** — `apiready` mobile'da ham kelmasligi kutilyapti (xuddi shu remote sahifa),
    shuning uchun `iframe onload="markReady()"` qo'shildi — video ko'rinishi/o'ynashi endi
    kafolatlangan. Sync (play/pause/seek) ATAYLAB tuzatilmadi — web'da IKKALA urinish (event kutish
    HAM owner-driven control) ham real productionda ishlamadi, demak mobile'da ham ishlamaydi.
  - [ ] VK/Rutube — **scope'dan chiqarildi** (Android boshqa pipeline, iOS alohida vazifa kerak
    bo'lsa).
  - [ ] Real qurilmada tekshirish — Twitch (VOD/live farqi) + Dailymotion (video ko'rinishi)
- **Fayllar:** `apps/mobile/src/components/video/WebViewAdapters.ts`
- **Bog'liq:** web'dagi manba — `docs/Done.md` 2026-07-19/20 yozuvlari (VK/Rutube/Twitch/Dailymotion)

---

# 🔒 Sprint 15: Security Audit fixes (2026-07-04 — аудит Claude)

> Полный аудит OWASP Top 10 + WeWatch-специфика. Фундамент крепкий (JWT/bcrypt/socket/internal/IDOR — ок). Ниже — найденные уязвимости. **Не начинать без claim.**

---

### T-S111 | P1 | [SECURITY] | Deps: обновить high-уязвимости (ws/undici/nodemailer/next)

- **Mas'ul:** pending[Jasur]
- **Beruvchi:** Saidazim (security audit)
- **Yaratilgan:** 2026-07-04
- **Holat:** 🔄 Qisman bajarildi (2026-07-26, Jasur) — xavfsiz qismi tugadi, **major bump qarori kutilmoqda**
- **Tavsiya model:** sonnet
- **Model sababi:** package bumps + smoke-тест
- **Sabab:** 54 уязвимости (13 high). Реально достижимые в рантайме: `ws` (DoS memory exhaustion → socket.io/watch-party), `undici` (обход TLS-проверки), `nodemailer` (письмо не на тот домен → auth), `next` (DoS Image Optimizer → web). Фикс: `npm audit fix`, поднять ws/undici/nodemailer/next, проверить что socket.io/сборки не сломались.
- **2026-07-26 holati:**
  - [x] `ws` va `undici` — **hozir zaiflik yo'q**, o'z-o'zidan hal bo'lgan (2026-07-04 auditidan keyin)
  - [x] `npm audit fix` (major'siz) — 83 → 82 zaiflik. `apps/web` next 16.2.10 → 16.2.12
  - [x] Tekshiruv: app-web tsc 0, apps/web tsc 5 (oldin ham 5), mobile 1 (oldin ham 1), auth/user/content/watch-party — bazaviy holatda
  - [ ] **Qaror kerak — `nodemailer` 6.9 → 9.0.3 (MAJOR).** auth + notification servislarida. SMTP command injection + noto'g'ri domenga xat. Breaking change, smoke-test kerak.
  - [ ] **Qaror kerak — `apps/app-web` next 14.2.35 → 15/16 (MAJOR migratsiya).** Image Optimizer DoS. Bu "bump" emas, alohida migratsiya vazifasi.
  - [ ] `tar` (critical, `@mapbox/node-pre-gyp` orqali) — build-time bog'liqlik, runtime so'rov yo'lida emas; ota-paketning major bump'i kerak
  - [ ] Qolgan 40+ zaiflik — devDependency (eslint/jest/vite/expo), runtime'ga chiqmaydi
- **Файлы:** `package.json`, `package-lock.json` (overrides при необходимости)

---

### T-S109 | P1 | [DEVOPS] | Staging env + CI/CD (Railway Environments + native deploy)

- **Mas'ul:** pending[Saidazim]
- **Beruvchi:** Saidazim
- **Yaratilgan:** 2026-07-03
- **Holat:** ❌ Boshlanmagan (план одобрен: A1+B1+C2)
- **Tavsiya model:** sonnet
- **Sabab:** Нет staging-окружения; деплой ручной; CI/CD написан, но staging «стреляет в пустоту» (сервисов -staging нет). Решение: Railway Environments (prod+staging в 1 проекте), отдельные staging Mongo/Redis, деплой Railway-native (develop→staging, main→prod), Actions = только гейты на PR.

**Фаза 1 — Railway staging env (A1+B1) [Railway dashboard/CLI]:**
  - [ ] Создать окружение `staging` в проекте `rave` (Duplicate environment от production → клонирует все сервисы + свои volumes = отдельные staging Mongo/Redis автоматически = B1)
  - [ ] Проверить staging Mongo/Redis: отдельные instance, `MONGO_URI`/`REDIS_URL` в staging указывают на staging-БД (Railway reference vars)
  - [ ] Staging-переменные: домены (auth-staging.up.railway.app и т.д.), `NODE_ENV=staging`, свои JWT/INTERNAL секреты (НЕ прод)
  - [ ] Сид тестовых данных в staging cinesync

**Фаза 2 — Ветки + Railway deploy-триггеры (C2):**
  - [ ] Создать ветку `dev` от main
  - [ ] Railway: production env → deploy from `main`; staging env → deploy from `dev` (Settings → Environment → branch)
  - [ ] Проверить: push в dev → авто-деплой staging; push в main → авто-деплой prod

**Фаза 3 — CI гейты (GitHub Actions, только PR):**
  - [ ] Оставить `lint.yml` + `test.yml` как PR-проверки (on pull_request → dev/main)
  - [ ] Добавить `ci.yml`: typecheck (shared + все сервисы) + test + lint на PR
  - [ ] Удалить/выпилить `deploy-prod.yml` + `deploy-staging.yml` (деплой теперь Railway-native) — или оставить как ручной `workflow_dispatch` fallback
  - [ ] Добавить web/app-web/admin-ui в typecheck (сейчас только backend)

**Фаза 4 — Branch protection (GitHub, via gh):**
  - [ ] `main`: require PR + passing CI + 1 review
  - [ ] `dev`: require PR + passing CI

**Фаза 5 — Docs:**
  - [ ] `docs/deployment.md`: схема веток → окружений, как деплоить, rollback

- **Разделение:** Клод делает — develop-ветку, ci.yml, чистку workflow, branch protection (gh), docs. Saidazim (Railway dashboard) — duplicate environment, per-env deploy branch, staging переменные/домены. Часть через `railway` CLI попробую сам.
- **Файлы:** `.github/workflows/*.yml`, `docs/deployment.md`

---

# 🔵 Sprint 13: Mobile UX fixes (2026-07-03 — manual QA Saidazim)

---

### T-S107b | ✅ | [MOBILE] | Fix: свайп-вниз случайно сворачивает комнату

- **Holat:** ✅ Bajarildi (2026-07-03) — outer Modal wrapper `gestureEnabled` off qachonki `WatchParty` active (`AppNavigator.tsx`)

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

### T-S107 | P1 | [MOBILE] | Mesh Faza 1: SyncBroadcaster'ni useWatchPartyRoom'ga ulash | pending[Saidazim]

- **Mas'ul:** pending[Saidazim]
- **Beruvchi:** Saidazim
- **Yaratilgan:** 2026-06-29
- **Holat:** 🔄 Bajarilmoqda (~95%) — kod ulangan (`useWatchPartyRoom` → `useWatchParty` → `SyncBroadcaster`), APK yig'ildi (wewatch-mesh-sync.apk). Qolgan: 2 qurilmada play/pause kechikishni o'lchash.
- **Tavsiya model:** opus
- **Model sababi:** Ikkita parallel sync tizimini birlashtirish, owner-authority, late-join seed — arxitektura tushunish kerak
- **Sabab:** Asosiy gap — mesh kodi ulanmagan. Owner play/pause/seek/heartbeat `SyncBroadcaster` orqali ketishi, follower'lar mesh xabarlarni qo'llashi kerak.
- **Qilish kerak:**
  - [x] `useWatchPartyRoom` → `SyncBroadcaster` instance (owner flag bilan) — `useWatchParty.ts:267`
  - [ ] Owner-only broadcast (echo-loop oldini olish) — tasdiqlash kerak
  - [ ] Kech qo'shilgan peer → Redis `getSyncState` dan boshlang'ich pozitsiya seed — tasdiqlash kerak
  - [ ] Socket.io fallback saqlanishini tekshirish (mesh fail → socket) — tasdiqlash kerak
  - [ ] 2 qurilma WiFi'da sync kechikishni o'lchash (maqsad <300ms) — MANUAL, qurilma kerak
- **Bog'liq:** T-S106 (✅ tugadi — Done.md)
- **Fayllar:** `apps/mobile/src/hooks/useWatchPartyRoom.ts`, `apps/mobile/src/hooks/useWatchParty.ts`, `apps/mobile/src/services/mesh/SyncBroadcaster.ts`

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

---

## 💬 Sprint 16: DM Chat 2.0 (2026-07-07 — Jasur/Emirhan mobile)

> Mobile DM chatni Telegram darajasiga ko'tarish: push+inline reply, reply, forward.
> Frontend (apps/mobile) — Jasur bajaradi. Quyidagilar BACKEND tomonini talab qiladi.
> **Boshlashdan oldin claim qilish shart.** Barchasi shared/types o'zgarishini o'z ichiga oladi → LOCK protocol.

---


