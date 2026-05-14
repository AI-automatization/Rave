FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY tsconfig.base.json ./
COPY shared/package*.json ./shared/
COPY services/auth/package*.json ./services/auth/
COPY services/user/package*.json ./services/user/
COPY services/content/package*.json ./services/content/
COPY services/watch-party/package*.json ./services/watch-party/
COPY services/battle/package*.json ./services/battle/
COPY services/notification/package*.json ./services/notification/
COPY services/admin/package*.json ./services/admin/

RUN npm ci --legacy-peer-deps --include-workspace-root -w @cinesync/shared -w @cinesync/content

COPY shared/ ./shared/
COPY services/content/ ./services/content/

RUN npm run build --workspace=@cinesync/shared
RUN npm run build --workspace=@cinesync/content -- --project tsconfig.build.json

FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY shared/package*.json ./shared/
COPY services/auth/package*.json ./services/auth/
COPY services/user/package*.json ./services/user/
COPY services/content/package*.json ./services/content/
COPY services/watch-party/package*.json ./services/watch-party/
COPY services/battle/package*.json ./services/battle/
COPY services/notification/package*.json ./services/notification/
COPY services/admin/package*.json ./services/admin/

RUN npm ci --legacy-peer-deps --omit=dev --include-workspace-root -w @cinesync/shared -w @cinesync/content

COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/services/content/dist ./services/content/dist

RUN ln -s /app/shared/dist /app/node_modules/@shared

# yt-dlp via pip — min 2025.1.0 for poToken + MWEB client support
RUN apk add --no-cache python3 py3-pip && \
    pip3 install --no-cache-dir --break-system-packages "yt-dlp>=2025.1.0"

# Playwright/Chromium support (T-S043) — system Chromium to avoid downloading ~150MB browser
# chromium-driver package doesn't exist in Alpine — only chromium is needed for Playwright
RUN apk add --no-cache chromium \
    nss freetype harfbuzz ca-certificates ttf-freefont
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# FFmpeg for HLS transcoding (T-S005b)
RUN apk add --no-cache ffmpeg

RUN addgroup -g 1001 -S nodejs && \
    adduser -S cinesync -u 1001 && \
    mkdir -p /app/services/content/logs && \
    chown -R cinesync:nodejs /app/services/content

USER cinesync
WORKDIR /app/services/content

EXPOSE 3003

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3003/health || exit 1

CMD ["node", "dist/server.js"]
