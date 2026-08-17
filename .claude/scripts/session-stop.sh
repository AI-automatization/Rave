#!/bin/bash
# session-stop.sh — Auto-runs on Claude session stop (Ctrl+C or normal exit)
# Saves: last session info + active zone context marker

VAULT="$HOME/Documents/weWatch-obsidian"
ACTIVE_ZONE_FILE="/tmp/claude-active-zone"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M')

# 1. Update LAST_SESSION.md timestamp
LAST_SESSION="$VAULT/PROJECTS/weWatch/LAST_SESSION.md"
if [ -f "$LAST_SESSION" ]; then
  # Update the "Завершена" date
  sed -i '' "s/\*\*Завершена:\*\* .*/\*\*Завершена:\*\* $TIMESTAMP/" "$LAST_SESSION" 2>/dev/null || true
fi

# 2. If active zone is set — add session end marker
if [ -f "$ACTIVE_ZONE_FILE" ]; then
  ZONE=$(cat "$ACTIVE_ZONE_FILE")
  ZONE_CONTEXT="$VAULT/ZONES/$ZONE/_context.md"
  if [ -f "$ZONE_CONTEXT" ]; then
    # Update the "updated" frontmatter date
    sed -i '' "s/^updated:.*/updated: $(date '+%Y-%m-%d')/" "$ZONE_CONTEXT" 2>/dev/null || true
    echo "" >> "$ZONE_CONTEXT"
    echo "<!-- session ended: $TIMESTAMP -->" >> "$ZONE_CONTEXT"
  fi
  rm -f "$ACTIVE_ZONE_FILE"
fi

# 3. Git: auto-commit changed zone files (silent)
cd /Users/saidazim/Desktop/Rave 2>/dev/null || exit 0
if git diff --quiet "$VAULT" 2>/dev/null; then
  : # no changes
else
  git add "$VAULT" 2>/dev/null
  git add CLAUDE.md 2>/dev/null
  git commit -m "chore: auto-save zone context [session-stop]" --no-verify 2>/dev/null || true
fi

# 4. Full vault update — handoff.md + LAST_SESSION.md + DAILY
bash "$(dirname "$0")/obsidian-session-stop.sh" 2>/dev/null || true
