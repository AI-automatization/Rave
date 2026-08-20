#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Terminal Context Flush — ручной / cron запуск
#
# Читает буфер ~/.terminal_context_buffer и пишет в Obsidian DAILY.
# Никакого AI — только bash + awk/sed.
#
# Запуск:
#   bash terminal-context-flush.sh             — flush сегодня
#   bash terminal-context-flush.sh --report    — показать что в буфере
#   bash terminal-context-flush.sh --git       — только git активность
#   bash terminal-context-flush.sh --errors    — только ошибки
#   bash terminal-context-flush.sh --clear     — очистить буфер
#
# Cron (каждые 10 мин):
#   */10 * * * * /Users/muhammad/Desktop/Rave/.claude/scripts/terminal-context-flush.sh >> /tmp/tc-flush.log 2>&1
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

BUFFER="$HOME/.terminal_context_buffer"
VAULT="${OBSIDIAN_VAULT:-$HOME/Documents/weWatch-obsidian}"
DEV="${VAULT_DEVELOPER:-Saidazim}"
NOW="$(date '+%Y-%m-%d %H:%M')"
DATE="$(date '+%Y-%m-%d')"
mkdir -p "$VAULT/DAILY/$DEV"
DAILY="$VAULT/DAILY/$DEV/${DATE}.md"

# ── Аргументы ────────────────────────────────────────────────────────────────
MODE="flush"
[[ "${1:-}" == "--report" ]] && MODE="report"
[[ "${1:-}" == "--git" ]]    && MODE="git"
[[ "${1:-}" == "--errors" ]] && MODE="errors"
[[ "${1:-}" == "--clear" ]]  && MODE="clear"
[[ "${1:-}" == "--status" ]] && MODE="status"

# ── Status ───────────────────────────────────────────────────────────────────
if [[ "$MODE" == "status" ]]; then
    if [[ -f "$BUFFER" ]]; then
        local_count="$(wc -l < "$BUFFER" | tr -d ' ')"
        echo "Buffer: $local_count команд в очереди"
        echo "Vault:  $VAULT"
        echo "Daily:  $DAILY"
        if [[ -f "$DAILY" ]]; then
            echo "Daily:  ✅ существует"
        else
            echo "Daily:  ⚠️  не создан"
        fi
    else
        echo "Buffer: не существует"
    fi
    exit 0
fi

# ── Clear ────────────────────────────────────────────────────────────────────
if [[ "$MODE" == "clear" ]]; then
    : > "$BUFFER"
    echo "🗑  Buffer очищен"
    exit 0
fi

# ── Report / Git / Errors — показать без записи ───────────────────────────────
if [[ "$MODE" == "report" ]]; then
    echo "=== Terminal Buffer ($(wc -l < "$BUFFER" | tr -d ' ') записей) ==="
    cat "$BUFFER"
    exit 0
fi

if [[ "$MODE" == "git" ]]; then
    echo "=== Git команды ==="
    grep '|git ' "$BUFFER" 2>/dev/null || echo "(нет git команд)"
    exit 0
fi

if [[ "$MODE" == "errors" ]]; then
    echo "=== Ошибки ==="
    grep '|ERR:' "$BUFFER" 2>/dev/null || echo "(нет ошибок)"
    exit 0
fi

# ── Flush ─────────────────────────────────────────────────────────────────────

# Проверяем что есть что писать
if [[ ! -f "$BUFFER" || ! -s "$BUFFER" ]]; then
    echo "✓ Буфер пустой — нечего записывать"
    exit 0
fi

if [[ ! -d "$VAULT" ]]; then
    echo "⚠️  Vault не найден: $VAULT"
    exit 1
fi

# Создаём DAILY если нет
mkdir -p "$VAULT/DAILY/$DEV"
if [[ ! -f "$DAILY" ]]; then
    cat > "$DAILY" << HEREDOC
---
date: $DATE
developer: $DEV
---

# 📅 $DATE — $DEV

## Sessions
## Terminal
## Decisions
## Bugs
## Ideas
## Fixes
## TODOs
HEREDOC
    echo "📅 Создан daily note: $DAILY"
fi

# ─────────────────────────────────────────────────────────────────────────────
# Парсим буфер и строим Markdown
# Формат буфера: TS|CWD|CMD|EXIT
# ─────────────────────────────────────────────────────────────────────────────

TOTAL=0
ERRORS=0
GIT_COMMITS=0
GIT_PUSHES=0
FIRST_TS=""
LAST_TS=""
TABLE_ROWS=""
GIT_SECTION=""
ERROR_SECTION=""

while IFS='|' read -r ts cwd cmd exit_code; do
    [[ -z "$ts" || -z "$cmd" ]] && continue

    (( TOTAL++ )) || true

    # Первый и последний timestamp
    [[ -z "$FIRST_TS" ]] && FIRST_TS="$ts"
    LAST_TS="$ts"

    # ── Иконка статуса ────────────────────────────────────────────────────────
    STATUS_ICON="✅"
    STATUS_NOTE=""
    if [[ "$exit_code" == ERR:* ]]; then
        STATUS_ICON="❌"
        STATUS_NOTE=" (${exit_code})"
        (( ERRORS++ )) || true
    elif [[ "$exit_code" == "?" ]]; then
        STATUS_ICON="⏳"
    fi

    # ── Иконка команды ────────────────────────────────────────────────────────
    CMD_ICON="▸"
    case "$cmd" in
        "git commit"*)
            CMD_ICON="💾"
            (( GIT_COMMITS++ )) || true
            # Сохраняем commit message отдельно
            msg="$(echo "$cmd" | grep -oP '(?<=-m ")[^"]+' 2>/dev/null || echo "")"
            [[ -n "$msg" ]] && GIT_SECTION+="  - \`${ts}\` 💾 \`${msg}\`\n"
            ;;
        "git push"*)
            CMD_ICON="🚀"
            (( GIT_PUSHES++ )) || true
            GIT_SECTION+="  - \`${ts}\` 🚀 push → \`${cwd}\`\n"
            ;;
        "git pull"*|"git fetch"*) CMD_ICON="⬇️" ;;
        "git merge"*|"git rebase"*) CMD_ICON="🔀" ;;
        "git checkout"*|"git switch"*)
            CMD_ICON="🌿"
            ;;
        "git "*) CMD_ICON="📦" ;;
        "npm run dev"*|"npx expo start"*) CMD_ICON="🟢" ;;
        "npm run build"*|"npx expo build"*) CMD_ICON="🔨" ;;
        "npm install"*|"npm i "*|"yarn install"*) CMD_ICON="📥" ;;
        "npm run test"*|"npx jest"*|"maestro test"*) CMD_ICON="🧪" ;;
        "docker compose up"*|"docker-compose up"*) CMD_ICON="🐳" ;;
        "docker compose down"*|"docker-compose down"*) CMD_ICON="⛔" ;;
        "docker "*) CMD_ICON="🐳" ;;
        "ssh "*|"scp "*) CMD_ICON="🔌" ;;
        "kill "*|"pkill "*|"killall "*) CMD_ICON="💀" ;;
        "rm -rf "*) CMD_ICON="🗑" ;;
    esac

    # Ошибки — сохраняем отдельно для секции ошибок
    if [[ "$exit_code" == ERR:* ]]; then
        ERROR_SECTION+="  - \`${ts}\` \`${cwd}\` ❌ \`${cmd}\` → **${exit_code}**\n"
    fi

    # Обрезаем длинные команды
    CMD_SHORT="${cmd:0:72}"
    [[ ${#cmd} -gt 72 ]] && CMD_SHORT="${CMD_SHORT}…"

    TABLE_ROWS+="| \`${ts}\` | \`${cwd}\` | ${CMD_ICON} \`${CMD_SHORT}\` | ${STATUS_ICON}${STATUS_NOTE} |\n"

done < "$BUFFER"

# Если ничего не распарсилось
if [[ $TOTAL -eq 0 ]]; then
    echo "✓ Буфер не содержит валидных записей"
    exit 0
fi

# ─────────────────────────────────────────────────────────────────────────────
# Собираем Markdown блок
# ─────────────────────────────────────────────────────────────────────────────

BLOCK=""
BLOCK+="---\n"
BLOCK+="\n### 🖥 Terminal — \`${FIRST_TS}\` → \`${LAST_TS}\` · ${TOTAL} команд · ${NOW}\n\n"

# Сводка
SUMMARY="> "
SUMMARY+="📊 **${TOTAL}** команд"
[[ $GIT_COMMITS -gt 0 ]] && SUMMARY+=" · 💾 **${GIT_COMMITS}** commits"
[[ $GIT_PUSHES -gt 0 ]]  && SUMMARY+=" · 🚀 **${GIT_PUSHES}** pushes"
[[ $ERRORS -gt 0 ]]      && SUMMARY+=" · ❌ **${ERRORS}** errors"
BLOCK+="${SUMMARY}\n\n"

# Git сводка (если есть)
if [[ -n "$GIT_SECTION" ]]; then
    BLOCK+="**Git:**\n"
    BLOCK+="${GIT_SECTION}\n"
fi

# Ошибки (если есть)
if [[ -n "$ERROR_SECTION" ]]; then
    BLOCK+="**⚠️ Ошибки:**\n"
    BLOCK+="${ERROR_SECTION}\n"
fi

# Полная таблица команд
BLOCK+="<details><summary>Все команды</summary>\n\n"
BLOCK+="| Время | Директория | Команда | Статус |\n"
BLOCK+="|-------|-----------|---------|--------|\n"
BLOCK+="${TABLE_ROWS}"
BLOCK+="\n</details>\n"

# ── Пишем в DAILY ─────────────────────────────────────────────────────────────
echo -e "$BLOCK" >> "$DAILY"

# ── Очищаем буфер ─────────────────────────────────────────────────────────────
: > "$BUFFER"

echo "✅ Записано ${TOTAL} команд в $DAILY"
[[ $GIT_COMMITS -gt 0 ]] && echo "   💾 ${GIT_COMMITS} git commits"
[[ $GIT_PUSHES -gt 0 ]]  && echo "   🚀 ${GIT_PUSHES} git pushes"
[[ $ERRORS -gt 0 ]]      && echo "   ❌ ${ERRORS} ошибок"
