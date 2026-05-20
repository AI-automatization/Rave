FROM node:20-slim AS builder
LABEL build-id="20260520-1"
WORKDIR /app

# Copy shared src for @shared/* tsconfig path alias (type-only, stripped by SWC)
COPY shared/src/ ./shared/src/

# Copy web app
COPY apps/web/ ./apps/web/

# Install without lock file so platform-specific optional deps (SWC, Tailwind oxide)
# are resolved for linux-x64 rather than inheriting the macOS lock file
WORKDIR /app/apps/web
RUN npm install --legacy-peer-deps

# Set tsconfig paths base so @shared/* resolves to /app/shared/src/*
# (Next.js reads tsconfig which maps "@shared/*" → "../../shared/src/*" relative to apps/web)
RUN npm run build

# ─── Production ───────────────────────────────────────────────────────────────
FROM node:20-slim AS production
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
