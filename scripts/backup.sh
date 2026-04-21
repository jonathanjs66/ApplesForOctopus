#!/usr/bin/env bash
set -euo pipefail

TIMESTAMP="$(date +%F_%H-%M-%S)"
BACKUP_DIR="./backups"
BACKUP_FILE="$BACKUP_DIR/mongo-backup-$TIMESTAMP.archive.gz"

mkdir -p "$BACKUP_DIR"

set -a
source ./.env
set +a

docker compose exec -T \
  -e MONGO_USERNAME="$MONGO_USERNAME" \
  -e MONGO_PASSWORD="$MONGO_PASSWORD" \
  -e MONGO_DB="$MONGO_DB" \
  mongodb sh -c '
    mongodump \
      --username "$MONGO_USERNAME" \
      --password "$MONGO_PASSWORD" \
      --authenticationDatabase admin \
      --db "$MONGO_DB" \
      --archive \
      --gzip
  ' > "$BACKUP_FILE"

echo "Backup created: $BACKUP_FILE"
