#!/bin/sh
# ─── WeWatch Backup Scheduler (внутри контейнера) ────────────────────────────
# Почему планировщик свой, а не Railway-cron: в бэкапе RAOS Railway-cron так и
# не взвёлся — поле cronSchedule у сервиса было заполнено, а у каждого
# деплоя meta.cronSchedule оставался null, и бэкап не запускался ни разу, молча.
# busybox `crond` тоже не годится: как PID 1 он вызывает setpgid() на лидере
# сессии → «Operation not permitted» → выход → crash-loop.
#
# Поэтому расписание своё: sh-цикл без зависимостей, он и есть PID 1. Один
# бэкап сразу при старте (чтобы свежий дамп существовал сразу после деплоя),
# дальше по одному в сутки в 02:00 UTC (07:00 по Ташкенту). Упавший прогон
# логируется, цикл продолжается — одна неудача не останавливает расписание.
#
# ВАЖНО: сервис в Railway должен быть обычным always-on (numReplicas=1) БЕЗ
# cronSchedule. С заданным cronSchedule Railway применяет run-once / scale-to-0
# и убивает этот цикл.
set -u

TARGET_SECS=7200   # 02:00 UTC в секундах от начала суток

run_backup() {
  echo "[scheduler] $(date -u) running backup-mongo.sh"
  /usr/local/bin/backup-mongo.sh || echo "[scheduler] backup-mongo.sh exited non-zero — continuing; next run still scheduled"
}

echo "[scheduler] $(date -u) started — immediate backup, then daily at 02:00 UTC"
run_backup

while true; do
  now=$(date -u +%s)
  secs_today=$(( now % 86400 ))
  if [ "$secs_today" -lt "$TARGET_SECS" ]; then
    wait=$(( TARGET_SECS - secs_today ))
  else
    wait=$(( 86400 - secs_today + TARGET_SECS ))
  fi
  echo "[scheduler] $(date -u) sleeping ${wait}s until next 02:00 UTC run"
  sleep "$wait"
  run_backup
done
