FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY tsconfig.base.json ./
COPY shared/package*.json ./shared/
COPY services/auth/package*.json ./services/auth/
COPY services/user/package*.json ./services/user/
COPY services/content/package*.json ./services/content/
COPY services/watch-party/package*.json ./services/watch-party/
COPY services/notification/package*.json ./services/notification/
COPY services/admin/package*.json ./services/admin/

RUN npm ci --legacy-peer-deps --include-workspace-root -w @cinesync/shared -w @cinesync/watch-party

COPY shared/ ./shared/
COPY services/watch-party/ ./services/watch-party/

RUN npm run build --workspace=@cinesync/shared
RUN npm run build --workspace=@cinesync/watch-party

FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY shared/package*.json ./shared/
COPY services/auth/package*.json ./services/auth/
COPY services/user/package*.json ./services/user/
COPY services/content/package*.json ./services/content/
COPY services/watch-party/package*.json ./services/watch-party/
COPY services/notification/package*.json ./services/notification/
COPY services/admin/package*.json ./services/admin/

RUN npm ci --legacy-peer-deps --omit=dev --include-workspace-root -w @cinesync/shared -w @cinesync/watch-party

COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/services/watch-party/dist ./services/watch-party/dist

RUN ln -s /app/shared/dist /app/node_modules/@shared

# Playwright/Chromium for the shared virtual browser feature — same Alpine setup already
# proven working in services/content/Dockerfile (T-S043). System chromium avoids downloading
# the ~150MB browser bundle; chromium-driver doesn't exist in Alpine, only chromium is needed.
#
# ffmpeg (2026-08-26): one-shot `-c copy -movflags +faststart` remux for non-faststart CDN
# sources (fayllar1.ru-class movie rips, moov atom at EOF — see faststartRemux.service.ts). No
# re-encode, just an atom reorder, so this is cheap on CPU; Alpine's package is a normal handful
# of MB, no separate download step needed like Chromium above.
RUN apk add --no-cache chromium ffmpeg \
    nss freetype harfbuzz ca-certificates ttf-freefont
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

RUN addgroup -g 1001 -S nodejs && \
    adduser -S cinesync -u 1001 && \
    mkdir -p /app/services/watch-party/logs && \
    mkdir -p /tmp/faststart-cache && \
    chown -R cinesync:nodejs /app/services/watch-party /tmp/faststart-cache

USER cinesync
WORKDIR /app/services/watch-party

EXPOSE 3004

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3004/health || exit 1

CMD ["node", "dist/server.js"]
