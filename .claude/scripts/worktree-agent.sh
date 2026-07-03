#!/usr/bin/env bash
# worktree-agent.sh — создаёт git worktree для параллельного агента
# Usage: bash worktree-agent.sh create <agent-name> <branch>
#        bash worktree-agent.sh list
#        bash worktree-agent.sh cleanup <agent-name>

set -euo pipefail

RAVE="/Users/saidazim/Desktop/Rave"
WORKTREES_DIR="/tmp/rave-worktrees"
ACTION="${1:-list}"
AGENT_NAME="${2:-}"
BRANCH="${3:-}"

case "$ACTION" in
  create)
    [ -z "$AGENT_NAME" ] && echo "Usage: $0 create <name> [branch]" && exit 1
    BRANCH="${BRANCH:-agent/$AGENT_NAME-$(date +%s)}"
    WT_PATH="$WORKTREES_DIR/$AGENT_NAME"
    mkdir -p "$WORKTREES_DIR"
    git -C "$RAVE" worktree add -b "$BRANCH" "$WT_PATH" main 2>/dev/null \
      || git -C "$RAVE" worktree add "$WT_PATH" "$BRANCH" 2>/dev/null
    echo "✅ Worktree created: $WT_PATH (branch: $BRANCH)"
    echo "   Run agent in: $WT_PATH"
    ;;

  list)
    echo "=== Active worktrees ==="
    git -C "$RAVE" worktree list
    echo ""
    echo "=== /tmp worktrees ==="
    ls "$WORKTREES_DIR" 2>/dev/null || echo "none"
    ;;

  cleanup)
    [ -z "$AGENT_NAME" ] && echo "Usage: $0 cleanup <name>" && exit 1
    WT_PATH="$WORKTREES_DIR/$AGENT_NAME"
    git -C "$RAVE" worktree remove "$WT_PATH" --force 2>/dev/null || true
    rm -rf "$WT_PATH"
    echo "✅ Worktree $AGENT_NAME removed"
    ;;

  cleanup-all)
    git -C "$RAVE" worktree prune
    rm -rf "$WORKTREES_DIR"
    echo "✅ All agent worktrees cleaned"
    ;;
esac
