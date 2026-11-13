#!/usr/bin/env bash
# Builds the web app (apps/app-web of THIS checkout) into desktop-mac/web-dist, which electron-builder ships as
# Resources/web and src/main/local-web.ts runs locally (why: src/main/local-web-model.ts header).
#
# Mirrors apps/app-web/Dockerfile (production): an isolated copy with only shared/src + apps/app-web, its own
# `npm install`, `next build` with output 'standalone'. Building inside the monorepo does not work: npm hoists into the
# root workspace and the build failed with "Cannot find module '@opentelemetry/instrumentation'" (2026-11-13).
#
# Node: use 24.x (Electron 45 runs the server on its own Node 24.22). Usage: npm run build:web
set -euo pipefail

HERE="$(cd "$(dirname "$0")/.." && pwd)"          # desktop-mac
REPO="$(cd "$HERE/.." && pwd)"
OUT="$HERE/web-dist"
STAGE="$(mktemp -d "${TMPDIR:-/tmp}/ww-web-build.XXXXXX")"
trap 'rm -rf "$STAGE"' EXIT

mkdir -p "$STAGE/shared" "$STAGE/apps"
rsync -a "$REPO/shared/src" "$STAGE/shared/"
rsync -a --exclude node_modules --exclude .next --exclude '.next-*' "$REPO/apps/app-web" "$STAGE/apps/"

cd "$STAGE/apps/app-web"
npm install --legacy-peer-deps --no-audit --no-fund

# Inlined into the client bundle at build time. Backend hosts = the public production ones (local-web-model.ts).
export NODE_OPTIONS="--max-old-space-size=4096"
export NEXT_TELEMETRY_DISABLED=1
export NEXT_PUBLIC_APP_URL="https://app.wewatch.uz"        # invite links keep pointing at the real site
export NEXT_PUBLIC_LANDING_URL="https://wewatch.uz"
export NEXT_PUBLIC_SOCKET_URL="https://media-production-97dd.up.railway.app"
export NEXT_PUBLIC_DESKTOP_VB=1                            # the desktop features (VB share, picker) are on
export AUTH_SERVICE_URL="https://core-production-dbd0.up.railway.app/api/v1/auth"
export USER_SERVICE_URL="https://core-production-dbd0.up.railway.app/api/v1"
export NOTIFICATION_SERVICE_URL="https://core-production-dbd0.up.railway.app/api/v1"
export CONTENT_SERVICE_URL="https://media-production-97dd.up.railway.app/api/v1"
export WATCH_PARTY_SERVICE_URL="https://media-production-97dd.up.railway.app/api/v1"
npm run build

# Same layout as the Dockerfile's production stage: standalone + .next/static + public.
NEW="$OUT.new"
rm -rf "$NEW"
mkdir -p "$NEW/.next"
rsync -a .next/standalone/ "$NEW/"
rsync -a .next/static "$NEW/.next/"
rsync -a public "$NEW/"
test -f "$NEW/server.js" && test -f "$NEW/.next/BUILD_ID"
rm -rf "$OUT"
mv "$NEW" "$OUT"
echo "web-dist: $(cat "$OUT/.next/BUILD_ID") ($(du -sh "$OUT" | cut -f1))"
