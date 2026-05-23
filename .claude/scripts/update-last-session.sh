#!/usr/bin/env bash
# update-last-session.sh — обновляет LAST_SESSION.md в Obsidian vault
# Вызывается: вручную Claude в конце сессии + Stop hook автоматически
# Usage: bash update-last-session.sh [task_id] [what_was_done] [next_step]

set -uo pipefail

VAULT="${OBSIDIAN_VAULT:-$HOME/Documents/weWatch-obsidian}"
REPO="${REPO_PATH:-$HOME/Desktop/Rave}"
NOW=$(date '+%Y-%m-%d %H:%M')
TASK_ID="${1:-}"
WHAT_DONE="${2:-}"
NEXT_STEP="${3:-"Проверить docs/Tasks.md и выбрать следующую задачу"}"

TARGET="$VAULT/PROJECTS/weWatch/LAST_SESSION.md"
[[ ! -d "$VAULT" ]] && exit 0

# ── Собрать git info ───────────────────────────────────────────────
LAST_COMMIT=""
UNCOMMITTED=0
MODIFIED_FILES=""
LAST_5=""
if [[ -d "$REPO/.git" ]]; then
  LAST_COMMIT=$(git -C "$REPO" log --oneline -1 2>/dev/null || echo "")
  UNCOMMITTED=$(git -C "$REPO" status --porcelain 2>/dev/null | wc -l | tr -d ' ' || echo "0")
  MODIFIED_FILES=$(git -C "$REPO" diff --name-only HEAD 2>/dev/null | head -10 | sed 's/^/  - /' || echo "  (нет)")
  LAST_5=$(git -C "$REPO" log --oneline -5 2>/dev/null | sed 's/^/- /' || echo "")
fi

# ── Собрать задачи ────────────────────────────────────────────────
PENDING_TASKS=""
TASKS_FILE="$REPO/docs/Tasks.md"
if [[ -f "$TASKS_FILE" ]]; then
  PENDING_TASKS=$(grep "pending\[Saidazim\]" "$TASKS_FILE" 2>/dev/null | \
    grep "^###" | grep -v "✅" | sed 's/^### /- /' | head -5 || echo "  (нет)")
fi

# ── Записать LAST_SESSION.md ──────────────────────────────────────
cat > "$TARGET" << HEREDOC
---
type: last-session
project: weWatch
updated: $NOW
developer: Saidazim
---

# Последняя сессия — WeWatch

> Этот файл автоматически обновляется в конце каждой сессии.
> Читать при старте: понять где остановились и что делать дальше.

---

## Последняя сессия

**Дата:** $NOW
**Последний коммит:** \`$LAST_COMMIT\`
**Незакоммиченных файлов:** $UNCOMMITTED

---

## Что делали

${WHAT_DONE:-Информация не сохранена — Claude должен обновить вручную}

---

## Завершённая задача

${TASK_ID:-"(не указано)"}

---

## Изменённые файлы

$MODIFIED_FILES

---

## Последние 5 коммитов

$LAST_5

---

## Где остановились / Следующий шаг

$NEXT_STEP

---

## Pending задачи Saidazim

$PENDING_TASKS

---

## Открытые вопросы

(Claude должен добавить вручную в конце сессии)

---

*Обновлено: $NOW автоматически через update-last-session.sh*
HEREDOC

echo "[memory] LAST_SESSION.md updated: $NOW"
exit 0
