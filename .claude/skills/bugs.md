---
description: Bug logging skill — save bugs to Obsidian vault with root cause and fix
argument-hint: "bugs [log|list|search <keyword>]"
---

# Bugs Skill — Bug Memory System

Saves bugs to `~/Documents/weWatch-obsidian/PROJECTS/weWatch/_bugs.md`
and Android-specific bugs to `_android-bugs.md`.

---

## Before fixing any bug

**MANDATORY: Read bug logs first.**

```bash
# Check if this bug (or similar) was seen before
cat ~/Documents/weWatch-obsidian/PROJECTS/weWatch/_bugs.md
cat ~/Documents/weWatch-obsidian/PROJECTS/weWatch/_android-bugs.md  # if Android

# Search for related bugs
grep -i "<keyword>" ~/Documents/weWatch-obsidian/PROJECTS/weWatch/_bugs.md
```

If bug already in log → check previous fix attempt first.

---

## Log a new bug

```bash
.claude/scripts/obsidian-note.sh bug weWatch "<title>" "<body>" Saidazim
```

Body format:
```
Root cause: <why it happened>
Fix: <what was changed, file:line>
How to avoid: <pattern to prevent recurrence>
```

Example:
```bash
.claude/scripts/obsidian-note.sh bug weWatch \
  "adminClient double /api/v1 path" \
  "Root cause: EXPO_PUBLIC_ADMIN_URL already has /api/v1, client.ts added another.
Fix: removed /api/v1 from createClient call in apps/admin-ui/src/lib/client.ts:12.
How to avoid: never add /api/v1 to axios base when env var already contains it." \
  Saidazim
```

---

## Android bug format (for _android-bugs.md)

Use when bug is device/OS specific:

```markdown
### BUG-A001 | Title | STATUS

- **Symptom:** What user sees
- **Device/OS:** Samsung A52 / Android 13
- **Reproduce:** Steps to reproduce
- **Root cause:** Why it happens
- **Attempts:**
  1. ❌ [date] What was tried → what happened (FAILED)
  2. ✅ [date] What fixed it → WORKED
- **Final fix:** file:line — what changed
- **Lesson:** What NOT to do next time
```

STATUS: 🔴 OPEN | 🟡 INVESTIGATING | 🟢 CLOSED

---

## Bug log structure in _bugs.md

```markdown
### 🐛 [weWatch] <title>
> <root cause and fix in 2-3 sentences>
> Found: YYYY-MM-DD | By: Saidazim
```

---

## Known bugs (do NOT reproduce)

### adminClient double /api/v1
`EXPO_PUBLIC_ADMIN_URL` already contains `/api/v1`.
Do NOT add `/api/v1` when creating axios client.

### Socket.io event rename
Renaming ANY event breaks 3 platforms simultaneously.
Change event name ONLY via shared/constants/socket-events.ts + all platforms at once.

### Android clean video fix
`cleanUrlFoundRef + normalizeDetectedMedia + isDirectVideoUrl + perf sync scan`
DO NOT BREAK these — critical for Android video playback.
See memory file: `android_clean_video_fix.md`
