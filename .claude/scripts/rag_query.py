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
    brief = False
    min_bm25 = None
    graph = False
    graph_hops = 2
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
        if a == "--brief":
            brief = True; i += 1; continue
        if a == "--min-bm25":
            min_bm25 = float(args[i + 1]); i += 2; continue
        if a == "--graph":
            graph = True; i += 1; continue
        if a == "--graph-hops":
            graph_hops = int(args[i + 1]); i += 2; continue
        query_parts.append(a); i += 1
    query = " ".join(query_parts)

    vectors, meta = rc.load_index()
    if vectors is None:
        print("[rag] no index. run: rag.sh index")
        sys.exit(1)

    import numpy as np

    # Dense (semantic) ranking
    qv = rc.embed([query])[0]
    dense_scores = vectors @ qv
    dense_ranks = [int(i) for i in np.argsort(-dense_scores)]

    # Sparse (BM25 keyword) ranking — catches exact IDs/names dense embedding smears
    bm25 = rc.load_bm25()
    if bm25 is not None:
        bm25_scores = bm25.get_scores(rc.tokenize(query))
        # Anisotropy in the multilingual dense model compresses cosine sim into a
        # narrow band regardless of relevance ("ало" scores ~0.49, same range as a
        # real query) — dense score alone can't gate noise. BM25 (word-overlap) is
        # the only signal here with a real zero: phatic filler ("ало", "ок", "спасибо")
        # shares zero vocabulary with anything in the vault, so bm25_top==0 is a
        # clean, low-risk skip. Measured 2026-08-01: noise queries hit 0.0, every
        # real content question hit 10+. See feedback_rag_hook_noise_gate.md.
        if min_bm25 is not None and float(np.max(bm25_scores)) < min_bm25:
            if as_json:
                print("[]")
            return
        bm25_ranks = [int(i) for i in np.argsort(-bm25_scores)]
        bm25_rank_of = {idx: pos for pos, idx in enumerate(bm25_ranks)}
        fused = rc.rrf_merge([dense_ranks, bm25_ranks], top_n=max(30, k * 3))
        # Tie-break: RRF's curve is flat enough that a confident exact-match BM25
        # rank-0 hit can score-tie a mediocre dense rank-0 hit (found 2026-08-01 on
        # a "T-S107" query — the wrong chunk won purely because dense_ranks was the
        # first list merged, an accidental artifact of dict/sort insertion order,
        # not a real judgment). On ties, prefer the better BM25 rank explicitly —
        # exact-match confidence is the more trustworthy signal at the margin.
        fused.sort(key=lambda kv: (-kv[1], bm25_rank_of.get(kv[0], 10**9)))
    else:
        # Fallback: dense-only if BM25 index hasn't been built yet (run rag.sh index)
        bm25_rank_of = {}
        fused = [(int(i), float(dense_scores[i])) for i in dense_ranks[:max(30, k * 3)]]

    # Generative-Agents-style nudge: recency + query-intent type match.
    #
    # 2026-08-01 lesson (found via testing, confirmed by a peer review from
    # Abdulaziz's Claude who'd hit the identical failure independently): applying
    # this as a multiplier on the RRF score does NOT just "break ties" — RRF's
    # curve is so flat (1/60 vs 1/65 differ ~8%) that even a 3-5% boost can flip
    # the order between a confident exact-match BM25 hit and an unrelated dense
    # hit. A signal that's only reliable/meaningful on a narrow subclass (recency,
    # type-match) must never outrank the primary retrieval signal — it should only
    # ever decide among candidates the primary signal already judged equal.
    # So: sort by RRF score first, BM25 rank second (exact-match protection, see
    # above), and recency/type only as a THIRD-level tie-break for the rare case
    # where the first two are also equal — never as a score multiplier.
    intent = rc.detect_query_intent(query)

    def _tiebreak_key(item):
        idx, score = item
        c = meta[int(idx)]
        rec = rc.recency_boost(c.get("mtime", 0))
        type_match = 1 if c.get("mem_type") == intent else 0
        return (-score, bm25_rank_of.get(idx, 10**9), -rec, -type_match)

    fused.sort(key=_tiebreak_key)

    top = [idx for idx, _ in fused[:k]]
    score_of = {idx: sc for idx, sc in fused}

    # --brief exists for the auto-search hook: a file/heading pointer plus a
    # short taste of the text is enough for the model to judge relevance and
    # go Read() the real file itself if it matters — it has to anyway per the
    # anti-hallucination rule, so paying for a long snippet up front is mostly
    # wasted tokens on the (majority of) turns where the hit goes unused.
    snippet_chars = 80 if brief else 280
    results = []
    for idx in top:
        c = meta[int(idx)]
        text = c["text"] if full else (c["text"][:snippet_chars] + ("…" if len(c["text"]) > snippet_chars else ""))
        results.append({
            "score": round(float(score_of[idx]), 4),
            "file": c["file"],
            "heading": c["heading"],
            "mem_type": c.get("mem_type", ""),
            "text": text,
        })

    # GraphRAG: 1-2 hop wikilink expansion from the main hits' own files. Deliberately
    # NOT merged into `results`/score_of above — a graph edge means "someone linked
    # these," not "this matches the query," so it goes in its own reserved section
    # instead of competing with the RRF ranking (see rag_common.build_link_graph
    # docstring for why). Opt-in via --graph, not wired into the auto-search hook —
    # this is a deliberate deeper-dive tool, not something to inject every turn.
    graph_results = []
    if graph:
        adjacency = rc.load_link_graph()
        seed_files = list(dict.fromkeys(r["file"] for r in results))  # dedupe, keep order
        neighbors = rc.graph_neighbors(adjacency, seed_files, hops=graph_hops, limit=8)
        already_shown = set(seed_files)
        file_to_chunk = {}
        for c in meta:
            file_to_chunk.setdefault(c["file"], c)  # first chunk per file = teaser
        for nbr_file, hop in neighbors:
            if nbr_file in already_shown:
                continue
            c = file_to_chunk.get(nbr_file)
            if not c:
                continue
            text = c["text"][:80] + ("…" if len(c["text"]) > 80 else "")
            graph_results.append({"file": nbr_file, "hop": hop, "heading": c["heading"], "text": text})

    if as_json:
        out = {"results": results}
        if graph:
            out["graph"] = graph_results
        print(json.dumps(out if graph else results, ensure_ascii=False, indent=2))
        return

    for r in results:
        loc = r["file"] + (f"  ›  {r['heading']}" if r["heading"] else "")
        print(f"\n[{r['score']}] {loc}")
        print(r["text"])

    if graph:
        print(f"\n🔗 Graph — {len(graph_results)} связанных заметок (не участвуют в ранжировании выше):")
        for g in graph_results:
            loc = g["file"] + (f"  ›  {g['heading']}" if g["heading"] else "")
            print(f"  [{g['hop']} hop] {loc}")
            print(f"    {g['text']}")
    elif not as_json and rc.is_relational_query(query):
        # Mechanism reminds, model decides (2026-08-01, per Saidazim: "mexanizm +
        # discipline" — the hook always runs this cheap hybrid pass regardless of
        # query shape; THIS line is the mechanism's nudge that graph expansion
        # might help here, but calling it is left to judgment, not auto-injected,
        # so plain queries stay cheap.
        adjacency = rc.load_link_graph()
        seed_files = [r["file"] for r in results]
        if rc.graph_neighbors(adjacency, seed_files, hops=1, limit=1):
            print(f'\n🔗 Похоже на связочный запрос — доступен graph expansion: rag.sh q "{query}" --graph')


if __name__ == "__main__":
    main()
