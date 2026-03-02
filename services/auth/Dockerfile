FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY tsconfig.base.json ./
COPY shared/package*.json ./shared/
COPY services/auth/package*.json ./services/auth/

RUN npm ci --workspace=@cinesync/shared --workspace=@cinesync/auth

COPY shared/ ./shared/
COPY services/auth/ ./services/auth/

RUN npm run build --workspace=@cinesync/auth

FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY shared/package*.json ./shared/
COPY services/auth/package*.json ./services/auth/

RUN npm ci --workspace=@cinesync/shared --workspace=@cinesync/auth --omit=dev

COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/services/auth/dist ./services/auth/dist

RUN ln -s /app/shared/dist /app/node_modules/@shared

RUN addgroup -g 1001 -S nodejs && \
    adduser -S cinesync -u 1001 && \
    mkdir -p /app/services/auth/logs && \
    chown -R cinesync:nodejs /app/services/auth

USER cinesync
WORKDIR /app/services/auth

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["node", "dist/server.js"]
