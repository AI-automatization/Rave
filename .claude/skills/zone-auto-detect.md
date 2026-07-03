# Zone Auto-Detect Hook

UserPromptSubmit hook — har prompt da keyword asosida Obsidian zone avtomatik yuklanadi.

## Pattern

```bash
# settings.json
"UserPromptSubmit": [{"hooks": [{"type": "command", "command": "bash .claude/scripts/zone-auto-detect.sh"}]}]
```

```bash
# zone-auto-detect.sh
PROMPT=$(cat | python3 -c "import sys,json; d=json.load(sys.stdin); print(str(d.get('prompt','')).lower())")
[ -z "$PROMPT" ] && exit 0

# keyword → zone mapping
echo "$PROMPT" | grep -qiE "instagram|reel|remotion" && ZONE="instagram"
echo "$PROMPT" | grep -qiE "backend|api|service|mongo" && ZONE="backend"
# ... boshqa zonalar

# PPID — session identifier, parallel sessiyalar uchun isolation
LAST_ZONE_FILE="/tmp/claude-last-loaded-zone-${PPID}"
[ -f "$LAST_ZONE_FILE" ] && [ "$(cat $LAST_ZONE_FILE)" = "$ZONE" ] && exit 0

echo "$ZONE" > "$LAST_ZONE_FILE"
echo "$(date '+%H:%M') zone=$ZONE" >> "/tmp/claude-zone-stats-${PPID}.log"
bash zone-load.sh "$ZONE"
```

## Key decisions

- **`$PPID`** — parent PID = Claude session ID. Stable per session, unique across parallel sessions. No libraries needed.
- **Debounce** — skip if SAME zone already loaded, reload on zone switch
- **Stats log** — `/tmp/claude-zone-stats-${PPID}.log` — bir haftadan keyin qaysi zone ko'p ishlatilganini ko'rish mumkin, keyword optimize qilish uchun

## Zones

| Keyword trigger | Zone |
|---|---|
| instagram, reel, remotion, slide | instagram |
| mobile, react native, expo | mobile |
| backend, api, service, mongo, redis | backend |
| web, next.js, apps/web | web |
| telegram, bot, tg | telegram |
| agent, swarm, automation | ai-agents |

## Source

Council arxitekturasi: `@shuhratov_HH` pattern + `@diyor_claude_assistant_bot` PPID maslahat (2026-05-26)
