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
#
# xvfb + pulseaudio (2026-08-28): needed only for the VB live A/V stream (vbStream.service.ts).
# Headless Chromium renders to no X surface and produces no audio stream at all, so it can never
# be captured as watchable video — CDP's screencast is JPEG frames with no audio path by design.
# For the stream, Chrome runs HEADFUL on a per-session Xvfb display with its audio routed to a
# per-session PulseAudio null-sink, and ffmpeg grabs both. Inert unless VB_STREAM_ENABLED=1:
# without the flag nothing here is ever spawned and Chromium stays headless exactly as before.
# xvfb-run/pulseaudio-utils bring in `pactl`, which the service uses to create/destroy sinks.
RUN apk add --no-cache chromium ffmpeg \
    nss freetype harfbuzz ca-certificates ttf-freefont \
    xvfb xvfb-run pulseaudio pulseaudio-utils dbus
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

COPY services/watch-party/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN addgroup -g 1001 -S nodejs && \
    adduser -S cinesync -u 1001 && \
    mkdir -p /app/services/watch-party/logs && \
    mkdir -p /tmp/faststart-cache /tmp/vb-stream /tmp/.X11-unix && \
    chmod 1777 /tmp/.X11-unix && \
    chmod +x /usr/local/bin/docker-entrypoint.sh && \
    chown -R cinesync:nodejs /app/services/watch-party /tmp/faststart-cache /tmp/vb-stream

USER cinesync
WORKDIR /app/services/watch-party

EXPOSE 3004

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3004/health || exit 1

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
