#!/bin/bash
# restart.sh — перезапуск Claude изнутри сессии
# Claude вызывает этот скрипт → убивает себя → start-claude.sh перезапускает

echo "🔄 Перезапуск сессии..."
# PPID = PID процесса Claude (родитель bash-скрипта)
kill -TERM $PPID
