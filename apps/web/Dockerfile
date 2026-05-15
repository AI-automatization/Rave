FROM node:20-alpine AS builder
WORKDIR /app

# Copy root workspace manifest
COPY package*.json ./
COPY tsconfig.base.json ./

# Copy package manifests for the workspaces we need
COPY shared/package*.json ./shared/
COPY apps/web/package*.json ./apps/web/

# Install workspace deps (shared + web only)
RUN npm ci --legacy-peer-deps --include-workspace-root -w @cinesync/shared -w web

# Copy source
COPY shared/ ./shared/
COPY apps/web/ ./apps/web/

# Build shared types (needed by @shared/* tsconfig path)
RUN npm run build --workspace=@cinesync/shared

# Build Next.js (standalone output)
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
