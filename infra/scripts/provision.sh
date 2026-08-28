#!/usr/bin/env bash
# One-time bootstrap for a fresh Debian/Ubuntu IONOS VPS.
set -euo pipefail

echo "▶ Installing Docker…"
curl -fsSL https://get.docker.com | sh

echo "▶ Adding 2G swap (helps on small VPS)…"
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >>/etc/fstab
fi

echo "▶ Firewall (SSH + HTTP + HTTPS)…"
apt-get update && apt-get install -y ufw git
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw --force enable

mkdir -p /srv/ffm /srv/sv/backups

echo "✓ Provisioned."
echo "  Next: clone the repo to /srv/sv/SV-Platform, create .env, run infra/scripts/deploy.sh"
