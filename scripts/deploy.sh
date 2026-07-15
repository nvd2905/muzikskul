#!/usr/bin/env bash
set -euo pipefail

TAG="${1:?Usage: deploy.sh <git-tag> — refusing to deploy without an explicit tag}"

echo "Deploying tag: ${TAG}"

git fetch --tags --prune
git checkout --force "tags/${TAG}"

# dev deps are required for `next build`; do a clean, reproducible install
npm ci

npm run build

# COEXISTENCE: target ONLY the 'muzikskul' app by name via ecosystem.config.js.
# Never `pm2 reload all` / `pm2 restart all` — that would bounce the other app on this VPS.
#
# `pm2 reload <name> --update-env` only refreshes env values on an
# already-registered process — it does NOT re-read `script`/`args` from
# ecosystem.config.js, so a changed process definition (e.g. switching which
# file PM2 runs) would silently never take effect. Delete + fresh start from
# the config file every time instead, so what's running always matches what's
# committed.
if pm2 describe muzikskul > /dev/null 2>&1; then
  pm2 delete muzikskul
fi
pm2 start ecosystem.config.js --only muzikskul --update-env

pm2 save
