#!/usr/bin/env bash
# obsidian-checkpoint.sh — сохраняет прогресс задачи в in-progress.md
#
# Claude вызывает ОДНОЙ строкой. Скрипт сам собирает контекст из git + Tasks.md.
#
# Usage:
#   obsidian-checkpoint.sh <task-id> <progress%> "<done>" "<next>"
#   obsidian-checkpoint.sh clear "<task-id завершён>"
#
# Примеры:
#   obsidian-checkpoint.sh T-S067 50 "Sidebar done" "Header.tsx — breadcrumb"
#   obsidian-checkpoint.sh T-S067 0 "" "lucide-react install, then Sidebar.tsx"
#   obsidian-checkpoint.sh clear "T-S067"

set -euo pipefail

VAULT="${OBSIDIAN_VAULT:-$HOME/Documents/weWatch-obsidian}"
DEV="${VAULT_DEVELOPER:-Saidazim}"
DEV_LOWER=$(echo "$DEV" | tr '[:upper:]' '[:lower:]')
REPO="${REPO_PATH:-$HOME/Desktop/Rave}"
NOW=$(date '+%Y-%m-%d %H:%M')
DATE=$(date '+%Y-%m-%d')

[[ ! -d "$VAULT" ]] && exit 0

IN_PROGRESS="$VAULT/AI_CONTEXT/in-progress-${DEV_LOWER}.md"
DAILY="$VAULT/DAILY/$DEV/$DATE.md"

TASK_ID="${1:-}"
PROGRESS="${2:-0}"
DONE="${3:-}"
NEXT="${4:-}"

# ── CLEAR mode ───────────────────────────────────────────────────────
if [[ "$TASK_ID" == "clear" ]]; then
  LABEL="${PROGRESS:-завершено}"
  cat > "$IN_PROGRESS" << HEREDOC
---
updated: $NOW
developer: $DEV
status: clear
---

# ✅ Нет незавершённых задач

Последнее завершено: $LABEL ($NOW)
HEREDOC
  [[ -f "$DAILY" ]] && echo -e "\n### ✅ Завершено: $LABEL — $NOW" >> "$DAILY"
  echo "✅ in-progress cleared"
  exit 0
fi

[[ -z "$TASK_ID" ]] && { echo "Usage: obsidian-checkpoint.sh <task-id> <progress%> <done> <next>"; exit 1; }

# ── Авто-контекст из git ─────────────────────────────────────────────
MODIFIED_FILES=""
if [[ -d "$REPO/.git" ]]; then
  MODIFIED_FILES=$(git -C "$REPO" diff --name-only HEAD 2>/dev/null | head -10 | sed 's/^/  - /' || true)
  STAGED=$(git -C "$REPO" diff --cached --name-only 2>/dev/null | head -5 | sed 's/^/  - /' || true)
  [[ -n "$STAGED" ]] && MODIFIED_FILES="$MODIFIED_FILES"$'\n'"$STAGED"
fi

# ── Авто-контекст из Tasks.md ────────────────────────────────────────
TASK_TITLE=""
TASKS_FILE="$REPO/docs/Tasks.md"
if [[ -f "$TASKS_FILE" ]]; then
  TASK_TITLE=$(grep -m1 "### $TASK_ID" "$TASKS_FILE" 2>/dev/null | sed "s/### $TASK_ID | //" | sed 's/ | pending.*//' || true)
fi

# ── Записать in-progress.md ──────────────────────────────────────────
cat > "$IN_PROGRESS" << HEREDOC
---
updated: $NOW
developer: $DEV
status: active
---

# 🚧 В ПРОЦЕССЕ — $DEV

**Таск:** $TASK_ID${TASK_TITLE:+ — $TASK_TITLE}
**Прогресс:** ${PROGRESS}%
**Обновлено:** $NOW

## Сделано ✅
${DONE:-—}

## Следующий шаг ▶️
${NEXT:-—}

## Изменённые файлы (git)
${MODIFIED_FILES:-  —}
HEREDOC

# ── Маркер в daily note ──────────────────────────────────────────────
if [[ -f "$DAILY" ]]; then
  echo -e "\n### 🚧 Checkpoint $TASK_ID (${PROGRESS}%) — $NOW\n> Next: $NEXT" >> "$DAILY"
fi

echo "✅ checkpoint saved → in-progress.md ($TASK_ID ${PROGRESS}%)"
