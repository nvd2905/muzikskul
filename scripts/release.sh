#!/usr/bin/env bash
set -euo pipefail

REPO="nvd2905/muzikskul"
NOTES="${1:?Usage: scripts/release.sh \"<release notes>\" [version]}"
VERSION="${2:-}"

if [[ -z "$VERSION" ]]; then
  LATEST=$(gh release list --repo "$REPO" --limit 1 --json tagName -q '.[0].tagName' 2>/dev/null || echo "v0.0.0")
  IFS='.' read -r MAJOR MINOR PATCH <<< "${LATEST#v}"
  VERSION="v${MAJOR}.${MINOR}.$((PATCH + 1))"
fi

echo "Creating release ${VERSION} on ${REPO}..."
gh release create "$VERSION" --repo "$REPO" --title "$VERSION" --notes "$NOTES" --target main
