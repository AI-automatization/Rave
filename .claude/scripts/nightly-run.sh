#!/usr/bin/env bash
# nightly-run.sh — ночной автономный прогон
# Запускается по cron каждую ночь в 3:00
# Делает: tsc check, security scan, task audit, git status
# Результат → Telegram + Obsidian daily note

set -euo pipefail

VAULT="${OBSIDIAN_VAULT:-$HOME/Documents/weWatch-obsidian}"
DATE=$(date '+%Y-%m-%d')
TIME=$(date '+%H:%M')
LOG_FILE="/tmp/nightly-run-$DATE.log"
BOT_TOKEN="${CLAUDE_TG_BOT_TOKEN:-8734969603:AAF0FcbPp86XYgTkWf2Sveqqy8QOB_dh8P0}"
CHAT_ID="${CLAUDE_TG_CHAT_ID:-6299152655}"
RAVE="/Users/saidazim/Desktop/Rave"

log() { echo "[$TIME] $*" | tee -a "$LOG_FILE"; }

tg_send() {
  local text="$1"
  curl -s -X POST "https://api.telegram.org/bot$BOT_TOKEN/sendMessage" \
    -d "chat_id=$CHAT_ID&text=$text&parse_mode=Markdown" > /dev/null 2>&1 || true
}

log "=== NIGHTLY RUN START $DATE ==="

REPORT="🌙 *Nightly Report — $DATE*\n\n"

# ── 1. Git status ────────────────────────────────────────────────────────────
log "Checking git status..."
cd "$RAVE"
UNCOMMITTED=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
AHEAD=$(git log origin/main..HEAD --oneline 2>/dev/null | wc -l | tr -d ' ')
REPORT+="📦 *Git:* $UNCOMMITTED uncommitted files, $AHEAD commits ahead of main\n"

# ── 2. TypeScript check ──────────────────────────────────────────────────────
log "Running tsc checks..."
TSC_ERRORS=0
for svc in services/auth services/user services/content services/watch-party services/battle services/notification services/admin; do
  if [ -f "$RAVE/$svc/tsconfig.json" ]; then
    ERR=$(cd "$RAVE/$svc" && npx tsc --noEmit 2>&1 | grep "error TS" | wc -l | tr -d ' ')
    TSC_ERRORS=$((TSC_ERRORS + ERR))
    [ "$ERR" -gt 0 ] && log "  ⚠️  $svc: $ERR TS errors"
  fi
done
REPORT+="🔷 *TypeScript:* $TSC_ERRORS total errors\n"

# ── 3. Open tasks check ──────────────────────────────────────────────────────
log "Checking tasks..."
PENDING=$(grep -c "❌ Boshlanmagan\|🔄 Bajarilmoqda" "$RAVE/docs/Tasks.md" 2>/dev/null || echo 0)
P1=$(grep -c "P1" "$RAVE/docs/Tasks.md" 2>/dev/null || echo 0)
REPORT+="📋 *Tasks:* $PENDING open ($P1 P1 priority)\n"

# ── 4. Security: .env in git check ──────────────────────────────────────────
log "Security scan..."
ENV_LEAK=$(git -C "$RAVE" log --all --full-history --oneline -- '*.env' 2>/dev/null | wc -l | tr -d ' ')
HARDCODED=$(grep -r "password\s*=\s*['\"][^'\"]\+['\"]" "$RAVE/services" --include="*.ts" -l 2>/dev/null | wc -l | tr -d ' ')
REPORT+="🔒 *Security:* env leaks=$ENV_LEAK, hardcoded=$HARDCODED\n"

# ── 5. Disk space ────────────────────────────────────────────────────────────
DISK=$(df -h / | awk 'NR==2{print $5}')
REPORT+="💾 *Disk:* $DISK used\n"

# ── 6. Write to Obsidian daily note ─────────────────────────────────────────
DAILY="$VAULT/DAILY/Saidazim/$DATE.md"
mkdir -p "$(dirname "$DAILY")"
if [ -f "$DAILY" ]; then
  echo "" >> "$DAILY"
  echo "## 🌙 Nightly Report ($TIME)" >> "$DAILY"
  echo "- git: $UNCOMMITTED uncommitted, $AHEAD ahead" >> "$DAILY"
  echo "- tsc errors: $TSC_ERRORS" >> "$DAILY"
  echo "- open tasks: $PENDING" >> "$DAILY"
  echo "- disk: $DISK" >> "$DAILY"
fi

REPORT+="\n✅ Nightly run complete"

# ── Send to Telegram ─────────────────────────────────────────────────────────
tg_send "$REPORT"
log "=== NIGHTLY RUN DONE ==="
