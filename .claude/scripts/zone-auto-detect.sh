#!/bin/bash
# zone-auto-detect.sh — UserPromptSubmit hook
# Reads user prompt from stdin (JSON), detects zone by keywords, loads context

PROMPT=$(cat | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    # Claude Code sends {prompt: ...} or nested structure
    if isinstance(data, dict):
        text = data.get('prompt', data.get('message', data.get('text', '')))
        if isinstance(text, list):
            text = ' '.join(str(t.get('text','') if isinstance(t,dict) else t) for t in text)
        print(str(text).lower())
except:
    pass
" 2>/dev/null)

[ -z "$PROMPT" ] && exit 0

detect_zone() {
  local p="$1"
  # Instagram / Reels
  echo "$p" | grep -qiE "instagram|reel|slide|remotion|marketing|content plan|post|story|stories|caption|hashtag" && echo "instagram" && return
  # Mobile
  echo "$p" | grep -qiE "mobile|react native|expo|ios|android|screen|navigator|app\b" && echo "mobile" && return
  # Backend
  echo "$p" | grep -qiE "backend|service|api|endpoint|mongo|redis|socket|express|node|auth|user service|watch.party|battle|notification|admin" && echo "backend" && return
  # Web
  echo "$p" | grep -qiE "\bweb\b|next\.?js|apps/web|frontend|landing|page|nextjs" && echo "web" && return
  # Telegram
  echo "$p" | grep -qiE "telegram|bot|guruh|group|tg\b|tg-|pyrogram|telethon" && echo "telegram" && return
  # AI Agents
  echo "$p" | grep -qiE "agent|swarm|automation|multi.agent|subagent|dispatch|skill" && echo "ai-agents" && return
  echo ""
}

ZONE=$(detect_zone "$PROMPT")
[ -z "$ZONE" ] && exit 0

# Skip only if the SAME zone was already loaded (allow zone switching)
# Use PPID as session identifier — each Claude session has unique parent PID
LAST_ZONE_FILE="/tmp/claude-last-loaded-zone-${PPID}"
if [ -f "$LAST_ZONE_FILE" ] && [ "$(cat "$LAST_ZONE_FILE")" = "$ZONE" ]; then
  exit 0
fi

echo "$ZONE" > "$LAST_ZONE_FILE"
echo "$(date '+%H:%M') zone=$ZONE" >> "/tmp/claude-zone-stats-${PPID}.log"

# First zone load of session → also show Tasks.md and git status
SESSION_INIT_FILE="/tmp/claude-session-init-${PPID}"
if [ ! -f "$SESSION_INIT_FILE" ]; then
  touch "$SESSION_INIT_FILE"
  echo ""
  echo "════════════════════════════════════════════"
  echo "📋 TASKS.md — активные задачи"
  echo "════════════════════════════════════════════"
  grep -E "^### T-|Holat:|Mas'ul:|pending\[" /Users/saidazim/Desktop/Rave/docs/Tasks.md 2>/dev/null | head -30
  echo ""
  echo "📦 GIT STATUS"
  git -C /Users/saidazim/Desktop/Rave status --short 2>/dev/null | head -10
  echo "════════════════════════════════════════════"
fi

bash "$(dirname "$0")/zone-load.sh" "$ZONE" 2>/dev/null
