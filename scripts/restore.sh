#!/usr/bin/env bash
set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Usage: ./scripts/restore.sh <backup-file>"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Backup file not found: $BACKUP_FILE"
  exit 1
fi

set -a
source ./.env
set +a

cat "$BACKUP_FILE" | docker compose exec -T \
  -e APP_DB_USERNAME="$APP_DB_USERNAME" \
  -e APP_DB_PASSWORD="$APP_DB_PASSWORD" \
  -e MONGO_DB="$MONGO_DB" \
  mongodb sh -c '
    mongorestore \
      --username "$APP_DB_USERNAME" \
      --password "$APP_DB_PASSWORD" \
      --authenticationDatabase "$MONGO_DB" \
      --archive \
      --gzip \
      --drop
  '

echo "Restore completed from: $BACKUP_FILE"
