#!/usr/bin/env bash
# Restore the database from a gzipped pg_dump.
#   ./infra/scripts/restore.sh /srv/sv/backups/db-YYYYMMDD-HHMMSS.sql.gz
set -euo pipefail
[ $# -ge 1 ] || { echo "Usage: restore.sh <db-backup.sql.gz>"; exit 1; }
cd "$(dirname "$0")/../.."
[ -f .env ] && set -a && . ./.env && set +a

echo "▶ Restoring $1 …"
gunzip -c "$1" | docker compose exec -T postgres psql -U "${POSTGRES_USER:-sv}" "${POSTGRES_DB:-svplatform}"
echo "✓ Restored."
