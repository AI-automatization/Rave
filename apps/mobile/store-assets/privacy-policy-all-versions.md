# WeWatch — Privacy Policy (Все версии)
Создано: 2026-06-11 | Аудит расхождений

---

## ⚠️ НАЙДЕННЫЕ РАСХОЖДЕНИЯ

| Поле | Веб (wewatch.uz) | Мобильное приложение |
|------|-----------------|----------------------|
| Возраст | **17+** | **13+** ← нужно исправить |
| Email | privacy@wewatch.**app** | support@wewatch.**uz** ← нужно унифицировать |
| Watch Party retention | **30 дней** | **60 дней** ← нужно исправить |
| Дата | 20 мая 2026 | 1 января 2025 ← нужно обновить |
| MongoDB Atlas | Упомянут (ОШИБКА) | НЕ упомянут ✓ |

---

## ВЕРСИЯ 1 — ВЕБ САЙТ (wewatch.uz/privacy-policy)
*Наиболее полная версия. Английский язык.*

**Privacy Policy — WeWatch**
Last updated: May 20, 2026 · Effective: May 20, 2026

**About This Policy**
WeWatch (Rave) ("WeWatch", "we", "our", "us") operates the WeWatch mobile application, website (https://wewatch.uz), and related services (collectively, the "Service"). This Privacy Policy describes what personal information we collect, how we use it, with whom we share it, and your rights. By using the Service, you agree to the practices described here.

**1. Information We Collect**

1.1 Information You Provide Directly
- Account data — email address, username, password (stored as bcrypt hash)
- Profile data — display name, optional profile photo
- Support messages — content of messages sent to support
- User-generated content — chat messages and emoji reactions in watch party rooms

1.2 Information Collected Automatically
- Usage data — watch history, watch party sessions, video URLs shared, room membership
- Device identifiers — device type, OS version, push notification token (FCM/APNs). NO advertising identifiers (IDFA).
- Log data — IP address, request timestamps, HTTP status codes, error reports (retained 90 days)
- Interaction data — points, ranks, achievements, friend relationships, gamification events
- In-app browser domain data — domain name of sites visited (e.g., youtube.com), NOT full URL path

1.3 Device Permissions
- Photos/Media Library — only when uploading profile photo
- Microphone — only in voice chat (WebRTC, NOT recorded/stored)
- Push Notifications — watch party invites, friend requests

1.4 Third-Party Sign-In (Google / Apple)
- Provider unique identifier, email (if not hidden), display name
- NO OAuth access/refresh tokens stored on servers

**2. How We Use Your Information**
- Account creation and authentication
- Synchronized watch party experiences
- Push notifications (opted-in)
- Points, ranks, streaks, achievements
- Social features — friend lists, user search, public profiles
- Content moderation and ToS enforcement
- Support requests
- Legal compliance
- Service improvement (aggregated, non-identifiable analytics only)

We DO NOT use data for behavioral advertising, cross-context tracking, or sell it to third parties.

**3. Video Content, In-App Browser & Stream Processing**
- WeWatch is NOT a video proxy or CDN — video travels directly from source to user device
- Client-side URL detection — runs locally on device
- No DRM circumvention — only publicly playable streams (no Widevine/FairPlay/PlayReady bypass)
- No content downloading
- Third-party website privacy policies apply when using in-app browser
- URLs shared in rooms retained for room lifetime (auto-purged 30 days after room ends)

**4. Data Sharing & Disclosure**
Service Providers (contractually bound):
- ~~MongoDB Atlas~~ → [ОШИБКА — используется Railway self-hosted]
- Railway.app — cloud server infrastructure (all services, databases)
- Google Firebase (FCM) — push notification delivery (only device token shared)
- Sentry.io — error monitoring (no personal data)

Legal Requirements, Business Transfers, With Your Consent only.

NO data selling. NO advertising networks. NO third-party AI services.

**5. Data Retention**
- Active accounts — lifetime of account
- Deleted accounts — personal data removed within 30 days; moderation records anonymized up to 1 year
- Access logs — 90 days
- Watch party room data — 30 days after room ends ← (мобильная версия говорит 60 дней — РАСХОЖДЕНИЕ)
- Chat messages — deleted with room
- Support tickets — up to 2 years

**6. Your Privacy Rights**
Access, Correction, Deletion (Settings → Account → Delete Account), Portability, Restriction, Objection, Withdraw Consent.
Contact: privacy@wewatch.app (веб) / support@wewatch.uz (мобильное) ← РАСХОЖДЕНИЕ
Response: 30 days (GDPR) / 45 days (CCPA)
GDPR legal bases: performance of contract, legitimate interests, legal obligation, consent
CCPA: no selling/sharing for cross-context behavioral advertising

**7. Age Requirements (COPPA)**
17 and older. 17+ age rating on App Store (user-generated content, mature video potential).
No data collected from under 13.

**8. Security**
- bcrypt 12 rounds
- TLS 1.2+
- RS256 JWT, 15-min expiry
- Redis rate limiting, 5 attempts → 15-min lockout
- MongoDB encryption at rest
- Internal service auth via shared secret

**9. Cookies, Tracking & Advertising Identifiers**
- No cross-app tracking
- No IDFA
- No ATT prompt (no tracking)
- No advertising/analytics tracking cookies

**10. International Data Transfers**
Servers hosted via Railway.app (US). By using the service from EEA/UK you acknowledge data transfer to US under standard contractual clauses.

**11. Changes**
Notification via in-app or email at least 7 days before change takes effect.

**12. Contact**
WeWatch (Rave)
Privacy: privacy@wewatch.app
DMCA: copyright@wewatch.app
Support: support@wewatch.app

---

## ВЕРСИЯ 2 — МОБИЛЬНОЕ ПРИЛОЖЕНИЕ (IN-APP)
*Показывается пользователям при первом входе. Три языка: UZ / RU / EN*

### 🇺🇿 УЗБЕКСКИЙ (uz)

WeWatch — Maxfiylik Siyosati
Kuchga kirish sanasi: 1-yanvar 2025-yil

1. Kirish
WeWatch ("biz", "bizning") sizning maxfiyligingizni hurmat qiladi.

2. Biz to'playdigan ma'lumotlar
Siz taqdim etasiz:
• Foydalanuvchi nomi, Email, Parol (shifrlangan), Profil rasmi, Watch Party tarixi

Avtomatik:
• Push-token, Qurilma OS, Xato hisobotlari, Oxirgi faollik

HECH QACHON: GPS, kontaktlar, biometrika, bank ma'lumotlari

3. Maqsadlar: Akkaunt, Watch Party, Push, Xavfsizlik, Diagnostika, Yaxshilash

4. Huquqiy asos (GDPR): Shartnoma (6(1)(b)), Qonuniy manfaat (6(1)(f)), Rozilik (6(1)(a))

5. Uchinchi tomon xizmatlar:
• Railway — barcha serverlar va DB (self-hosted MongoDB, Redis)
• Firebase — push tokenlar
• Sentry — anonim xatolar
• Google Sign-In, Apple Sign In

6. Saqlash muddati:
• Akkaunt — o'chirilgunga qadar
• Texnik loglar — 90 kun
• Watch Party xonalar — 60 kun ← (veb: 30 kun — TAFOVUT)

7. Huquqlar: Kirish, To'g'irlash, O'chirish, Cheklash, Ko'chirish, E'tiroz, Rozilikni qaytarish
Murojaat: support@wewatch.uz

8. Xavfsizlik: bcrypt, HTTPS/TLS, JWT 15 daqiqa, Rotatsiya 30 kun, expo-secure-store

9. Bolalar: 13+ ← (veb: 17+ — TAFOVUT)

10. Xalqaro uzatish: Railway platformasi, GDPR SCCs

11. O'zgarishlar: push yoki keyingi kirishda xabar beriladi

12. Murojaat: support@wewatch.uz

---

### 🇷🇺 РУССКИЙ (ru)

WeWatch — Политика конфиденциальности
Дата вступления в силу: 1 января 2025 г.

1. Введение
WeWatch уважает вашу конфиденциальность.

2. Данные которые мы собираем
Вы предоставляете: Никнейм, Email, Пароль (зашифрован), Фото профиля, История Watch Party

Автоматически: Push-токен, ОС устройства, Анонимные отчёты об ошибках, Дата последней активности

НИКОГДА: GPS, контакты, биометрика, банковские данные

3. Цели: Аккаунт, Watch Party, Push, Безопасность, Диагностика, Улучшение

4. Правовые основания (GDPR): Исполнение договора, Законный интерес, Согласие

5. Третьи стороны:
• Railway — все серверы и БД (self-hosted MongoDB, Redis, Elasticsearch)
• Firebase — push токены
• Sentry — анонимные ошибки
• Google Sign-In, Apple Sign In

6. Сроки хранения:
• Аккаунт — до удаления
• Логи — 90 дней
• Watch Party комнаты — 60 дней ← (веб: 30 дней — РАСХОЖДЕНИЕ)

7. Права: Доступ, Исправление, Удаление, Ограничение, Перенос, Возражение, Отзыв
Контакт: support@wewatch.uz

8. Безопасность: bcrypt, HTTPS/TLS, JWT 15 мин, Ротация 30 дней, expo-secure-store

9. Дети: 13+ ← (веб: 17+ — РАСХОЖДЕНИЕ)

10. Международная передача: Railway, GDPR Standard Contractual Clauses

11. Изменения: push или при следующем входе

12. Контакт: support@wewatch.uz

---

### 🇬🇧 АНГЛИЙСКИЙ (en)

WeWatch — Privacy Policy
Effective Date: January 1, 2025

1. Introduction — WeWatch respects your privacy.

2. Data We Collect
You provide: Username, Email, Password (encrypted), Profile photo, Watch Party history
Automatic: Push token, Device OS, Crash reports, Last activity date
NEVER: GPS, contacts, biometrics, financial data

3. Purposes: Account, Watch Party, Push, Security, Diagnostics, Improvement

4. GDPR Legal Basis: Performance of contract, Legitimate interest, Consent

5. Third Parties:
• Railway — all servers & DBs (self-hosted MongoDB, Redis)
• Firebase — push tokens only
• Sentry — anonymous error reports
• Google Sign-In, Apple Sign In

6. Retention:
• Account — until deletion
• Technical logs — 90 days
• Watch Party rooms — 60 days ← (web: 30 days — MISMATCH)

7. Rights: Access, Rectification, Erasure, Restriction, Portability, Object, Withdraw consent
Contact: support@wewatch.uz

8. Security: bcrypt, HTTPS/TLS, JWT 15 min, Refresh rotation 30 days, expo-secure-store

9. Children: 13+ ← (web: 17+ — MISMATCH)

10. International transfers: Railway platform, GDPR SCCs

11. Changes: push notification or on next login

12. Contact: support@wewatch.uz

---

## ЧТО НУЖНО ИСПРАВИТЬ

### Исправить в apps/mobile/src/constants/privacyPolicy.ts (мобильный PP):
1. Возраст: 13+ → 17+
2. Email: support@wewatch.uz → оставить или унифицировать с вебом
3. Watch Party retention: 60 дней → 30 дней
4. Дата: 2025-01-01 → 2026-05-20

### Исправить в apps/web/src/app/privacy-policy/page.tsx (веб PP):
1. Убрать MongoDB Atlas (не используется, self-hosted на Railway)
2. Email: privacy@wewatch.app, support@wewatch.app → проверить что эти ящики существуют

---
*Файл создан автоматически аудитом 2026-06-11*
