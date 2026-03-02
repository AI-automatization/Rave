FROM node:20-alpine AS builder
WORKDIR /app

# All backend package.json files for workspace resolution
COPY package*.json ./
COPY tsconfig.base.json ./
COPY shared/package*.json ./shared/
COPY services/auth/package*.json ./services/auth/
COPY services/user/package*.json ./services/user/
COPY services/content/package*.json ./services/content/
COPY services/watch-party/package*.json ./services/watch-party/
COPY services/battle/package*.json ./services/battle/
COPY services/notification/package*.json ./services/notification/
COPY services/admin/package*.json ./services/admin/

# Full install — includes root deps (swagger-jsdoc, swagger-ui-express)
# apps/* workspaces are skipped (dirs not present in build context)
RUN npm ci

# Copy only what is needed for this build
COPY shared/ ./shared/
COPY services/auth/ ./services/auth/

# Step 1: Build shared → generates dist/*.d.ts type declarations
RUN npm run build --workspace=@cinesync/shared

# Step 2: Build service using tsconfig.build.json
# Paths point to shared/dist/*.d.ts — avoids rootDir conflict with shared/src
RUN npm run build --workspace=@cinesync/auth -- --project tsconfig.build.json

FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY shared/package*.json ./shared/
COPY services/auth/package*.json ./services/auth/
COPY services/user/package*.json ./services/user/
COPY services/content/package*.json ./services/content/
COPY services/watch-party/package*.json ./services/watch-party/
COPY services/battle/package*.json ./services/battle/
COPY services/notification/package*.json ./services/notification/
COPY services/admin/package*.json ./services/admin/

# Production install — omits devDeps, includes root prod deps (swagger)
RUN npm ci --omit=dev

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
