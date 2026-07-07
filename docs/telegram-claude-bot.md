# Как работает WeWatch Claude Telegram бот

## Общая схема

```
Telegram → MCP плагин → Claude Code CLI → ответ через reply tool
```

Saidazim пишет в Telegram → сообщение приходит в Claude как обычный запрос → Claude отвечает/делает код/деплоит.

---

## Компоненты

### 1. Claude Code CLI + plugin:telegram

Запуск через скрипт:
```bash
bash .claude/scripts/start-claude.sh
```

Внутри он запускает:
```bash
claude CLAUDE.md --channels plugin:telegram@claude-plugins-official --dangerously-skip-permissions
```

- `--channels plugin:telegram@claude-plugins-official` — подключает официальный плагин Telegram
- `CLAUDE.md` — передаётся как системный промпт (правила, зоны, задачи)
- `--dangerously-skip-permissions` — Claude не спрашивает разрешения на каждое действие
- При крэше — автоперезапуск через 2 сек + уведомление в TG

### 2. MCP сервер `plugin:telegram:telegram`

Конфиг в `~/.claude/settings.json`:
```json
"telegram": {
  "command": "npx",
  "args": ["-y", "@benjapieres/mcp-telegram-listener"],
  "env": {
    "TELEGRAM_BOT_TOKEN": "...",
    "ALLOWED_CHAT_IDS": "6299152655,-3944652223",
    "REQUIRE_MENTION": "false",
    "QUEUE_PATH": "/Users/saidazim/.claude/telegram-queue.json"
  }
}
```

- Бот слушает сообщения из разрешённых чатов
- Сообщения кладёт в JSON-очередь
- Claude читает очередь и обрабатывает

### 3. Два отдельных бота

| Бот | Назначение | Chat IDs |
|-----|-----------|----------|
| WeWatch бот (токен в env `CLAUDE_TG_BOT_TOKEN`) | Основной — общение с Claude, задачи, код | личка Saidazim + группа |
| Blogy бот (токен в env) | Отдельный агент для проекта Blogy (инфлюенсеры) | все чаты |

---

## Жизненный цикл сообщения

```
1. Saidazim пишет в TG
2. MCP слушает webhook/polling → кладёт в telegram-queue.json
3. Claude видит тег: <channel source="telegram" chat_id="..." user="...">
4. Обрабатывает как обычный запрос
5. Отвечает через reply tool → сообщение приходит в TG
```

---

## Голосовые сообщения

```
1. Приходит тег с attachment_file_id
2. Claude скачивает: download_attachment(file_id)
3. Транскрибирует: python3 .claude/scripts/transcribe.py <файл>
4. Whisper (base модель) → русский текст
5. Отвечает на содержимое
```

---

## Уведомления о задачах

Отдельный бот (`8710780612:...`) через скрипт:
```bash
.claude/scripts/tg-notify.sh <action> <task_id> <meta> <title> [executor]
# actions: new | claim | done | update | blocked
```

Отправляет уведомления:
- Saidazim (chat: `6299152655`) → для задач `T-S*`
- Emirhan (chat: `569913655`) → для задач `T-E*`
- Оба → для задач `T-C*`

---

## Blogy агент

Сообщения с тегом `source="plugin:telegram:telegram-blogy"` обрабатываются отдельно:
- Контекст: `~/Documents/weWatch-obsidian/ZONES/Blogy/_context.md`
- Заказчик: Георгий Балуев (`@baluevgeorge`)
- Тематика: инфлюенсер-маркетплейс Узбекистана

---

## Мониторинг TezCode чата

`tg_autobot.py` через Telethon (не Bot API — читает как юзер):
```bash
bash .claude/scripts/tg-watch.sh start   # фоновый мониторинг
bash .claude/scripts/tg-watch.sh history 3  # история за 3 дня
```

Читает `~/.claude/scripts/tg_read.py` для истории чатов.

---

## Как добавить новый чат

1. Добавить `chat_id` в `ALLOWED_CHAT_IDS` в `~/.claude/settings.json`
2. Перезапустить: `bash .claude/scripts/restart.sh`

---

*WeWatch | docs/telegram-claude-bot.md*
