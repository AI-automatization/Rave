---
description: Research-before-code protocol — explore project before writing any code
argument-hint: "research [task description]"
---

# Research Skill — Explore Before Code

**RULE: Never write code without completing Research Phase first.**

---

## When to use

- Any new feature (even small)
- Bug fix in unfamiliar code
- Adding an endpoint to existing service
- Any change to shared/ files
- Any task touching 2+ files

---

## Research Phase — Step by Step

### Step 1: Understand the task
```
What exactly needs to change?
Which service/zone? (verify it's Saidazim's zone)
What's the expected input/output?
```

### Step 2: Find the relevant files
```bash
# Find service files
ls services/<name>/src/

# Find specific file
find services/<name>/src -name "*.ts" | grep -i <keyword>

# Find where something is defined
grep -r "functionName\|ClassName\|routeName" services/ --include="*.ts" -l
```

### Step 3: Read current implementation
```
1. Read routes file → understand existing endpoints
2. Read controller → understand HTTP handling
3. Read service → understand business logic
4. Read model → understand data structure
5. Read validators → understand expected input
```

### Step 4: Find related files
```bash
# Check imports
grep -r "import.*<symbol>" services/<name>/src/ --include="*.ts"

# Check shared usage
grep -r "<symbol>" shared/ --include="*.ts"

# Check if similar endpoint exists
grep -r "router\." services/<name>/src/routes/ --include="*.ts"
```

### Step 5: Check existing patterns
```
Same type of feature already exists? → follow that pattern
Similar service has this feature? → copy the pattern
```

### Step 6: Check constraints
```
Read CONSTRAINTS.md → any constraint applies here?
Read ARCHITECTURE.md → any pattern to follow?
```

---

## Research Output (required before Execute)

After research, output this summary:

```
[RESEARCH COMPLETE]

Task: <description>
Service: services/<name>/ (port XXXX)

Files to change:
1. <file>:<line-range> — <what to add/change>
2. <file>:<line-range> — <what to add/change>

Existing pattern found: <yes/no>
  → Following pattern from: <file>:<line>

Related files (read-only, no change):
- <file> — <why relevant>

Constraints that apply:
- <constraint 1>
- <constraint 2>

Plan:
1. <step 1>
2. <step 2>
3. <step 3>
```

Only after this output → proceed to Execute Phase.

---

## Anti-shortcuts

```
❌ "I'll add an endpoint to the content service" → first read content routes
❌ "I'll use the existing auth middleware" → first verify it exists at expected path
❌ "I'll update the user model" → first read the full model file
❌ "I know this pattern" → still verify with actual file read
```

---

## Integration with other skills

```
research → summary
  ├── found clear pattern → execute-judge-loop
  ├── architecture decision needed → brainstorm
  ├── bug fix → root-cause-tracing first
  └── large refactor → dev-workflow PRE-CHECK
```
