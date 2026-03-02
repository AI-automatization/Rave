FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY tsconfig.base.json ./
COPY shared/package*.json ./shared/
COPY services/battle/package*.json ./services/battle/

RUN npm ci --workspace=@cinesync/shared --workspace=@cinesync/battle

COPY shared/ ./shared/
COPY services/battle/ ./services/battle/

RUN npm run build --workspace=@cinesync/battle

FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY shared/package*.json ./shared/
COPY services/battle/package*.json ./services/battle/

RUN npm ci --workspace=@cinesync/shared --workspace=@cinesync/battle --omit=dev

COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/services/battle/dist ./services/battle/dist

RUN ln -s /app/shared/dist /app/node_modules/@shared

RUN addgroup -g 1001 -S nodejs && \
    adduser -S cinesync -u 1001 && \
    mkdir -p /app/services/battle/logs && \
    chown -R cinesync:nodejs /app/services/battle

USER cinesync
WORKDIR /app/services/battle

EXPOSE 3005

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3005/health || exit 1

CMD ["node", "dist/server.js"]
