FROM node:20-alpine AS builder
WORKDIR /app

# Root package.json (monorepo)
COPY package*.json ./
COPY tsconfig.base.json ./

# Web app deps
COPY apps/web/package*.json ./apps/web/

RUN npm ci

# Source
COPY apps/web/ ./apps/web/

# Build
WORKDIR /app/apps/web
RUN npm run build

# ─── Production ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# standalone output
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
