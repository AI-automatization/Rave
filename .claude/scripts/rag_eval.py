#!/usr/bin/env python3
"""Regression test for the hybrid RAG pipeline — run after any ranking/chunking
change to catch what ad-hoc single-query testing misses (this is the eval-set
idea from Hobbit's/Habibulloh's AI review, 2026-08-01).

Usage: rag_eval.py [--k N] [--set PATH]
Exit code: 0 if all pass, 1 if any fail (usable in a pre-commit-style check).
"""
import sys
import json
from pathlib import Path

import rag_common as rc

DEFAULT_SET = Path(__file__).resolve().parents[1] / "rag" / "eval_set.json"


def run_query(query: str, k: int):
    import numpy as np

    vectors, meta = rc.load_index()
    if vectors is None:
        print("[eval] no index. run: rag.sh index")
        sys.exit(1)

    qv = rc.embed([query])[0]
    dense_scores = vectors @ qv
    dense_ranks = [int(i) for i in np.argsort(-dense_scores)]

    bm25 = rc.load_bm25()
    if bm25 is not None:
        bm25_scores = bm25.get_scores(rc.tokenize(query))
        bm25_ranks = [int(i) for i in np.argsort(-bm25_scores)]
        bm25_rank_of = {idx: pos for pos, idx in enumerate(bm25_ranks)}
        fused = rc.rrf_merge([dense_ranks, bm25_ranks], top_n=max(30, k * 3))
        fused.sort(key=lambda kv: (-kv[1], bm25_rank_of.get(kv[0], 10**9)))
    else:
        fused = [(int(i), float(dense_scores[i])) for i in dense_ranks[:k]]

    intent = rc.detect_query_intent(query)

    def _tiebreak_key(item):
        idx, score = item
        c = meta[int(idx)]
        rec = rc.recency_boost(c.get("mtime", 0))
        type_match = 1 if c.get("mem_type") == intent else 0
        return (-score, bm25_rank_of.get(idx, 10**9) if bm25 is not None else 0, -rec, -type_match)

    fused.sort(key=_tiebreak_key)
    return [meta[idx]["file"] for idx, _ in fused[:k]]


def main():
    args = sys.argv[1:]
    k = 5
    set_path = DEFAULT_SET
    i = 0
    while i < len(args):
        if args[i] == "--k":
            k = int(args[i + 1]); i += 2; continue
        if args[i] == "--set":
            set_path = Path(args[i + 1]); i += 2; continue
        i += 1

    cases = json.loads(set_path.read_text(encoding="utf-8"))
    passed, failed = 0, []
    reciprocal_ranks = []

    for case in cases:
        query = case["query"]
        expected = [case["expect_file"]] + case.get("expect_file_alt", [])
        top_files = run_query(query, k)

        rank = next((i + 1 for i, f in enumerate(top_files) if f in expected), None)
        reciprocal_ranks.append(1.0 / rank if rank else 0.0)

        if rank:
            passed += 1
            print(f"✅ [{rank}/{k}] {query!r}")
        else:
            failed.append((query, expected, top_files))
            print(f"❌ [miss] {query!r} — expected {expected}, got {top_files}")

    mrr = sum(reciprocal_ranks) / len(reciprocal_ranks) if reciprocal_ranks else 0.0
    print(f"\n{passed}/{len(cases)} passed — MRR@{k} = {mrr:.3f}")

    if failed:
        print("\nFailures:")
        for query, expected, got in failed:
            print(f"  {query!r}\n    expected: {expected}\n    got:      {got}")
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    main()
