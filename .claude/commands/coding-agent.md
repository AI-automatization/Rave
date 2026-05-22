# coding-agent

Delegate substantial coding tasks to a background worker. Use for large feature builds, PR reviews, and refactors — NOT for simple one-line edits.

**Source:** LobeHub Skills Marketplace — openclaw/openclaw

---

## When to Use

- Building a new screen from scratch (e.g., full WatchPartyScreen with Socket.io)
- Reviewing a PR for correctness
- Refactoring a large file (300+ lines → split into hooks + screen)
- Implementing a complex feature across multiple files

## When NOT to Use

- Simple one-liner fixes (just edit directly)
- Passive code reading (use Read tool)
- Quick bug fixes under 10 lines

## Workflow

### 1. Define the Task
Write a precise prompt covering:
- What to build/fix
- Files to touch: `apps/mobile/src/screens/`, `apps/mobile/src/hooks/`, etc.
- Constraints: 300-line screen limit, StyleSheet.create, no `any` types
- Definition of done

### 2. Launch Worker
For Claude Code sub-agent:
```
--permission-mode bypassPermissions --print
```

### 3. Monitor
Track via process command. Worker must report back when done.

### 4. Review Output
- Check types: no `any`, no `console.log` without `__DEV__`
- Check size: screens ≤ 300 lines, logic extracted to hooks
- Check design: StyleSheet.create, theme tokens used

---

## CineSync Task Template

```
Task: Build [ScreenName]

Location: apps/mobile/src/screens/[ScreenName].tsx

Requirements:
- [functional requirement]
- [functional requirement]

Constraints:
- Max 300 lines
- Use StyleSheet.create (no inline styles)
- Use colors/spacing from apps/mobile/src/theme
- No any types (TypeScript strict)
- Loading + error + empty states required

API: [endpoint or socket event]
Navigation: [how to get to this screen]
```
