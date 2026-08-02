#!/usr/bin/env bash
# Obsidian RAG memory — wrapper around the local fastembed index.
#
#   rag.sh index            # (re)build the index from the vault
#   rag.sh query "..." [-k N] [--json] [--full]
#   rag.sh q "..."          # alias for query
#
# Vault: $OBSIDIAN_VAULT or ~/Documents/weWatch-obsidian
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PY="$SCRIPT_DIR/../rag/venv/bin/python"

if [ ! -x "$PY" ]; then
  echo "[rag] venv missing at $PY — run setup first" >&2
  exit 1
fi

cmd="${1:-}"; shift || true
case "$cmd" in
  index)         exec "$PY" "$SCRIPT_DIR/rag_index.py" "$@" ;;
  query|q|"")    exec "$PY" "$SCRIPT_DIR/rag_query.py" "$@" ;;
  eval)          exec "$PY" "$SCRIPT_DIR/rag_eval.py" "$@" ;;
  *)             exec "$PY" "$SCRIPT_DIR/rag_query.py" "$cmd" "$@" ;;
esac
