# product-capability

Transform product requirements into explicit engineering constraints before implementation begins. Use when a feature idea exists but implementation constraints remain unclear.

**Source:** LobeHub Skills Marketplace — affaan-m/ECC

---

## Purpose

Bridge the gap between "what should we build?" and "what must be true before coding starts?" — making hidden assumptions explicit before they become bugs.

## When to Use

- A new screen/feature is planned but architecture is unclear
- A feature spans multiple services (Mobile ↔ Backend API contract)
- Senior engineer keeps surfacing the same unstated assumptions
- You're about to implement something complex (WatchParty sync, Battle scoring)

## 4-Stage Process

### 1. Restate the Capability
Compress the request into one precise statement:
> "**[User type]** can **[do new thing]** which results in **[outcome]**"

Example:
> "A WatchParty owner can sync video position to all members in real-time, so everyone sees the same frame within 500ms"

### 2. Resolve Constraints
Extract what senior engineers hold in memory:
- **Business rules** — who can do what, when, with what limits
- **Scope boundaries** — what's explicitly NOT included
- **Invariants** — things that must always be true
- **Trust boundaries** — which client can be trusted, which needs server validation
- **Lifecycle** — created → active → ended → archived

### 3. Define Implementation Contract
Produce a concise plan covering:
- Actors (Owner, Member, Guest)
- Surfaces (Mobile screen, Socket event, REST endpoint)
- State transitions (diagram if complex)
- API interfaces (request/response shape)
- Data implications (new MongoDB fields, Redis keys)

### 4. Identify Readiness
- **Ready to implement** → point to the right screen/service/hook
- **Needs clarification** → list open questions explicitly
- **Needs architecture review** → flag before coding begins

## Output Format

```markdown
## Capability: [Name]

**Summary:** One sentence

**Actors:** Owner / Member / System

**Invariants:**
- [thing that must always be true]

**Contract:**
- Mobile sends: `{ event: '...', payload: {...} }`
- Server responds: `{ ... }`

**Non-goals:**
- [what this does NOT handle]

**Open questions:**
- [ ] [unresolved decision]
```

## CineSync Feature Examples

Use for: WatchParty sync edge cases, Battle scoring rules, Achievement trigger conditions, Friend request flows, Notification routing logic.
