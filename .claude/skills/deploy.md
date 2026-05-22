---
name: deploy
description: Deploy WeWatch services to Railway (backend) or Vercel/Railway (web). Runs pre-checks, deploys, and verifies health. Use before releasing to production.
argument-hint: "deploy [service: web|all|auth|user|content|watch-party]"
---

# Deploy — WeWatch

WeWatch deployment protocol. Backend on Railway, Web on Railway (Docker), Mobile via Expo/Play Store.

## Pre-Deployment Checklist (ALWAYS RUN)

```bash
# 1. No uncommitted changes
git status --porcelain

# 2. Branch is up to date
git fetch && git status -uno

# 3. TypeScript clean
cd apps/web && tsc --noEmit
# for each service: cd services/auth && tsc --noEmit

# 4. Tests pass
npm test --if-present

# 5. No critical vulnerabilities
npm audit --audit-level=critical --if-present
```

If ANY check fails → abort deployment. Fix first.

## Deployment Methods

### Web App (apps/web → Railway Docker)

```bash
# Build Docker image
cd apps/web
docker build -t wewatch-web .

# Deploy via Railway
railway up --detach --service web

# Monitor
railway logs --service web --tail
```

### Backend Services (Railway)

```bash
# Single service
railway up --detach --service auth
railway up --detach --service user
railway up --detach --service content
railway up --detach --service watch-party
railway up --detach --service battle
railway up --detach --service notification

# Check deployment status
railway deployment list --service <name>
```

### Environment Variables

Never commit .env files. Set via Railway dashboard or CLI:
```bash
railway variables set JWT_SECRET=... --service auth
railway variables set MONGODB_URI=... --service auth
```

## Post-Deploy Verification

```bash
# Health check — all services
for svc in auth user content watch-party battle notification; do
  PORT=$(railway variables get PORT --service $svc 2>/dev/null || echo "300X")
  URL=$(railway domain --service $svc 2>/dev/null)
  echo "=== $svc ==="
  curl -f "$URL/health" 2>/dev/null && echo "✅ Healthy" || echo "❌ Unhealthy"
done
```

## Rollback

```bash
# Railway: redeploy previous deployment
railway rollback --service <name>

# Or via Git: revert the commit
git revert HEAD
git push origin main
```

## Deployment Report Format

```
## Deployment: <environment>
Date: <timestamp>
Version: <git-sha-short>
Branch: main

### Pre-checks
  ✅ No uncommitted changes
  ✅ tsc: 0 errors
  ✅ Tests: passing
  ✅ npm audit: clean

### Services Deployed
  ✅ web — https://wewatch.railway.app
  ✅ auth — healthy
  ✅ watch-party — healthy

### Health Checks
  ✅ /health: 200 OK (all services)

### Rollback Command
  railway rollback --service web
```

## WeWatch-Specific Notes

- MongoDB Atlas connection string in `MONGODB_URI` env var
- Redis URL in `REDIS_URL` (port 6380 in dev, Railway internal in prod)
- Firebase service account JSON in `FIREBASE_SERVICE_ACCOUNT` env var (base64 encoded)
- JWT RS256 keys: `JWT_PRIVATE_KEY` + `JWT_PUBLIC_KEY` (base64 encoded PEM)
- Never deploy `services/watch-party` without verifying Socket.io Redis adapter config
- `apps/web` requires `NEXT_PUBLIC_API_URL` to be set before build

## Running

```bash
/deploy web              # deploy web app only
/deploy all              # deploy all services (careful!)
/deploy auth             # deploy single service
```
