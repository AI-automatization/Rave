#!/usr/bin/env bash
# CineSync — Save a note to Obsidian vault during Claude sessions
#
# Usage:
#   obsidian-note.sh decision  <service> "<title>" "<body>" [executor]
#   obsidian-note.sh bug       <service> "<title>" "<body>" [executor]
#   obsidian-note.sh idea      <service> "<title>" "<body>"
#   obsidian-note.sh todo      <service> "<title>" "<body>" [executor]
#   obsidian-note.sh fix       <service> "<title>" "<body>" [executor]
#
# service: auth | user | content | watch-party | battle | notification | admin | mobile | shared | general
# type:    decision | bug | idea | todo | fix

set -euo pipefail

VAULT="${CINESYNC_VAULT:-$HOME/Documents/CineSync-Vault}"
TYPE="${1:-}"
SERVICE="${2:-general}"
TITLE="${3:-}"
BODY="${4:-}"
EXECUTOR="${5:-}"
NOW=$(date '+%Y-%m-%d %H:%M')
DATE=$(date '+%Y-%m-%d')
SLUG=$(echo "$TITLE" | tr '[:upper:]' '[:lower:]' | tr ' /' '--' | tr -cd '[:alnum:]-' | cut -c1-50)

[[ -z "$TYPE" || -z "$TITLE" ]] && { echo "Usage: obsidian-note.sh <type> <service> <title> <body>"; exit 1; }
[[ ! -d "$VAULT" ]] && { echo "⚠️  Vault not found: $VAULT — run obsidian-setup.sh first"; exit 0; }

DAILY_FILE="$VAULT/DAILY/$DATE.md"

# ── Ensure daily note exists ───────────────────────────────────────
if [[ ! -f "$DAILY_FILE" ]]; then
  DEV=$(git config user.name 2>/dev/null || echo "Unknown")
  cat > "$DAILY_FILE" << HEREDOC
---
date: $DATE
developer: $DEV
type: daily
---

# 📅 $DATE

## Sessions
<!-- auto-logged -->

## Decisions
<!-- auto-logged -->

## Bugs Found
<!-- auto-logged -->

## Ideas
<!-- auto-logged -->

## TODOs
<!-- auto-logged -->
HEREDOC
fi

# ── Route by type ──────────────────────────────────────────────────
case "$TYPE" in

decision)
  mkdir -p "$VAULT/DECISIONS"
  # Also in service folder if specific service
  if [[ "$SERVICE" != "general" ]]; then
    TARGET_DIR="$VAULT/SERVICES/$SERVICE/decisions"
    [[ "$SERVICE" == "mobile" ]] && TARGET_DIR="$VAULT/MOBILE/decisions"
    [[ "$SERVICE" == "shared" ]] && TARGET_DIR="$VAULT/SHARED/decisions"
    mkdir -p "$TARGET_DIR"
  else
    TARGET_DIR="$VAULT/DECISIONS"
  fi

  FILE="$TARGET_DIR/${DATE}-${SLUG}.md"
  cat > "$FILE" << HEREDOC
---
type: decision
service: $SERVICE
title: "$TITLE"
decision_type: architecture
date: $DATE
executor: $EXECUTOR
---

# 🏛 $TITLE

**Service:** $SERVICE
**Date:** $NOW
**By:** ${EXECUTOR:-Claude}

## Decision

$BODY

## Rationale
<!-- why this approach -->

## Consequences
<!-- what changes -->
HEREDOC

  # Append to daily
  echo -e "\n### 🏛 Decision: $TITLE\n- **Service:** $SERVICE\n- $BODY\n- [[${FILE#$VAULT/}]]" >> "$DAILY_FILE"
  echo "✅ decision → ${FILE#$VAULT/}"
  ;;

bug)
  mkdir -p "$VAULT/BUGS"
  FILE="$VAULT/BUGS/${DATE}-${SLUG}.md"
  cat > "$FILE" << HEREDOC
---
type: bug
service: $SERVICE
title: "$TITLE"
status: open
severity: medium
date: $DATE
executor: $EXECUTOR
---

# 🐛 $TITLE

**Service:** $SERVICE
**Found:** $NOW
**By:** ${EXECUTOR:-Claude}
**Status:** open

## Description

$BODY

## Root Cause
<!-- fill in -->

## Fix
<!-- fill in when resolved -->
HEREDOC

  echo -e "\n### 🐛 Bug: $TITLE\n- **Service:** $SERVICE\n- $BODY\n- [[BUGS/${DATE}-${SLUG}]]" >> "$DAILY_FILE"
  echo "✅ bug → BUGS/${DATE}-${SLUG}.md"
  ;;

idea)
  mkdir -p "$VAULT/DECISIONS"
  FILE="$VAULT/DECISIONS/${DATE}-idea-${SLUG}.md"
  cat > "$FILE" << HEREDOC
---
type: idea
service: $SERVICE
title: "$TITLE"
date: $DATE
---

# 💡 $TITLE

**Service:** $SERVICE
**Date:** $NOW

## Idea

$BODY

## Feasibility
<!-- notes -->
HEREDOC

  echo -e "\n### 💡 Idea: $TITLE\n- **Service:** $SERVICE\n- $BODY" >> "$DAILY_FILE"
  echo "✅ idea → DECISIONS/${DATE}-idea-${SLUG}.md"
  ;;

todo)
  echo -e "\n### ☑️ TODO: $TITLE\n- **Service:** $SERVICE\n- **Who:** ${EXECUTOR:-?}\n- $BODY" >> "$DAILY_FILE"
  echo "✅ todo → $DATE daily note"
  ;;

fix)
  echo -e "\n### ✅ Fix: $TITLE\n- **Service:** $SERVICE\n- **By:** ${EXECUTOR:-Claude}\n- $BODY" >> "$DAILY_FILE"
  echo "✅ fix → $DATE daily note"
  ;;

*)
  echo "Unknown type: $TYPE (use: decision|bug|idea|todo|fix)"
  exit 1
  ;;
esac
