FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY tsconfig.base.json ./
COPY shared/package*.json ./shared/
COPY services/notification/package*.json ./services/notification/

RUN npm ci --workspace=@cinesync/shared --workspace=@cinesync/notification

COPY shared/ ./shared/
COPY services/notification/ ./services/notification/

RUN npm run build --workspace=@cinesync/notification

FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY shared/package*.json ./shared/
COPY services/notification/package*.json ./services/notification/

RUN npm ci --workspace=@cinesync/shared --workspace=@cinesync/notification --omit=dev

COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/services/notification/dist ./services/notification/dist

RUN ln -s /app/shared/dist /app/node_modules/@shared

RUN addgroup -g 1001 -S nodejs && \
    adduser -S cinesync -u 1001 && \
    mkdir -p /app/services/notification/logs && \
    chown -R cinesync:nodejs /app/services/notification

USER cinesync
WORKDIR /app/services/notification

EXPOSE 3007

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3007/health || exit 1

CMD ["node", "dist/server.js"]
