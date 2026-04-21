#!/usr/bin/env bash
# CineSync — Claude Code SessionStart hook
# Runs automatically when a new Claude Code session begins

set -euo pipefail

VAULT="${CINESYNC_VAULT:-$HOME/Documents/CineSync-Vault}"
DATE=$(date '+%Y-%m-%d')
NOW=$(date '+%Y-%m-%d %H:%M')
WEEK=$(date '+%Y-W%V')

# Vault not set up — silently skip (don't block session)
[[ ! -d "$VAULT" ]] && exit 0

DAILY_FILE="$VAULT/DAILY/$DATE.md"
DEV=$(git config user.name 2>/dev/null || echo "Developer")

# ── Create daily note if missing ───────────────────────────────────
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
<!-- session end logged on Stop hook -->

## Decisions
<!-- auto-logged via obsidian-note.sh decision -->

## Bugs Found
<!-- auto-logged via obsidian-note.sh bug -->

## Ideas
<!-- auto-logged via obsidian-note.sh idea -->

## TODOs
<!-- auto-logged via obsidian-note.sh todo -->

## Fixes Applied
<!-- auto-logged via obsidian-note.sh fix -->
HEREDOC
else
  # Append session start to existing daily note
  echo -e "\n### 🟢 Session started: $NOW" >> "$DAILY_FILE"
fi

# ── Create weekly note if missing ─────────────────────────────────
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
- [ ]

## ✅ Completed
<!-- auto-updated -->

## 🚧 Blockers
<!-- fill in -->

## 📊 Sessions
<!-- auto-updated -->
HEREDOC
fi

echo "🔗 $NOW in session" >> "$WEEKLY_FILE"

# ── Sync tasks (if last sync > 30 min ago) ─────────────────────────
SYNC_LOCK="$VAULT/.last-sync"
SHOULD_SYNC=true
if [[ -f "$SYNC_LOCK" ]]; then
  LAST=$(cat "$SYNC_LOCK")
  NOW_EPOCH=$(date +%s)
  LAST_EPOCH=$(date -d "$LAST" +%s 2>/dev/null || date -j -f "%Y-%m-%d %H:%M" "$LAST" +%s 2>/dev/null || echo 0)
  DIFF=$(( NOW_EPOCH - LAST_EPOCH ))
  [[ $DIFF -lt 1800 ]] && SHOULD_SYNC=false
fi

if $SHOULD_SYNC; then
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  bash "$SCRIPT_DIR/obsidian-tasks-sync.sh" 2>/dev/null || true
  echo "$NOW" > "$SYNC_LOCK"
fi

exit 0
