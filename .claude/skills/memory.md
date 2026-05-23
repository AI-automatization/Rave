---
description: Memory management — read vault at session start, update at session end
argument-hint: "memory [read|update|save-session]"
---

# Memory Skill — Persistent AI Memory Layer

Manages reading and writing of project memory in Obsidian vault.

---

## VAULT PATH

```bash
VAULT=~/Documents/weWatch-obsidian
PROJECT=$VAULT/PROJECTS/weWatch
```

---

## READ MEMORY (session start / before any task)

Read these files in this order:

```bash
# 1. Constraints first (anti-hallucination)
Read $PROJECT/CONSTRAINTS.md

# 2. Last session (where we stopped)
Read $PROJECT/LAST_SESSION.md

# 3. Architecture (avoid inventing patterns)
Read $PROJECT/ARCHITECTURE.md

# 4. Active tasks
Read ~/Desktop/Rave/docs/Tasks.md

# 5. Decisions (why things are the way they are)
Read $PROJECT/DECISIONS.md

# 6. Current bugs (avoid re-introducing them)
Read $PROJECT/_bugs.md
Read $PROJECT/_android-bugs.md (if mobile context)

# 7. Lessons learned (past mistakes)
Read $VAULT/AI_CONTEXT/lessons-learned.md
```

**After reading, output summary:**
```
[MEMORY LOADED]
Last session: <date> — <what was done in 1 line>
Where stopped: <next step>
Open tasks: <count> pending
Key constraint reminder: <most important constraint>
```

---

## UPDATE MEMORY (after completing work)

### Update LAST_SESSION.md
At the END of each work session, update `$PROJECT/LAST_SESSION.md`:

```markdown
## Последняя сессия
**Дата:** YYYY-MM-DD HH:MM
**Последний коммит:** `<hash> <message>`

## Что делали
- <task 1>
- <task 2>

## Что завершили
- T-SXXX ✅ <name>

## Где остановились
<specific next step — file:line if possible>

## Следующий шаг
<exact command or action>

## Открытые вопросы
- <question 1>
```

### Save decision to DECISIONS.md
When making an architecture decision:
```bash
.claude/scripts/obsidian-note.sh decision weWatch "<title>" "<body>" Saidazim
```

### Save bug to _bugs.md
When finding/fixing a bug:
```bash
.claude/scripts/obsidian-note.sh bug weWatch "<bug title>" "<root cause + fix>" Saidazim
```

---

## CHECKPOINT DURING WORK

```bash
# Task start:
.claude/scripts/obsidian-checkpoint.sh T-XXX 0 "" "first step — file:line"

# After each modified file:
.claude/scripts/obsidian-checkpoint.sh T-XXX 40 "File.ts done" "next — Service.ts"

# Task complete:
.claude/scripts/obsidian-checkpoint.sh clear "T-XXX"
```

---

## RESUME PROTOCOL

When starting a new session, output:

```
В прошлой сессии:
- <bullet 1>
- <bullet 2>

Где остановились:
<specific location>

Следующий шаг:
<exact action>

Продолжим?
```

Only proceed after user confirms or redirects.

---

## MEMORY FILE MAP

| File | When to read | When to update |
|------|-------------|----------------|
| LAST_SESSION.md | Every session start | Every session end |
| ARCHITECTURE.md | Before any backend task | When arch changes |
| CONSTRAINTS.md | Every session start | When new constraint added |
| DECISIONS.md | Before arch change | After arch decision |
| API.md | Before adding endpoint | After adding endpoint |
| _bugs.md | Before bug fix | After bug fix |
| lessons-learned.md | Every session start | After incident |
| Tasks.md | Every session start | After task status change |
