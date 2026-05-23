#!/usr/bin/env bash
# SessionStart hook — читает vault и выдаёт Клоду память + TezCode Telegram
# VAULT_DEVELOPER=Saidazim|Emirhan (из ~/.zshrc каждого разработчика)

set -uo pipefail

VAULT="${OBSIDIAN_VAULT:-/c/Users/User/OneDrive/Рабочий стол/weWatch-obsidian}"
DEV="${VAULT_DEVELOPER:-Saidazim}"
DEV_LOWER=$(echo "$DEV" | tr '[:upper:]' '[:lower:]')
DATE=$(date '+%Y-%m-%d')
NOW=$(date '+%Y-%m-%d %H:%M')
WEEK=$(date '+%Y-W%V')

[[ ! -d "$VAULT" ]] && exit 0

# ── Pull vault из git ──────────────────────────────────────────────
[[ -d "$VAULT/.git" ]] && git -C "$VAULT" pull -q --rebase origin main 2>/dev/null || true

# ── Daily note ─────────────────────────────────────────────────────
mkdir -p "$VAULT/DAILY/$DEV"
DAILY="$VAULT/DAILY/$DEV/$DATE.md"
if [[ ! -f "$DAILY" ]]; then
  cat > "$DAILY" << HEREDOC
---
date: $DATE
developer: $DEV
---

# 📅 $DATE — $DEV

## Sessions
## Decisions
## Bugs
## Ideas
## Fixes
## TODOs
HEREDOC
fi
# Дубликат oldini olish
if ! grep -qF "Session started: $NOW" "$DAILY" 2>/dev/null; then
  echo -e "\n### 🟢 Session started: $NOW" >> "$DAILY"
fi

# ── Weekly note ────────────────────────────────────────────────────
mkdir -p "$VAULT/WEEKLY/$DEV"
WEEKLY="$VAULT/WEEKLY/$DEV/$WEEK.md"
if [[ ! -f "$WEEKLY" ]]; then
  cat > "$WEEKLY" << HEREDOC
---
week: $WEEK
developer: $DEV
---

# 📅 Week $WEEK — $DEV

## 🎯 Goals
- [ ]

## ✅ Completed

## 🚧 Blockers

## Sessions
HEREDOC
fi
# Дубликат oldini olish — agar oxirgi qator shu vaqt bo'lsa, qayta yozmaslik
if ! grep -qF "- $NOW" "$WEEKLY" 2>/dev/null; then
  echo "- $NOW" >> "$WEEKLY"
fi

# ════════════════════════════════════════════════════════════════════
# OUTPUT TO CLAUDE — контекст памяти
# ════════════════════════════════════════════════════════════════════

# ════════════════════════════════════════════════════════════════════
# IN-PROGRESS — ПОКАЗЫВАЕТСЯ ПЕРВЫМ (незавершённые задачи)
# ════════════════════════════════════════════════════════════════════
IN_PROGRESS="$VAULT/AI_CONTEXT/in-progress-${DEV_LOWER}.md"
if [[ -f "$IN_PROGRESS" ]]; then
  IP_STATUS=$(grep "^status:" "$IN_PROGRESS" 2>/dev/null | head -1 | awk '{print $2}' || echo "clear")
  IP_UPDATED=$(grep "^updated:" "$IN_PROGRESS" 2>/dev/null | head -1 | awk '{print $2}' || echo "")
  if [[ "$IP_STATUS" == "active" ]]; then
    echo "════════════════════════════════════════════════"
    echo "⚠️⚠️⚠️  НЕЗАВЕРШЁННАЯ РАБОТА — ЧИТАЙ ПЕРВЫМ! ⚠️⚠️⚠️"
    echo "════════════════════════════════════════════════"
    echo "Обновлено: $IP_UPDATED"
    echo ""
    grep -v "^---" "$IN_PROGRESS" | grep -v "^updated:" | grep -v "^developer:" | grep -v "^status:" | head -50
    echo ""
    echo "════════════════════════════════════════════════"
    echo "❓ ДЕЙСТВИЕ: Продолжить незавершённое или начать новое?"
    echo "════════════════════════════════════════════════"
    echo ""
  fi
fi

echo "════════════════════════════════════════════════"
echo "🧠 OBSIDIAN VAULT — ПАМЯТЬ КЛОДА"
echo "════════════════════════════════════════════════"

# ── Профиль разработчика ───────────────────────────────────────────
HOWTO="$VAULT/AI_CONTEXT/how-${DEV_LOWER}-works.md"
if [[ -f "$HOWTO" ]]; then
  echo ""
  echo "━━━ 👤 ПРОФИЛЬ: КАК РАБОТАТЬ С $(echo $DEV | tr '[:lower:]' '[:upper:]') ━━━"
  tail -n +5 "$HOWTO"
fi

# ── Ошибки которые нельзя повторять ───────────────────────────────
LESSONS="$VAULT/AI_CONTEXT/lessons-learned.md"
if [[ -f "$LESSONS" ]] && [[ $(wc -l < "$LESSONS") -gt 6 ]]; then
  echo ""
  echo "━━━ ❌ НЕЛЬЗЯ ПОВТОРЯТЬ ━━━"
  tail -n +5 "$LESSONS"
fi

# ── CONSTRAINTS — anti-hallucination (ПЕРВЫМ из контента) ────────
CONSTRAINTS_FILE="$VAULT/PROJECTS/weWatch/CONSTRAINTS.md"
if [[ -f "$CONSTRAINTS_FILE" ]]; then
  echo ""
  echo "━━━ 🚫 CONSTRAINTS — ЗАПРЕТЫ (читать обязательно) ━━━"
  grep "^❌\|^АБСОЛЮТНЫЕ\|^## АБСОЛЮТНЫЕ" "$CONSTRAINTS_FILE" 2>/dev/null | head -15
  echo ""
  echo "  Полный файл: PROJECTS/weWatch/CONSTRAINTS.md"
fi

# ── LAST_SESSION — где остановились ──────────────────────────────
LAST_SESSION_FILE="$VAULT/PROJECTS/weWatch/LAST_SESSION.md"
if [[ -f "$LAST_SESSION_FILE" ]]; then
  echo ""
  echo "━━━ 🔄 LAST SESSION — ГДЕ ОСТАНОВИЛИСЬ ━━━"
  # Показать ключевые секции
  awk '/^## Что делали/{p=1} /^## Что завершили/{p=1} /^## Где остановились/{p=1} /^## Следующий шаг/{p=1} /^## Открытые вопросы/{p=1} p && /^---/{p=0; next} p' "$LAST_SESSION_FILE" 2>/dev/null | head -40
fi

# ── weWatch контекст (architecture) ──────────────────────────────
BRAIN="$VAULT/PROJECTS/weWatch/_context.md"
if [[ -f "$BRAIN" ]]; then
  echo ""
  echo "━━━ 🎬 weWatch — АРХИТЕКТУРА ━━━"
  tail -n +5 "$BRAIN"
fi

# ── Handoff — git state from last session ────────────────────────
HANDOFF="$VAULT/AI_CONTEXT/handoff-${DEV_LOWER}.md"
if [[ -f "$HANDOFF" ]] && [[ $(wc -l < "$HANDOFF") -gt 8 ]]; then
  echo ""
  echo "━━━ 📊 GIT STATE (прошлая сессия) ━━━"
  tail -n +5 "$HANDOFF"
fi

# ── TezCode Telegram — live history read ─────────────────────────
echo ""

VENV="$HOME/.tg_autobot_venv"
AUTOBOT="$(dirname "${BASH_SOURCE[0]}")/tg_autobot.py"
CONFIG_FILE="$HOME/.config/tg_autobot/config.env"

if [[ -f "$VENV/bin/python" ]] && [[ -f "$CONFIG_FILE" ]] && ! grep -q "YOUR_API_ID" "$CONFIG_FILE" 2>/dev/null; then
  # Запускаем фоновый мониторинг (если не запущен)
  bash "$(dirname "${BASH_SOURCE[0]}")/tg-watch.sh" start 2>/dev/null || true

  # Читаем историю за 3 дня (timeout 20s — не блокируем сессию)
  TG_OUT=$(timeout 20 "$VENV/bin/python" "$AUTOBOT" --history 3 2>/dev/null || echo "")
  if [[ -n "$TG_OUT" ]]; then
    echo "$TG_OUT"
  else
    # Fallback: читаем tg_messages.log напрямую
    TG_LOG="$HOME/tg_messages.log"
    TODAY=$(date '+%Y-%m-%d')
    YESTERDAY=$(date -v-1d '+%Y-%m-%d' 2>/dev/null || date -d 'yesterday' '+%Y-%m-%d' 2>/dev/null || echo "")
    echo "━━━ 💬 TEZCODE — TELEGRAM (последние сообщения) ━━━"
    if [[ -f "$TG_LOG" ]]; then
      MSGS=$(grep -E "^\[($TODAY|$YESTERDAY)" "$TG_LOG" 2>/dev/null | grep "TEZCODE" | tail -20 || true)
      if [[ -n "$MSGS" ]]; then
        echo "$MSGS"
      else
        echo "(нет сообщений за последние 2 дня)"
      fi
    else
      echo "(tg_messages.log не найден — мониторинг запущен в фоне)"
    fi
  fi
else
  # Fallback: читаем tg_messages.log если есть
  TG_LOG="$HOME/tg_messages.log"
  TODAY=$(date '+%Y-%m-%d')
  YESTERDAY=$(date -v-1d '+%Y-%m-%d' 2>/dev/null || date -d 'yesterday' '+%Y-%m-%d' 2>/dev/null || echo "")

  echo "━━━ 💬 TEZCODE — TELEGRAM (кэш) ━━━"
  if [[ -f "$TG_LOG" ]]; then
    GROUP=$(grep -E "^\[($TODAY|$YESTERDAY)" "$TG_LOG" 2>/dev/null | grep "TEZCODE" || true)
    if [[ -n "$GROUP" ]]; then
      echo "$GROUP" | tail -15
    else
      echo "⚠️  tg_messages.log есть, но нет сообщений за 24ч"
    fi
  else
    echo "⚠️  tg_autobot не настроен → запусти: bash .claude/scripts/tg-setup.sh"
  fi
fi

echo ""
echo "════════════════════════════════════════════════"

exit 0
