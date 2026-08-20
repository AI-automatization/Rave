#!/bin/bash
# start-claude.sh — запуск Claude с автоперезапуском
# Использование: bash .claude/scripts/start-claude.sh
# Вместо прямого: claude CLAUDE.md --channels plugin:telegram@claude-plugins-official --dangerously-skip-permissions

cd ~/Desktop/Rave || exit 1

while true; do
    claude CLAUDE.md --channels plugin:telegram@claude-plugins-official --dangerously-skip-permissions
    EXIT_CODE=$?

    # Код 0 = пользователь вышел сам (Ctrl+D / /exit) → не перезапускать
    if [ $EXIT_CODE -eq 0 ]; then
        echo "✅ Сессия завершена."
        break
    fi

    echo ""
    echo "🔄 Перезапуск через 2 сек... (Ctrl+C чтобы выйти совсем)"
    sleep 2

    # Уведомить в TG что сессия перезапустилась (токен — из env, не хардкодить)
    WEWATCH_TOKEN="${CLAUDE_TG_BOT_TOKEN:-}"
    CHAT_ID="${CLAUDE_TG_CHAT_ID:-6299152655}"
    if [ -n "$WEWATCH_TOKEN" ]; then
        curl -s -X POST "https://api.telegram.org/bot${WEWATCH_TOKEN}/sendMessage" \
            -d "chat_id=${CHAT_ID}" \
            -d "text=🔄 WeWatch агент перезапущен — готов к работе" \
            > /dev/null 2>&1
    fi
done
