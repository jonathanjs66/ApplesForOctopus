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
  -e MONGO_USERNAME="$MONGO_USERNAME" \
  -e MONGO_PASSWORD="$MONGO_PASSWORD" \
  mongodb sh -c '
    mongorestore \
      --username "$MONGO_USERNAME" \
      --password "$MONGO_PASSWORD" \
      --authenticationDatabase admin \
      --archive \
      --gzip \
      --drop
  '

echo "Restore completed from: $BACKUP_FILE"
