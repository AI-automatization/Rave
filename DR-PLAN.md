# Disaster Recovery Plan — CineSync

## Backups

| What | Where | Frequency | Retention |
|------|-------|-----------|-----------|
| MongoDB (all DBs) | S3 (`BACKUP_S3_BUCKET/backups/`) | Daily 02:00 UTC | 30 days |

GitHub Actions workflow: `.github/workflows/backup.yml`  
Backup script: `scripts/backup-mongo.sh`

Required secrets: `PROD_MONGO_URI`, `BACKUP_S3_BUCKET`, `BACKUP_S3_ENDPOINT`, `BACKUP_AWS_KEY_ID`, `BACKUP_AWS_SECRET`

## Restore Procedure

### 1. Find backup

```bash
aws s3 ls s3://$BACKUP_S3_BUCKET/backups/ --endpoint-url $S3_ENDPOINT
```

### 2. Download

```bash
aws s3 cp s3://$BACKUP_S3_BUCKET/backups/cinesync-backup-YYYY-MM-DDTHH-MM-SSZ.tar.gz /tmp/restore.tar.gz \
  --endpoint-url $S3_ENDPOINT
tar -xzf /tmp/restore.tar.gz -C /tmp/
```

### 3. Restore

```bash
mongorestore --uri="$MONGO_URI" --gzip /tmp/mongo-backup-YYYY-MM-DDTHH-MM-SSZ/ --drop
```

`--drop` drops existing collections before restore. Remove if doing partial restore.

### 4. Verify

```bash
mongosh "$MONGO_URI" --eval "db.adminCommand('listDatabases')"
```

## RPO / RTO

- **RPO (Recovery Point Objective):** 24 hours (daily backup)
- **RTO (Recovery Time Objective):** ~30 minutes (download + restore)

## Redis

Redis is ephemeral cache — no backup needed. Data is reconstructed on startup:
- Blocked users: re-read from MongoDB on next auth
- Session tokens: users re-login
- Socket.io rooms: reconnect on service restart

## Escalation

1. Check Railway service logs
2. Check `/health` endpoints for all 7 services
3. If DB down: restore from S3 backup using steps above
4. Contact: Saidazim (backend) or Bekzod (escalation)
