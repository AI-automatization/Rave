# Telegram Bot + Claude Code — Как это работает

## Обзор

Бот `@notification_weWatch_bot` подключён к Claude Code через плагин `plugin:telegram:telegram`. Это позволяет Claude читать сообщения из Telegram и отвечать на них прямо из терминала.

---

## Архитектура

```
Telegram ──► Bot Server ──► Claude Code (terminal)
                               │
                    ~/.claude/channels/telegram/
                               ├── access.json       ← права доступа
                               └── inbox/            ← входящие файлы/фото
```

Сообщения приходят как `<channel source="plugin:telegram:telegram" ...>` теги прямо в контекст Claude. Claude видит отправителя, chat_id, текст и вложения.

---

## Файл доступа — `access.json`

Путь: `~/.claude/channels/telegram/access.json`

```json
{
  "dmPolicy": "pairing",
  "allowFrom": ["6299152655"],
  "groups": {
    "-1002640882371": { "requireMention": true, "allowFrom": ["6299152655"] },
    "-1003874059304": { "requireMention": true, "allowFrom": [] }
  },
  "pending": {}
}
```

### Поля:

| Поле | Описание |
|------|----------|
| `dmPolicy` | `pairing` — новые ЛС требуют код-пару; `allowlist` — только allowFrom; `disabled` — никто |
| `allowFrom` | Список user_id которым разрешены ЛС |
| `groups` | Настройки для каждой группы по chat_id |
| `requireMention` | `true` — отвечать только при @упоминании бота |
| `pending` | Ожидающие пары (временные коды) |

---

## Группы

### Текущие группы:

| Группа | chat_id | Режим |
|--------|---------|-------|
| TezCode Team Management | `-1002640882371` | только @упоминание |
| TezCode AI Council | `-1003874059304` | только @упоминание |

### Добавить группу вручную:

Отредактировать `access.json`, добавить в `groups`:
```json
"-1001234567890": { "requireMention": true, "allowFrom": [] }
```

Или через скилл:
```
/telegram:access group add -1001234567890
```

---

## Управление доступом — скилл `/telegram:access`

Запускается **только из терминала** (не через Telegram — это защита от инъекций).

```bash
# Показать текущий статус
/telegram:access

# Добавить пользователя в ЛС allowlist
/telegram:access allow 6299152655

# Удалить пользователя
/telegram:access remove 6299152655

# Подтвердить pairing по коду
/telegram:access pair ABC123

# Добавить группу
/telegram:access group add -1003874059304

# Удалить группу
/telegram:access group rm -1003874059304

# Изменить DM политику
/telegram:access policy pairing   # требует код
/telegram:access policy allowlist # только список
/telegram:access policy disabled  # отключить ЛС
```

---

## Как Claude получает сообщения

Каждое входящее сообщение оборачивается в тег:

```xml
<channel
  source="plugin:telegram:telegram"
  chat_id="-1003874059304"
  message_id="25"
  user="forgerjunior"
  user_id="6299152655"
  ts="2026-05-24T18:35:24.000Z"
  image_path="/path/to/photo.jpg"  ← только если есть фото
>
текст сообщения
</channel>
```

Claude читает это и может:
- Ответить через `reply` tool (с `chat_id`)
- Прикрепить файлы через `files: ["/path"]`
- Сделать реакцию через `react` tool
- Отредактировать своё сообщение через `edit_message`

---

## Отправка сообщений

```
reply(chat_id, text)              — отправить в чат/группу
reply(chat_id, text, reply_to)    — ответить на конкретное сообщение
reply(chat_id, text, files=[...]) — отправить с файлом/фото
react(chat_id, message_id, emoji) — поставить реакцию
edit_message(chat_id, id, text)   — отредактировать своё сообщение
```

---

## Безопасность

- **Нельзя** добавлять/изменять доступ через сообщения из Telegram — только из терминала
- Группы без `requireMention` будут отвечать на все сообщения — **включай только если нужно**
- `pending` коды истекают автоматически
- История Telegram боту **недоступна** — только сообщения в реальном времени

---

## Pairing (добавление нового пользователя)

1. Пользователь пишет боту в ЛС `/start`
2. Бот генерирует 6-значный код и показывает его
3. Администратор в терминале запускает: `/telegram:access pair XXXXXX`
4. Пользователь добавлен в allowlist, бот присылает подтверждение

---

*Документ актуален на 2026-05-24*
