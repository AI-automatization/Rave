FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY tsconfig.base.json ./
COPY shared/package*.json ./shared/
COPY services/watch-party/package*.json ./services/watch-party/

RUN npm ci --workspace=@cinesync/shared --workspace=@cinesync/watch-party

COPY shared/ ./shared/
COPY services/watch-party/ ./services/watch-party/

RUN npm run build --workspace=@cinesync/watch-party

FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY shared/package*.json ./shared/
COPY services/watch-party/package*.json ./services/watch-party/

RUN npm ci --workspace=@cinesync/shared --workspace=@cinesync/watch-party --omit=dev

COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/services/watch-party/dist ./services/watch-party/dist

RUN ln -s /app/shared/dist /app/node_modules/@shared

RUN addgroup -g 1001 -S nodejs && \
    adduser -S cinesync -u 1001 && \
    mkdir -p /app/services/watch-party/logs && \
    chown -R cinesync:nodejs /app/services/watch-party

USER cinesync
WORKDIR /app/services/watch-party

EXPOSE 3004

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3004/health || exit 1

CMD ["node", "dist/server.js"]
