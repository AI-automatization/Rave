#!/usr/bin/env python3
"""Build the Obsidian RAG index: walk the vault, chunk, embed, save.

Usage: rag_index.py [--vault PATH]
"""
import sys
import json
import time
from pathlib import Path

import rag_common as rc


def main():
    vault = rc.VAULT
    if "--vault" in sys.argv:
        vault = Path(sys.argv[sys.argv.index("--vault") + 1]).expanduser()

    if not vault.exists():
        print(f"[rag] vault not found: {vault}")
        sys.exit(1)

    t0 = time.time()
    chunks = []
    files = 0
    for path in rc.iter_md_files(vault):
        files += 1
        for ch in rc.chunk_file(path, vault):
            chunks.append(ch)

    # Procedural memory (skills) — separate root (git repo, not the vault).
    skill_files = 0
    for path in rc.iter_skill_files():
        skill_files += 1
        for ch in rc.chunk_file(path, rc.SKILLS_DIR):
            ch["file"] = f"SKILLS/{ch['file']}"
            ch["mem_type"] = "procedural"
            chunks.append(ch)
    files += skill_files

    if not chunks:
        print(f"[rag] no chunks found in {vault}")
        sys.exit(1)

    print(f"[rag] {files} files -> {len(chunks)} chunks. embedding ...")
    texts = [f"{c['heading']}\n{c['text']}" if c["heading"] else c["text"] for c in chunks]
    vectors = rc.embed(texts)

    rc.INDEX_DIR.mkdir(parents=True, exist_ok=True)
    import numpy as np
    np.save(rc.VECTORS_PATH, vectors)
    rc.META_PATH.write_text(json.dumps(chunks, ensure_ascii=False), encoding="utf-8")

    print("[rag] building BM25 (keyword) index ...")
    bm25 = rc.build_bm25(chunks)
    rc.save_bm25(bm25)

    print("[rag] building wikilink graph ...")
    graph = rc.build_link_graph(vault)
    rc.save_link_graph(graph)
    edge_count = sum(len(v) for v in graph.values()) // 2
    connected = sum(1 for v in graph.values() if v)

    dt = time.time() - t0
    print(f"[rag] indexed {len(chunks)} chunks from {files} files in {dt:.1f}s")
    print(f"[rag] dim={vectors.shape[1]}  hybrid=dense+bm25  index={rc.INDEX_DIR}")
    print(f"[rag] graph: {connected} connected nodes, {edge_count} edges")


if __name__ == "__main__":
    main()
