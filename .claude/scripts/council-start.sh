#!/bin/bash
# council-start.sh — запускает WeWatch Swarm Bot в фоне
# Usage: bash council-start.sh [start|stop|status|restart]

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LISTENER="$SCRIPT_DIR/bot_council_listener.py"
PID_FILE="/tmp/council_bot.pid"
LOG_FILE="/tmp/council_bot.log"

cmd="${1:-start}"

case "$cmd" in
  start)
    if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
      echo "✅ Council bot уже запущен (PID $(cat "$PID_FILE"))"
      exit 0
    fi
    echo "🚀 Запускаю WeWatch Swarm Bot..."
    nohup python3 -u "$LISTENER" >> "$LOG_FILE" 2>&1 &
    echo $! > "$PID_FILE"
    sleep 2
    if kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
      echo "✅ Запущен (PID $(cat "$PID_FILE"))"
      echo "📋 Логи: tail -f $LOG_FILE"
    else
      echo "❌ Не запустился. Логи:"
      tail -20 "$LOG_FILE"
    fi
    ;;

  stop)
    if [ -f "$PID_FILE" ]; then
      PID=$(cat "$PID_FILE")
      kill "$PID" 2>/dev/null && echo "🛑 Остановлен (PID $PID)" || echo "⚠️ Процесс не найден"
      rm -f "$PID_FILE"
    else
      echo "⚠️ Не запущен"
    fi
    ;;

  status)
    if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
      echo "✅ Работает (PID $(cat "$PID_FILE"))"
      echo "Последние логи:"
      tail -10 "$LOG_FILE"
    else
      echo "❌ Не запущен"
    fi
    ;;

  restart)
    bash "$0" stop
    sleep 1
    bash "$0" start
    ;;

  log)
    tail -50 "$LOG_FILE"
    ;;

  *)
    echo "Usage: $0 [start|stop|status|restart|log]"
    ;;
esac
