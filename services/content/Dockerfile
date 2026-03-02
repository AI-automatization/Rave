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

RUN npm ci

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

RUN npm ci --omit=dev

COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/services/content/dist ./services/content/dist

RUN ln -s /app/shared/dist /app/node_modules/@shared

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
