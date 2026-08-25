#!/bin/sh
# ─── WeWatch MongoDB Backup ──────────────────────────────────────────────────
# mongodump → GPG (AES256) → MinIO. Запускается планировщиком внутри контейнера
# (scripts/backup-mongo-scheduler.sh), сервис `wewatch-backup` в проекте Railway `rave`.
#
# Почему не GitHub Actions, где этот бэкап жил раньше: workflow существовал с
# первого дня и НИ РАЗУ не отработал — 99 падений из 100 прогонов с
# «MONGO_URI is required», потому что секретов в репозитории не было. А положить
# их туда нельзя: репозиторий публичный, и в организации у 19 человек права
# admin по умолчанию (проверено 25.08.2026 через GitHub API) — любой из них
# может добавить workflow и вывести секрет в лог. На Railway строка подключения
# вообще не хранится: она подставляется ссылкой ${{MongoDB.MONGO_URL}} и не
# покидает инфраструктуру.
#
# Переменные окружения (задаются в Railway):
#   MONGO_URL          — ссылка на сервис MongoDB того же проекта
#   MINIO_ENDPOINT     — адрес MinIO
#   MINIO_ACCESS       — access key
#   MINIO_SECRET       — secret key
#   MINIO_BUCKET       — существующий бакет MinIO
#   MINIO_PREFIX       — префикс внутри бакета, например wewatch/ (см. ниже)
#   GPG_PASSPHRASE     — пароль симметричного шифрования (БЕЗ НЕГО ДАМП НЕ ВОССТАНОВИТЬ)
#   RETENTION_DAYS     — сколько дней хранить, по умолчанию 30
#   TELEGRAM_BOT_TOKEN — необязательно, уведомление
#   TELEGRAM_CHAT_ID   — необязательно, уведомление

set -e

TIMESTAMP=$(date -u +"%Y-%m-%dT%H-%M-%SZ")
DATE=$(date -u +"%Y/%m/%d")
BACKUP_NAME="wewatch-mongo-${TIMESTAMP}.archive.gz.gpg"
TMP_DIR="/tmp/wewatch-backup"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

# Префикс внутри бакета. Появился 25.08 после первого живого прогона: ключ
# MinIO не имеет права создавать бакеты («mc mb … Access Denied»), поэтому
# дампы WeWatch кладутся в уже существующий бакет рядом с чужими. Отсюда
# требование: и загрузка, и РЕТЕНЦИЯ работают строго внутри префикса —
# иначе уборка старше 30 дней снесёт бэкапы RAOS, лежащие в том же бакете.
# (Required-guard lives above with the other required vars, not here.)

mkdir -p "${TMP_DIR}"
BACKUP_FILE="${TMP_DIR}/${BACKUP_NAME}"
RAW_DUMP="${TMP_DIR}/wewatch-mongo-${TIMESTAMP}.archive.gz"

notify() {
  if [ -n "${TELEGRAM_BOT_TOKEN:-}" ] && [ -n "${TELEGRAM_CHAT_ID:-}" ]; then
    curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
      -d "chat_id=${TELEGRAM_CHAT_ID}" \
      -d "text=${1}" \
      -d "parse_mode=Markdown" > /dev/null 2>&1 || true
  fi
}

echo "[$(date -u)] Starting WeWatch MongoDB backup: ${BACKUP_NAME}"

: "${MONGO_URL:?MONGO_URL is required}"
: "${MINIO_ENDPOINT:?MINIO_ENDPOINT is required}"
: "${MINIO_BUCKET:?MINIO_BUCKET is required}"
: "${GPG_PASSPHRASE:?GPG_PASSPHRASE is required}"
# 2026-08-25 (Saidazim, PR review): MINIO_PREFIX is the ONLY thing standing between this
# script and wiping RAOS's backups in the same shared bucket (see comment below) -- an unset
# or mistyped value must fail loudly here, not silently fall back to bucket-root scope.
: "${MINIO_PREFIX:?MINIO_PREFIX is required}"

# ─── 1. Дамп в ФАЙЛ, не в пайп ────────────────────────────────────────────────
# Пайп `mongodump | gpg` маскирует код возврата дампа: под `set -e` статус
# пайплайна — это статус gpg, то есть успех, и наружу уезжает крошечный
# «успешный» пустой архив. Ровно на этом уже обжигались в бэкапе RAOS.
echo "[$(date -u)] Dumping database..."
mongodump --uri="${MONGO_URL}" --archive="${RAW_DUMP}" --gzip

# Настоящий дамп никогда не бывает почти пустым — защита от частичного дампа
# и от дампа, где авторизация не прошла.
RAW_BYTES=$(wc -c < "${RAW_DUMP}")
if [ "${RAW_BYTES}" -lt 1024 ]; then
  rm -f "${RAW_DUMP}"
  echo "[$(date -u)] ERROR: dump only ${RAW_BYTES} bytes — aborting, NOT uploading a junk backup"
  notify "🔴 *WeWatch Backup* FAILED: дамп всего ${RAW_BYTES} байт (\`${TIMESTAMP}\`)"
  exit 1
fi

# ─── 2. Шифрование ────────────────────────────────────────────────────────────
gpg --batch --yes --symmetric --cipher-algo AES256 \
    --passphrase "${GPG_PASSPHRASE}" \
    --output "${BACKUP_FILE}" \
    "${RAW_DUMP}"
rm -f "${RAW_DUMP}"

BACKUP_SIZE=$(du -sh "${BACKUP_FILE}" | cut -f1)
echo "[$(date -u)] Backup created: ${BACKUP_FILE} (${BACKUP_SIZE})"

# ─── 3. Загрузка в MinIO ──────────────────────────────────────────────────────
mc alias set wewatch "${MINIO_ENDPOINT}" "${MINIO_ACCESS}" "${MINIO_SECRET}" --quiet
# Бакет НЕ создаём: у ключа нет на это прав, и это нормально — он и не должен
# уметь ничего, кроме записи в свой префикс.
mc cp "${BACKUP_FILE}" "wewatch/${MINIO_BUCKET}/${MINIO_PREFIX}${DATE}/${BACKUP_NAME}" --quiet
echo "[$(date -u)] Uploaded: ${MINIO_BUCKET}/${MINIO_PREFIX}${DATE}/${BACKUP_NAME}"

# ─── 4. Ретенция ──────────────────────────────────────────────────────────────
# Cutoff — ЧИСЛО (YYYYMMDD), не строка. В бэкапе RAOS ровно здесь была дыра:
# `mc ls --recursive` отдаёт верхнеуровневый префикс («2026/»), и сравнение
# «2026» < «2026-07-12» лексикографически истинно — под нож уходил целый год,
# включая только что загруженный дамп.
echo "[$(date -u)] Cleaning up backups older than ${RETENTION_DAYS} days..."
CUTOFF_NUM=$(date -u -d "${RETENTION_DAYS} days ago" +"%Y%m%d" 2>/dev/null || \
             date -u -v-"${RETENTION_DAYS}"d +"%Y%m%d" 2>/dev/null || echo "")

if [ -z "${CUTOFF_NUM}" ]; then
  echo "[$(date -u)] WARNING: cutoff date not computed — retention skipped"
else
  # Листинг ИМЕННО от префикса: mc отдаёт пути относительно него, поэтому
  # разбор на YYYY/MM/DD ниже не меняется, а чужие папки в выборку не попадают.
  mc ls --recursive "wewatch/${MINIO_BUCKET}/${MINIO_PREFIX}" --quiet 2>/dev/null \
    | awk '{print $NF}' \
    | awk -F/ 'NF >= 4 { print $1 "/" $2 "/" $3 }' \
    | sort -u \
    | while read -r DAY; do
        DAY_NUM=$(echo "${DAY}" | tr -d '/')
        case "${DAY_NUM}" in
          '' | *[!0-9]*)
            echo "[$(date -u)] Skipped non-date prefix: ${DAY}"
            continue
            ;;
        esac
        if [ "${DAY_NUM}" -lt "${CUTOFF_NUM}" ]; then
          mc rm --recursive --force "wewatch/${MINIO_BUCKET}/${MINIO_PREFIX}${DAY}/" --quiet || true
          echo "[$(date -u)] Deleted old backup dir: ${DAY}"
        fi
      done
fi

rm -f "${BACKUP_FILE}"
rmdir "${TMP_DIR}" 2>/dev/null || true

echo "[$(date -u)] Backup complete."
notify "✅ *WeWatch Backup* success: \`${TIMESTAMP}\` (${BACKUP_SIZE})"
