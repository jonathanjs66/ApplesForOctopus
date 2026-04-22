#!/usr/bin/env bash
set -euo pipefail

TIMESTAMP="$(date +%F_%H-%M-%S)"
BACKUP_DIR="./backups"

LAST_INDEX="$(
  find "$BACKUP_DIR" -maxdepth 1 -type f -name 'backup-*.archive.gz' -printf '%f\n' 2>/dev/null \
    | sed -E 's/^backup-([0-9]+)-.*$/\1/' \
    | sort -n \
    | tail -1
)"

if [ -z "${LAST_INDEX:-}" ]; then
  NEXT_INDEX=1
else
  NEXT_INDEX=$((LAST_INDEX + 1))
fi

BACKUP_FILE="$BACKUP_DIR/backup-$NEXT_INDEX-$TIMESTAMP.archive.gz"

mkdir -p "$BACKUP_DIR"

set -a
source ./.env
set +a

docker compose exec -T \
  -e APP_DB_USERNAME="$APP_DB_USERNAME" \
  -e APP_DB_PASSWORD="$APP_DB_PASSWORD" \
  -e MONGO_DB="$MONGO_DB" \
  mongodb sh -c '
    mongodump \
      --username "$APP_DB_USERNAME" \
      --password "$APP_DB_PASSWORD" \
      --authenticationDatabase "$MONGO_DB" \
      --db "$MONGO_DB" \
      --archive \
      --gzip
  ' > "$BACKUP_FILE"

echo "Backup created: $BACKUP_FILE"
