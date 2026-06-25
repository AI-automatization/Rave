# Telegram Integration — Claude Agent

## Arxitektura taqqoslash

### MCP Listener (bizda)
- **Tip:** Bot API (bot token), long polling
- **Integratsiya:** MCP tool result → Claude context
- **Config:** `settings.json` mcpServers.telegram
- **Xavfsizlik:** ALLOWED_CHAT_IDS whitelist, QUEUE_PATH persistent
- **Kamchilik:** Guruh invite kerak, bot-to-bot ko'rolmaydi, media limitlar

### Pyrogram Userbot (@shuhratov_HH arxitekturasi)
- **Tip:** MTProto user account, asyncio event-driven
- **Integratsiya:** inbox/ fayl relay → Claude → outbox/ → send
- **Kuchli tomoni:** Barcha guruhlar, bot+bot xabarlar, history
- **Kamchilik:** User session ban xavfi, session saqlash murakkab

## Hybrid Pattern (tavsiya)
```
Bot API (MCP)          → public channels, user messages, commands
Pyrogram userbot       → monitoring, bot-to-bot, guruh analytics
```

## Bizning setup
```json
// settings.json
"telegram": {
  "command": "npx",
  "args": ["-y", "@benjapieres/mcp-telegram-listener"],
  "env": {
    "TELEGRAM_BOT_TOKEN": "...",
    "ALLOWED_CHAT_IDS": "6299152655,-1002640882371,-1003874059304",
    "QUEUE_PATH": "~/.claude/telegram-queue.json"
  }
}
```

## Source
Council discussion 2026-05-26 — @JafarbekUlugbekov + @notification_weWatch_bot
