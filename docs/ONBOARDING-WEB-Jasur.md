# WeWatch — Онбординг для веб-разработчика (Жасур)

> Привет, Жасур! 👋 Это гид по проекту **WeWatch** (он же Rave / CineSync).
> Твоя зона — **весь веб**: `apps/web` (лендинг) + `apps/app-web` (само приложение).
> Документ объясняет всю архитектуру, чтобы ты понимал контекст, и подробно — веб-часть.
> Составлено: 2026-07-03. Автор: Saidazim (backend + admin).

---

## 1. Что такое WeWatch

**Социальный онлайн-кинотеатр**: смотреть видео (YouTube, VK, Rutube, Uzmove и др.) **синхронно с друзьями** — ты нажал паузу, у всех пауза. Плюс чат, эмодзи-реакции, батлы, достижения, друзья, DM.

- **Стадия:** MVP, в продакшне (Railway).
- **Платформы:** iOS (в App Store), Android (скоро), **Web** (твоя зона).
- **Компания:** tezCode (Ташкент, UTC+5), AI-first студия.
- **Домен:** `wewatch.uz` (лендинг), `app.wewatch.uz` (приложение), `admin.wewatch.uz` (админка).

---

## 2. Общая архитектура

Монорепозиторий (npm workspaces), микросервисы на бэке, три фронта.

```
                     ┌────────────────────────────┐
                     │        Клиенты             │
    wewatch.uz ──────┤ apps/web (лендинг, Next.js) │
 app.wewatch.uz ─────┤ apps/app-web (app, Next.js) │──┐
                     │ apps/mobile (RN + Expo)     │  │
 admin.wewatch.uz ───┤ apps/admin-ui (React+Vite)  │  │
                     └────────────────────────────┘  │
                                                      │ HTTP (JWT) + Socket.io
                     ┌────────────────────────────────▼──────────────┐
                     │            Backend (services/*)                 │
                     │  auth · user · content · watch-party · battle   │
                     │  notification · admin                           │
                     └───────────────┬─────────────────────────────────┘
                                     │
                     ┌───────────────▼──────────────┐
                     │  MongoDB · Redis · Elastic    │
                     └──────────────────────────────┘
```

### Сервисы (бэкенд — контекст, не твоя зона)

| Сервис | Технологии | Порт | Railway URL | Роль |
|--------|-----------|------|-------------|------|
| auth | Node+Express+MongoDB | 3001 | auth-production-47a8 | регистрация, логин, JWT, OAuth (Google/Telegram) |
| user | Node+Express+MongoDB | 3002 | user-production-86ed | профили, друзья, DM, статы, FCM-токены |
| content | Node+Express+Elasticsearch | 3003 | content-production-4e08 | извлечение видео, HLS-прокси, поиск, домены |
| watch-party | Express+Socket.io+Redis | 3004 | watch-part-production | комнаты, **синхронизация play/pause/seek**, чат |
| battle | Express+MongoDB+Redis | 3005 | — | батлы, лидерборды |
| notification | Express+Firebase FCM+Bull | 3007 | notification-production-9c30 | push-уведомления |
| admin | Express+MongoDB | 3008 | admin-production-8d2a | админ-API, настройки платформы |

**Инфра:** MongoDB (единая база `cinesync` после миграции), Redis (кэш + Socket.io adapter + rate-limit), Elasticsearch (поиск).

**Ключевой принцип синхронизации:** сервер watch-party — источник правды. Клиент шлёт события (`play`, `pause`, `seek`) через Socket.io, сервер рассылает их всем в комнате + компенсирует задержку (NTP-подобный offset + буфер). На мобилке есть экспериментальный **mesh** (WebRTC P2P) — веба это пока не касается.

---

## 3. Структура монорепо

```
Rave/
├── apps/
│   ├── web/        → ЛЕНДИНГ (wewatch.uz)      ← твоя зона
│   ├── app-web/    → ПРИЛОЖЕНИЕ (app.wewatch.uz) ← твоя зона
│   ├── mobile/     → React Native + Expo (Emirhan)
│   └── admin-ui/   → React + Vite админка (Saidazim)
├── services/       → бэкенд-микросервисы (Saidazim) — НЕ трогать
├── shared/         → общие types / utils / middleware (общая зона, lock protocol)
├── docs/           → Tasks.md, Done.md, документация
├── package.json    → workspaces: services/*, apps/*, shared
└── tsconfig.base.json
```

**Правило зон:** веб-разработчик трогает только `apps/web` и `apps/app-web`. `services/`, `apps/mobile`, `apps/admin-ui` — чужие зоны. `shared/*` — по согласованию (см. §9).

---

## 4. ВЕБ — твоя зона (детально)

### 4.1. Разделение доменов (важно понять сразу)

Два отдельных Next.js-приложения:

| Приложение | Домен | Что содержит |
|-----------|-------|--------------|
| **`apps/web`** | `wewatch.uz` | Лендинг, маркетинг: главная, `/features`, `/pricing`, 13 SEO-гайдов (`/guides/*`), use-cases, `/about`, `/faq`, `/team`, `/terms`, `/privacy-policy`, `/dmca`. **Только публичные SEO-страницы.** |
| **`apps/app-web`** | `app.wewatch.uz` | Само приложение: `(auth)` (login/register), `(app)` (home, room, friends, messages, profile, settings, notifications, support). Требует авторизации. |

`apps/web/next.config.mjs` **301-редиректит** пути приложения (`/login`, `/home`, `/room`, `/friends`…) на `app.wewatch.uz` — чтобы лендинг и приложение были чисто разделены для SEO и пользователей.

### 4.2. Стек (обе апы)

- **Next.js 14** (App Router) + **React 18** + **TypeScript**
- **TailwindCSS v4** (+ tailwind-merge, cva, tailwindcss-animate)
- **Radix UI** (shadcn-style компоненты в `components/ui/`)
- **next-intl** — i18n: **ru / uz / en** (`messages/*.json`)
- **framer-motion** — анимации
- **@tanstack/react-query** — серверный стейт
- **zustand** — клиентский стейт (`store/`)
- **socket.io-client** — realtime (комнаты, чат, DM)
- **hls.js** — HLS-плеер видео
- **@sentry/nextjs** — мониторинг ошибок

### 4.3. Как веб общается с бэкендом (ключевой паттерн)

Веб **не ходит напрямую** в микросервисы из браузера. Вместо этого — **Next.js API routes как прокси**:

```
Браузер → /api/rooms (Next.js route) → watch-party service → ответ
```

Пример (`apps/web/src/app/api/rooms/route.ts`):
```ts
const accessToken = req.cookies.get('access_token')?.value;   // JWT в httpOnly cookie
const res = await fetch(`${WATCH_PARTY_SERVICE_URL}/api/v1/watch-party/rooms`, {
  headers: { Authorization: `Bearer ${accessToken}` },          // проксируем токен
});
return NextResponse.json(await res.json(), { status: res.status });
```

Почему так:
- **JWT хранится в httpOnly cookie** (`access_token` / `refresh_token`) — недоступен JS, безопасно от XSS.
- Браузер не знает URL-ы сервисов — они только на сервере (env).
- Одна точка входа, единый CORS.

Клиентские хелперы: `src/lib/` → `api-client.ts`, `service-urls.ts`, `socket.ts`, `query-client.ts`, `api-error.ts`.

**Env-переменные сервисов** (на сервере Next.js): `AUTH_SERVICE_URL`, `USER_SERVICE_URL`, `CONTENT_SERVICE_URL`, `WATCH_PARTY_SERVICE_URL`, `NOTIFICATION_SERVICE_URL`, `ADMIN_SERVICE_URL` (+ `RAILWAY_SERVICE_*_URL` как fallback). Публичные: `NEXT_PUBLIC_SOCKET_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_APP_DOMAIN`.

### 4.4. Структура `apps/web` (лендинг)

```
apps/web/src/
├── app/
│   ├── (landing)/
│   │   ├── layout.tsx
│   │   ├── features/ · pricing/
│   ├── LandingContent.tsx   → главная (⚠️ 2000+ строк, god-file — кандидат на рефактор)
│   ├── page.tsx · layout.tsx (SEO-мета, JSON-LD, GA/Yandex)
│   ├── guides/*  · use-cases/* · about · faq · team · terms · privacy-policy · dmca
│   ├── api/*     → прокси-роуты к бэкенду
│   ├── sitemap.ts · og-image/route.tsx
│   └── uz/       → узбекские гайды
├── components/common/  → LandingNav, Footer, WeWatchLogo, LanguageSwitcher, StatsWidget
├── lib/  · hooks/  · store/  · types/
└── messages/  → ru.json, uz.json, en.json (i18n)
```

### 4.5. Структура `apps/app-web` (приложение)

```
apps/app-web/src/app/
├── (auth)/   → login, register, reset-password
├── (app)/    → home, room/[id], friends, messages, profile, settings, notifications, support
├── api/      → прокси-роуты
└── layout.tsx
components/ → party/ (VideoPlayer, ChatPanel, MemberList), rooms/, friends/, messages/, profile/, ui/
```

---

## 5. Локальный запуск

```bash
# 1. установка (из корня — монорепо)
npm install

# 2. лендинг
cd apps/web && npm run dev        # → localhost:3000

# 3. приложение
cd apps/app-web && npm run dev    # → localhost:3001 (или др. порт)
```

Нужны `.env` файлы с URL-ами сервисов. Для локальной разработки можно указывать на **прод-сервисы Railway** (URL-ы в таблице §2) — тогда бэкенд поднимать не надо. Env-файлы попроси у Saidazim (в git их нет — секреты).

---

## 6. Деплой и окружения

- **Хостинг:** Railway, проект `rave` (TezCode Team).
- Каждый сервис/апа — свой **Dockerfile** + `railway.toml` (Root Directory = корень репо, Config Path = `<service>/railway.toml`).
- **Деплой вручную:**
  ```bash
  railway up --service web       # лендинг
  railway up --service app-web   # приложение
  ```
- **`main` — защищённая ветка**, прямой push запрещён. Работа через ветки `jasur/feat-xxx` → PR.
- Health-check у сервисов: `/health` (у app-web — `/login`).

---

## 7. Пример потока данных (Watch Party)

```
1. Юзер логинится → auth выдаёт JWT → Next.js кладёт в httpOnly cookie
2. Создаёт комнату → POST /api/rooms → watch-party service → возвращает roomId + inviteCode
3. Открывает комнату → socket.io connect (JWT verify) → join room
4. Нажимает Play → emit 'play' → сервер рассылает всем + компенсирует задержку
5. Все клиенты применяют seek/play синхронно (±2с)
6. Чат/эмодзи → socket events → всем в комнате
```

---

## 8. Соглашения и правила (из CLAUDE.md)

**Clean code:**
- ❌ `any`, ❌ `console.log` (использовать logger / `if (__DEV__)`), ❌ файлы 400+ строк
- ❌ magic numbers, ❌ hardcoded secrets, ❌ вложенные try/catch
- Дубли → в `shared/utils/` или общий компонент

**Git:**
- Ветки: `jasur/feat-xxx`
- Коммиты: `feat(web): ...` | `fix(web): ...` | `refactor(web): ...`
- Перед мержем: `npm run typecheck` (tsc чистый) обязателен

**Язык:** код/комментарии — английский. Общение в команде — русский/узбекский.

**Задачи:** `docs/Tasks.md` (открытые) → `docs/Done.md` (архив). Формат — см. существующие. Уведомления в Telegram-бот при изменении задач.

---

## 9. ⚠️ Что нельзя без согласования

- ❌ Трогать `services/*`, `apps/mobile/`, `apps/admin-ui/` — чужие зоны
- ❌ Менять `shared/types|utils|middleware` без уведомления команды (ломает все сервисы) — «lock protocol»
- ❌ Переименовывать Socket.io events — ломает 3 платформы (web + iOS + Android)
- ❌ Менять формат ответа API без обновления `shared/types`
- ❌ Push в `main` напрямую

---

## 10. Текущее состояние веба (что уже есть и что чинить)

**Работает:** лендинг в проде, SEO-мета/JSON-LD/sitemap, i18n ru/uz/en, 13 SEO-гайдов, домен-сплит, прокси-роуты, socket-интеграция.

**Известные задачи по лендингу** (из недавнего UI/UX-аудита — хороший стартовый бэклог):
1. 🔴 **CTA «Download App Store» ведёт на `apps.apple.com`** (домашнюю Apple, не на приложение) — во всех кнопках. Заменить на реальный URL.
2. 🔴 **Язык ≠ SEO:** лендинг рендерит узбекский по умолчанию, но `<html lang="ru">` захардкожен + вся мета русская. Определиться с дефолтным locale + hreflang.
3. 🟠 Фейковая статистика на лендинге (счётчики, «5+ стран», глобус с выдуманными юзерами) — у MVP.
4. 🟠 Контраст текста (zinc-500/600/700 на тёмном) — не проходит WCAG AA.
5. 🟠 i18n-дыры: «Команда»/«Компания» захардкожены по-русски в nav/footer.
6. 🟠 Повторяющиеся блоки: 3-шаговый флоу и заголовок «ТАК ПРОСТО» дублируются; фичи Battle/Достижения есть в переводах, но не показаны.
7. 🟡 `LandingContent.tsx` — 2000+ строк, разбить на компоненты.

**Полезно знать (грабли):** есть флаг **maintenance mode** (админка → Settings). Когда включён — все сервисы отдают 503. Логин/админ-настройки/`app-config` из-под него **исключены** (иначе систему невозможно разблокировать). Если приложение вдруг показывает «Техническое обслуживание» — проверь этот флаг.

---

## 11. Контакты и ресурсы

| Кто | Роль | Telegram |
|-----|------|----------|
| Saidazim | Backend + Admin (автор гида) | @forgerjunior |
| Emirhan | Mobile TL | @Emirhan7788 |
| Bekzod | CEO, code review | — |
| **Жасур (ты)** | **Web** | @coder_enginer |

- Командный чат: TEZCODE Team (Telegram)
- Задачи: `docs/Tasks.md`
- Гайды по зонам: `CLAUDE.md` (главный), `CLAUDE_WEB.md` (веб-детали, местами устарел — сверяйся с кодом)

---

## 12. Первые шаги

1. Клонировать репо, `npm install` из корня.
2. Взять `.env` у Saidazim, запустить `apps/web` и `apps/app-web` локально.
3. Пройтись по `apps/web/src/app/LandingContent.tsx` и `apps/app-web/src/app/(app)/` — понять структуру.
4. Изучить прокси-паттерн: `src/lib/service-urls.ts` + любой `src/app/api/*/route.ts`.
5. Взять первую задачу из §10 (рекомендую #1 — CTA-фикс: быстро и заметно) → ветка `jasur/feat-cta-appstore` → PR.
6. Вопросы — сразу Saidazim (@forgerjunior).

Добро пожаловать в команду! 🚀
