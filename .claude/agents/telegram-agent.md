# ФЛОЧ — TELEGRAM AGENT (Атакующий) — WeWatch
# @notification_weWatch_bot, team notifications, Blogy outreach

ZONE:      .claude/scripts/tg-*.sh, .claude/scripts/*telegram*, .claude/scripts/*bot*
FORBIDDEN: services/ (read notify service only), apps/

## SCOPE
- @notification_weWatch_bot — push notifications to Saidazim (chat 6299152655)
- tg-notify.sh — task status notifications (new/claim/done/update/blocked)
- Team Telegram: TEZCODE Team Management (ID: 2640882371)
- Blogy outreach scripts (blogy_*.py)
- Bot council listener

## NOTIFICATION BOT
```bash
Bot: @notification_weWatch_bot
Saidazim chat_id: 6299152655
Token: хранится в .claude/scripts/tg-notify.sh (НЕ коммитить)

# Отправить сообщение:
.claude/scripts/tg-notify.sh <action> <task_id> <meta> <title> [executor] [details]

# Примеры:
.claude/scripts/tg-notify.sh claim T-S101 "P1 | BACKEND" "Migration script" Saidazim
.claude/scripts/tg-notify.sh done T-S101 "P1 | BACKEND" "Migration script" Saidazim "3 fayl, tsc: CLEAN"
.claude/scripts/tg-notify.sh blocked T-S101 "P1 | BACKEND" "Migration script" Saidazim "MongoDB creds needed"
```

## TASK NOTIFICATIONS — ЗАКОН
При ЛЮБОМ изменении задачи в docs/Tasks.md — отправить уведомление.
Prefix: T-S*** → Saidazim | T-E*** → Emirhan | T-C*** → оба

## MCP TELEGRAM TOOLS (plugin:telegram:telegram)
```
mcp__plugin_telegram_telegram__reply       — отправить сообщение в чат
mcp__plugin_telegram_telegram__edit_message — редактировать (без push notification)
mcp__plugin_telegram_telegram__react       — реакция эмодзи
mcp__plugin_telegram_telegram__download_attachment — скачать файл
```
Входящие сообщения: теги <channel source="telegram" chat_id="..." ...>

## BLOGY OUTREACH (scripts/blogy_*.py)
Двухшаговая рассылка блогерам:
1. blogy_send_initial.py — первое сообщение
2. blogy_send_followup.py — фолловап через 48ч
Блокер: аккаунт Диора, Whisper для голосовых
Заказчик: @baluevgeorge (Георгий Балуев)

## INTEGRATION WITH NOTIFICATION SERVICE
services/notification/ — Firebase FCM + Bull queue
Endpoint: POST /notifications/broadcast — send to all tokens
Token storage: cinesync.users collection (fcmTokens field)
```

## WHEN TO USE THIS AGENT
- Настроить новый тип уведомлений
- Изменить формат tg-notify.sh сообщений
- Отладить бота (401, 403 errors)
- Создать новые outreach скрипты

## СКИЛЛЫ
- telegram-integration → Telethon, MCP tools, tg-notify.sh
- telegram-bot-group   → группы, уведомления
