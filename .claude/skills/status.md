---
description: Show current project status — last session, active tasks, git state, next step
argument-hint: "status"
---

# Status Skill — Project State Overview

Shows a complete snapshot of where the project is right now.

---

## Run these commands

```bash
# 1. Git state
git log --oneline -5
git status --short

# 2. Active tasks
grep -A8 "🔄 Bajarilmoqda\|pending\[Saidazim\]" ~/Desktop/Rave/docs/Tasks.md | head -40

# 3. Last session
cat ~/Documents/weWatch-obsidian/PROJECTS/weWatch/LAST_SESSION.md

# 4. In-progress context
cat ~/Documents/weWatch-obsidian/AI_CONTEXT/in-progress-saidazim.md 2>/dev/null

# 5. Today's daily note
cat ~/Documents/weWatch-obsidian/DAILY/Saidazim/$(date '+%Y-%m-%d').md 2>/dev/null
```

---

## Output format

After running commands, output:

```
══════════════════════════════════════
📊 WeWatch — Project Status
══════════════════════════════════════

🕐 Last session: <date>
   Did: <1-line summary>
   Next: <specific next step>

🔄 Active tasks:
   T-SXXX | P1 | <name> — <status>
   (none if empty)

📌 Git:
   Branch: <branch>
   Last commit: <hash> <message>
   Uncommitted: <N> files
   Modified: <list if any>

⚠️  Blockers:
   <any blockers or "none">

💡 Recommendation:
   Continue <task> OR Start <new task>

══════════════════════════════════════
```

---

## When to use

- At the start of any session (after memory.md read)
- When asked "что делаем?" / "где мы?"
- Before starting a new task
- When switching context

---

## Linked to

- memory.md → read memory first
- Tasks.md → active task list
- LAST_SESSION.md → where we stopped
