#!/usr/bin/env bash
# Stop hook — конец сессии: маркер в DAILY + flush терминала + vault commit

set -euo pipefail

VAULT="${OBSIDIAN_VAULT:-$HOME/Documents/Obsidian Vault}"
DEV="${VAULT_DEVELOPER:-Saidazim}"
DATE=$(date '+%Y-%m-%d')
NOW=$(date '+%Y-%m-%d %H:%M')

[[ ! -d "$VAULT" ]] && exit 0

mkdir -p "$VAULT/DAILY/$DEV"
DAILY="$VAULT/DAILY/$DEV/$DATE.md"

# ── Маркер конца сессии ───────────────────────────────────────────
[[ -f "$DAILY" ]] && echo -e "\n### 🔴 Session ended: $NOW" >> "$DAILY"

# ── Auto-snapshot: git state + pending tasks → handoff.md ────────────
HANDOFF="$VAULT/AI_CONTEXT/handoff.md"
REPO="${REPO_PATH:-$HOME/Desktop/Rave}"

LAST_COMMIT=""
UNCOMMITTED=0
LAST_5=""
PENDING_S=""
PENDING_E=""
MODIFIED=""
if [[ -d "$REPO/.git" ]]; then
  LAST_COMMIT=$(git -C "$REPO" log --oneline -1 2>/dev/null || echo "")
  UNCOMMITTED=$(git -C "$REPO" status --porcelain 2>/dev/null | wc -l | tr -d ' ' || echo "0")
  LAST_5=$(git -C "$REPO" log --oneline -5 2>/dev/null | sed 's/^/- /' || echo "")
  MODIFIED=$(git -C "$REPO" diff --name-only HEAD 2>/dev/null | head -8 | sed 's/^/  - /' || echo "")
fi

TASKS_FILE="$REPO/docs/Tasks.md"
if [[ -f "$TASKS_FILE" ]]; then
  PENDING_S=$(grep "pending\[Saidazim\]" "$TASKS_FILE" 2>/dev/null | grep "^###" | sed 's/^### /- /' | head -5 || true)
  PENDING_E=$(grep "pending\[Emirhan\]" "$TASKS_FILE" 2>/dev/null | grep "^###" | sed 's/^### /- /' | head -5 || true)
fi

cat > "$HANDOFF" << HEREDOC
---
type: handoff
updated: $NOW
---

# 🔄 Handoff — Прошлая сессия

**Завершена:** $NOW

## Последний коммит
$LAST_COMMIT

## Незакоммиченных файлов
$UNCOMMITTED

## Изменённые файлы
$MODIFIED

## Последние 5 коммитов
$LAST_5

## Pending задачи — Saidazim
${PENDING_S:-  нет}

## Pending задачи — Emirhan
${PENDING_E:-  нет}
HEREDOC

# ── Flush терминального буфера ────────────────────────────────────
BUFFER="$HOME/.terminal_context_buffer"
if [[ -f "$BUFFER" && -s "$BUFFER" ]]; then
  bash "$(dirname "${BASH_SOURCE[0]}")/terminal-context-flush.sh" 2>/dev/null || true
fi

# ── Коммит vault в git ────────────────────────────────────────────
if [[ -d "$VAULT/.git" ]]; then
  git -C "$VAULT" add -A 2>/dev/null || true
  git -C "$VAULT" diff --cached --quiet 2>/dev/null || \
    git -C "$VAULT" commit -q -m "vault: $DEV session stop $NOW" 2>/dev/null || true
  git -C "$VAULT" push -q origin main 2>/dev/null || true
fi

exit 0
