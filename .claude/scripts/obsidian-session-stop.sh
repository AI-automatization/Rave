#!/usr/bin/env bash
# CineSync — Claude Code Stop hook
# Runs automatically when a Claude Code session ends

set -euo pipefail

VAULT="${CINESYNC_VAULT:-$HOME/Documents/CineSync-Vault}"
DATE=$(date '+%Y-%m-%d')
NOW=$(date '+%Y-%m-%d %H:%M')

[[ ! -d "$VAULT" ]] && exit 0

DAILY_FILE="$VAULT/DAILY/$DATE.md"

# ── Log session end ────────────────────────────────────────────────
[[ -f "$DAILY_FILE" ]] && echo "### 🔴 Session ended: $NOW" >> "$DAILY_FILE"

# ── Detect which service was active (by CWD or recent git changes) ─
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel 2>/dev/null || echo "")"

if [[ -n "$PROJECT_ROOT" ]]; then
  # Map changed files → services
  CHANGED=$(git -C "$PROJECT_ROOT" diff --name-only HEAD~1 HEAD 2>/dev/null || true)
  declare -A TOUCHED
  while IFS= read -r f; do
    case "$f" in
      services/auth/*)         TOUCHED[auth]=1 ;;
      services/user/*)         TOUCHED[user]=1 ;;
      services/content/*)      TOUCHED[content]=1 ;;
      services/watch-party/*)  TOUCHED[watch-party]=1 ;;
      services/battle/*)       TOUCHED[battle]=1 ;;
      services/notification/*) TOUCHED[notification]=1 ;;
      services/admin/*)        TOUCHED[admin]=1 ;;
      apps/mobile/*)           TOUCHED[mobile]=1 ;;
      shared/*)                TOUCHED[shared]=1 ;;
    esac
  done <<< "$CHANGED"

  # Update _context.md for each touched service
  for svc in "${!TOUCHED[@]}"; do
    if [[ "$svc" == "mobile" ]]; then
      CTX="$VAULT/MOBILE/_context.md"
    elif [[ "$svc" == "shared" ]]; then
      CTX="$VAULT/SHARED/_context.md"
    else
      CTX="$VAULT/SERVICES/$svc/_context.md"
    fi

    [[ ! -f "$CTX" ]] && continue

    # Pull last 5 commits for this service path
    if [[ "$svc" == "mobile" ]]; then
      GIT_PATH="apps/mobile"
    elif [[ "$svc" == "shared" ]]; then
      GIT_PATH="shared"
    else
      GIT_PATH="services/$svc"
    fi

    COMMITS=$(git -C "$PROJECT_ROOT" log --oneline -5 -- "$GIT_PATH" 2>/dev/null | \
      sed 's/^/- /' || echo "- no recent commits")

    # Replace or append Recent Commits section
    BLOCK="## Recent Commits\n\n*Updated: $NOW*\n\n$COMMITS"
    if grep -q "^## Recent Commits" "$CTX"; then
      # Replace section (everything between ## Recent Commits and next ## or EOF)
      python3 - "$CTX" "$BLOCK" << 'PYEOF'
import sys, re
path, block = sys.argv[1], sys.argv[2]
content = open(path).read()
content = re.sub(r'## Recent Commits.*?(?=\n## |\Z)', block + '\n\n', content, flags=re.DOTALL)
open(path, 'w').write(content)
PYEOF
    else
      echo -e "\n$BLOCK" >> "$CTX"
    fi
    echo "🔄 Updated context: $svc"
  done

  # ── Sync tasks ──────────────────────────────────────────────────
  bash "$SCRIPT_DIR/obsidian-tasks-sync.sh" 2>/dev/null || true
fi

# ── Commit vault to git ────────────────────────────────────────────
if [[ -d "$VAULT/.git" ]]; then
  git -C "$VAULT" add -A 2>/dev/null || true
  git -C "$VAULT" diff --cached --quiet 2>/dev/null || \
    git -C "$VAULT" commit -q -m "vault: session $NOW" 2>/dev/null || true
fi

exit 0
