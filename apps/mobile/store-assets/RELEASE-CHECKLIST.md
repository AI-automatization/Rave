# WeWatch — First Release Checklist

**App:** WeWatch (`com.wewatch.app`) | **Version:** 1.0.1 | **Target:** Play Store + App Store

---

## ✅ УЖЕ ГОТОВО

- [x] `app.json` — bundle ID, version, permissions
- [x] `eas.json` — build profiles (dev/preview/production)
- [x] iOS Privacy Manifest (NSPrivacyAccessedAPITypes)
- [x] Privacy Policy URL: https://wewatch.uz/privacy-policy
- [x] App icon: 1024×1024px ✓
- [x] Android adaptive icon: foreground + background ✓
- [x] Splash screen configured ✓
- [x] `usesNonExemptEncryption: false` — добавлено ✓
- [x] Store listing текст: RU + EN написан ✓
- [x] `eas.json` iOS submit config — добавлен ✓

---

## 🔴 КРИТИЧНО — БЕЗ ЭТОГО НЕЛЬЗЯ ПУБЛИКОВАТЬ

### Google Play Store
- [ ] **Создать аккаунт Play Console** — play.google.com/console ($25)
- [ ] **Создать приложение** — название WeWatch, package com.wewatch.app
- [ ] **Feature Graphic** — 1024×500px (создать в Figma или Canva)
  - Файл: `store-assets/play-store/feature-graphic.png`
- [ ] **5+ скриншотов Android** — 1080×2400px
  - Файлы: `store-assets/screenshots/android-01.png` ... `android-05.png`
- [ ] **Content Rating Questionnaire** — заполнить в Play Console
- [ ] **Data Safety Form** — заполнить в Play Console
- [ ] **Service Account Key** для auto-submit
  - Создать: Google Cloud Console → IAM → Service Accounts
  - Сохранить как: `apps/mobile/google-services-key.json`
  - Добавить в `.gitignore` ✓

### Apple App Store
- [ ] **Apple Developer Program** — $99/год (developer.apple.com)
- [ ] **Создать app в App Store Connect** — bundle ID: com.wewatch.app
- [ ] **App Store Connect API Key** (.p8)
  - App Store Connect → Users and Access → Keys
  - Сохранить как: `apps/mobile/AuthKey_XXXX.p8`
  - Заполнить в `eas.json`: ascAppId, ascApiKeyIssuerId, ascApiKeyId
- [ ] **5+ скриншотов iPhone 6.7"** — 1290×2796px (обязательно)
- [ ] **5+ скриншотов iPhone 6.5"** — 1242×2688px (обязательно)
- [ ] **Заполнить App Review Notes** — demo account (см. listing-en.md)
- [ ] **Заполнить App Store Connect listing** — name, subtitle, keywords, description

---

## 🟡 ВАЖНО — для качественного релиза

- [ ] **Demo-аккаунт** для App Reviewers
  - Email: reviewer@wewatch.uz
  - Создать в БД с тестовыми данными
- [ ] **Support URL** — wewatch.uz/support или Telegram канал
- [ ] **Тестирование на реальных устройствах** (не симулятор)
  - iPhone (iOS 16+)
  - Android (API 26+, arm64)
- [ ] **tsc --noEmit** — должен быть CLEAN
- [ ] **Проверить все deep links** (scheme: wewatch://)
- [ ] **Push notifications** — проверить на физическом устройстве

---

## КОМАНДЫ СБОРКИ

```bash
cd apps/mobile

# Тест сборки (internal, без сабмита)
eas build -p android --profile production
eas build -p ios --profile production

# Сборка + автосабмит (после заполнения eas.json)
JAVA_HOME=/opt/homebrew/opt/openjdk@17 ANDROID_HOME=~/Library/Android/sdk \
  eas build -p android --profile production --submit

eas build -p ios --profile production --submit
```

---

## ПОРЯДОК ПУБЛИКАЦИИ (рекомендованный)

1. **Google Play → Internal Track** (100 тестеров, мгновенно)
2. Тест 3-5 дней → фиксируем баги
3. **Google Play → Open Beta**
4. **App Store → TestFlight** (параллельно)
5. Тест 1 неделя
6. **Google Play → Production** (staged rollout 10%)
7. **App Store → Submit for Review** (1-3 дня)
8. **Google Play → Production 100%**

---

*Обновлено: 2026-06-11*
