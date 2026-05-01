#!/usr/bin/env zsh
# ─────────────────────────────────────────────────────────────────────────────
# Terminal Context Logger — zsh hook
#
# Что делает:
#   Перехватывает каждую команду в терминале и пишет в буфер-файл.
#   Умный фильтр — сохраняет только полезные команды (git, npm, docker, ошибки).
#   Не требует AI, не тратит токены.
#
# Установка — добавить в ~/.zshrc одну строку:
#   source /Users/muhammad/Desktop/Rave/.claude/scripts/terminal-context-hook.sh
#
# Буфер: ~/.terminal_context_buffer  (формат: TIMESTAMP|CWD_SHORT|CMD|EXIT)
# Flush: запускается автоматически каждые 15 мин (или вручную: tc-flush)
# ─────────────────────────────────────────────────────────────────────────────

# ── Конфиг ───────────────────────────────────────────────────────────────────
_TC_BUFFER="$HOME/.terminal_context_buffer"
_TC_PROJECT_ROOT="/Users/muhammad/Desktop/Rave"
_TC_VAULT="${OBSIDIAN_VAULT:-$HOME/Documents/Obsidian Vault}"
_TC_FLUSH_INTERVAL=900   # секунд (15 мин)
_TC_LAST_FLUSH_FILE="$HOME/.terminal_context_last_flush"

# ── Команды которые НЕ логируем (шум) ────────────────────────────────────────
_tc_is_noise() {
    local cmd="$1"
    # Trim leading spaces
    cmd="${cmd#"${cmd%%[! ]*}"}"

    case "$cmd" in
        # Навигация и просмотр
        ls|ls\ *|ll|ll\ *|l\ *|pwd|cd|cd\ *) return 0 ;;
        cat\ *|head\ *|tail\ *|less\ *|more\ *) return 0 ;;
        # Поиск — только чтение
        grep\ *|find\ *|which\ *|where\ *|man\ *|help\ *) return 0 ;;
        # Системное
        clear|reset|history|echo\ *|printf\ *) return 0 ;;
        # Редакторы (открытие файлов — не команды)
        code\ *|vim\ *|nano\ *|open\ *) return 0 ;;
        # Пустые
        ""|" ") return 0 ;;
    esac

    # Длинные pipe-цепочки с grep/awk/sed — читающие операции
    [[ "$cmd" =~ ^\|?grep ]] && return 0

    return 1  # не шум — логировать
}

# ── Сокращаем путь до readable формата ───────────────────────────────────────
_tc_short_path() {
    local full="$1"
    # Убираем project root prefix
    local short="${full#$_TC_PROJECT_ROOT/}"
    # Если совпадает с root — показываем "."
    [[ "$short" == "$full" ]] && short="${full/$HOME/~}"
    [[ "$short" == "$_TC_PROJECT_ROOT" ]] && short="[root]"
    echo "$short"
}

# ── preexec — вызывается ДО выполнения команды ───────────────────────────────
_tc_preexec() {
    local cmd="$1"
    local cwd="$(pwd)"
    local ts="$(date '+%H:%M:%S')"

    # Фильтруем шум
    _tc_is_noise "$cmd" && return

    # Определяем — в проекте или нет
    local in_project=0
    [[ "$cwd" == "$_TC_PROJECT_ROOT"* ]] && in_project=1

    # Команды которые логируем ВСЕГДА (даже вне проекта)
    local always_log=0
    case "$cmd" in
        git\ *|npm\ *|npx\ *|yarn\ *|bun\ *)  always_log=1 ;;
        docker\ *|docker-compose\ *|"docker compose"\ *)  always_log=1 ;;
        node\ *|ts-node\ *|tsx\ *)  always_log=1 ;;
        maestro\ *|eas\ *|expo\ *)  always_log=1 ;;
        ssh\ *|scp\ *|rsync\ *)  always_log=1 ;;
        kill\ *|pkill\ *|killall\ *)  always_log=1 ;;
    esac

    # Пропускаем если не в проекте и не "всегда логировать"
    [[ $in_project -eq 0 && $always_log -eq 0 ]] && return

    local short_cwd
    short_cwd="$(_tc_short_path "$cwd")"

    # Записываем в буфер: TS|CWD|CMD
    # EXIT будет добавлен в precmd
    echo "${ts}|${short_cwd}|${cmd}|?" >> "$_TC_BUFFER"

    # Сохраняем данные для precmd
    _tc_last_cmd="$cmd"
    _tc_last_ts="$ts"
}

# ── precmd — вызывается ПОСЛЕ выполнения команды ─────────────────────────────
_tc_precmd() {
    local exit_code=$?

    # Если была команда — дописываем exit code в последнюю строку буфера
    if [[ -n "$_tc_last_cmd" && -f "$_TC_BUFFER" ]]; then
        # Заменяем "?" на реальный exit code в последней строке
        if [[ $exit_code -eq 0 ]]; then
            # Последняя строка — заменяем |? на |0
            local last_line
            last_line="$(tail -1 "$_TC_BUFFER")"
            if [[ "$last_line" == *"|?" ]]; then
                # Убираем последнюю строку и добавляем с exit code
                local tmp_file="${_TC_BUFFER}.tmp"
                head -n -1 "$_TC_BUFFER" > "$tmp_file" 2>/dev/null && mv "$tmp_file" "$_TC_BUFFER"
                echo "${last_line%|?}|0" >> "$_TC_BUFFER"
            fi
        else
            # Ошибка — заменяем |? на |ERR:N
            local last_line
            last_line="$(tail -1 "$_TC_BUFFER")"
            if [[ "$last_line" == *"|?" ]]; then
                local tmp_file="${_TC_BUFFER}.tmp"
                head -n -1 "$_TC_BUFFER" > "$tmp_file" 2>/dev/null && mv "$tmp_file" "$_TC_BUFFER"
                echo "${last_line%|?}|ERR:${exit_code}" >> "$_TC_BUFFER"
            fi
        fi
    fi

    unset _tc_last_cmd _tc_last_ts

    # ── Auto-flush каждые N минут ─────────────────────────────────────────────
    local now_ts
    now_ts="$(date +%s)"
    local last_flush=0
    [[ -f "$_TC_LAST_FLUSH_FILE" ]] && last_flush="$(cat "$_TC_LAST_FLUSH_FILE" 2>/dev/null || echo 0)"
    local elapsed=$(( now_ts - last_flush ))

    if [[ $elapsed -ge $_TC_FLUSH_INTERVAL ]]; then
        # Flush в фоне, чтобы не тормозить терминал
        _tc_flush_to_daily &>/dev/null &
        disown
        echo "$now_ts" > "$_TC_LAST_FLUSH_FILE"
    fi
}

# ── Flush — записывает буфер в Obsidian DAILY ─────────────────────────────────
_tc_flush_to_daily() {
    [[ ! -f "$_TC_BUFFER" ]] && return
    [[ ! -s "$_TC_BUFFER" ]] && return  # пустой файл

    local vault="$_TC_VAULT"
    [[ ! -d "$vault" ]] && return

    local date_str
    date_str="$(date '+%Y-%m-%d')"
    local time_str
    time_str="$(date '+%H:%M')"
    local daily="$vault/DAILY/${date_str}.md"

    # Создаём daily если нет
    if [[ ! -f "$daily" ]]; then
        mkdir -p "$vault/DAILY"
        cat > "$daily" << DAILY_HEREDOC
---
date: $date_str
developer: Saidazim
---

# 📅 $date_str

## Sessions
## Terminal
## Decisions
## Bugs
## Ideas
## Fixes
## TODOs
DAILY_HEREDOC
    fi

    # ── Форматируем буфер в Markdown таблицу ──────────────────────────────────
    local count
    count="$(wc -l < "$_TC_BUFFER" | tr -d ' ')"
    [[ $count -eq 0 ]] && return

    # Читаем буфер и строим таблицу
    local table_rows=""
    local error_count=0
    local git_count=0
    local first_ts="" last_ts=""

    while IFS='|' read -r ts cwd cmd exit; do
        [[ -z "$ts" ]] && continue

        # Иконка статуса
        local icon="✅"
        [[ "$exit" == ERR:* ]] && icon="❌" && (( error_count++ ))
        [[ "$exit" == "?" ]] && icon="⏳"

        # Иконка команды
        local cmd_icon="▸"
        case "$cmd" in
            git\ commit*) cmd_icon="💾" && (( git_count++ )) ;;
            git\ push*)   cmd_icon="🚀" && (( git_count++ )) ;;
            git\ pull*)   cmd_icon="⬇️" ;;
            git\ merge*)  cmd_icon="🔀" ;;
            git\ *)       cmd_icon="📦" ;;
            npm\ run\ dev*|node\ *) cmd_icon="🟢" ;;
            npm\ run\ build*) cmd_icon="🔨" ;;
            npm\ install*|npm\ i\ *) cmd_icon="📥" ;;
            docker\ *|"docker compose"*) cmd_icon="🐳" ;;
            maestro\ *) cmd_icon="🧪" ;;
        esac

        # Обрезаем длинные команды
        local cmd_short="${cmd:0:70}"
        [[ ${#cmd} -gt 70 ]] && cmd_short="${cmd_short}…"

        table_rows+="| ${ts} | \`${cwd}\` | ${cmd_icon} \`${cmd_short}\` | ${icon} |\n"

        # Запоминаем первый и последний ts
        [[ -z "$first_ts" ]] && first_ts="$ts"
        last_ts="$ts"
    done < "$_TC_BUFFER"

    [[ -z "$table_rows" ]] && return

    # ── Дописываем в DAILY ────────────────────────────────────────────────────
    {
        echo ""
        echo "### 🖥 Terminal — ${first_ts} → ${last_ts} (${count} команд)"
        echo ""

        # Краткая сводка
        local summary=""
        [[ $git_count -gt 0 ]] && summary+="📦 git:${git_count}  "
        [[ $error_count -gt 0 ]] && summary+="❌ errors:${error_count}  "
        [[ -n "$summary" ]] && echo "> ${summary}" && echo ""

        echo "| Время | Директория | Команда | Статус |"
        echo "|-------|-----------|---------|--------|"
        echo -e "$table_rows"
    } >> "$daily"

    # ── Очищаем буфер ─────────────────────────────────────────────────────────
    > "$_TC_BUFFER"
}

# ── Публичные алиасы ──────────────────────────────────────────────────────────
# tc-flush   — немедленно сбросить буфер в DAILY
# tc-status  — показать что сейчас в буфере
# tc-clear   — очистить буфер без записи

alias tc-flush='_tc_flush_to_daily && echo "✅ Flushed to Obsidian DAILY"'
alias tc-status='echo "Buffer ($(wc -l < ~/.terminal_context_buffer 2>/dev/null || echo 0) lines):" && cat ~/.terminal_context_buffer 2>/dev/null || echo "(empty)"'
alias tc-clear='> ~/.terminal_context_buffer && echo "🗑  Buffer cleared"'
alias tc-tail='tail -f ~/.terminal_context_buffer'

# ── Регистрируем hooks ────────────────────────────────────────────────────────
autoload -Uz add-zsh-hook 2>/dev/null
add-zsh-hook preexec _tc_preexec
add-zsh-hook precmd  _tc_precmd

# ── Инициализация ─────────────────────────────────────────────────────────────
# Создаём буфер если нет
[[ ! -f "$_TC_BUFFER" ]] && touch "$_TC_BUFFER"
