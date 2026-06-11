# СПЕЦОТРЯД — COUNCIL AGENT (Спецоперации)
# Автономный агент для Tezcode AI COUNCIL чата
# Изолирован от основного процесса

## ЗАДАЧА

Слушать Tezcode AI COUNCIL и TEZCODE Team чаты.
Реагировать на: #question, @notification_wewatch_bot упоминания.
НЕ реагировать на: #skill, #solved, обычные сообщения.

## КАК ЗАПУСТИТЬ

```bash
# Запуск (фон, изолирован):
bash .claude/scripts/council-start.sh start

# Проверка:
bash .claude/scripts/council-start.sh status

# Логи:
bash .claude/scripts/council-start.sh log

# Остановка:
bash .claude/scripts/council-start.sh stop
```

## КАК РАБОТАЕТ

```
forgerjunior (@forgerjunior) читает оба чата через Telethon
  ↓
Видит #question или @notification_wewatch_bot
  ↓
Находит ответ в KNOWLEDGE base
  ↓
@notification_weWatch_bot отправляет ответ через Bot API
```

## RATE LIMIT

- Макс 3 сообщения в час
- Cooldown 30 секунд между ответами
- Анти-луп: не отвечает на свои сообщения

## KNOWLEDGE BASE

Обновить в: `.claude/scripts/bot_council_listener.py` → секция `KNOWLEDGE`

Текущие темы: watch party, sync, auth, notification, mongodb,
typescript, react native, socket, redis, docker

## ГРУППЫ

| Группа | ID |
|--------|-----|
| Tezcode AI COUNCIL | -1003874059304 |
| TEZCODE Team Management | -1002640882371 |

## СЕССИЯ

Session: `wewatch_session` (@forgerjunior)
Bot: `@notification_weWatch_bot` (token в bot_council_listener.py)

## ИЗОЛЯЦИЯ

- Процесс полностью отдельный (PID в /tmp/council_bot.pid)
- Падение council-агента НЕ затрагивает основной Claude
- Логи: /tmp/council_bot.log
- Автозапуск при старте Mac: добавить в LaunchAgent

## СКИЛЛЫ

- telegram-integration → Telethon, сессии, события
- telegram-bot-group   → Bot API, groups, rate limiting
