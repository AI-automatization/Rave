#!/usr/bin/env bash
# memory-load.sh — загружает ВСЮ память проекта для Claude
# Читает: LAST_SESSION, ARCHITECTURE, CONSTRAINTS, API, DECISIONS, _bugs, lessons-learned
# Usage: bash memory-load.sh [full|quick|constraints]
# Mode: quick (default) — важное | full — всё | constraints — только запреты

set -uo pipefail

VAULT="${OBSIDIAN_VAULT:-$HOME/Documents/weWatch-obsidian}"
PROJECT="$VAULT/PROJECTS/weWatch"
AI_CTX="$VAULT/AI_CONTEXT"
REPO="${REPO_PATH:-$HOME/Desktop/Rave}"
MODE="${1:-quick}"

[[ ! -d "$VAULT" ]] && echo "[memory] Vault not found: $VAULT" && exit 0

echo "════════════════════════════════════════════════════"
echo "🧠 MEMORY LOAD — WeWatch | Mode: $MODE | $(date '+%Y-%m-%d %H:%M')"
echo "════════════════════════════════════════════════════"

# ── CONSTRAINTS (всегда) ──────────────────────────────────────────
echo ""
echo "━━━ 🚫 CONSTRAINTS (anti-hallucination) ━━━"
if [[ -f "$PROJECT/CONSTRAINTS.md" ]]; then
  grep -A1 "^##\|^❌\|^✅\|^АБСОЛЮТНЫЕ\|^ANTI-HALL\|^ZONE" "$PROJECT/CONSTRAINTS.md" 2>/dev/null | head -40
else
  echo "CONSTRAINTS.md not found — no constraints loaded"
fi

if [[ "$MODE" == "constraints" ]]; then
  exit 0
fi

# ── LAST SESSION (всегда) ─────────────────────────────────────────
echo ""
echo "━━━ 🔄 LAST SESSION (где остановились) ━━━"
if [[ -f "$PROJECT/LAST_SESSION.md" ]]; then
  grep -v "^---\|^type:\|^project:\|^developer:\|^updated:" "$PROJECT/LAST_SESSION.md" | head -50
else
  echo "LAST_SESSION.md not found"
fi

# ── ACTIVE TASKS ──────────────────────────────────────────────────
echo ""
echo "━━━ 📋 ACTIVE TASKS (Saidazim) ━━━"
TASKS_FILE="$REPO/docs/Tasks.md"
if [[ -f "$TASKS_FILE" ]]; then
  # Показать только незавершённые задачи Saidazim
  ACTIVE=$(grep -B1 "pending\[Saidazim\]" "$TASKS_FILE" | grep "^###" | \
    grep -v "✅" | head -10 || echo "")
  if [[ -n "$ACTIVE" ]]; then
    echo "$ACTIVE"
  else
    echo "(нет активных задач — секция пустая)"
  fi
else
  echo "docs/Tasks.md not found"
fi

if [[ "$MODE" == "quick" ]]; then
  # Quick mode: только architecture summary
  echo ""
  echo "━━━ 🏗️ ARCHITECTURE (summary) ━━━"
  if [[ -f "$PROJECT/ARCHITECTURE.md" ]]; then
    grep "^## \|^| " "$PROJECT/ARCHITECTURE.md" 2>/dev/null | head -25
  fi
  echo ""
  echo "════════════════════════════════════════════════════"
  echo "💡 Для полной памяти: bash memory-load.sh full"
  echo "════════════════════════════════════════════════════"
  exit 0
fi

# ── FULL MODE ─────────────────────────────────────────────────────

echo ""
echo "━━━ 🏗️ ARCHITECTURE ━━━"
if [[ -f "$PROJECT/ARCHITECTURE.md" ]]; then
  grep -v "^---\|^type:\|^project:\|^updated:" "$PROJECT/ARCHITECTURE.md" | head -80
fi

echo ""
echo "━━━ 🔌 API REFERENCE (summary) ━━━"
if [[ -f "$PROJECT/API.md" ]]; then
  grep "^## \|^POST\|^GET\|^PATCH\|^DELETE\|^PUT" "$PROJECT/API.md" 2>/dev/null | head -40
fi

echo ""
echo "━━━ 🧭 DECISIONS (последние) ━━━"
if [[ -f "$PROJECT/DECISIONS.md" ]]; then
  grep "^## D-\|^\*\*Дата:\|^\*\*Решение:" "$PROJECT/DECISIONS.md" 2>/dev/null | head -20
fi

echo ""
echo "━━━ 🐛 KNOWN BUGS ━━━"
if [[ -f "$PROJECT/_bugs.md" ]]; then
  grep -v "^---\|^type:\|^project:" "$PROJECT/_bugs.md" | head -30
fi

echo ""
echo "━━━ ❌ LESSONS LEARNED ━━━"
if [[ -f "$AI_CTX/lessons-learned.md" ]]; then
  grep -v "^---\|^type:" "$AI_CTX/lessons-learned.md" | head -20
fi

echo ""
echo "════════════════════════════════════════════════════"
echo "✅ Memory loaded. Ready to work."
echo "════════════════════════════════════════════════════"
exit 0
