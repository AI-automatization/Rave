FROM node:20-alpine AS builder
WORKDIR /app

# Copy root workspace manifest (needed for workspace resolution)
COPY package*.json ./
COPY tsconfig.base.json ./

# Copy only the web app package manifest
COPY apps/web/package*.json ./apps/web/

# Install web app deps (workspace-isolated, no shared build deps needed)
RUN npm ci --legacy-peer-deps -w web

# Copy shared source (needed for @shared/* tsconfig path alias — type-only, stripped by SWC)
COPY shared/src/ ./shared/src/

# Copy web app source
COPY apps/web/ ./apps/web/

# Build Next.js (standalone output); SWC strips @shared/* type-only imports at compile time
WORKDIR /app/apps/web
RUN npm run build

# ─── Production ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./public

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
