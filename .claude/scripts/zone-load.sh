#!/bin/bash
# zone-load.sh — Obsidian zone context loader
# Usage: bash zone-load.sh <zone>
# Zones: instagram | mobile | backend | web | telegram | ai-agents | skills | mcps
#
# Claude bu scriptni quyidagi hollarda chaqiradi:
#   - "Instagram bilan ishlaylik" → zone-load.sh instagram
#   - "Mobile qilamiz" → zone-load.sh mobile
#   - "Telegram bilan" → zone-load.sh telegram

VAULT="$HOME/Documents/weWatch-obsidian/ZONES"
ZONE_ARG="${1:-}"

# Zone name normalization
case "$ZONE_ARG" in
  instagram|Instagram|insta)
    ZONE_DIR="$VAULT/Instagram" ;;
  mobile|Mobile|wewatch-mobile)
    ZONE_DIR="$VAULT/WeWatch-Mobile" ;;
  backend|Backend|wewatch-backend)
    ZONE_DIR="$VAULT/WeWatch-Backend" ;;
  web|Web|wewatch-web)
    ZONE_DIR="$VAULT/WeWatch-Web" ;;
  telegram|Telegram|tg)
    ZONE_DIR="$VAULT/Telegram" ;;
  ai-agents|ai|agents)
    ZONE_DIR="$VAULT/AI-Agents" ;;
  skills|Skills)
    ZONE_DIR="$VAULT/Skills" ;;
  mcps|MCP|mcp)
    ZONE_DIR="$VAULT/MCPs" ;;
  blogy|Blogy|blog)
    ZONE_DIR="$VAULT/Blogy" ;;
  *)
    echo "❌ Noma'lum zone: $ZONE_ARG"
    echo "   Mavjud: instagram | mobile | backend | web | telegram | ai-agents | skills | mcps | blogy"
    exit 1 ;;
esac

if [ ! -d "$ZONE_DIR" ]; then
  echo "⚠️  Zone topilmadi: $ZONE_DIR"
  exit 0
fi

# Track active zone for session-stop.sh
echo "$ZONE_DIR" | xargs basename > /tmp/claude-active-zone

echo "════════════════════════════════════════════"
echo "📁 ZONE: $ZONE_ARG"
echo "════════════════════════════════════════════"
echo ""

# Read all markdown files in zone
for f in "$ZONE_DIR"/*.md; do
  [ -f "$f" ] || continue
  filename=$(basename "$f")
  echo "━━━ $filename ━━━"
  cat "$f"
  echo ""
done

echo "════════════════════════════════════════════"
