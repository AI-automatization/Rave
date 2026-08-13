#!/usr/bin/env python3
"""Auto-insert wikilinks for known entities (people/services/concepts) into
episodic vault notes (DAILY/WEEKLY/MEETINGS) — reusable, not a one-off.

Only links the FIRST unlinked mention of each entity per file, skips
frontmatter/code blocks/existing wikilinks, and never links a person to
their own per-developer daily/weekly folder (self-link noise).

Usage:
  vault-autolink.py --dry-run    # print what would change, touch nothing
  vault-autolink.py --apply      # write changes
"""
import re
import sys
from pathlib import Path

VAULT = Path.home() / "Documents" / "weWatch-obsidian"

# Longest/most-specific names first so a shorter substring doesn't steal the
# match (e.g. "react-native" before a bare "React").
ENTITIES = [
    # Literal "services/<name>" code-path mentions are unambiguous (unlike a
    # bare "auth"/"user"/"content"/"admin", which collide with ordinary
    # English words constantly in these notes) — safe to auto-link even
    # though the bare service name isn't in this list.
    ("services/admin-ui", "PROJECTS/weWatch/services/admin-ui"),
    ("services/watch-party", "PROJECTS/weWatch/services/watch-party"),
    ("services/notification", "PROJECTS/weWatch/services/notification"),
    ("services/content", "PROJECTS/weWatch/services/content"),
    ("services/battle", "PROJECTS/weWatch/services/battle"),
    ("services/mobile", "PROJECTS/weWatch/services/mobile"),
    ("services/admin", "PROJECTS/weWatch/services/admin"),
    ("services/auth", "PROJECTS/weWatch/services/auth"),
    ("services/user", "PROJECTS/weWatch/services/user"),
    ("React Native", "PROJECTS/weWatch/concepts/react-native"),
    ("react-native", "PROJECTS/weWatch/concepts/react-native"),
    ("Elasticsearch", "PROJECTS/weWatch/concepts/Elasticsearch"),
    ("watch-party", "PROJECTS/weWatch/services/watch-party"),
    ("Socket.io", "PROJECTS/weWatch/concepts/Socket.io"),
    ("gamification", "PROJECTS/weWatch/concepts/gamification"),
    ("websockets", "PROJECTS/weWatch/concepts/websockets"),
    ("MongoDB", "PROJECTS/weWatch/concepts/MongoDB"),
    ("Railway", "PROJECTS/weWatch/concepts/Railway"),
    ("Redis", "PROJECTS/weWatch/concepts/Redis"),
    ("FCM", "PROJECTS/weWatch/concepts/FCM"),
    ("JWT", "PROJECTS/weWatch/concepts/JWT"),
    ("Saidazim", "PROJECTS/weWatch/people/Saidazim"),
    ("Emirhan", "PROJECTS/weWatch/people/Emirhan"),
    ("Jasur", "PROJECTS/weWatch/people/Jasur"),
    # tezCode roster (Bekzod/Abdulaziz/Diyor/Sardor/Akmal/Abubakir) deliberately
    # NOT auto-linked: 2026-08-01 caught this script linking "Abdulaziz" and
    # "Sardor" mentioned inside an unrelated external client project's daily
    # note (LevelUp Academy team roster) to the tezCode people pages — common
    # Uzbek first names collide across projects, identity isn't verifiable from
    # a bare string match. Link these manually only when the surrounding
    # context actually confirms it's the tezCode person.
]

PERSON_SELF = {
    "Saidazim": "PROJECTS/weWatch/people/Saidazim",
    "Emirhan": "PROJECTS/weWatch/people/Emirhan",
}

WIKILINK_RE = re.compile(r"\[\[.*?\]\]")
CODEBLOCK_RE = re.compile(r"```.*?```", re.DOTALL)
INLINECODE_RE = re.compile(r"`[^`\n]+`")
MDLINK_RE = re.compile(r"\[[^\]]*\]\([^)]*\)")  # [text](url) — don't touch link text either
HEADING_RE = re.compile(r"^#{1,6}\s.*$", re.MULTILINE)


def protected_spans(body: str):
    spans = []
    for pat in (WIKILINK_RE, CODEBLOCK_RE, INLINECODE_RE, MDLINK_RE, HEADING_RE):
        for m in pat.finditer(body):
            spans.append((m.start(), m.end()))
    return spans


def overlaps(pos_start, pos_end, spans):
    return any(s < pos_end and pos_start < e for s, e in spans)


def split_frontmatter(text: str):
    if text.startswith("---\n"):
        end = text.find("\n---\n", 4)
        if end != -1:
            return text[: end + 5], text[end + 5 :]
    return "", text


def owning_person(rel_path: str):
    parts = Path(rel_path).parts
    if len(parts) >= 2 and parts[0] in ("DAILY", "WEEKLY") and parts[1] in PERSON_SELF:
        return parts[1]
    return None


def process_file(path: Path, rel_path: str, apply: bool):
    text = path.read_text(encoding="utf-8")
    frontmatter, body = split_frontmatter(text)
    already_linked_targets = {m.group(0) for m in WIKILINK_RE.finditer(body)}
    skip_person = owning_person(rel_path)

    changes = []
    spans = protected_spans(body)
    new_body = body

    for name, target in ENTITIES:
        if skip_person and name == skip_person:
            continue
        if any(target in link for link in already_linked_targets):
            continue  # already linked somewhere in this file
        pattern = re.compile(r"(?<!\[)\b" + re.escape(name) + r"\b(?!\]|\|)")
        m = pattern.search(new_body)
        if not m:
            continue
        if overlaps(m.start(), m.end(), protected_spans(new_body)):
            continue
        replacement = f"[[{target}|{m.group(0)}]]"
        new_body = new_body[: m.start()] + replacement + new_body[m.end() :]
        changes.append(f"{name} -> {target}")

    if changes:
        if apply:
            path.write_text(frontmatter + new_body, encoding="utf-8")
        return changes
    return []


def main():
    apply = "--apply" in sys.argv
    targets = []
    for folder in ("DAILY", "WEEKLY", "MEETINGS"):
        targets.extend((VAULT / folder).rglob("*.md"))

    total_files = 0
    total_links = 0
    for path in sorted(targets):
        rel = str(path.relative_to(VAULT))
        changes = process_file(path, rel, apply)
        if changes:
            total_files += 1
            total_links += len(changes)
            print(f"{rel}: {', '.join(changes)}")

    mode = "APPLIED" if apply else "DRY-RUN"
    print(f"\n[{mode}] {total_links} links across {total_files} files")


if __name__ == "__main__":
    main()
