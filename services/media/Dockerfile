# Media service: content + watch-party in ONE container. See services/media/README.md.
# Build context = repo root (Railway "Root Directory" = /).
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
COPY services/payment/package*.json ./services/payment/
COPY services/media/package*.json ./services/media/

RUN npm ci --legacy-peer-deps --include-workspace-root \
    -w @cinesync/shared -w @cinesync/content -w @cinesync/watch-party -w @cinesync/media

COPY shared/ ./shared/
COPY services/content/ ./services/content/
COPY services/watch-party/ ./services/watch-party/
COPY services/media/ ./services/media/

# shared first, then the two services (media imports their dist/*.js + dist/*.d.ts), then media.
RUN npm run build --workspace=@cinesync/shared
RUN npm run build --workspace=@cinesync/content && \
    npm run build --workspace=@cinesync/watch-party
RUN npm run build --workspace=@cinesync/media

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
COPY services/payment/package*.json ./services/payment/
COPY services/media/package*.json ./services/media/

RUN npm ci --legacy-peer-deps --omit=dev --include-workspace-root \
    -w @cinesync/shared -w @cinesync/content -w @cinesync/watch-party -w @cinesync/media

COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/services/content/dist ./services/content/dist
COPY --from=builder /app/services/watch-party/dist ./services/watch-party/dist
COPY --from=builder /app/services/media/dist ./services/media/dist

RUN ln -s /app/shared/dist /app/node_modules/@shared

# yt-dlp via pip (content) — same floor as services/content/Dockerfile; keep them in sync.
RUN apk add --no-cache python3 py3-pip && \
    pip3 install --no-cache-dir --break-system-packages --upgrade "yt-dlp>=2026.6.9"

# Union of services/content/Dockerfile and services/watch-party/Dockerfile system packages:
# system Chromium (playwright-chromium, PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD), ffmpeg (HLS + faststart
# remux), xvfb + pulseaudio (VB live A/V stream, inert unless VB_STREAM_ENABLED=1), tini (PID 1).
RUN apk add --no-cache chromium ffmpeg \
    nss freetype harfbuzz ca-certificates ttf-freefont \
    xvfb xvfb-run pulseaudio pulseaudio-utils dbus tini
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# Single source of truth: watch-party's entrypoint (PulseAudio bring-up when VB_STREAM_ENABLED=1,
# then `exec node dist/server.js` in the WORKDIR below).
COPY services/watch-party/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN addgroup -g 1001 -S nodejs && \
    adduser -S cinesync -u 1001 && \
    mkdir -p /app/services/media/logs && \
    mkdir -p /tmp/faststart-cache /tmp/vb-stream /tmp/cinesync-hls /tmp/.X11-unix && \
    chmod 1777 /tmp/.X11-unix && \
    chmod +x /usr/local/bin/docker-entrypoint.sh && \
    chown -R cinesync:nodejs /app/services/media /tmp/faststart-cache /tmp/vb-stream /tmp/cinesync-hls

USER cinesync
WORKDIR /app/services/media

# Railway injects PORT; 3000 is only the local default.
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider "http://localhost:${PORT:-3000}/health" || exit 1

# tini as PID 1 reaps exited Chromium/ffmpeg/yt-dlp children (PR #266: Node as PID 1 leaves
# zombies -> EAGAIN on every chromium launch). The entrypoint script then execs node.
ENTRYPOINT ["/sbin/tini", "--", "/usr/local/bin/docker-entrypoint.sh"]
