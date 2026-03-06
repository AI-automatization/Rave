FROM node:20-slim AS builder
WORKDIR /app

COPY package*.json ./
COPY tsconfig.base.json ./
COPY apps/web/package*.json ./apps/web/

# npm ci o'rniga npm install — Linux platform-specific native binaries auto-resolve
RUN npm install

COPY apps/web/ ./apps/web/

WORKDIR /app/apps/web
RUN npm run build

# ─── Production ───────────────────────────────────────────────────────────────
FROM node:20-slim AS production
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
