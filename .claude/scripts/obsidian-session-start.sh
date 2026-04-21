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

# ── OUTPUT HANDOFF TO CLAUDE ───────────────────────────────────────
# Всё что выводится в stdout — Claude видит как system-reminder
# Это главный механизм памяти между сессиями

HANDOFF="$VAULT/AI_CONTEXT/handoff.md"
if [[ -f "$HANDOFF" ]]; then
  echo "════════════════════════════════════════════"
  echo "📂 OBSIDIAN MEMORY — прочитай перед началом"
  echo "════════════════════════════════════════════"
  echo ""
  # Выводим handoff без frontmatter
  tail -n +6 "$HANDOFF"
  echo ""
  echo "════════════════════════════════════════════"
fi

exit 0
