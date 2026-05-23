---
description: Read-before-write protocol — always read files fully before editing
argument-hint: "read-before-write"
---

# Read-Before-Write — File Safety Protocol

**RULE: Read every file completely before making ANY change to it.**

---

## Why this exists

Claude hallucinates file contents. Without reading first:
- Wrong line numbers → edit fails or corrupts file
- Outdated assumptions → introduce regression
- Missing context → break existing logic
- Duplicate code → service already has the function

---

## Protocol

### Before editing ANY file:

```
1. Read <file_path>                    ← full file, not partial
2. Note current line count
3. Find the exact insertion/change point
4. Verify the function/class exists
5. Check imports at top of file
6. Understand surrounding context
7. Only then: Edit <file_path>
```

### Before creating a new file:

```
1. find . -name "*<name>*" → file doesn't already exist?
2. ls <directory>/ → understand what's already there
3. Read similar file → use same structure/imports
4. Check package.json → verify import exists
5. Only then: Write <new_file>
```

---

## Verification checklist (before Edit/Write)

```
□ I have read this file in this session
□ I know the current line count (approximately)
□ I can see the exact lines I'm changing
□ The function/class I'm calling actually exists in the imported file
□ The import path is correct
□ No duplicate of this logic exists elsewhere
```

---

## Special cases

### Adding to routes file
```bash
# Always read routes file first
Read services/<name>/src/routes/<name>.routes.ts
# Find: where existing routes end, what middleware is used, imports at top
# Then add new route following the same pattern
```

### Adding to service
```bash
# Always read service file first
Read services/<name>/src/services/<name>.service.ts
# Find: class structure, existing methods, what's injected
# Then add method in right place
```

### Modifying model
```bash
# Read model AND migration story
Read services/<name>/src/models/<entity>.model.ts
# Find: existing fields, required vs optional, indexes
# NEVER add required: true to existing model without default value
```

### Adding to shared/
```bash
# Read existing shared file
Read shared/utils/<file>.ts   # or types/ or constants/
# Notify Telegram before changing
# Follow existing export pattern exactly
```

---

## Forbidden patterns

```typescript
// ❌ Writing based on assumption
// "The service probably has a getById method"
// → Read the service file first

// ❌ Partial read
// Reading first 50 lines only
// → Read the full file (especially bottom — exports, class closing)

// ❌ Edit without read
// Making change directly from task description
// → Always Read before Edit

// ❌ Copy-paste without verify
// "Same pattern as auth service"
// → Still read the target file to verify it's empty/correct
```
