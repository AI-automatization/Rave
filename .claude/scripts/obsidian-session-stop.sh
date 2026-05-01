#!/usr/bin/env bash
# Stop hook — конец сессии: маркер в DAILY + flush терминала + vault commit

set -euo pipefail

VAULT="${OBSIDIAN_VAULT:-$HOME/Documents/Obsidian Vault}"
DEV="${VAULT_DEVELOPER:-Saidazim}"
DATE=$(date '+%Y-%m-%d')
NOW=$(date '+%Y-%m-%d %H:%M')

[[ ! -d "$VAULT" ]] && exit 0

mkdir -p "$VAULT/DAILY/$DEV"
DAILY="$VAULT/DAILY/$DEV/$DATE.md"

# ── Маркер конца сессии ───────────────────────────────────────────
[[ -f "$DAILY" ]] && echo -e "\n### 🔴 Session ended: $NOW" >> "$DAILY"

# ── Flush терминального буфера ────────────────────────────────────
BUFFER="$HOME/.terminal_context_buffer"
if [[ -f "$BUFFER" && -s "$BUFFER" ]]; then
  bash "$(dirname "${BASH_SOURCE[0]}")/terminal-context-flush.sh" 2>/dev/null || true
fi

# ── Коммит vault в git ────────────────────────────────────────────
if [[ -d "$VAULT/.git" ]]; then
  git -C "$VAULT" add -A 2>/dev/null || true
  git -C "$VAULT" diff --cached --quiet 2>/dev/null || \
    git -C "$VAULT" commit -q -m "vault: $DEV session stop $NOW" 2>/dev/null || true
  git -C "$VAULT" push -q origin main 2>/dev/null || true
fi

exit 0
