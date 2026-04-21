#!/usr/bin/env bash
# CineSync — Clone shared Obsidian vault (for team members)
# Run ONCE on a new machine to connect to shared vault
# Usage: bash .claude/scripts/obsidian-vault-clone.sh [git-repo-url]
#
# Setup: Saidazim first creates the vault and pushes to a private repo,
# then Emirhan runs this script with that repo URL.

set -euo pipefail

VAULT="${CINESYNC_VAULT:-$HOME/Documents/CineSync-Vault}"
REPO_URL="${1:-}"

if [[ -z "$REPO_URL" ]]; then
  echo "Usage: bash obsidian-vault-clone.sh <git-repo-url>"
  echo ""
  echo "Example (GitHub private repo):"
  echo "  bash obsidian-vault-clone.sh git@github.com:yourorg/cinesync-vault.git"
  echo ""
  echo "Ask Saidazim for the vault repo URL."
  exit 1
fi

if [[ -d "$VAULT" ]]; then
  echo "⚠️  Vault already exists at $VAULT"
  echo "    Remove it first if you want a fresh clone: rm -rf $VAULT"
  exit 1
fi

echo "📥 Cloning CineSync Vault..."
git clone "$REPO_URL" "$VAULT"

echo "✅ Vault cloned → $VAULT"
echo ""
echo "Next steps:"
echo "  1. Open Obsidian → 'Open folder as vault' → $VAULT"
echo "  2. Settings → Community plugins → install: Dataview, Homepage, Obsidian Git"
echo "  3. Settings → Obsidian Git → set remote to origin (already set)"
echo ""
echo "Auto-sync is now active — vault pulls on session start, pushes on session stop."
