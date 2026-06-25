---
name: app-store-publish
description: "Публикация, сабмит, релиз, обновление мобильного приложения в Google Play Store или Apple App Store. Включает: EAS build/submit, pre-submission аудит, ASO, rejection handling, CI/CD. Используй когда: 'publish to play store', 'submit to app store', 'release the app', 'как опубликовать', 'app was rejected', 'отклонили приложение', 'keywords', 'screenshots', 'store listing'."
metadata:
  version: 3.0.0
  sources:
    - "expo/skills (official) — docs.expo.dev/skills/"
    - "rshankras/claude-code-apple-skills — rejection-handler, release-review, app-store"
    - "WeWatch project — eas.json, com.wewatch.app"
  zone: WeWatch-Mobile
---

# App Store Publish — Master Skill

Полный цикл публикации WeWatch (`com.wewatch.app`) в iOS App Store и Google Play Store.

---

## БЫСТРЫЕ КОМАНДЫ

```bash
cd apps/mobile

# Android Play Store (production AAB)
JAVA_HOME=/opt/homebrew/opt/openjdk@17 ANDROID_HOME=~/Library/Android/sdk \
  eas build -p android --profile production --submit

# iOS App Store
eas build -p ios --profile production --submit

# Submit уже готового билда (без ребилда)
eas submit -p android --latest
eas submit -p ios --latest

# Только сборка (без сабмита)
eas build -p android --profile production
eas build -p ios --profile production
```

---

## ФАЗА 0 — PRE-SUBMISSION АУДИТ (запускать перед КАЖДЫМ релизом)

### App Completeness (Guideline 2.1)
- [ ] Приложение запускается без крашей на всех поддерживаемых устройствах
- [ ] Все описанные в метаданных функции работают
- [ ] Нет placeholder контента (lorem ipsum, тестовые данные, TODO экраны)
- [ ] Нет сломанных ссылок и тупиковой навигации
- [ ] Все кнопки и интерактивные элементы работают
- [ ] Demo-аккаунт для App Review указан в Notes (если требуется логин)

### Accurate Metadata (Guideline 2.3)
- [ ] Название соответствует тому, что делает приложение
- [ ] Скриншоты показывают актуальный UI
- [ ] Описание точно отражает функциональность
- [ ] Нет misleading claims ("best", "#1") без подтверждения
- [ ] Keywords не содержат названия конкурентов

### Privacy (Guideline 5.1)
- [ ] Privacy Policy URL: `https://wewatch.uz/privacy-policy` — рабочая
- [ ] Privacy Nutrition Labels в App Store Connect соответствуют реальному поведению
- [ ] Privacy manifest включён (iOS 17+ — для определённых API)
- [ ] ATT prompt показывается перед трекингом (если применимо)
- [ ] Механизм удаления данных пользователя существует

### IAP Compliance (Guideline 3.1)
- [ ] Весь цифровой контент/фичи используют Apple IAP (не Stripe, PayPal и др.)
- [ ] Кнопка "Restore Purchases" есть и работает
- [ ] Нет текста, направляющего на покупку вне приложения

### Technical
- [ ] `usesNonExemptEncryption: false` в app.json (или корректно настроен Export Compliance)
- [ ] versionCode (Android) и buildNumber (iOS) увеличены
- [ ] Нет hardcoded secrets, .env данных в коде
- [ ] tsc --noEmit CLEAN

---

## ФАЗА 1 — GOOGLE PLAY STORE

### Первый раз (разовые шаги)
1. Создать аккаунт на [play.google.com/console](https://play.google.com/console) — $25 разово
2. Создать приложение → package: `com.wewatch.app`
3. Заполнить store listing (название, описание, скриншоты)
4. Пройти content rating questionnaire
5. Data safety раздел — заполнить
6. Настроить Service Account (для автосабмита через EAS)

### Service Account для EAS Submit
```
Google Cloud Console → IAM → Service Accounts → Create
  → Роль: Service Account User
  → Скачать JSON key
Play Console → Setup → API access → Link project
  → Service accounts → Grant "Release to production"
```

В `eas.json`:
```json
{
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      }
    }
  }
}
```
**Добавить в `.gitignore`:** `google-service-account.json`

### Release Tracks
| Track | Назначение | Время |
|-------|-----------|-------|
| `internal` | До 100 тестеров | Мгновенно |
| `alpha` | Закрытое тестирование | ~2 часа |
| `beta` | Открытое тестирование | ~2 часа |
| `production` | Все пользователи | 1-3 дня review |

Старт с `internal` → `beta` → `production`.

### Play Store чеклист (первый релиз)
- [ ] Privacy Policy URL: `https://wewatch.uz/privacy-policy`
- [ ] Описание (макс. 4000 символов)
- [ ] Краткое описание (макс. 80 символов)
- [ ] Скриншоты телефона (мин. 2, 16:9)
- [ ] Feature graphic: 1024×500px
- [ ] Иконка: 512×512px
- [ ] Content rating questionnaire
- [ ] Data safety раздел
- [ ] Targeting: страны, возраст

### Частые ошибки Android
| Ошибка | Решение |
|--------|---------|
| `Version code already used` | Увеличить `versionCode` в app.json |
| `APK not acceptable` | Использовать AAB (`"buildType": "app-bundle"`) |
| `App not found` | Сначала создать app в Play Console |
| `Service account lacks permission` | Выдать "Release to production" в Play Console → API access |

---

## ФАЗА 2 — APPLE APP STORE

### Первый раз (разовые шаги)
1. Apple Developer Program — $99/год — [developer.apple.com](https://developer.apple.com)
2. Создать app в App Store Connect → bundle ID: `com.wewatch.app`
3. Настроить App Store Connect API Key

### API Key для EAS Submit
```
App Store Connect → Users and Access → Keys → "+"
  → Роль: App Manager
  → Скачать .p8 файл
```

В `eas.json`:
```json
{
  "submit": {
    "production": {
      "ios": {
        "ascApiKeyPath": "./AuthKey_XXXXX.p8",
        "ascApiKeyIssuerId": "xxxxx-xxxx-xxxx-xxxx-xxxxx",
        "ascApiKeyId": "XXXXXXXXXX",
        "ascAppId": "<App Store Connect Apple ID>"
      }
    }
  }
}
```

### App Store чеклист
- [ ] Название (макс. 30 символов)
- [ ] Subtitle (макс. 30 символов)
- [ ] Description (макс. 4000 символов)
- [ ] Keywords (макс. 100 символов, без пробелов после запятых)
- [ ] Privacy Policy URL
- [ ] Support URL
- [ ] Скриншоты iPhone 6.7": 1290×2796 (**обязательно**)
- [ ] Скриншоты iPhone 6.5": 1242×2688 (**обязательно**)
- [ ] Скриншоты iPad Pro 12.9" (если universal)
- [ ] Age rating заполнен
- [ ] `"usesNonExemptEncryption": false` в app.json
- [ ] Demo account для App Reviewers (если есть логин)

### App Review Timeline
| Сценарий | Ожидаемое время |
|----------|----------------|
| Первый сабмит | 1-3 дня (обычно 24-48 ч) |
| Ресабмит после rejection | 1-3 дня |
| Expedited review | В день или на следующий день |
| Resolution Center reply | 1-3 рабочих дня |

**Сезонные задержки:**
- WWDC (июнь) — небольшие задержки
- Сентябрь-октябрь — запуск iPhone, очередь растёт
- Декабрь 23-27 — Apple freeze, сабмиты не обрабатываются → планировать заранее

### Частые ошибки iOS
| Ошибка | Решение |
|--------|---------|
| `No suitable application records found` | Создать app в App Store Connect |
| `The bundle version must be higher` | Включить `autoIncrement: true` |
| `Missing compliance information` | Добавить в app.json: `"usesNonExemptEncryption": false` |
| Rejection 4.2 (minimum functionality) | Убедиться что приложение даёт реальную ценность |

---

## ФАЗА 3 — ASO (App Store Optimization)

### Стратегия ключевых слов
- Использовать все 100 символов в keywords поле (без пробелов после запятых)
- Не дублировать слова из названия и subtitle
- Фокус на: высокий релевантность + умеренная конкуренция
- Обновлять keywords каждые 2-4 недели на основе данных

**Пример для WeWatch:**
```
watch,party,movie,together,sync,stream,friends,film,series,online,co-watch,cinema,share
```

### Описание — структура
```
[Hook — 1-2 предложения, главная ценность]

ГЛАВНЫЕ ФУНКЦИИ:
• [Feature 1 — с пользой]
• [Feature 2 — с пользой]
• [Feature 3 — с пользой]

[Social proof или CTA]

[Privacy/legal footnote если нужен]
```

**Правила:**
- Lead with benefits, not features
- Запрещённые слова: "free", "best", "#1", "top-rated" без доказательств
- Не упоминать конкурирующие платформы

### Screenshot стратегия
- Скриншот 1: главная ценность (hook)
- Скриншот 2-4: ключевые фичи с caption
- Скриншот 5: social proof или CTA
- Использовать device mockups + bold заголовки
- Captions: макс. 30-40 символов, крупный шрифт

---

## ФАЗА 4 — REJECTION HANDLING

### Алгоритм при отклонении

```
Rejection получен?
├── Objective violation (краш, privacy, IAP) → Исправить и ресабмитить (Путь A)
└── Subjective / misunderstanding?
    ├── Reviewer не понял → Объяснить с доказательствами (Путь B)
    └── Subjectibe judgment call?
        ├── Apple права → Исправить (Путь A)
        └── Apple ошибается → Возразить с доказательствами (Путь C) → Appeal (Путь D)
```

### Путь A — Fix and Resubmit
```
Thank you for the review.

We've addressed the issue cited in Guideline [X.X]:
- [Конкретное изменение]
- [Как проверили]

The updated build ([version] [build number]) has been submitted.
Please let us know if you have any further questions.
```

### Путь B — Clarification
```
Thank you for reviewing our app.

We'd like to provide additional context regarding Guideline [X.X].

[Объяснение что делает фича/приложение]

To demonstrate this:
1. [Пошаговые инструкции]
2. [Продолжение]

We believe this addresses the concern. We're happy to provide
additional information or discuss further.
```

### Путь C — Pushback (субъективный rejection)
```
Thank you for your feedback.

We respectfully believe [App Name] provides meaningful
functionality as outlined in Guideline [X.X]:

1. [Core value proposition]
2. [Конкретные фичи, показывающие глубину]
3. [Польза для пользователя]

[App Name] is designed as a focused [тип] that excels at
[конкретная цель]. This is an intentional design decision.

We'd welcome the opportunity to discuss this further.
```

### Путь D — Formal Appeal (эскалация)
| Уровень | Действие | Срок ответа |
|---------|---------|------------|
| 1 | Resolution Center reply | 1-3 рабочих дня |
| 2 | Запросить phone call в Resolution Center | 3-7 дней |
| 3 | App Review Board: developer.apple.com/contact/app-store/ | 5-14 дней |

**Топ rejection причины и фиксы:**
| Guideline | Причина | Фикс |
|-----------|---------|------|
| 2.1 | App crashes / incomplete | Fix bugs, remove placeholders |
| 2.3 | Misleading metadata | Обновить описание/скриншоты |
| 3.1 | Bypassing IAP | Убрать внешние платёжные ссылки |
| 4.2 | Minimum functionality | Добавить ценности или объяснить |
| 5.1 | Privacy violation | Privacy manifest + политика |
| 1.1 | Objectionable content | Модерация контента |

**Resolution Center — правила тона:**
- Professional и respectful
- Concise (reply ≤ 200 слов, appeal ≤ 500 слов)
- Evidence-based: скриншоты, видео, step-by-step
- НЕ эмоциональный язык, НЕ угрозы
- НЕ несколько реплаев подряд — ждать ответа

---

## КОНФИГИ

### eas.json — Production (WeWatch)
```json
{
  "cli": {
    "version": ">= 16.0.1",
    "appVersionSource": "remote"
  },
  "build": {
    "production": {
      "autoIncrement": true,
      "android": {
        "buildType": "app-bundle"
      },
      "ios": {
        "resourceClass": "m-medium"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      },
      "ios": {
        "appleId": "beelugacat@gmail.com",
        "ascAppId": "<FILL_IN>"
      }
    }
  }
}
```

### Version Bump перед релизом
```json
// apps/mobile/app.json
{
  "expo": {
    "version": "1.0.2",
    "android": { "versionCode": 3 },
    "ios": { "buildNumber": "3" }
  }
}
```

Или через EAS автоматически (с `autoIncrement: true` в eas.json — рекомендуется).

### Staged Rollout (осторожный запуск — Android)
```json
{
  "submit": {
    "production": {
      "android": {
        "track": "production",
        "releaseStatus": "inProgress",
        "rollout": 0.1
      }
    }
  }
}
```
10% → 25% → 50% → 100% с интервалом 24-48 ч, мониторинг crash rate.

---

## CI/CD — EAS WORKFLOWS

### Автоматический билд при push в main
```yaml
# .eas/workflows/production-release.yml
name: Production Release
on:
  push:
    branches: [main]
jobs:
  build_and_submit:
    type: build
    params:
      platform: all
      profile: production
```

```bash
# Запустить вручную
eas workflow:run production-release
```

### EAS Update (OTA обновление без ресабмита)
```bash
# Деплой JS/assets обновления мгновенно
eas update --branch production --message "Fix: watch sync fix"

# Проверить здоровье обновлений
eas update:list --branch production
```

---

## GITIGNORE (добавить обязательно)
```
google-service-account.json
AuthKey_*.p8
*.mobileprovision
```

---

*Sources: [expo/skills](https://docs.expo.dev/skills/) | [rshankras/claude-code-apple-skills](https://github.com/rshankras/claude-code-apple-skills) | WeWatch eas.json*
