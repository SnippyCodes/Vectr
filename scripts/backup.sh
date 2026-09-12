#!/bin/bash
# Vectr - Daily PostgreSQL backup to AWS S3
# Runs via cron: 0 2 * * * /opt/vectr/scripts/backup.sh >> /var/log/vectr-backup.log 2>&1
set -euo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BUCKET="vectr-production-backups"
CONTAINER="vectr-postgres-1"
POSTGRES_USER="vectr"
POSTGRES_DB="vectr_production"
KEEP_DAYS=30

echo "[$(date)] Starting backup..."

# Dump and stream directly to S3 (no local disk usage)
docker exec "$CONTAINER" pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" \
  | gzip \
  | aws s3 cp - "s3://${BUCKET}/postgres/backup_${TIMESTAMP}.sql.gz" \
    --storage-class STANDARD_IA

echo "[$(date)] Backup uploaded: backup_${TIMESTAMP}.sql.gz"

# Delete backups older than KEEP_DAYS (keep 30-day rolling window)
CUTOFF=$(date -d "-${KEEP_DAYS} days" +%Y%m%d 2>/dev/null || date -v-${KEEP_DAYS}d +%Y%m%d)
aws s3 ls "s3://${BUCKET}/postgres/" \
  | awk '{print $4}' \
  | grep "^backup_" \
  | while read -r file; do
      file_date=$(echo "$file" | grep -oP '^\d{8}')
      if [[ "$file_date" < "$CUTOFF" ]]; then
        aws s3 rm "s3://${BUCKET}/postgres/${file}"
        echo "[$(date)] Removed old backup: ${file}"
      fi
    done

echo "[$(date)] Backup complete."
