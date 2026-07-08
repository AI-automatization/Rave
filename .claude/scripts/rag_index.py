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

    dt = time.time() - t0
    print(f"[rag] indexed {len(chunks)} chunks from {files} files in {dt:.1f}s")
    print(f"[rag] dim={vectors.shape[1]}  index={rc.INDEX_DIR}")


if __name__ == "__main__":
    main()
