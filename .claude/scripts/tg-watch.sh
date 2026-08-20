#!/usr/bin/env bash
# tg-watch.sh — TezCode Telegram фоновый монитор
#
# Использование:
#   bash tg-watch.sh start        Запустить фоновый мониторинг
#   bash tg-watch.sh stop         Остановить мониторинг
#   bash tg-watch.sh status       Проверить статус
#   bash tg-watch.sh history [N]  Показать историю за N дней (default: 3)
#   bash tg-watch.sh report       Отчёт за текущую сессию
#
# Вызывается из SessionStart и Stop hooks автоматически.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV="$HOME/.tg_autobot_venv"
AUTOBOT="$SCRIPT_DIR/tg_autobot.py"
PID_FILE="$HOME/.tg_watch.pid"
CONFIG_FILE="$HOME/.config/tg_autobot/config.env"

PYTHON="$VENV/bin/python"

# ── Проверка установки ────────────────────────────────────────────────────────
_check_ready() {
  if [[ ! -f "$PYTHON" ]]; then
    echo "⚠️  tg_autobot не установлен. Запусти: bash .claude/scripts/tg-setup.sh"
    return 1
  fi
  if [[ ! -f "$CONFIG_FILE" ]]; then
    echo "⚠️  Конфиг не найден: $CONFIG_FILE"
    echo "    Запусти: bash .claude/scripts/tg-setup.sh"
    return 1
  fi
  if grep -q "YOUR_API_ID" "$CONFIG_FILE" 2>/dev/null; then
    echo "⚠️  Конфиг не заполнен. Заполни: $CONFIG_FILE"
    return 1
  fi
  return 0
}

# ── start ─────────────────────────────────────────────────────────────────────
cmd_start() {
  _check_ready || return 0  # Graceful — не крашить hook

  if [[ -f "$PID_FILE" ]]; then
    OLD_PID=$(cat "$PID_FILE")
    if kill -0 "$OLD_PID" 2>/dev/null; then
      echo "ℹ️  tg-watch уже запущен (PID $OLD_PID)"
      return 0
    fi
    rm -f "$PID_FILE"
  fi

  nohup "$PYTHON" "$AUTOBOT" --watch > "$HOME/tg_watch.log" 2>&1 &
  echo $! > "$PID_FILE"
  echo "🚀 tg-watch запущен (PID $(cat "$PID_FILE")) — мониторинг tezCode"
}

# ── stop ──────────────────────────────────────────────────────────────────────
cmd_stop() {
  if [[ ! -f "$PID_FILE" ]]; then
    return 0
  fi
  PID=$(cat "$PID_FILE")
  if kill -0 "$PID" 2>/dev/null; then
    kill "$PID" 2>/dev/null || true
    echo "⏹  tg-watch остановлен (PID $PID)"
  fi
  rm -f "$PID_FILE"
}

# ── status ────────────────────────────────────────────────────────────────────
cmd_status() {
  if [[ ! -f "$PID_FILE" ]]; then
    echo "⏹  tg-watch не запущен"
    return 0
  fi
  PID=$(cat "$PID_FILE")
  if kill -0 "$PID" 2>/dev/null; then
    echo "✅ tg-watch работает (PID $PID)"
    LOG_LINES=$(wc -l < "$HOME/tg_session.log" 2>/dev/null || echo 0)
    echo "   Сообщений за сессию: $LOG_LINES"
  else
    echo "⏹  tg-watch не работает (устаревший PID $PID)"
    rm -f "$PID_FILE"
  fi
}

# ── history ───────────────────────────────────────────────────────────────────
cmd_history() {
  DAYS="${1:-3}"
  _check_ready || { echo "⚠️  Запусти tg-setup.sh для настройки"; return 0; }
  "$PYTHON" "$AUTOBOT" --history "$DAYS"
}

# ── report ────────────────────────────────────────────────────────────────────
cmd_report() {
  _check_ready || return 0
  "$PYTHON" "$AUTOBOT" --session-report
}

# ── dispatch ──────────────────────────────────────────────────────────────────
CMD="${1:-status}"
shift || true

case "$CMD" in
  start)   cmd_start ;;
  stop)    cmd_stop ;;
  status)  cmd_status ;;
  history) cmd_history "${1:-3}" ;;
  report)  cmd_report ;;
  *)
    echo "Использование: tg-watch.sh {start|stop|status|history [N]|report}"
    exit 1
    ;;
esac
