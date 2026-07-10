#!/usr/bin/env bash
# Notification hook — срабатывает когда Claude хочет уведомить пользователя
# (фоновый агент завершён, долгая задача готова, нужен input)
# stdin: JSON {"message":"...","session_id":"..."}

INPUT=$(cat)
MSG=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('message','')[:200])" 2>/dev/null)
TITLE=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('title','Claude Code'))" 2>/dev/null)

[ -z "$MSG" ] && exit 0

# ── macOS native notification ────────────────────────────────────────────────
osascript -e "display notification \"$MSG\" with title \"$TITLE\" sound name \"Ping\"" 2>/dev/null &

# ── Telegram notification (если бот настроен) ────────────────────────────────
BOT_TOKEN="${CLAUDE_TG_BOT_TOKEN:-}"
CHAT_ID="${CLAUDE_TG_CHAT_ID:-6299152655}"

if [ -n "$BOT_TOKEN" ] && [ -n "$CHAT_ID" ]; then
  TEXT="🤖 *Claude Code*%0A$MSG"
  curl -s -X POST "https://api.telegram.org/bot$BOT_TOKEN/sendMessage" \
    -d "chat_id=$CHAT_ID&text=$TEXT&parse_mode=Markdown" \
    > /dev/null 2>&1 &
fi

exit 0
