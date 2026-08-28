#!/usr/bin/env bash
# Nightly backup of the database + uploaded PDFs. Add to cron:
#   0 3 * * * /srv/sv/SV-Platform/infra/scripts/backup.sh >> /var/log/sv-backup.log 2>&1
set -euo pipefail
cd "$(dirname "$0")/../.."
[ -f .env ] && set -a && . ./.env && set +a

OUT=/srv/sv/backups
STAMP=$(date +%Y%m%d-%H%M%S)
mkdir -p "$OUT"

echo "▶ Dumping database…"
docker compose exec -T postgres pg_dump -U "${POSTGRES_USER:-sv}" "${POSTGRES_DB:-svplatform}" \
  | gzip >"$OUT/db-$STAMP.sql.gz"

echo "▶ Archiving uploads…"
docker run --rm -v sv-platform_uploads:/data -v "$OUT":/backup alpine \
  tar czf "/backup/uploads-$STAMP.tar.gz" -C /data .

# Retain the 14 most recent of each.
ls -1t "$OUT"/db-*.sql.gz 2>/dev/null | tail -n +15 | xargs -r rm --
ls -1t "$OUT"/uploads-*.tar.gz 2>/dev/null | tail -n +15 | xargs -r rm --

echo "✓ Backup $STAMP complete."
