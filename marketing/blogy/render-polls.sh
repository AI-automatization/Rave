#!/bin/bash
# Export 3 poll story backgrounds as PNG (single frame)
# Use these in Instagram: upload image → add "Opros" sticker on top

mkdir -p out/stories/polls

echo "📸 Rendering poll backgrounds..."

npx remotion still Story-D1S2-Poll out/stories/polls/D1S2-poll-bg.png --frame=0
echo "✅ D1S2 — Filmni yolg'iz ko'rasanmi?"

npx remotion still Story-D4S2-Poll out/stories/polls/D4S2-battle-poll-bg.png --frame=0
echo "✅ D4S2 — Battle'da yutasanmi?"

npx remotion still Story-D7S3-Poll out/stories/polls/D7S3-week-poll-bg.png --frame=0
echo "✅ D7S3 — Qaysi feature eng yoqdi?"

echo ""
echo "🎉 Done! Files saved to: out/stories/polls/"
echo ""
echo "Instagram workflow:"
echo "  1. Instagram → Story yaratish"
echo "  2. PNG faylni yuklang"
echo "  3. 'Stiker' → 'Opros' yoki 'Viktorina' qo'shing"
echo "  4. Post!"
