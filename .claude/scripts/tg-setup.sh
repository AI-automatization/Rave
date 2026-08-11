#!/usr/bin/env bash
# tg-setup.sh — One-time Telegram monitor setup
# 1. Creates venv + installs telethon
# 2. Creates config template
# 3. Runs first-time auth (interactive)
#
# Run once: bash .claude/scripts/tg-setup.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV="$HOME/.tg_autobot_venv"
CONFIG_DIR="$HOME/.config/tg_autobot"
CONFIG_FILE="$CONFIG_DIR/config.env"

echo "════════════════════════════════════════════════"
echo "🤖 tg_autobot setup — TezCode Telegram monitor"
echo "════════════════════════════════════════════════"
echo ""

# ── 1. Venv ────────────────────────────────────────────────────────────────────
if [[ ! -d "$VENV" ]]; then
  echo "📦 Создаю venv: $VENV"
  python3 -m venv "$VENV"
else
  echo "✅ venv уже есть: $VENV"
fi

echo "📥 Устанавливаю telethon..."
"$VENV/bin/pip" install -q --upgrade telethon

echo "✅ telethon установлен: $("$VENV/bin/python" -c 'import telethon; print(telethon.__version__)')"
echo ""

# ── 2. Config ─────────────────────────────────────────────────────────────────
mkdir -p "$CONFIG_DIR"
if [[ ! -f "$CONFIG_FILE" ]]; then
  cat > "$CONFIG_FILE" << 'EOF'
# tg_autobot config — НЕ коммитить в git!
# Получить API_ID и API_HASH: https://my.telegram.org → App configuration

TG_API_ID=YOUR_API_ID
TG_API_HASH=YOUR_API_HASH
TG_PHONE=+998901234567
TG_GROUP=tezCode
EOF
  echo "📝 Создан конфиг: $CONFIG_FILE"
  echo ""
  echo "⚠️  ЗАПОЛНИ КОНФИГ:"
  echo "   nano $CONFIG_FILE"
  echo ""
  echo "   TG_API_ID   — с https://my.telegram.org"
  echo "   TG_API_HASH — с https://my.telegram.org"
  echo "   TG_PHONE    — твой номер (+998...)"
  echo "   TG_GROUP    — имя или ID группы tezCode"
  echo ""
  echo "Потом запусти заново: bash .claude/scripts/tg-setup.sh"
  exit 0
fi

# Проверяем что конфиг заполнен
if grep -q "YOUR_API_ID" "$CONFIG_FILE"; then
  echo "⚠️  Конфиг не заполнен! Открываю..."
  echo "   $CONFIG_FILE"
  echo ""
  echo "   TG_API_ID и TG_API_HASH: https://my.telegram.org → App configuration"
  exit 1
fi

echo "✅ Конфиг: $CONFIG_FILE"
echo ""

# ── 3. First auth ──────────────────────────────────────────────────────────────
echo "🔐 Первый вход в Telegram (одноразово)..."
echo "   Введи код из SMS/Telegram"
echo ""

# Run auth via a small snippet
"$VENV/bin/python" << PYEOF
import sys
sys.path.insert(0, '$SCRIPT_DIR')
import asyncio
from pathlib import Path
from telethon import TelegramClient

config_file = Path("$CONFIG_FILE")
cfg = {}
for line in config_file.read_text().splitlines():
    line = line.strip()
    if line and not line.startswith('#') and '=' in line:
        k, _, v = line.partition('=')
        cfg[k.strip()] = v.strip()

async def auth():
    client = TelegramClient(
        str(Path.home() / '.tg_autobot_session'),
        int(cfg['TG_API_ID']),
        cfg['TG_API_HASH']
    )
    await client.start(phone=cfg['TG_PHONE'])
    me = await client.get_me()
    print(f"✅ Авторизован как: {me.first_name} (@{me.username})")
    await client.disconnect()

asyncio.run(auth())
PYEOF

echo ""
echo "════════════════════════════════════════════════"
echo "✅ Готово! Теперь можно:"
echo ""
echo "  Читать историю (3 дня):"
echo "    bash .claude/scripts/tg-watch.sh history"
echo ""
echo "  Запустить фоновый мониторинг:"
echo "    bash .claude/scripts/tg-watch.sh start"
echo ""
echo "  Остановить мониторинг:"
echo "    bash .claude/scripts/tg-watch.sh stop"
echo "════════════════════════════════════════════════"
