FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY tsconfig.base.json ./
COPY shared/package*.json ./shared/
COPY services/user/package*.json ./services/user/

RUN npm ci --workspace=@cinesync/shared --workspace=@cinesync/user

COPY shared/ ./shared/
COPY services/user/ ./services/user/

RUN npm run build --workspace=@cinesync/user

FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY shared/package*.json ./shared/
COPY services/user/package*.json ./services/user/

RUN npm ci --workspace=@cinesync/shared --workspace=@cinesync/user --omit=dev

COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/services/user/dist ./services/user/dist

RUN ln -s /app/shared/dist /app/node_modules/@shared

RUN addgroup -g 1001 -S nodejs && \
    adduser -S cinesync -u 1001 && \
    mkdir -p /app/services/user/logs && \
    chown -R cinesync:nodejs /app/services/user

USER cinesync
WORKDIR /app/services/user

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3002/health || exit 1

CMD ["node", "dist/server.js"]
