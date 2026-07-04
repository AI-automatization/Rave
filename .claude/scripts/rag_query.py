#!/usr/bin/env python3
"""Semantic search over the Obsidian RAG index.

Usage:
  rag_query.py "your question" [-k N] [--json] [--full]
"""
import sys
import json

import rag_common as rc


def main():
    args = sys.argv[1:]
    if not args:
        print('usage: rag_query.py "query" [-k N] [--json] [--full]')
        sys.exit(1)

    k = 5
    as_json = False
    full = False
    query_parts = []
    i = 0
    while i < len(args):
        a = args[i]
        if a == "-k":
            k = int(args[i + 1]); i += 2; continue
        if a == "--json":
            as_json = True; i += 1; continue
        if a == "--full":
            full = True; i += 1; continue
        query_parts.append(a); i += 1
    query = " ".join(query_parts)

    vectors, meta = rc.load_index()
    if vectors is None:
        print("[rag] no index. run: rag.sh index")
        sys.exit(1)

    import numpy as np
    qv = rc.embed([query])[0]
    scores = vectors @ qv
    top = np.argsort(-scores)[:k]

    results = []
    for idx in top:
        c = meta[int(idx)]
        text = c["text"] if full else (c["text"][:280] + ("…" if len(c["text"]) > 280 else ""))
        results.append({
            "score": round(float(scores[idx]), 4),
            "file": c["file"],
            "heading": c["heading"],
            "text": text,
        })

    if as_json:
        print(json.dumps(results, ensure_ascii=False, indent=2))
        return

    for r in results:
        loc = r["file"] + (f"  ›  {r['heading']}" if r["heading"] else "")
        print(f"\n[{r['score']}] {loc}")
        print(r["text"])


if __name__ == "__main__":
    main()
