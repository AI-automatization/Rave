#!/usr/bin/env bash
# PostToolUse hook — вызывается после каждого Edit или Write
# Автоматически обновляет in-progress.md со списком изменённых файлов
# Stdin: JSON {"tool_name":"Edit","tool_input":{"file_path":"..."},...}

VAULT="${OBSIDIAN_VAULT:-$HOME/Documents/weWatch-obsidian}"
DEV="${VAULT_DEVELOPER:-Saidazim}"
DEV_LOWER=$(echo "$DEV" | tr '[:upper:]' '[:lower:]')
# obsidian-checkpoint.sh writes status:active to the per-developer file, not the
# generic in-progress.md (which has been stuck at status:clear since 2026-05-09) —
# this hook was checking the wrong file, so auto-logging never fired even during
# a properly checkpointed task.
IN_PROGRESS="$VAULT/AI_CONTEXT/in-progress-${DEV_LOWER}.md"
NOW=$(date '+%H:%M')

[[ ! -f "$IN_PROGRESS" ]] && exit 0

# Читаем file_path из JSON stdin
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)
[[ -z "$FILE_PATH" ]] && exit 0

# Только если задача активна
STATUS=$(grep "^status:" "$IN_PROGRESS" 2>/dev/null | awk '{print $2}' || echo "clear")
[[ "$STATUS" != "active" ]] && exit 0

# Добавляем файл в список если ещё не там
if ! grep -qF "$FILE_PATH" "$IN_PROGRESS" 2>/dev/null; then
  # Вставляем под секцией "Изменённые файлы" или в конец
  if grep -q "## Изменённые файлы" "$IN_PROGRESS" 2>/dev/null; then
    echo "  - $FILE_PATH ($NOW)" >> "$IN_PROGRESS"
  else
    echo -e "\n## Изменённые файлы (auto)\n  - $FILE_PATH ($NOW)" >> "$IN_PROGRESS"
  fi
fi

exit 0
