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

RUN npm ci --legacy-peer-deps --include-workspace-root -w @cinesync/shared -w @cinesync/payment

COPY shared/ ./shared/
COPY services/payment/ ./services/payment/

RUN npm run build --workspace=@cinesync/shared
RUN npm run build --workspace=@cinesync/payment

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

RUN npm ci --legacy-peer-deps --omit=dev --include-workspace-root -w @cinesync/shared -w @cinesync/payment

COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/services/payment/dist ./services/payment/dist

RUN ln -s /app/shared/dist /app/node_modules/@shared

RUN addgroup -g 1001 -S nodejs && \
    adduser -S cinesync -u 1001 && \
    mkdir -p /app/services/payment/logs && \
    chown -R cinesync:nodejs /app/services/payment

USER cinesync
WORKDIR /app/services/payment

EXPOSE 3009

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3009/health || exit 1

CMD ["node", "dist/server.js"]
