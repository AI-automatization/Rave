#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Emirhan Setup — одноразовая настройка Obsidian + terminal logger
#
# Запуск (один раз на новом Mac):
#   bash /path/to/Rave/.claude/scripts/emirhan-setup.sh
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

VAULT_REPO="https://github.com/forger6969/weWatch-obsidian.git"
VAULT_DIR="$HOME/Documents/Obsidian Vault"
RAVE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ZSHRC="$HOME/.zshrc"

echo "════════════════════════════════════════"
echo "  weWatch Obsidian Setup — Emirhan"
echo "════════════════════════════════════════"

# ── 1. Клонировать vault ──────────────────────────────────────────
if [[ -d "$VAULT_DIR/.git" ]]; then
  echo "✅ Vault уже существует: $VAULT_DIR"
  git -C "$VAULT_DIR" pull -q --rebase origin main 2>/dev/null || true
  echo "   ↳ pulled latest"
else
  echo "📥 Клонирую vault..."
  mkdir -p "$(dirname "$VAULT_DIR")"
  git clone "$VAULT_REPO" "$VAULT_DIR"
  echo "✅ Vault клонирован: $VAULT_DIR"
fi

# ── 2. Добавить переменные в ~/.zshrc ────────────────────────────
MARKER="# ── weWatch Obsidian (Emirhan) ──"

if grep -q "$MARKER" "$ZSHRC" 2>/dev/null; then
  echo "✅ ~/.zshrc уже настроен"
else
  cat >> "$ZSHRC" << BLOCK

$MARKER
export VAULT_DEVELOPER=Emirhan
export OBSIDIAN_VAULT="\$HOME/Documents/Obsidian Vault"
source "$RAVE_DIR/.claude/scripts/terminal-context-hook.sh"
BLOCK
  echo "✅ ~/.zshrc обновлён"
fi

# ── 3. Создать DAILY/Emirhan папку ───────────────────────────────
mkdir -p "$VAULT_DIR/DAILY/Emirhan"
echo "✅ DAILY/Emirhan/ создана"

# ── 4. Применить сейчас (для текущей сессии) ─────────────────────
export VAULT_DEVELOPER=Emirhan
export OBSIDIAN_VAULT="$VAULT_DIR"

echo ""
echo "════════════════════════════════════════"
echo "✅ Готово!"
echo ""
echo "Следующие шаги:"
echo "  1. Открой Obsidian → Add vault → '$VAULT_DIR'"
echo "  2. Перезапусти терминал (или: source ~/.zshrc)"
echo "  3. Запусти Claude Code из apps/mobile/ — всё работает автоматически"
echo ""
echo "Твои daily notes: $VAULT_DIR/DAILY/Emirhan/"
echo "Общие доки: $VAULT_DIR/PROJECTS/weWatch/"
echo "════════════════════════════════════════"
