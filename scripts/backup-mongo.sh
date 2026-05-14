#!/usr/bin/env bash
# MongoDB backup → S3/R2 (#21)
# Usage: ./scripts/backup-mongo.sh
# Requires: mongodump, aws CLI (or rclone), MONGO_URI, S3_BUCKET, (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)

set -euo pipefail

: "${MONGO_URI:?MONGO_URI is required}"
: "${S3_BUCKET:?S3_BUCKET is required}"

TIMESTAMP=$(date -u +"%Y-%m-%dT%H-%M-%SZ")
BACKUP_DIR="/tmp/mongo-backup-${TIMESTAMP}"
ARCHIVE="/tmp/cinesync-backup-${TIMESTAMP}.tar.gz"

echo "[backup] Starting MongoDB backup at ${TIMESTAMP}"

# 1. Dump
mkdir -p "${BACKUP_DIR}"
mongodump --uri="${MONGO_URI}" --out="${BACKUP_DIR}" --gzip
echo "[backup] mongodump complete"

# 2. Archive
tar -czf "${ARCHIVE}" -C /tmp "mongo-backup-${TIMESTAMP}"
echo "[backup] Archive created: ${ARCHIVE}"

# 3. Upload to S3 (or Cloudflare R2 / any S3-compatible storage)
S3_KEY="backups/cinesync-backup-${TIMESTAMP}.tar.gz"
aws s3 cp "${ARCHIVE}" "s3://${S3_BUCKET}/${S3_KEY}" \
  ${S3_ENDPOINT_URL:+--endpoint-url "${S3_ENDPOINT_URL}"}
echo "[backup] Uploaded to s3://${S3_BUCKET}/${S3_KEY}"

# 4. Cleanup local files
rm -rf "${BACKUP_DIR}" "${ARCHIVE}"
echo "[backup] Local cleanup done"

# 5. Retention: keep last 30 days — delete older backups
CUTOFF=$(date -u -d "30 days ago" +"%Y-%m-%dT" 2>/dev/null || date -u -v-30d +"%Y-%m-%dT")
aws s3 ls "s3://${S3_BUCKET}/backups/" \
  ${S3_ENDPOINT_URL:+--endpoint-url "${S3_ENDPOINT_URL}"} \
  | awk '{print $4}' \
  | while read -r KEY; do
    PREFIX="${KEY%%-[0-9]*}"
    DATE_PART="${KEY#cinesync-backup-}"
    DATE_PART="${DATE_PART%.tar.gz}"
    if [[ "${DATE_PART}" < "${CUTOFF}" ]]; then
      aws s3 rm "s3://${S3_BUCKET}/backups/${KEY}" \
        ${S3_ENDPOINT_URL:+--endpoint-url "${S3_ENDPOINT_URL}"}
      echo "[backup] Deleted old backup: ${KEY}"
    fi
  done

echo "[backup] Backup complete: ${S3_KEY}"
