#!/bin/bash
# CineSync — Telegram Task Notifier (подробный)
# Usage: ./tg-notify.sh <action> <task_id> <task_meta> <title> [executor] [details]
#
# action:     new | claim | done | update | blocked
# task_id:    T-S053 | T-E096 | T-C012
# task_meta:  "P2 | BACKEND" или "P0 | IKKALASI"
# title:      "Task sarlavhasi"
# executor:   Saidazim | Emirhan  (optional, auto-detected)
# details:    "Qo'shimcha ma'lumot" (optional — bajarilgan ish, xato, izoh)
#
# Examples:
#   ./tg-notify.sh new     T-S057 "P2 | BACKEND"  "Battle leaderboard endpoint"
#   ./tg-notify.sh claim   T-S057 "P2 | BACKEND"  "Battle leaderboard endpoint"  Saidazim
#   ./tg-notify.sh done    T-S057 "P2 | BACKEND"  "Battle leaderboard endpoint"  Saidazim  "3 fayl o'zgartirildi, tsc: CLEAN"
#   ./tg-notify.sh update  T-C012 "P0 | IKKALASI" "MVP E2E test"  "Saidazim+Emirhan"  "YouTube OK, Rutube FAIL"
#   ./tg-notify.sh blocked T-S058 "P1 | BACKEND"  "Socket mesh"   Saidazim  "T-S052 dan avval bajarilishi kerak"

BOT_TOKEN="${TG_NOTIFY_BOT_TOKEN:?set TG_NOTIFY_BOT_TOKEN (never commit the token)}"
CHAT_SAIDAZIM="6299152655"
CHAT_EMIRHAN="569913655"
TG_API="https://api.telegram.org/bot${BOT_TOKEN}/sendMessage"

ACTION="${1}"
TASK_ID="${2}"
TASK_META="${3}"
TITLE="${4}"
EXECUTOR="${5}"
DETAILS="${6}"

if [[ -z "$ACTION" || -z "$TASK_ID" || -z "$TITLE" ]]; then
  echo "Usage: $0 <action> <task_id> <task_meta> <title> [executor] [details]"
  echo "Actions: new | claim | done | update | blocked"
  exit 1
fi

# Auto-detect recipients from task prefix
PREFIX="${TASK_ID:0:3}"
RECIPIENTS=()

case "$PREFIX" in
  T-S)
    RECIPIENTS=("$CHAT_SAIDAZIM")
    [[ -z "$EXECUTOR" ]] && EXECUTOR="Saidazim"
    ;;
  T-E)
    RECIPIENTS=("$CHAT_EMIRHAN")
    [[ -z "$EXECUTOR" ]] && EXECUTOR="Emirhan"
    ;;
  T-C)
    RECIPIENTS=("$CHAT_SAIDAZIM" "$CHAT_EMIRHAN")
    [[ -z "$EXECUTOR" ]] && EXECUTOR="Saidazim + Emirhan"
    ;;
  *)
    RECIPIENTS=("$CHAT_SAIDAZIM")
    ;;
esac

# Emoji + header per action
case "$ACTION" in
  new)
    EMOJI="🆕"
    HEADER="YANGI TASK YARATILDI"
    STATUS_EMOJI="📋"
    STATUS_TEXT="Ochiq — hali olinmagan"
    ;;
  claim)
    EMOJI="🔄"
    HEADER="TASK OLINDI — JARAYONDA"
    STATUS_EMOJI="⚙️"
    STATUS_TEXT="In Progress"
    ;;
  done)
    EMOJI="✅"
    HEADER="TASK BAJARILDI!"
    STATUS_EMOJI="🏁"
    STATUS_TEXT="Completed → Done.md"
    ;;
  update)
    EMOJI="📝"
    HEADER="TASK YANGILANDI"
    STATUS_EMOJI="🔁"
    STATUS_TEXT="Updated"
    ;;
  blocked)
    EMOJI="🚫"
    HEADER="TASK BLOKLANGAN"
    STATUS_EMOJI="⛔"
    STATUS_TEXT="Blocked — boshqa task kutmoqda"
    ;;
  *)
    EMOJI="📌"
    HEADER="TASK O'ZGARISHI"
    STATUS_EMOJI="📌"
    STATUS_TEXT="Changed"
    ;;
esac

DATE=$(date '+%Y-%m-%d %H:%M')

# Extract priority from task_meta for visual indicator
PRIORITY_EMOJI="🔵"
if echo "$TASK_META" | grep -q "P0"; then PRIORITY_EMOJI="🔴"; fi
if echo "$TASK_META" | grep -q "P1"; then PRIORITY_EMOJI="🟠"; fi
if echo "$TASK_META" | grep -q "P2"; then PRIORITY_EMOJI="🟡"; fi
if echo "$TASK_META" | grep -q "P3"; then PRIORITY_EMOJI="🟢"; fi

# Build message
MESSAGE="${EMOJI} *${HEADER}*
━━━━━━━━━━━━━━━━━━━━
🏷  *ID:* \`${TASK_ID}\`"

if [[ -n "$TASK_META" ]]; then
  MESSAGE+="
${PRIORITY_EMOJI} *Meta:* ${TASK_META}"
fi

MESSAGE+="
📋 *Sarlavha:* ${TITLE}
👤 *Mas'ul:* ${EXECUTOR}
${STATUS_EMOJI} *Status:* ${STATUS_TEXT}"

if [[ -n "$DETAILS" ]]; then
  MESSAGE+="
💬 *Tafsilot:*
\`\`\`
${DETAILS}
\`\`\`"
fi

MESSAGE+="
🕐 ${DATE}
━━━━━━━━━━━━━━━━━━━━
_CineSync Task Bot_"

# Send to all recipients
SENT=0
for CHAT_ID in "${RECIPIENTS[@]}"; do
  RESPONSE=$(curl -s -X POST "$TG_API" \
    -H "Content-Type: application/json" \
    -d "{
      \"chat_id\": \"${CHAT_ID}\",
      \"text\": $(echo "$MESSAGE" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))'),
      \"parse_mode\": \"Markdown\"
    }")

  OK=$(echo "$RESPONSE" | grep -o '"ok":true')
  if [[ -n "$OK" ]]; then
    SENT=$((SENT + 1))
  else
    echo "⚠️  Failed chat ${CHAT_ID}: $(echo "$RESPONSE" | grep -o '"description":"[^"]*"')"
  fi
done

if [[ $SENT -gt 0 ]]; then
  echo "✅ Telegram sent (${SENT} recipient(s)): [${ACTION}] ${TASK_ID} — ${TITLE}"
else
  echo "❌ All notifications failed"
  exit 1
fi
