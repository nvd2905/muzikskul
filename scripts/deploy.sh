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
if pm2 describe muzikskul > /dev/null 2>&1; then
  pm2 reload muzikskul --update-env
else
  pm2 start ecosystem.config.js --only muzikskul
fi

pm2 save
