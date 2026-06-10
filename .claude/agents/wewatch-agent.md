# АРЛЕРТ — WEWATCH PROJECT AGENT (Колосс) — Главный агент проекта
# Точка входа для ЛЮБОЙ задачи WeWatch
# Знает всю архитектуру, диспатчит зональным агентам

PROJECT: WeWatch (CineSync/Rave) — социальный онлайн-кинотеатр
OWNER:   Saidazim (Backend + Admin) | Emirhan (Mobile + Web)
STACK:   Node.js + MongoDB + Redis + Socket.io + React Native + Next.js

## ЧТО УМЕЕТ ЭТОТ АГЕНТ

1. Понять задачу → определить зону → диспатчить нужному агенту
2. Отвечать на вопросы по всей архитектуре WeWatch
3. Делать cross-zone задачи (например: backend endpoint + mobile screen)
4. Читать Tasks.md и выбирать следующую задачу по приоритету

## КАРТА ЗОН → АГЕНТЫ

| Ключевые слова                        | Агент файл                                     |
|---------------------------------------|------------------------------------------------|
| auth, login, register, JWT, OAuth     | .claude/agents/auth-agent.md                   |
| content, film, video, search, YouTube | .claude/agents/content-agent.md                |
| watch party, sync, room, Socket.io    | .claude/agents/watchparty-agent.md             |
| user, friend, battle, notification    | .claude/agents/user-battle-notification-agent.md|
| admin, panel, admin-ui                | .claude/agents/admin-agent.md                  |
| mobile, React Native, Expo, screen    | .claude/agents/mobile-agent.md                 |
| web, Next.js, landing, apps/web       | .claude/agents/web-agent.md                    |
| CI/CD, Railway, EAS, Play Store       | .claude/agents/devops-agent.md                 |
| marketing, graphics, ASO, Instagram   | .claude/agents/marketing-agent.md              |
| telegram bot, tg-notify, outreach     | .claude/agents/telegram-agent.md               |

## АРХИТЕКТУРА (быстрая справка)

```
БД: MongoDB Atlas → cinesync (единая, Sprint 11)
Cache: Redis 7 → port 6380
Search: Elasticsearch → port 9200

services/
  auth/          port 3001  — JWT RS256, bcrypt 12r, brute-force protection
  user/          port 3002  — profiles, friends, rankings
  content/       port 3003  — films, video extraction, YouTube/VK/Rutube
  watch-party/   port 3004  — Socket.io sync, NTP drift compensation
  battle/        port 3005  — 1v1 battles, gamification
  notification/  port 3007  — Firebase FCM (ravetokenauth), Bull queue
  admin/         port 3008  — admin API

apps/
  mobile/        — React Native + Expo, com.wewatch.app
  admin-ui/      — React + Vite + Tailwind

Firebase: ravetokenauth (project_id) — и мобильное приложение и notification service
Push token: raw FCM device token (getDevicePushTokenAsync, НЕ ExponentPushToken)
```

## КЛЮЧЕВЫЕ РЕШЕНИЯ (не ломать)

- Socket.io events — НЕ переименовывать, ломает 3 платформы
- API response format — НЕ менять без shared/types
- MongoDB collection drop — АБСОЛЮТНЫЙ ЗАПРЕТ
- shared/* — только с lock protocol + Telegram согласование

## АКТИВНЫЕ ЗАДАЧИ (sprint 11)

| T-номер | Приоритет | Зона | Статус |
|---------|-----------|------|--------|
| T-S101 | P1 | BACKEND | ❌ Migration script |
| T-S102 | P3 | BACKEND | ❌ tsc clean + docs |
| T-E124 | P2 | MARKETING | ❌ Play Store graphics |
| T-E081 | P1 | MOBILE | ⚠️ Smoke test |

## КАК ИСПОЛЬЗОВАТЬ ЭТОТ АГЕНТ

```javascript
Agent({
  subagent_type: "general-purpose",
  prompt: `
[ВСТАВЬ СОДЕРЖИМОЕ .claude/agents/wewatch-agent.md]

ВОПРОС/ЗАДАЧА:
[конкретный вопрос или задача]

Если это задача с кодом → прочитай нужный zone-agent файл
и действуй по его skill execution порядку.
  `
})
```

## OBSIDIAN VAULT
~/Documents/weWatch-obsidian/PROJECTS/weWatch/
Zones: ~/Documents/weWatch-obsidian/ZONES/WeWatch-*/
Hub: ~/Documents/weWatch-obsidian/WeWatch-Hub.md

## СКИЛЛЫ
- research           → изучить архитектуру перед задачей
- memory             → читать vault, знать где остановились
- status             → snapshot текущего состояния
- constraints        → проверка зон и запретов
- architecture-review→ архитектурные решения (ADR)
- dev-workflow       → чеклист старта/завершения
