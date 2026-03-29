# SKILL: Subagent Driven Development
# Orchestrator dispatches agents with specs, agents communicate via structured messages

---

## TRIGGER

Mode B (Multi-Agent) selected. Orchestrator uses this skill to dispatch and coordinate agents.

## DISPATCH PROTOCOL

### Step 1: Task Analysis
```
Read docs/Tasks.md → identify open tasks
Classify each task:
  services/**         → Backend Agent
  apps/mobile/**      → Mobile Agent
  apps/web/**         → Web Agent
  shared/**           → Lock protocol → first available agent
  IKKALASI            → Sequential: Backend first, then Mobile/Web
```

### Step 2: Create Spec for Each Task
```
SPEC:
  task_id: T-XXXX
  title: [short description]
  problem: [what's wrong — with file:line references]
  solution: [what to change — specific, not vague]
  files_to_modify: [list of files]
  expected_outcome: [what should happen after fix]
  test_criteria: [how to verify it works]
```

### Step 3: Dispatch Agent with Full Context
```
Agent(
  subagent_type: "general-purpose",
  isolation: "worktree",
  prompt: """
    You are {ROLE} AGENT for CineSync.

    ZONE: {allowed_dirs}
    FORBIDDEN: {restricted_dirs}

    TASK SPEC:
    {spec_object}

    SKILLS ACTIVE:
    - Self-Reflection: Run 7-step check before submitting
    - Execute-Judge Loop: Write → compile → check → fix → repeat

    CONTEXT FILES (read these FIRST):
    {list_of_relevant_files}

    CONSTRAINTS:
    - DO NOT touch files outside your zone
    - DO NOT modify docs/Tasks.md or docs/Done.md
    - DO NOT commit — Orchestrator handles git
    - NO `any` type — TypeScript strict
    - NO console.log — use proper logger
    - If blocked → return error description, do not guess

    DELIVERABLES:
    1. Code changes within your ZONE only
    2. Self-check results (7 steps)
    3. Summary: files changed + what + why
  """
)
```

## AGENT COMMUNICATION FORMAT

### Agent → Orchestrator (on completion)
```
STATUS: COMPLETE / BLOCKED / PARTIAL
TASK: T-XXXX
FILES_CHANGED:
  - path/to/file.ts (N lines changed)
SELF_CHECK:
  imports: ✅
  functions: ✅
  socket_events: ✅
  api_endpoints: ✅
  tsc: ✅
  forbidden: ✅
  zone: ✅
SUMMARY: [What was done and why]
BLOCKERS: [If any — what prevented completion]
```

### Orchestrator → Critic Agent
```
REVIEW_REQUEST:
  task: T-XXXX
  agent: Mobile Agent
  diff: {unified diff from worktree}
  self_check: {agent's self-check results}
  spec: {original spec}
```

### Critic → Orchestrator
```
VERDICT: APPROVE / REJECT
SCORES: correctness/architecture/integration
ISSUES: [if reject — specific fixes needed]
```

### Orchestrator → QA Agents
```
TEST_REQUEST:
  scope: T-XXXX
  changed_files: [list]
  code_tests: [tsc, jest commands]
  visual_tests: [maestro, playwright commands]
```

## PARALLEL DISPATCH RULES

- Backend + Mobile agents can run in PARALLEL (different zones)
- Backend + Web agents can run in PARALLEL
- Mobile + Web agents can run in PARALLEL
- shared/ changes → SEQUENTIAL with lock protocol
- IKKALASI tasks → Backend FIRST, then Mobile/Web SECOND
