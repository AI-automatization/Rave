#!/usr/bin/env bash
# PreToolUse hook — запускается ПЕРЕД каждым Edit/Write/Bash
# Блокирует опасные операции и проверяет зональные правила
# stdin: JSON {"tool_name":"...","tool_input":{...}}

INPUT=$(cat)
TOOL=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_name',''))" 2>/dev/null)
FILE=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('file_path',''))" 2>/dev/null)
CMD=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('command',''))" 2>/dev/null)

# ── ZONE GUARD: Emirhan zone protection ─────────────────────────────────────
if [[ "$TOOL" == "Edit" || "$TOOL" == "Write" ]]; then
  if echo "$FILE" | grep -qE "apps/mobile/"; then
    # Allow if explicitly in a mobile task context
    ACTIVE_ZONE=$(cat /tmp/claude-active-zone 2>/dev/null || echo "")
    if [[ "$ACTIVE_ZONE" != "mobile" ]]; then
      echo '{"decision":"block","reason":"⛔ ZONE GUARD: apps/mobile/ — Emirhan zone. Load mobile zone first or get confirmation."}' >&2
      exit 2
    fi
  fi
fi

# ── DANGER: .env files ───────────────────────────────────────────────────────
if [[ "$TOOL" == "Write" || "$TOOL" == "Edit" ]]; then
  if echo "$FILE" | grep -qE "\.env$|\.env\.prod|\.env\.production"; then
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
