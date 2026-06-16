FROM node:20-slim AS builder
LABEL build-id="20260616-6"
WORKDIR /app

ENV NODE_OPTIONS="--max-old-space-size=2048"

# Accept build-time public env vars so Next.js can inline them
ARG NEXT_PUBLIC_SOCKET_URL=http://localhost:3004
ARG NEXT_PUBLIC_APP_URL=https://wewatch.uz
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

# Accept runtime service URLs (inlined by Next.js webpack at build time)
ARG WATCH_PARTY_SERVICE_URL=http://localhost:3004/api/v1
ARG AUTH_SERVICE_URL=http://localhost:3001/api/v1/auth
ARG USER_SERVICE_URL=http://localhost:3002/api/v1
ARG CONTENT_SERVICE_URL=http://localhost:3003/api/v1
ARG NOTIFICATION_SERVICE_URL=http://localhost:3007/api/v1
ENV WATCH_PARTY_SERVICE_URL=$WATCH_PARTY_SERVICE_URL
ENV AUTH_SERVICE_URL=$AUTH_SERVICE_URL
ENV USER_SERVICE_URL=$USER_SERVICE_URL
ENV CONTENT_SERVICE_URL=$CONTENT_SERVICE_URL
ENV NOTIFICATION_SERVICE_URL=$NOTIFICATION_SERVICE_URL

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
