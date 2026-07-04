#!/bin/bash
# start-claude.sh — запуск Claude с автоперезапуском
# Использование: bash .claude/scripts/start-claude.sh
# Вместо прямого: claude CLAUDE.md --channels plugin:telegram@claude-plugins-official --dangerously-skip-permissions

cd ~/Desktop/Rave

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

    # Уведомить в TG что сессия перезапустилась
    WEWATCH_TOKEN="8734969603:AAF0FcbPp86XYgTkWf2Sveqqy8QOB_dh8P0"
    curl -s -X POST "https://api.telegram.org/bot${WEWATCH_TOKEN}/sendMessage" \
        -d "chat_id=6299152655" \
        -d "text=🔄 WeWatch агент перезапущен — готов к работе" \
        > /dev/null 2>&1
done
