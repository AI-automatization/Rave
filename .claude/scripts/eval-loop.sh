#!/usr/bin/env bash
# eval-loop.sh — eval-driven цикл: запускает тесты, оценивает, передаёт Claude
# Usage: bash eval-loop.sh <service> [max_iterations]
# Claude читает вывод и решает что фиксить

SERVICE="${1:-all}"
MAX_ITER="${2:-3}"
RAVE="/Users/saidazim/Desktop/Rave"
ITER=0
PASS=false

run_checks() {
  local svc="$1"
  local out=""

  echo "━━━ ITER $ITER / $MAX_ITER ━━━"

  # TypeScript
  if [ "$svc" = "all" ]; then
    for d in "$RAVE"/services/*/; do
      [ -f "$d/tsconfig.json" ] || continue
      name=$(basename "$d")
      result=$(cd "$d" && npx tsc --noEmit 2>&1 | grep "error TS" | head -5 || true)
      if [ -n "$result" ]; then
        echo "❌ $name TSC:"
        echo "$result"
        out+="$result"
      else
        echo "✅ $name TSC: clean"
      fi
    done
  else
    svc_path="$RAVE/services/$svc"
    [ -f "$svc_path/tsconfig.json" ] || { echo "No tsconfig for $svc"; return 1; }
    result=$(cd "$svc_path" && npx tsc --noEmit 2>&1 | grep "error TS" | head -10 || true)
    if [ -n "$result" ]; then
      echo "❌ $svc TSC errors:"
      echo "$result"
      out+="$result"
    else
      echo "✅ $svc TSC: clean"
    fi
  fi

  # Jest tests (if exist)
  if [ -f "$RAVE/services/$svc/package.json" ] && grep -q '"test"' "$RAVE/services/$svc/package.json" 2>/dev/null; then
    test_result=$(cd "$RAVE/services/$svc" && npm test -- --passWithNoTests 2>&1 | tail -5 || true)
    echo "🧪 Tests: $test_result"
    echo "$test_result" | grep -qi "fail" && out+="TEST_FAIL: $test_result"
  fi

  [ -z "$out" ] && return 0 || return 1
}

while [ $ITER -lt $MAX_ITER ]; do
  ITER=$((ITER + 1))
  if run_checks "$SERVICE"; then
    echo ""
    echo "✅ EVAL LOOP PASSED on iteration $ITER"
    PASS=true
    break
  else
    echo ""
    echo "⚠️  Errors found. Claude should fix and re-run: bash .claude/scripts/eval-loop.sh $SERVICE $MAX_ITER"
    echo "EVAL_STATUS=FAIL ITER=$ITER SERVICE=$SERVICE"
    break
  fi
done

$PASS || echo "EVAL_STATUS=FAIL after $MAX_ITER iterations"
