#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Emirhan Setup — одноразовая настройка Obsidian + Claude hooks
#
# Запуск (один раз на новом Mac):
#   bash /path/to/Rave/.claude/scripts/emirhan-setup.sh
#
# Требования до запуска:
#   1. git установлен
#   2. Доступ к https://github.com/forger6969/weWatch-obsidian
#      (Saidazim должен добавить тебя как collaborator — настройки репо → Collaborators)
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

VAULT_REPO="https://github.com/forger6969/weWatch-obsidian.git"
VAULT_DIR="$HOME/Documents/weWatch-obsidian"
RAVE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ZSHRC="$HOME/.zshrc"

echo "════════════════════════════════════════"
echo "  weWatch Obsidian Setup — Emirhan"
echo "════════════════════════════════════════"
echo ""

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

# ── 2. Создать DAILY/Emirhan и WEEKLY/Emirhan ─────────────────────
mkdir -p "$VAULT_DIR/DAILY/Emirhan"
mkdir -p "$VAULT_DIR/WEEKLY/Emirhan"
echo "✅ DAILY/Emirhan/ и WEEKLY/Emirhan/ созданы"

# ── 3. Создать AI_CONTEXT/how-emirhan-works.md (профиль для Клода) ─
HOW_FILE="$VAULT_DIR/AI_CONTEXT/how-emirhan-works.md"
if [[ ! -f "$HOW_FILE" ]]; then
  mkdir -p "$VAULT_DIR/AI_CONTEXT"
  cat > "$HOW_FILE" << 'PROFILE'
---
type: profile
developer: Emirhan
updated: 2026-05-11
---

# 👤 Как работать с Emirhan

## Кто он
- **GitHub:** emirhan-handle (обнови)
- **Роль:** Mobile TL — React Native + Expo
- **Зона:** apps/mobile/ (только эта папка)

## Технический стек
- **Сильное:** React Native, Expo, TypeScript, Zustand, TanStack Query
- **Стек Rave mobile:** Expo SDK 54, expo-av, expo-notifications, Socket.io client

## Стиль работы с Claude
- **Язык:** только русский
- **Зона:** apps/mobile/ — не трогать services/*, apps/admin-ui/
- **shared/*** — обязательно уведомить Saidazim перед изменением

## Правила зоны
- Screens: 300 строк MAX
- Components: 150 строк MAX
- Не использовать console.log — только if (__DEV__)
PROFILE
  echo "✅ how-emirhan-works.md создан"
else
  echo "✅ how-emirhan-works.md уже существует"
fi

# ── 4. Добавить переменные в ~/.zshrc ────────────────────────────
MARKER="# ── weWatch Obsidian (Emirhan) ──"

if grep -q "$MARKER" "$ZSHRC" 2>/dev/null; then
  echo "✅ ~/.zshrc уже настроен"
else
  cat >> "$ZSHRC" << BLOCK

$MARKER
export VAULT_DEVELOPER=Emirhan
export OBSIDIAN_VAULT="\$HOME/Documents/weWatch-obsidian"
export REPO_PATH="\$HOME/Desktop/Rave"
source "$RAVE_DIR/.claude/scripts/terminal-context-hook.sh"
BLOCK
  echo "✅ ~/.zshrc обновлён (VAULT_DEVELOPER, OBSIDIAN_VAULT, REPO_PATH)"
fi

# ── 5. Применить сейчас (для текущей сессии) ─────────────────────
export VAULT_DEVELOPER=Emirhan
export OBSIDIAN_VAULT="$VAULT_DIR"
export REPO_PATH="$RAVE_DIR"

# ── 6. Первый коммит Emirhan в vault ─────────────────────────────
if [[ -d "$VAULT_DIR/.git" ]]; then
  git -C "$VAULT_DIR" add -A 2>/dev/null || true
  git -C "$VAULT_DIR" diff --cached --quiet 2>/dev/null || \
    git -C "$VAULT_DIR" commit -q -m "vault: Emirhan setup $(date '+%Y-%m-%d')" 2>/dev/null || true
  git -C "$VAULT_DIR" push -q origin main 2>/dev/null || echo "⚠️  Push не удался — убедись что Saidazim добавил тебя как collaborator"
fi

echo ""
echo "════════════════════════════════════════"
echo "✅ Готово!"
echo ""
echo "Следующие шаги:"
echo "  1. Открой Obsidian → Add vault → '$VAULT_DIR'"
echo "     Plugins: Dataview · Homepage · Obsidian Git"
echo ""
echo "  2. Перезапусти терминал:"
echo "     source ~/.zshrc"
echo ""
echo "  3. Запускай Claude Code из папки Rave:"
echo "     cd $RAVE_DIR && claude"
echo ""
echo "Твои файлы (никогда не конфликтуют с Saidazim):"
echo "  Daily notes:  $VAULT_DIR/DAILY/Emirhan/"
echo "  Weekly notes: $VAULT_DIR/WEEKLY/Emirhan/"
echo "  In-progress:  $VAULT_DIR/AI_CONTEXT/in-progress-emirhan.md"
echo "  Handoff:      $VAULT_DIR/AI_CONTEXT/handoff-emirhan.md"
echo "════════════════════════════════════════"
