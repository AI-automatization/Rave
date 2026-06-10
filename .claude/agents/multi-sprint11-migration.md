# ГРОМОВОЕ КОПЬЁ — MULTI-AGENT: Sprint 11 — DB Migration Completion
# T-S101 + T-S102 — parallel execution possible

## ЗАДАЧА
Завершить миграцию на единую БД cinesync:
1. T-S101: Migration script (cinesync_auth + cinesync_user → cinesync)
2. T-S102: tsc clean all services + db-architecture.html update

## AGENTS

### Agent 1 — Migration Script (T-S101, ~30 min)
```javascript
Agent({
  subagent_type: "general-purpose",
  isolation: "worktree",
  prompt: `
[ВСТАВЬ СОДЕРЖИМОЕ .claude/agents/auth-agent.md]

TASK SPEC:
  ID: T-S101
  Title: Migration script — cinesync_auth + cinesync_user → cinesync
  Problem: Старые данные в 2 отдельных БД, нужно объединить в cinesync
  Solution:
    1. Создать scripts/migrate-to-single-db.ts
    2. Читать cinesync_auth.users + cinesync_user.users
    3. Email-based merge → cinesync.users
    4. Добавить --dry-run флаг
    5. Добавить progress logging (logger, не console.log)
  Files:
    - services/auth/scripts/migrate-to-single-db.ts (создать)
    - Merge strategy: auth fields (rank, fcmTokens, settings) + user fields (profile, username)
  Verify: npx ts-node scripts/migrate-to-single-db.ts --dry-run

DO NOT commit. Return: STATUS + FILES_CHANGED + tsc result
  `
})
```

### Agent 2 — TSC Clean + Docs (T-S102, ~20 min)
```javascript
Agent({
  subagent_type: "general-purpose",
  prompt: `
TASK SPEC:
  ID: T-S102
  Title: tsc --noEmit check all services + update db-architecture.html

  Steps:
    1. cd services/auth && npx tsc --noEmit → report errors
    2. cd services/user && npx tsc --noEmit
    3. cd services/content && npx tsc --noEmit
    4. cd services/watch-party && npx tsc --noEmit
    5. cd services/battle && npx tsc --noEmit
    6. cd services/notification && npx tsc --noEmit
    7. cd services/admin && npx tsc --noEmit
    8. Read docs/db-architecture.html
    9. Update it: old (3 separate DBs) → new (single cinesync DB, merged users)

  Zone: services/*, docs/db-architecture.html
  Return: tsc results per service + updated html summary

DO NOT commit.
  `
})
```

## DISPATCH ORDER
T-S101 and T-S102 can run IN PARALLEL (different files, no conflicts).

```javascript
const [migrationResult, tscResult] = await Promise.all([
  Agent({ /* Agent 1 spec */ }),
  Agent({ /* Agent 2 spec */ })
]);
```

## POST-MERGE CHECKLIST
- [ ] tsc clean на всех сервисах
- [ ] Migration script: --dry-run успешен
- [ ] docs/db-architecture.html обновлён
- [ ] Done.md записать T-S101 + T-S102
- [ ] tg-notify done T-S101
- [ ] tg-notify done T-S102
- [ ] git commit + push

## VERIFICATION
```bash
# После запуска migration (production — только после backup!):
# npx ts-node scripts/migrate-to-single-db.ts --dry-run 2>&1 | head -50
# Ожидать: "DRY RUN: would migrate N users"
```
