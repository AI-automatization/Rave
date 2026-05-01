#!/usr/bin/env bash
# Obsidian Note — записывает решения, баги, идеи в vault
#
# Usage:
#   obsidian-note.sh <type> <project> "<title>" "<body>" [executor]
#
# type:    decision | bug | idea | todo | fix | note
# project: weWatch | tezCode | general

set -euo pipefail

VAULT="${OBSIDIAN_VAULT:-$HOME/Documents/Obsidian Vault}"
TYPE="${1:-}"
PROJECT="${2:-weWatch}"
TITLE="${3:-}"
BODY="${4:-}"
EXECUTOR="${5:-Saidazim}"
NOW=$(date '+%Y-%m-%d %H:%M')
DATE=$(date '+%Y-%m-%d')
SLUG=$(echo "$TITLE" | tr '[:upper:]' '[:lower:]' | tr ' /' '--' | tr -cd '[:alnum:]-' | cut -c1-50)

[[ -z "$TYPE" || -z "$TITLE" ]] && { echo "Usage: obsidian-note.sh <type> <project> <title> <body>"; exit 1; }
[[ ! -d "$VAULT" ]] && { echo "⚠️  Vault not found: $VAULT"; exit 0; }

DAILY_FILE="$VAULT/DAILY/$DATE.md"
PROJECT_DIR="$VAULT/PROJECTS/$PROJECT"
mkdir -p "$PROJECT_DIR/decisions"

# Создаём daily note если нет
if [[ ! -f "$DAILY_FILE" ]]; then
  cat > "$DAILY_FILE" << HEREDOC
---
date: $DATE
developer: Saidazim
---

# 📅 $DATE

## Sessions
## Decisions
## Bugs
## Ideas
## Fixes
## TODOs
HEREDOC
fi

case "$TYPE" in

decision)
  FILE="$PROJECT_DIR/decisions/${DATE}-${SLUG}.md"
  cat > "$FILE" << HEREDOC
---
type: decision
project: $PROJECT
title: "$TITLE"
date: $DATE
executor: $EXECUTOR
---

# 🏛 $TITLE

**Project:** $PROJECT | **Date:** $NOW | **By:** $EXECUTOR

## Decision

$BODY

## Rationale

## Consequences
HEREDOC
  echo -e "\n### 🏛 [$PROJECT] $TITLE\n> $BODY\n> By: $EXECUTOR | [[decisions/${DATE}-${SLUG}]]" >> "$DAILY_FILE"
  echo "✅ decision → $PROJECT/decisions/${DATE}-${SLUG}.md"
  ;;

bug)
  echo -e "\n### 🐛 [$PROJECT] $TITLE\n> $BODY\n> Found: $NOW | By: $EXECUTOR" >> "$PROJECT_DIR/_bugs.md"
  echo -e "\n### 🐛 Bug [$PROJECT]: $TITLE\n> $BODY" >> "$DAILY_FILE"
  echo "✅ bug → $PROJECT/_bugs.md"
  ;;

idea)
  echo -e "\n### 💡 $TITLE\n> $BODY\n> Date: $NOW" >> "$PROJECT_DIR/_ideas.md"
  echo -e "\n### 💡 Idea [$PROJECT]: $TITLE\n> $BODY" >> "$DAILY_FILE"
  echo "✅ idea → $PROJECT/_ideas.md"
  ;;

todo)
  echo -e "\n- [ ] [$PROJECT] $TITLE — $BODY (by $EXECUTOR, $DATE)" >> "$DAILY_FILE"
  echo "✅ todo → daily $DATE"
  ;;

fix)
  echo -e "\n### ✅ [$PROJECT] $TITLE\n> $BODY\n> Fixed: $NOW | By: $EXECUTOR" >> "$DAILY_FILE"
  echo "✅ fix → daily $DATE"
  ;;

note)
  echo -e "\n### 📝 [$PROJECT] $TITLE\n> $BODY\n> $NOW" >> "$DAILY_FILE"
  echo "✅ note → daily $DATE"
  ;;

tezcode)
  # Специальный тип — важное сообщение из tezCode Telegram
  echo -e "\n### 💬 $TITLE\n> $BODY\n> $NOW" >> "$VAULT/PROJECTS/tezCode/_telegram.md"
  echo -e "\n### 💬 tezCode: $TITLE\n> $BODY" >> "$DAILY_FILE"
  echo "✅ tezcode msg → tezCode/_telegram.md"
  ;;

*)
  echo "Unknown type: $TYPE (decision|bug|idea|todo|fix|note|tezcode)"
  exit 1
  ;;
esac
