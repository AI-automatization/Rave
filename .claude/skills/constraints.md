---
description: Constraints enforcement — anti-hallucination rules, forbidden patterns, zone checks
argument-hint: "constraints [check|remind]"
---

# Constraints Skill — Anti-Hallucination & Zone Enforcement

Enforces hard rules that prevent hallucination and destructive changes.

---

## ZONE CHECK (run before any task)

```bash
# What files will be touched?
# Check if they're in Saidazim's zone:

ALLOWED:
  services/auth/
  services/user/
  services/content/
  services/watch-party/
  services/battle/
  services/notification/
  services/admin/
  apps/admin-ui/
  shared/  (with lock protocol only)
  docs/
  docker-compose*.yml
  nginx/
  .github/
  .claude/

FORBIDDEN (don't touch):
  apps/mobile/    → Emirhan's zone
  apps/web/       → no owner assigned
```

If task touches `apps/mobile/` → STOP. Redirect to Emirhan.

---

## HALLUCINATION PREVENTION

### Before claiming a file exists:
```bash
find . -name "<filename>" 2>/dev/null
# or
ls services/<name>/src/
```

### Before claiming a function exists:
```bash
grep -r "function <name>\|const <name>\|<name>(" services/<name>/src/ --include="*.ts"
```

### Before claiming an endpoint exists:
```bash
grep -r "router\.(get|post|put|patch|delete)" services/<name>/src/routes/ --include="*.ts"
```

### Before claiming a package is installed:
```bash
cat services/<name>/package.json | grep '"<package>"'
```

### Before claiming an env variable exists:
```bash
cat services/<name>/src/config/index.ts | grep "<VAR_NAME>"
```

---

## PATTERN VERIFICATION

### "I'll use the existing pattern"
```bash
# Verify the pattern actually exists
grep -n "apiResponse\." services/<name>/src/controllers/ --include="*.ts" | head -5
```

### "I'll follow the same structure as auth"
```bash
# Verify by reading the auth structure
ls services/auth/src/
```

---

## FORBIDDEN CODE PATTERNS

```typescript
// ❌ any type
const data: any = {};
function process(input: any) {}

// ❌ console.log (production code)
console.log('debug', data);

// ❌ DB query in controller
router.get('/', async (req, res) => {
  const items = await Model.find({});  // belongs in service
});

// ❌ Nested try/catch
try {
  try {
    await something();
  } catch (inner) { /* ... */ }
} catch (outer) { /* ... */ }

// ❌ Magic numbers
if (attempts >= 5) {}  // use: if (attempts >= MAX_LOGIN_ATTEMPTS)

// ❌ Hardcoded secrets
const key = 'sk_live_abc123';  // use env variables

// ❌ File >400 lines (split it)
```

---

## BEFORE STARTING ANY TASK — CHECKLIST

```
□ Zone check: is this Saidazim's zone?
□ Not renaming Socket.io events?
□ Not changing API response format?
□ Not touching MongoDB required fields without default?
□ Not adding required npm dep without checking existing ones?
□ Read LAST_SESSION.md to understand context?
□ Read CONSTRAINTS.md for any specific constraint?
□ git pull origin main done?
□ Task claim in Tasks.md + git push done?
```

---

## SHARED/ PROTOCOL

If task touches shared/types/, shared/utils/, or shared/constants/:
```bash
# 1. Notify Telegram
.claude/scripts/tg-notify.sh update T-SXXX "SHARED" "Changing shared/<file>" Saidazim "Need confirmation"

# 2. Wait for confirmation from Emirhan

# 3. Create lock
echo "$(date '+%Y-%m-%dT%H:%M') Saidazim" > .claude/locks/shared-$(basename <file>).lock

# 4. Make change

# 5. Commit: "shared: <what added> (Saidazim)"

# 6. Remove lock
rm .claude/locks/shared-$(basename <file>).lock
```
