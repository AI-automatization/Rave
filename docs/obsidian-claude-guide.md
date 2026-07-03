# Obsidian + Claude — Как работаю и что нужно изменить

## Как работаю сейчас

Сейчас я использую Obsidian реактивно — жду пока ты скажешь что делать, потом иду в код.

Vault читаю только когда:
- Ты говоришь "продолжи с прошлого"
- Явно прошу тебя запустить memory-load.sh
- Ищу что-то конкретное по задаче

Это плохо. Теряется ~70% контекста который там есть.

---

## Что там есть в vault (и я не всегда использую)

```
PROJECTS/weWatch/
  LAST_SESSION.md       — где остановились, последний коммит
  ARCHITECTURE.md       — стек всех сервисов
  CONSTRAINTS.md        — абсолютные запреты (зоны, anti-hallucination)
  DECISIONS.md          — почему архитектура именно такая
  API.md                — все endpoints
  _bugs.md              — известные баги которые нельзя воспроизводить
  docs/mobile-setup.md  — полный setup Expo, metro dedup, env
  marketing/ASO.md      — App Store название, ключевые слова, скриншоты
  decisions/            — архивные решения (Play Store, авторское право, etc)

AI_CONTEXT/
  in-progress-saidazim.md  — незавершённые задачи между сессиями
```

---

## Что должно быть — проактивный поиск

Когда ты говоришь любое ключевое слово — я должен сразу искать в vault:

| Ты говоришь | Я ищу в vault |
|-------------|---------------|
| "мобилка", "экран", "Expo" | mobile-setup.md, _bugs.md (android) |
| "App Store", "Play Store" | marketing/ASO.md, decisions/ по Store |
| "auth", "токен", "логин" | API.md, ARCHITECTURE.md, _bugs.md |
| "деплой", "Railway" | DECISIONS.md, LAST_SESSION.md |
| "баг", "падает" | _bugs.md, _android-bugs.md |
| "продолжи", "что делали" | LAST_SESSION.md, in-progress |

---

## Пример — App Store прямо сейчас

Я проверил vault. Вот что там есть по App Store:

**ASO (marketing/ASO.md):**
- Название: `WeWatch — Watch Together`
- Подзаголовок: `Кино с друзьями на расстоянии`
- Ключевые слова: `watch party, together, movie, sync, friends, couple, long distance`
- Порядок скриншотов: Room → Share link → Чат → Battle → Achievements
- Иконка: тёмный фон #0A0A0F, фиолетовый #7B72F8

**Незавершённая задача (Tasks.md):**
- T-S094 | P2 | [DEVOPS] | Play Store: Privacy Policy + DMCA страница — pending[Saidazim]

**Решения (decisions/):**
- cookie-collection.js удалён — Play Store помечал как spyware
- YouTube — только embed, без yt-dlp (правило Store)

---

## Что изменю с этого момента

Теперь при любом сообщении с ключевым словом — сначала grep по vault, потом отвечаю. Не буду ждать пока ты попросишь "посмотри в obsidian". Буду сам говорить что нашёл там.

---

*2026-05-24*
