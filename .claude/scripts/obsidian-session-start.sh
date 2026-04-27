#!/usr/bin/env bash
# CineSync — Claude Code SessionStart hook
# Runs automatically when a new Claude Code session begins
# OUTPUT is shown to Claude as system context — это и есть "память"

set -euo pipefail

VAULT="${CINESYNC_VAULT:-$HOME/Documents/CineSync-Vault}"
DATE=$(date '+%Y-%m-%d')
NOW=$(date '+%Y-%m-%d %H:%M')
WEEK=$(date '+%Y-W%V')

[[ ! -d "$VAULT" ]] && exit 0

# ── Pull latest vault from git (Emirhan's changes) ────────────────
if [[ -d "$VAULT/.git" ]]; then
  git -C "$VAULT" pull -q --rebase origin main 2>/dev/null || true
fi

DAILY_FILE="$VAULT/DAILY/$DATE.md"
DEV=$(git config user.name 2>/dev/null || echo "Developer")

# ── Create daily note ──────────────────────────────────────────────
if [[ ! -f "$DAILY_FILE" ]]; then
  cat > "$DAILY_FILE" << HEREDOC
---
date: $DATE
developer: $DEV
type: daily
---

# 📅 $DATE — $DEV

## Sessions

### 🟢 Session started: $NOW

## Decisions

## Bugs Found

## Fixes Applied

## TODOs
HEREDOC
else
  echo -e "\n### 🟢 Session started: $NOW" >> "$DAILY_FILE"
fi

# ── Create weekly note ─────────────────────────────────────────────
WEEKLY_FILE="$VAULT/WEEKLY/$WEEK.md"
if [[ ! -f "$WEEKLY_FILE" ]]; then
  mkdir -p "$VAULT/WEEKLY"
  cat > "$WEEKLY_FILE" << HEREDOC
---
week: $WEEK
developer: $DEV
type: weekly
---

# 📅 Week $WEEK

## 🎯 Goals This Week
- [ ]

## ✅ Completed

## 🚧 Blockers

## 📊 Sessions
HEREDOC
fi
echo "🔗 $NOW" >> "$WEEKLY_FILE"

# ── Sync tasks ─────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SYNC_LOCK="$VAULT/.last-sync"
SHOULD_SYNC=true
if [[ -f "$SYNC_LOCK" ]]; then
  LAST=$(cat "$SYNC_LOCK")
  NOW_EPOCH=$(date +%s)
  LAST_EPOCH=$(date -d "$LAST" +%s 2>/dev/null || echo 0)
  DIFF=$(( NOW_EPOCH - LAST_EPOCH ))
  [[ $DIFF -lt 1800 ]] && SHOULD_SYNC=false
fi
if $SHOULD_SYNC; then
  bash "$SCRIPT_DIR/obsidian-tasks-sync.sh" 2>/dev/null || true
  echo "$NOW" > "$SYNC_LOCK"
fi

# ── OUTPUT TO CLAUDE ──────────────────────────────────────────────
# Всё что в stdout — Claude видит как system-reminder
# Это главный механизм памяти между сессиями

BRAIN="$VAULT/AI_CONTEXT/project-brain.md"
LESSONS="$VAULT/AI_CONTEXT/lessons-learned.md"
HOWTO="$VAULT/AI_CONTEXT/how-saidazim-works.md"
HANDOFF="$VAULT/AI_CONTEXT/handoff.md"

echo "════════════════════════════════════════════"
echo "🧠 RAVE — ПОЛНАЯ ПАМЯТЬ КЛОДА"
echo "════════════════════════════════════════════"

echo ""
echo "━━━ 👤 КАК РАБОТАТЬ С SAIDAZIM ━━━"
if [[ -f "$HOWTO" ]]; then tail -n +6 "$HOWTO"; fi

echo ""
echo "━━━ ❌ ОШИБКИ КОТОРЫЕ НЕЛЬЗЯ ПОВТОРЯТЬ ━━━"
if [[ -f "$LESSONS" ]]; then tail -n +6 "$LESSONS"; fi

echo ""
echo "━━━ 🏗 ПРОЕКТ: АРХИТЕКТУРА И КОНТЕКСТ ━━━"
if [[ -f "$BRAIN" ]]; then tail -n +6 "$BRAIN"; fi

echo ""
echo "━━━ 🔄 СЕЙЧАС: СТАТУС И ЗАДАЧИ ━━━"
if [[ -f "$HANDOFF" ]]; then tail -n +6 "$HANDOFF"; fi

echo ""
echo "━━━ 💬 TEZCODE — ПОСЛЕДНИЕ СООБЩЕНИЯ ━━━"
TG_LOG="$HOME/tg_messages.log"
SINCE_EPOCH=$(date -d '24 hours ago' +%s 2>/dev/null || date -v-24H +%s 2>/dev/null || echo 0)

if [[ -f "$TG_LOG" ]]; then
  TODAY=$(date '+%Y-%m-%d')
  YESTERDAY=$(date -d 'yesterday' '+%Y-%m-%d' 2>/dev/null || date -v-1d '+%Y-%m-%d' 2>/dev/null || echo "")

  # Group messages — today + yesterday
  GROUP_MSGS=$(grep -E "^\[($TODAY|$YESTERDAY)" "$TG_LOG" | grep "\[group\] TEZCODE" 2>/dev/null || true)

  # Private messages from known tezCode members — today + yesterday
  TEZCODE_MEMBERS="Бекзод|Abubakir|Diyor|Sardor|Сардор|Akmal|Акмал"
  PRIVATE_MSGS=$(grep -E "^\[($TODAY|$YESTERDAY)" "$TG_LOG" | grep "\[private\]" | grep -E "$TEZCODE_MEMBERS" 2>/dev/null || true)

  if [[ -n "$GROUP_MSGS" ]]; then
    echo "📢 tezCode группа (сегодня/вчера):"
    echo "$GROUP_MSGS" | sed 's/\[group\] TEZCODE Team Managment | //'
  else
    echo "📢 tezCode группа: нет сообщений за последние 24ч"
  fi

  if [[ -n "$PRIVATE_MSGS" ]]; then
    echo ""
    echo "📩 Личные от участников tezCode:"
    echo "$PRIVATE_MSGS" | sed 's/\[private\] //'
  fi
else
  echo "⚠️  tg_messages.log не найден — запусти tg_autobot.py"
fi

echo ""
echo "════════════════════════════════════════════"

exit 0
