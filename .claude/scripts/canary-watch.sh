#!/usr/bin/env bash
# canary-watch.sh — WeWatch post-deploy production monitor (see canary-watch.md skill).
# Added 2026-08-26 after a real 5+ minute stuck-request incident (vb-media-proxy, no upstream
# timeout, fixed in PR #191) went unnoticed until a user sent a screen recording. This is the
# "keep watching after deploy" half deploy.md's one-shot health check doesn't cover.
#
# Usage: bash canary-watch.sh once   — single pass, exit 1 if any service is CRITICAL
#        bash canary-watch.sh watch  — loop every 5 min until killed
#
# Deliberately does NOT send Telegram/Hermes alerts itself — see canary-watch.md's "standing
# monitoring" section for wiring this into `hermes cron` for unattended alerting. Keeping this
# script a pure checker means it's safe to run ad-hoc mid-conversation with no side effects.

set -uo pipefail

LOG_FILE="$HOME/.claude/canary-watch.log"
mkdir -p "$(dirname "$LOG_FILE")"

# name|url|has_health_json (1 = expect {"status":"ok"|...} body, 0 = just check HTTP status)
SERVICES=(
  "watch-party|https://stream.wewatch.uz/health|1"
  "auth|https://auth-production-47a8.up.railway.app/health|1"
  "user|https://user-production-86ed.up.railway.app/health|1"
  "content|https://content-production-4e08.up.railway.app/health|1"
  "notification|https://notification-production-9c30.up.railway.app/health|1"
  "admin-api|https://admin-production-8d2a.up.railway.app/health|1"
  "payment|https://pay.wewatch.uz/health|1"
  "app-web|https://app.wewatch.uz/|0"
  "web|https://wewatch.uz/|0"
  "admin-ui|https://admin.wewatch.uz/|0"
)

WARN_MS=3000
CRIT_MS=8000

check_one() {
  local name="$1" url="$2" has_health="$3"
  local latency_ms http_code body level detail time_total

  # curl's own -w timing (time_total, seconds with decimals) instead of wall-clock date
  # arithmetic — `date +%s%3N` is a GNU coreutils extension that doesn't exist on macOS/BSD
  # date, and curl's own figure is more accurate anyway (measures the actual request, not
  # shell/subshell overhead around it). -m 10: hard cap so one truly hung service can't stall
  # the whole pass past 10s.
  # -L: follow redirects. Next.js apps (app-web, web) legitimately 307-redirect `/` to a
  # locale path (/ru, /uz, /en) — that's normal routing, not an outage, so the check should
  # land on the final page's status, not the redirect hop's.
  body=$(curl -sSL -m 10 -w '\nHTTPSTATUS:%{http_code}\nTIMETOTAL:%{time_total}' "$url" 2>/dev/null)
  local curl_exit=$?

  if [[ $curl_exit -ne 0 ]]; then
    level="CRITICAL"; detail="curl failed (exit $curl_exit, likely timeout/DNS/connection refused)"
    http_code="-"; latency_ms=0
  else
    http_code=$(echo "$body" | grep -o 'HTTPSTATUS:[0-9]*' | cut -d: -f2)
    time_total=$(echo "$body" | grep -o 'TIMETOTAL:[0-9.]*' | cut -d: -f2)
    latency_ms=$(python3 -c "print(int(float('$time_total') * 1000))" 2>/dev/null || echo 0)
    body=$(echo "$body" | sed '/^HTTPSTATUS:/d; /^TIMETOTAL:/d')

    if [[ ! "$http_code" =~ ^2[0-9][0-9]$ ]]; then
      level="CRITICAL"; detail="HTTP $http_code"
    elif [[ "$has_health" == "1" ]]; then
      local health_status
      health_status=$(echo "$body" | python3 -c "import json,sys; print(json.load(sys.stdin).get('status','?'))" 2>/dev/null || echo "unparseable")
      if [[ "$health_status" != "ok" ]]; then
        level="CRITICAL"; detail="HTTP $http_code but health body status=\"$health_status\""
      elif [[ $latency_ms -gt $CRIT_MS ]]; then
        level="CRITICAL"; detail="ok but ${latency_ms}ms (> ${CRIT_MS}ms critical threshold)"
      elif [[ $latency_ms -gt $WARN_MS ]]; then
        level="WARNING"; detail="ok but ${latency_ms}ms (> ${WARN_MS}ms warning threshold)"
      else
        level="OK"; detail="${latency_ms}ms"
      fi
    else
      if [[ $latency_ms -gt $CRIT_MS ]]; then
        level="CRITICAL"; detail="HTTP $http_code but ${latency_ms}ms (> ${CRIT_MS}ms critical threshold)"
      elif [[ $latency_ms -gt $WARN_MS ]]; then
        level="WARNING"; detail="HTTP $http_code but ${latency_ms}ms (> ${WARN_MS}ms warning threshold)"
      else
        level="OK"; detail="HTTP $http_code, ${latency_ms}ms"
      fi
    fi
  fi

  local ts
  ts=$(date -u '+%Y-%m-%dT%H:%M:%SZ')
  python3 -c "
import json
print(json.dumps({'ts': '$ts', 'service': '$name', 'url': '$url', 'level': '$level', 'http_code': '$http_code', 'latency_ms': $latency_ms, 'detail': '''$detail'''}))
" >> "$LOG_FILE"

  printf '%-14s %-9s %s\n' "$name" "$level" "$detail"
  [[ "$level" == "CRITICAL" ]] && return 1
  return 0
}

run_once() {
  echo "=== canary-watch $(date -u '+%Y-%m-%d %H:%M:%S UTC') ==="
  local any_critical=0
  for entry in "${SERVICES[@]}"; do
    IFS='|' read -r name url has_health <<< "$entry"
    check_one "$name" "$url" "$has_health" || any_critical=1
  done
  return $any_critical
}

MODE="${1:-once}"
case "$MODE" in
  once)
    run_once
    exit $?
    ;;
  watch)
    while true; do
      run_once
      echo "--- next check in 5 min ---"
      sleep 300
    done
    ;;
  *)
    echo "Usage: $0 [once|watch]" >&2
    exit 2
    ;;
esac
