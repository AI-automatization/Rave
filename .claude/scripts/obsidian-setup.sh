#!/usr/bin/env bash
# CineSync — Obsidian Vault Setup (run once per developer machine)
# Usage: bash .claude/scripts/obsidian-setup.sh

set -euo pipefail

VAULT="${CINESYNC_VAULT:-$HOME/Documents/CineSync-Vault}"
SERVICES=(auth user content watch-party battle notification admin)
NOW=$(date '+%Y-%m-%d')

echo "🎬 CineSync Obsidian Vault setup → $VAULT"

# ── Directory structure ────────────────────────────────────────────
mkdir -p "$VAULT"/{AI_CONTEXT,DAILY,WEEKLY,DECISIONS,BUGS,TASKS}
mkdir -p "$VAULT/SERVICES/_TEMPLATE/decisions"
for svc in "${SERVICES[@]}"; do
  mkdir -p "$VAULT/SERVICES/$svc/decisions"
done
mkdir -p "$VAULT/MOBILE/decisions"
mkdir -p "$VAULT/SHARED/decisions"
mkdir -p "$VAULT/.obsidian/plugins/"{dataview,homepage,obsidian-git}

# ── .obsidian configs ──────────────────────────────────────────────
cat > "$VAULT/.obsidian/core-plugins.json" << 'EOF'
["file-explorer","global-search","switcher","graph","backlink","outgoing-link","tag-pane","daily-notes","templates","note-composer","command-palette","markdown-importer","word-count"]
EOF

cat > "$VAULT/.obsidian/community-plugins.json" << 'EOF'
["dataview","homepage","obsidian-git"]
EOF

cat > "$VAULT/.obsidian/daily-notes.json" << 'EOF'
{"autorun":false,"template":"","folder":"DAILY","format":"YYYY-MM-DD"}
EOF

cat > "$VAULT/.obsidian/plugins/dataview/data.json" << 'EOF'
{"enableDataviewJs":true,"enableInlineDataview":true,"enableInlineDataviewJs":true,"prettyRenderInlineFields":true}
EOF

cat > "$VAULT/.obsidian/plugins/homepage/data.json" << 'EOF'
{"version":3,"defaultNote":"HOME","openMode":"desktop","manualOpenMode":"desktop","refreshDataview":true}
EOF

cat > "$VAULT/.obsidian/plugins/obsidian-git/data.json" << 'EOF'
{"commitMessage":"vault: {{date}}","autoCommitMessage":"vault: auto {{date}}","commitDateFormat":"YYYY-MM-DD HH:mm","autoSaveInterval":30,"autoPushInterval":0,"autoBackoffCommit":true,"pullUpdateStrategy":"merge","syncMethod":"merge","customMessageOnAutoBackup":true,"showedMobileNotice":true,"diffStyle":"git","lineAuthor":{"show":false},"showFileMenu":true,"refreshSourceControl":false,"basePath":""}
EOF

# ── HOME.md ────────────────────────────────────────────────────────
cat > "$VAULT/HOME.md" << EOF
---
type: home
---

# 🎬 CineSync — Knowledge Base

> Ijtimoiy Onlayn Kinoteatr · Backend + Mobile + Web

---

## 🧭 Quick Navigation

| | |
|---|---|
| [[AI_CONTEXT/dashboard\|📊 Dashboard]] | [[TASKS/active\|📋 Active Tasks]] |
| [[AI_CONTEXT/current-week\|📅 This Week]] | [[DECISIONS/index\|🏛 Decisions]] |

## 🏗 Services

| Service | Port | Context |
|---------|------|---------|
| [[SERVICES/auth/_context\|Auth]] | 3001 | JWT · bcrypt · RS256 |
| [[SERVICES/user/_context\|User]] | 3002 | Profile · Friends · Heartbeat |
| [[SERVICES/content/_context\|Content]] | 3003 | Movies · Elasticsearch · HLS |
| [[SERVICES/watch-party/_context\|Watch Party]] | 3004 | Socket.io · Sync · Redis |
| [[SERVICES/battle/_context\|Battle]] | 3005 | 1v1 · Leaderboard · Gamification |
| [[SERVICES/notification/_context\|Notification]] | 3007 | FCM · Bull · Email |
| [[SERVICES/admin/_context\|Admin]] | 3008 | Dashboard · Analytics |

## 📱 Zones

- [[MOBILE/_context|📱 Mobile]] — Emirhan · React Native · Expo
- [[SHARED/_context|🔗 Shared]] — Types · Utils · Constants · Middleware

---
*Updated: $NOW*
EOF

# ── AI_CONTEXT/dashboard.md ────────────────────────────────────────
cat > "$VAULT/AI_CONTEXT/dashboard.md" << 'EOF'
---
type: dashboard
---

# 📊 CineSync Dashboard

## 🔴 Open Bugs

```dataview
TABLE service, severity, file.mtime AS "Updated"
FROM "BUGS"
WHERE status = "open"
SORT severity ASC, file.mtime DESC
```

## 🏛 Recent Decisions (last 10)

```dataview
TABLE service, decision_type AS "Type"
FROM "DECISIONS"
SORT file.ctime DESC
LIMIT 10
```

## 📋 Active Tasks (from Tasks sync)

```dataview
TABLE assignee, priority
FROM "TASKS/active"
SORT priority ASC
```

## 📅 Sessions This Week

```dataview
TABLE developer, service
FROM "DAILY"
WHERE file.mtime >= date(today) - dur(7 days)
SORT file.mtime DESC
```
EOF

# ── AI_CONTEXT/current-week.md ─────────────────────────────────────
WEEK=$(date '+%Y-W%V')
cat > "$VAULT/AI_CONTEXT/current-week.md" << EOF
---
week: $WEEK
updated: $NOW
---

# 📅 $WEEK

## 🎯 Focus
- [ ] MVP E2E test (T-C012)
- [ ] Video extractor prod test (T-C013)

## ✅ Done This Week
<!-- auto-updated by obsidian-session-stop.sh -->

## 🚧 Blockers
<!-- fill in manually -->

## 📝 Notes
EOF

# ── DECISIONS/index.md ─────────────────────────────────────────────
cat > "$VAULT/DECISIONS/index.md" << 'EOF'
---
type: decisions-index
---

# 🏛 Architecture Decision Records

```dataview
TABLE service, decision_type AS "Type", file.ctime AS "Date"
FROM "DECISIONS"
WHERE type = "decision"
SORT file.ctime DESC
```
EOF

# ── TASKS/active.md (placeholder — synced by obsidian-tasks-sync.sh) ─
cat > "$VAULT/TASKS/active.md" << EOF
---
type: tasks-active
synced: $NOW
---

# 📋 Active Tasks

> Auto-synced from \`docs/Tasks.md\` — run \`obsidian-tasks-sync.sh\` to refresh

EOF

cat > "$VAULT/TASKS/done.md" << EOF
---
type: tasks-done
synced: $NOW
---

# ✅ Completed Tasks

> Auto-synced from \`docs/Done.md\` — last 50 entries

EOF

# ── Service _context.md files ──────────────────────────────────────
for svc in "${SERVICES[@]}"; do
  PORT_MAP=(auth:3001 user:3002 content:3003 watch-party:3004 battle:3005 notification:3007 admin:3008)
  PORT="?"
  for entry in "${PORT_MAP[@]}"; do
    if [[ "${entry%%:*}" == "$svc" ]]; then PORT="${entry##*:}"; fi
  done

  cat > "$VAULT/SERVICES/$svc/_context.md" << EOF
---
service: $svc
port: $PORT
status: active
type: backend
last_updated: $NOW
---

# ⚙️ $svc service (port $PORT)

## Recent Commits
<!-- auto-updated by obsidian-session-stop.sh -->

## Key Files
- \`services/$svc/src/controllers/\`
- \`services/$svc/src/services/\`
- \`services/$svc/src/models/\`
- \`services/$svc/src/routes/\`

## Active Bugs
\`\`\`dataview
LIST
FROM "BUGS"
WHERE service = "$svc" AND status = "open"
\`\`\`

## Decisions
\`\`\`dataview
LIST
FROM "SERVICES/$svc/decisions"
SORT file.ctime DESC
\`\`\`
EOF
done

# ── MOBILE/_context.md ─────────────────────────────────────────────
cat > "$VAULT/MOBILE/_context.md" << EOF
---
service: mobile
developer: Emirhan
type: mobile
last_updated: $NOW
---

# 📱 Mobile App (React Native + Expo)

## Recent Commits
<!-- auto-updated by obsidian-session-stop.sh -->

## Key Files
- \`apps/mobile/src/screens/\`
- \`apps/mobile/src/services/api/\`
- \`apps/mobile/src/components/\`
- \`apps/mobile/src/navigation/\`

## Active Bugs
\`\`\`dataview
LIST
FROM "BUGS"
WHERE service = "mobile" AND status = "open"
\`\`\`
EOF

# ── SHARED/_context.md ─────────────────────────────────────────────
cat > "$VAULT/SHARED/_context.md" << EOF
---
service: shared
type: shared
last_updated: $NOW
---

# 🔗 Shared Zone

## Contents
- \`shared/types/\` — Socket events, API types, DTOs
- \`shared/utils/\` — Logger, apiResponse, validators
- \`shared/middleware/\` — verifyToken, rateLimiter, errorHandler
- \`shared/constants/\` — Socket events, roles, limits

> ⚠️ Change protocol: notify both devs → confirm → lock → change → unlock

## Decisions
\`\`\`dataview
LIST
FROM "SHARED/decisions"
SORT file.ctime DESC
\`\`\`
EOF

# ── SERVICES/_TEMPLATE/_context.md ────────────────────────────────
cat > "$VAULT/SERVICES/_TEMPLATE/_context.md" << 'EOF'
---
service: SERVICE_NAME
port: PORT
status: active
type: backend
last_updated: YYYY-MM-DD
---

# ⚙️ SERVICE_NAME (port PORT)

## Recent Commits
<!-- auto-updated -->

## Key Files
- `services/SERVICE_NAME/src/controllers/`
- `services/SERVICE_NAME/src/services/`

## Active Bugs
```dataview
LIST FROM "BUGS" WHERE service = "SERVICE_NAME" AND status = "open"
```
EOF

# ── Git init for vault backup ──────────────────────────────────────
if [[ ! -d "$VAULT/.git" ]]; then
  git -C "$VAULT" init -q
  git -C "$VAULT" add -A
  git -C "$VAULT" commit -q -m "vault: initial CineSync setup $NOW"
  echo "✅ Git initialized in vault"
fi

echo ""
echo "✅ Vault created: $VAULT"
echo ""
echo "Next steps:"
echo "  1. Open Obsidian → 'Open folder as vault' → $VAULT"
echo "  2. Install plugins: Settings → Community plugins → Browse:"
echo "     • Dataview  • Homepage  • Obsidian Git"
echo "  3. Set CINESYNC_VAULT in ~/.bashrc if vault path differs"
echo "     export CINESYNC_VAULT=\"$VAULT\""
echo ""
echo "  Vault is ready. Hooks auto-run on each Claude session."
