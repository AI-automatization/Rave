# Core service: auth + user + notification + admin + payment in ONE container.
# Build context = repo root (Railway "Root Directory" = /). See services/core/README.md.
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
COPY services/core/package*.json ./services/core/

# Full install — includes root deps (swagger-jsdoc, swagger-ui-express)
# apps/* workspaces are skipped (dirs not present in build context)
RUN npm ci --legacy-peer-deps --include-workspace-root \
    -w @cinesync/shared -w @cinesync/auth -w @cinesync/user -w @cinesync/notification \
    -w @cinesync/admin -w @cinesync/payment -w @cinesync/core

COPY shared/ ./shared/
COPY services/auth/ ./services/auth/
COPY services/user/ ./services/user/
COPY services/notification/ ./services/notification/
COPY services/admin/ ./services/admin/
COPY services/payment/ ./services/payment/
COPY services/core/ ./services/core/

# shared first (emits dist/*.d.ts the services type-check against), then the five services
# (core imports their dist/*.js + dist/*.d.ts), then core itself.
RUN npm run build --workspace=@cinesync/shared
RUN npm run build --workspace=@cinesync/auth && \
    npm run build --workspace=@cinesync/user && \
    npm run build --workspace=@cinesync/notification && \
    npm run build --workspace=@cinesync/admin && \
    npm run build --workspace=@cinesync/payment
RUN npm run build --workspace=@cinesync/core

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
COPY services/core/package*.json ./services/core/

# Production install — omits devDeps, includes root prod deps (swagger)
RUN npm ci --legacy-peer-deps --omit=dev --include-workspace-root \
    -w @cinesync/shared -w @cinesync/auth -w @cinesync/user -w @cinesync/notification \
    -w @cinesync/admin -w @cinesync/payment -w @cinesync/core

COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/services/auth/dist ./services/auth/dist
COPY --from=builder /app/services/user/dist ./services/user/dist
COPY --from=builder /app/services/notification/dist ./services/notification/dist
COPY --from=builder /app/services/admin/dist ./services/admin/dist
COPY --from=builder /app/services/payment/dist ./services/payment/dist
COPY --from=builder /app/services/core/dist ./services/core/dist

RUN ln -s /app/shared/dist /app/node_modules/@shared

# uploads/ = user service avatar storage (UPLOAD_PATH default ./uploads, relative to cwd).
# If the old user service had a Railway volume, mount it at /app/services/core/uploads.
RUN addgroup -g 1001 -S nodejs && \
    adduser -S cinesync -u 1001 && \
    mkdir -p /app/services/core/logs /app/services/core/uploads && \
    chown -R cinesync:nodejs /app/services/core

USER cinesync
WORKDIR /app/services/core

# Railway injects PORT; 3000 is only the local default.
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider "http://localhost:${PORT:-3000}/health" || exit 1

CMD ["node", "dist/server.js"]
