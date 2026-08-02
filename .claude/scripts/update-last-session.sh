#!/usr/bin/env bash
# update-last-session.sh — обновляет LAST_SESSION.md в Obsidian vault
# Вызывается: вручную Claude в конце сессии + Stop hook автоматически (с пустыми аргументами)
# Usage: bash update-last-session.sh [task_id] [what_was_done] [next_step] [open_questions]
#
# Пустой/отсутствующий аргумент НЕ затирает старое значение — подставляется то, что уже
# было записано в LAST_SESSION.md на момент вызова. Это специально: Stop-хук стреляет
# автоматически на каждый Stop-эвент (не только при закрытии CLI) и раньше вызывал этот
# скрипт с "" "" "", что уничтожало любой ручной апдейт нарратива за секунды. Теперь
# автовызов лишь освежает git-данные (коммит/файлы/pending), а нарратив живёт, пока его
# явно не перезапишут новым текстом.

set -uo pipefail

VAULT="${OBSIDIAN_VAULT:-$HOME/Documents/weWatch-obsidian}"
REPO="${REPO_PATH:-$HOME/Desktop/Rave}"
NOW=$(date '+%Y-%m-%d %H:%M')

TARGET="$VAULT/PROJECTS/weWatch/LAST_SESSION.md"
[[ ! -d "$VAULT" ]] && exit 0

# ── Достать то, что уже записано в файле (до перезаписи) ──────────
extract_section() {
  local header="$1"
  [[ -f "$TARGET" ]] || return 0
  awk -v h="## $header" '
    $0 == h { found=1; next }
    found && $0 == "---" { exit }
    found { print }
  ' "$TARGET" | sed -e '1{/^$/d;}' -e '${/^$/d;}'
}
OLD_TASK_ID=$(extract_section "Завершённая задача")
OLD_WHAT_DONE=$(extract_section "Что делали")
OLD_NEXT_STEP=$(extract_section "Где остановились / Следующий шаг")
OLD_OPEN_Q=$(extract_section "Открытые вопросы")

TASK_ID="${1:-$OLD_TASK_ID}"
TASK_ID="${TASK_ID:-"(не указано)"}"

WHAT_DONE="${2:-$OLD_WHAT_DONE}"
WHAT_DONE="${WHAT_DONE:-"Информация не сохранена — Claude должен обновить вручную"}"

NEXT_STEP="${3:-$OLD_NEXT_STEP}"
NEXT_STEP="${NEXT_STEP:-"Проверить docs/Tasks.md и выбрать следующую задачу"}"

OPEN_QUESTIONS="${4:-$OLD_OPEN_Q}"
OPEN_QUESTIONS="${OPEN_QUESTIONS:-"(Claude должен добавить вручную в конце сессии)"}"

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

$WHAT_DONE

---

## Завершённая задача

$TASK_ID

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

$OPEN_QUESTIONS

---

*Обновлено: $NOW автоматически через update-last-session.sh*
HEREDOC

echo "[memory] LAST_SESSION.md updated: $NOW"
exit 0
