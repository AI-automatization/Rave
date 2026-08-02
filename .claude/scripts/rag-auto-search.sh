#!/bin/bash
# rag-auto-search.sh — UserPromptSubmit hook
# Automatically runs the hybrid RAG search (dense+BM25+RRF) against every
# incoming prompt and prints top results into context — turns RAG from
# DISCIPLINA (model has to remember to call rag.sh) into MEXANIZM (hook
# always does it, model just sees the results).

PROMPT=$(cat | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if isinstance(data, dict):
        text = data.get('prompt', data.get('message', data.get('text', '')))
        if isinstance(text, list):
            text = ' '.join(str(t.get('text','') if isinstance(t,dict) else t) for t in text)
        print(str(text))
except:
    pass
" 2>/dev/null)

# Skip trivial/short prompts ("да", "ок", "продолжи") — not worth ~1.5s embed latency
[ -z "$PROMPT" ] && exit 0
[ "${#PROMPT}" -lt 15 ] && exit 0

RAVE="/Users/saidazim/Desktop/Rave"
VENV_PY="$RAVE/.claude/rag/venv/bin/python"
[ -x "$VENV_PY" ] || exit 0
[ -f "$RAVE/.claude/rag/index/vectors.npy" ] || exit 0

RESULT=$(cd "$RAVE" && "$VENV_PY" .claude/scripts/rag_query.py "$PROMPT" -k 3 --min-bm25 0.5 --brief 2>/dev/null)
[ -z "$RESULT" ] && exit 0

echo ""
echo "════════════════════════════════════════════"
echo "🔎 RAG (hybrid dense+BM25) — авто-поиск по промпту"
echo "════════════════════════════════════════════"
echo "$RESULT"
echo "════════════════════════════════════════════"

exit 0
