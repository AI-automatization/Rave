#!/usr/bin/env bash
# SessionStart hook — читает vault и выдаёт Клоду память + TezCode Telegram
# VAULT_DEVELOPER=Saidazim|Emirhan (из ~/.zshrc каждого разработчика)

set -euo pipefail

VAULT="${OBSIDIAN_VAULT:-$HOME/Documents/Obsidian Vault}"
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
echo -e "\n### 🟢 Session started: $NOW" >> "$DAILY"

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
echo "- $NOW" >> "$WEEKLY"

# ════════════════════════════════════════════════════════════════════
# OUTPUT TO CLAUDE — контекст памяти
# ════════════════════════════════════════════════════════════════════

# ════════════════════════════════════════════════════════════════════
# IN-PROGRESS — ПОКАЗЫВАЕТСЯ ПЕРВЫМ (незавершённые задачи)
# ════════════════════════════════════════════════════════════════════
IN_PROGRESS="$VAULT/AI_CONTEXT/in-progress.md"
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

# ── weWatch контекст ──────────────────────────────────────────────
BRAIN="$VAULT/PROJECTS/weWatch/_context.md"
if [[ -f "$BRAIN" ]]; then
  echo ""
  echo "━━━ 🎬 weWatch — АРХИТЕКТУРА ━━━"
  tail -n +5 "$BRAIN"
fi

# ── Handoff — что было в прошлой сессии ──────────────────────────
HANDOFF="$VAULT/AI_CONTEXT/handoff.md"
if [[ -f "$HANDOFF" ]] && [[ $(wc -l < "$HANDOFF") -gt 8 ]]; then
  echo ""
  echo "━━━ 🔄 ПРОШЛАЯ СЕССИЯ — HANDOFF ━━━"
  tail -n +5 "$HANDOFF"
fi

# ── TezCode Telegram ──────────────────────────────────────────────
echo ""
echo "━━━ 💬 TEZCODE — TELEGRAM (последние 24ч) ━━━"

TG_LOG="$HOME/tg_messages.log"
TODAY=$(date '+%Y-%m-%d')
YESTERDAY=$(date -v-1d '+%Y-%m-%d' 2>/dev/null || date -d 'yesterday' '+%Y-%m-%d' 2>/dev/null || echo "")

if [[ -f "$TG_LOG" ]]; then
  GROUP=$(grep -E "^\[($TODAY|$YESTERDAY)" "$TG_LOG" 2>/dev/null | grep "TEZCODE" || true)
  MEMBERS="Бекзод|Abubakir|Diyor|Sardor|Сардор|Akmal|Акмал"
  PRIVATE=$(grep -E "^\[($TODAY|$YESTERDAY)" "$TG_LOG" 2>/dev/null | grep "\[private\]" | grep -E "$MEMBERS" || true)

  if [[ -n "$GROUP" ]]; then
    echo "📢 Группа tezCode:"
    echo "$GROUP" | tail -20
  else
    echo "📢 Группа: нет сообщений за 24ч"
  fi

  if [[ -n "$PRIVATE" ]]; then
    echo ""
    echo "📩 Личные от участников:"
    echo "$PRIVATE" | tail -10
    TGFILE="$VAULT/PROJECTS/tezCode/_telegram.md"
    echo -e "\n### 📩 $NOW — Личные сообщения\n\`\`\`\n$PRIVATE\n\`\`\`" >> "$TGFILE" 2>/dev/null || true
  fi

  # Упоминания текущего разработчика
  MENTIONED=$(grep -E "^\[($TODAY|$YESTERDAY)" "$TG_LOG" 2>/dev/null | grep -iE "${DEV_LOWER}|backend|mobile|серверная|мобил" || true)
  if [[ -n "$MENTIONED" ]]; then
    echo ""
    echo "⚠️  УПОМИНАНИЯ (требуют внимания):"
    echo "$MENTIONED"
  fi
else
  echo "⚠️  tg_messages.log не найден — запусти tg_autobot.py на сервере"
fi

echo ""
echo "════════════════════════════════════════════════"

exit 0
