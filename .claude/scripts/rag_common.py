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

# Skills live in the git repo, not the vault — separate root, tagged procedural.
SKILLS_DIR = Path(__file__).resolve().parents[1] / "skills"

# CoALA-style memory taxonomy (episodic/semantic/procedural) — cheap re-categorization
# of files we already have, used to lightly boost ranking by query intent (see rag_query.py).
_EPISODIC_DIR_PREFIXES = ("DAILY/", "WEEKLY/", "MEETINGS/")
_EPISODIC_FILENAMES = {"LAST_SESSION.md"}
_EPISODIC_FILENAME_PREFIXES = ("handoff", "in-progress")

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


_FRONTMATTER_TYPE_RE = re.compile(r"^type:\s*(\S+)", re.MULTILINE)
# Marks noise lines auto-appended by session-stop.sh every turn (found during the
# 2026-08-01 chunk-quality audit) — genuinely content-free (just a timestamp stub).
# NOTE: "🚧 Checkpoint TASK-ID (X%)" lines look similar but carry real info (which
# task, what progress) — a first version of this regex stripped those too and
# silently deleted the only mention of a task ID from its daily note. Session
# started/ended only, nothing else.
_NOISE_LINE_RE = re.compile(
    r"^#{1,4}\s*🔴\s*Session (started|ended):.*$", re.MULTILINE
)


def _strip_frontmatter(text: str) -> tuple[str, str]:
    """Returns (body, frontmatter_type_value_or_empty)."""
    if text.startswith("---"):
        end = text.find("\n---", 3)
        if end != -1:
            fm = text[3:end]
            m = _FRONTMATTER_TYPE_RE.search(fm)
            return text[end + 4:], (m.group(1) if m else "")
    return text, ""


def classify_memory_type(rel_path: str, frontmatter_type: str) -> str:
    """CoALA-style tag: episodic (what happened when) / semantic (durable facts) /
    procedural (how to do things — skills). Path-based, since most files here
    predate any frontmatter type: convention and it's inconsistently used."""
    if frontmatter_type == "skill" or rel_path.startswith("SKILLS/"):
        return "procedural"
    if rel_path.startswith(_EPISODIC_DIR_PREFIXES):
        return "episodic"
    name = Path(rel_path).name
    if name in _EPISODIC_FILENAMES or name.startswith(_EPISODIC_FILENAME_PREFIXES):
        return "episodic"
    return "semantic"


def chunk_file(path: Path, vault: Path):
    """Yield {file, heading, text, mem_type, mtime} chunks for one markdown file."""
    try:
        raw = path.read_text(encoding="utf-8", errors="ignore")
        mtime = path.stat().st_mtime
    except Exception:
        return
    raw, fm_type = _strip_frontmatter(raw)
    raw = _NOISE_LINE_RE.sub("", raw)
    rel = str(path.relative_to(vault))
    mem_type = classify_memory_type(rel, fm_type)

    heading = ""
    buf, buf_len = [], 0

    def flush():
        nonlocal buf, buf_len
        if buf:
            text = "\n".join(buf).strip()
            if len(text) >= MIN_CHARS:
                yield_chunk = {
                    "file": rel, "heading": heading, "text": text,
                    "mem_type": mem_type, "mtime": mtime,
                }
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
        # A single paragraph bigger than MAX_CHARS on its own (code fences/tables
        # have no blank lines to split on) — flush it alone so it doesn't drag
        # unrelated later sections in under a stale heading (2026-08-01 audit finding).
        if buf_len + len(para) > MAX_CHARS and buf:
            c = flush()
            if c:
                yield c
        buf.append(para)
        buf_len += len(para)
        if len(para) > MAX_CHARS:
            c = flush()
            if c:
                yield c
    c = flush()
    if c:
        yield c


def iter_skill_files():
    """Skills (.claude/skills/*.md) — procedural memory, separate root from the vault."""
    if not SKILLS_DIR.exists():
        return
    for p in sorted(SKILLS_DIR.glob("*.md")):
        yield p


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


# ─── BM25 (sparse/keyword) — catches exact IDs (T-S189) and names dense embedding smears ──

BM25_PATH = INDEX_DIR / "bm25.pkl"

# Keeps hyphenated codes like "T-S189" as one token instead of splitting on "-".
_TOKEN_RE = re.compile(r"[a-zA-Zа-яА-ЯёЁ0-9]+(?:-[a-zA-Zа-яА-ЯёЁ0-9]+)*")


def tokenize(text: str):
    return [t.lower() for t in _TOKEN_RE.findall(text)]


def build_bm25(chunks):
    from rank_bm25 import BM25Okapi
    corpus = [tokenize(f"{c['heading']} {c['text']}" if c["heading"] else c["text"]) for c in chunks]
    return BM25Okapi(corpus)


def save_bm25(bm25) -> None:
    import pickle
    BM25_PATH.write_bytes(pickle.dumps(bm25))


def load_bm25():
    import pickle
    if not BM25_PATH.exists():
        return None
    return pickle.loads(BM25_PATH.read_bytes())


# ─── Generative-Agents-style scoring boost: recency + query-intent type match ──
# (RRF above still does the heavy lifting — this only nudges the final order,
# it never overrides an exact BM25/dense hit.)

import time as _time

_RECENCY_HALFLIFE_DAYS = 7.0

_EPISODIC_HINTS = re.compile(
    r"когда|вчера|на прошлой неделе|что случилось|что произошло|"
    r"qachon|kecha|nima bo'ldi|history|what happened|when did",
    re.IGNORECASE,
)
_PROCEDURAL_HINTS = re.compile(
    r"\bкак\b|как настроить|как сделать|как запустить|"
    r"qanday|how to|how do i|setup|install|configure",
    re.IGNORECASE,
)


_RELATIONAL_HINTS = re.compile(
    r"связан|связь|использует|зависит|влияет|подключ|кто работает|"
    r"related|connected|uses|depends|affects|who works|"
    r"bog'liq|foydalanadi|kim ishlaydi",
    re.IGNORECASE,
)


def is_relational_query(query: str) -> bool:
    """Mechanism+discipline split (2026-08-01): the hook always runs cheap hybrid
    search (mechanism, no LLM judgment needed). Graph expansion costs real context
    tokens, so it's never auto-injected — instead this flags queries that LOOK
    multi-hop/relational, so rag_query.py can print a one-line nudge and the model
    decides whether --graph is actually worth calling (discipline, not another
    always-on mechanism)."""
    return bool(_RELATIONAL_HINTS.search(query))


def detect_query_intent(query: str) -> str:
    """Crude keyword heuristic — good enough to break ties, not meant to be smart."""
    if _EPISODIC_HINTS.search(query):
        return "episodic"
    if _PROCEDURAL_HINTS.search(query):
        return "procedural"
    return "semantic"


def recency_boost(mtime: float, now=None) -> float:
    """0..1, exponential decay with a 30-day half-life. Recent files score near 1."""
    now = now if now is not None else _time.time()
    age_days = max(0.0, (now - mtime) / 86400.0)
    return 0.5 ** (age_days / _RECENCY_HALFLIFE_DAYS)


# ─── GraphRAG — wikilink graph over the vault ──
# Small (~240 nodes) and sparse (most notes are hub-and-spoke leaves, not a dense
# mesh — confirmed 2026-08-01 audit), so no need for PageRank/community-detection
# machinery: plain 1-2 hop neighbor expansion from the hybrid search's own top hits
# is the right-sized tool here. Lives in a separate reserved section of query
# output, never blended into the main RRF-ranked score — a graph edge is a
# "someone thought these are related" signal, not a relevance score, and mixing
# it into the main ranking would repeat the same mistake the recency/type boost
# already made once (see rag_query.py history).

GRAPH_PATH = INDEX_DIR / "graph.json"

_WIKILINK_RE = re.compile(r"\[\[([^\]|#]+?)(?:\\?\|[^\]]*)?(?:#[^\]|]*)?\]\]")


def _wikilink_targets(text: str):
    for m in _WIKILINK_RE.finditer(text):
        target = m.group(1).strip().rstrip("\\")
        if target and not target.startswith(("http://", "https://")):
            yield target


def build_link_graph(vault: Path) -> dict:
    """Undirected adjacency {rel_path: [rel_path, ...]} built from [[wikilinks]].

    Resolution mirrors Obsidian's own behaviour (basename lookup, not filesystem-
    relative joining — confirmed empirically 2026-08-01: this vault mixes
    "../x/y" and "PROJECTS/x/y" link styles and Obsidian resolves both the same
    way, by matching path suffix / unique basename against the vault index, not
    by joining "../" against the source file's directory).
    """
    files = list(iter_md_files(vault))
    full_paths_noext = {str(p.relative_to(vault))[:-3]: str(p.relative_to(vault)) for p in files}
    basename_to_rels: dict = {}
    for p in files:
        basename_to_rels.setdefault(p.stem, []).append(str(p.relative_to(vault)))

    def resolve(target: str):
        candidate = target.lstrip("./").lstrip("../")
        for key in (target, candidate):
            if key in full_paths_noext:
                return full_paths_noext[key]
        base = Path(target).name
        rels = basename_to_rels.get(base)
        if rels and len(rels) == 1:
            return rels[0]
        return None  # unresolved or ambiguous — skip rather than guess

    adjacency: dict = {}
    for p in files:
        src = str(p.relative_to(vault))
        try:
            text = p.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        for target in _wikilink_targets(text):
            dst = resolve(target)
            if not dst or dst == src:
                continue
            adjacency.setdefault(src, [])
            if dst not in adjacency[src]:
                adjacency[src].append(dst)
            adjacency.setdefault(dst, [])
            if src not in adjacency[dst]:
                adjacency[dst].append(src)
    return adjacency


def save_link_graph(adjacency: dict) -> None:
    GRAPH_PATH.write_text(json.dumps(adjacency, ensure_ascii=False, indent=0), encoding="utf-8")


def load_link_graph():
    if not GRAPH_PATH.exists():
        return {}
    return json.loads(GRAPH_PATH.read_text(encoding="utf-8"))


def graph_neighbors(adjacency: dict, seed_files, hops: int = 1, limit: int = 8):
    """BFS expansion from seed files, excluding the seeds themselves. Returns
    [(file, hop_distance), ...] closest-first, capped at `limit`."""
    seen = set(seed_files)
    frontier = list(seed_files)
    result = []
    for hop in range(1, hops + 1):
        next_frontier = []
        for node in frontier:
            for nbr in adjacency.get(node, []):
                if nbr in seen:
                    continue
                seen.add(nbr)
                result.append((nbr, hop))
                next_frontier.append(nbr)
                if len(result) >= limit:
                    return result
        frontier = next_frontier
        if not frontier:
            break
    return result


def rrf_merge(rank_lists, k: int = 60, top_n: int = 30):
    """Reciprocal Rank Fusion — combine multiple ranked index lists (best-first)
    into one score per index. Different retrievers (dense cosine, BM25) live on
    incomparable scales, so we fuse by RANK POSITION, not raw score."""
    scores: dict = {}
    for ranks in rank_lists:
        for pos, idx in enumerate(ranks[:top_n]):
            scores[idx] = scores.get(idx, 0.0) + 1.0 / (k + pos + 1)
    return sorted(scores.items(), key=lambda kv: -kv[1])
