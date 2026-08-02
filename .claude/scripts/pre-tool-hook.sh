#!/usr/bin/env bash
# PreToolUse hook — запускается ПЕРЕД каждым Edit/Write/Bash
# Блокирует опасные операции и проверяет зональные правила
# stdin: JSON {"tool_name":"...","tool_input":{...}}

INPUT=$(cat)
TOOL=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_name',''))" 2>/dev/null)
FILE=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('file_path',''))" 2>/dev/null)
CMD=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('command',''))" 2>/dev/null)

# ── ZONE GUARD: shared mobile zone (Saidazim + Emirhan) — load-zone-first discipline ──
# apps/mobile is a SHARED zone per CLAUDE.md (Saidazim + Emirhan). We keep a soft guard so
# edits happen only after the mobile zone context is loaded (zone-load.sh mobile), but it is
# no longer an Emirhan-only hard block. Match is case-insensitive & substring: zone-load.sh
# writes the vault basename "WeWatch-Mobile", so we look for "mobile" anywhere.
if [[ "$TOOL" == "Edit" || "$TOOL" == "Write" ]]; then
  if echo "$FILE" | grep -qE "apps/mobile/"; then
    ACTIVE_ZONE=$(cat /tmp/claude-active-zone 2>/dev/null || echo "")
    if ! echo "$ACTIVE_ZONE" | grep -qiE "mobile"; then
      echo '{"decision":"block","reason":"⛔ ZONE GUARD: apps/mobile/ is a shared zone (Saidazim+Emirhan). Run: bash .claude/scripts/zone-load.sh mobile — then retry."}' >&2
      exit 2
    fi
  fi
fi

# ── DANGER: .env files ───────────────────────────────────────────────────────
# Catches .env, .env.local, .env.production, .env.development, .env.staging,
# .env.*.backup etc — previously only "\.env$|\.env\.prod|\.env\.production" was
# checked, which silently let .env.local / .env.development / .env.staging through
# (Next.js apps/web + apps/app-web use .env.local by convention — this is exactly
# how apps/app-web/.env.local.railway-backup ended up untracked and unblocked).
# .env.example / .env.sample stay allowed — they're committed templates with no secrets.
if [[ "$TOOL" == "Write" || "$TOOL" == "Edit" ]]; then
  if echo "$FILE" | grep -qE "\.env(\.|$)" && ! echo "$FILE" | grep -qE "\.env\.(example|sample)$"; then
    echo '{"decision":"block","reason":"⛔ SECURITY: .env files cannot be committed. Use env vars in deployment config."}' >&2
    exit 2
  fi
fi

# ── DANGER: Drop collections via Bash ───────────────────────────────────────
if [[ "$TOOL" == "Bash" ]]; then
  if echo "$CMD" | grep -qiE "dropDatabase|dropCollection|db\.drop|collection\.drop|--drop"; then
    echo '{"decision":"block","reason":"⛔ DANGER: MongoDB drop operation detected. Requires explicit manual confirmation."}' >&2
    exit 2
  fi
  # Block force push to main
  if echo "$CMD" | grep -qE "git push.*--force.*main|git push.*-f.*main"; then
    echo '{"decision":"block","reason":"⛔ DANGER: Force push to main is forbidden."}' >&2
    exit 2
  fi
fi

exit 0
