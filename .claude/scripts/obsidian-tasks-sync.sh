#!/usr/bin/env bash
# CineSync — Sync docs/Tasks.md and docs/Done.md → Obsidian vault
# Called automatically by session-start and session-stop hooks

set -euo pipefail

VAULT="${CINESYNC_VAULT:-$HOME/Documents/CineSync-Vault}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel 2>/dev/null || echo "")"
NOW=$(date '+%Y-%m-%d %H:%M')

[[ ! -d "$VAULT" ]] && exit 0
[[ -z "$PROJECT_ROOT" ]] && exit 0

TASKS_SRC="$PROJECT_ROOT/docs/Tasks.md"
DONE_SRC="$PROJECT_ROOT/docs/Done.md"

mkdir -p "$VAULT/TASKS"

# ── Sync active tasks ──────────────────────────────────────────────
if [[ -f "$TASKS_SRC" ]]; then
  {
    echo "---"
    echo "type: tasks-active"
    echo "synced: $NOW"
    echo "source: docs/Tasks.md"
    echo "---"
    echo ""
    echo "# 📋 Active Tasks"
    echo ""
    echo "> Auto-synced from \`docs/Tasks.md\` at $NOW"
    echo ""
    # Strip frontmatter-like headers and pass through content
    grep -v "^# Yangilangan\|^# 2 dasturchi" "$TASKS_SRC" | \
    grep -v "^# CineSync — OCHIQ" || true
  } > "$VAULT/TASKS/active.md"
fi

# ── Sync done tasks (last 50 entries) ─────────────────────────────
if [[ -f "$DONE_SRC" ]]; then
  {
    echo "---"
    echo "type: tasks-done"
    echo "synced: $NOW"
    echo "source: docs/Done.md"
    echo "---"
    echo ""
    echo "# ✅ Completed Tasks"
    echo ""
    echo "> Auto-synced from \`docs/Done.md\` at $NOW (last 50 entries)"
    echo ""
    # Take last 50 F-entries from Done.md
    grep -v "^# Yangilangan\|^# CineSync" "$DONE_SRC" | tail -300 || true
  } > "$VAULT/TASKS/done.md"
fi

echo "✅ Tasks synced → $VAULT/TASKS/ at $NOW"
