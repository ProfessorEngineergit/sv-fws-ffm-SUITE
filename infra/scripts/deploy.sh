#!/usr/bin/env bash
# Pull, build, migrate and (re)start the whole stack on the VPS.
set -euo pipefail
cd "$(dirname "$0")/../.."

COMPOSE="docker compose -f docker-compose.yml -f docker-compose.prod.yml"

echo "▶ Pulling latest code…"
git pull --ff-only || echo "  (skipped git pull)"

echo "▶ Building images…"
$COMPOSE build

echo "▶ Applying database migrations…"
$COMPOSE run --rm web pnpm --filter @sv/db migrate:deploy

echo "▶ Starting services…"
$COMPOSE up -d

echo "✓ Deployed. Check: $COMPOSE ps"
