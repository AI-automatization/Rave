FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY ../../shared/package*.json ../../shared/
RUN npm ci --workspace=@cinesync/shared --workspace=@cinesync/auth

COPY . .
COPY ../../shared ../../shared

RUN npm run build

FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

RUN addgroup -g 1001 -S nodejs && \
    adduser -S cinesync -u 1001

RUN mkdir -p logs && chown -R cinesync:nodejs logs

USER cinesync

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["node", "dist/server.js"]
