"""Shared helpers for the Obsidian RAG memory (index + query).

Lightweight, fully local: fastembed (ONNX, no torch) + numpy brute-force cosine.
No external API calls — the vault never leaves the machine.
"""
import os
import re
import json
from pathlib import Path

MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"

# Vault location: env override, else WeWatch default.
VAULT = Path(os.environ.get("OBSIDIAN_VAULT", str(Path.home() / "Documents" / "weWatch-obsidian")))

# Index lives next to the venv so it is easy to wipe/rebuild.
ROOT = Path(__file__).resolve().parents[1]          # .claude/
INDEX_DIR = ROOT / "rag" / "index"
VECTORS_PATH = INDEX_DIR / "vectors.npy"
META_PATH = INDEX_DIR / "meta.json"

# Chunking: pack paragraphs up to ~MAX_CHARS, carry one paragraph as overlap.
MAX_CHARS = 1000
MIN_CHARS = 60

_SKIP_DIRS = {".git", ".obsidian", ".trash", "node_modules"}


def iter_md_files(vault: Path):
    for p in vault.rglob("*.md"):
        if any(part in _SKIP_DIRS for part in p.parts):
            continue
        yield p


def _strip_frontmatter(text: str) -> str:
    if text.startswith("---"):
        end = text.find("\n---", 3)
        if end != -1:
            return text[end + 4:]
    return text


def chunk_file(path: Path, vault: Path):
    """Yield {file, heading, text} chunks for one markdown file."""
    try:
        raw = path.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return
    raw = _strip_frontmatter(raw)
    rel = str(path.relative_to(vault))

    heading = ""
    buf, buf_len = [], 0

    def flush():
        nonlocal buf, buf_len
        if buf:
            text = "\n".join(buf).strip()
            if len(text) >= MIN_CHARS:
                yield_chunk = {"file": rel, "heading": heading, "text": text}
                buf = buf[-1:] if len(buf) > 1 else []  # 1-paragraph overlap
                buf_len = sum(len(x) for x in buf)
                return yield_chunk
            buf, buf_len = [], 0
        return None

    paragraphs = re.split(r"\n\s*\n", raw)
    for para in paragraphs:
        para = para.strip()
        if not para:
            continue
        m = re.match(r"^#{1,6}\s+(.*)", para)
        if m:
            heading = m.group(1).strip()
        if buf_len + len(para) > MAX_CHARS and buf:
            c = flush()
            if c:
                yield c
        buf.append(para)
        buf_len += len(para)
    c = flush()
    if c:
        yield c


_model = None


def get_model():
    global _model
    if _model is None:
        from fastembed import TextEmbedding
        _model = TextEmbedding(model_name=MODEL_NAME)
    return _model


def embed(texts):
    import numpy as np
    vecs = np.array(list(get_model().embed(texts)), dtype="float32")
    norms = np.linalg.norm(vecs, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    return vecs / norms  # L2-normalized → cosine == dot product


def load_index():
    import numpy as np
    if not VECTORS_PATH.exists() or not META_PATH.exists():
        return None, None
    vectors = np.load(VECTORS_PATH)
    meta = json.loads(META_PATH.read_text(encoding="utf-8"))
    return vectors, meta
