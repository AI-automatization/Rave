---
name: security-audit
description: Security audit covering OWASP Top 10, secrets scan, JWT/auth review, and dependency vulnerabilities. Use before major releases or when touching auth/payment/sensitive code.
argument-hint: "security-audit [scope: all|secrets|deps|auth|owasp]"
---

# Security Audit — WeWatch

Covers all attack surfaces specific to WeWatch: JWT auth, Socket.io, MongoDB, Redis, Firebase.

## Quick Secrets Scan (always run first)

```bash
# Scan for hardcoded secrets
grep -r "password\s*=" services/ apps/ --include="*.ts" --include="*.js" -l
grep -r "api[_-]key\|apiKey\|secret\|token" services/ apps/ --include="*.ts" -l | grep -v "*.d.ts"
grep -r "mongodb://\|redis://\|postgresql://" services/ apps/ --include="*.ts" | grep -v ".env"
# Check .gitignore covers .env files
cat .gitignore | grep -E "\.env|\.key|\.pem"
```

Never print full secret values — mask all but first 4 chars.

## Full Audit Steps

### 1. Dependency Vulnerabilities
```bash
for svc in services/auth services/user services/content services/watch-party services/battle services/notification services/admin; do
  echo "=== $svc ==="
  cd $svc && npm audit --audit-level=high 2>/dev/null; cd -
done
```
List critical/high severity only. Check if vulnerable code path is actually reachable.

### 2. OWASP Top 10 — WeWatch Specific

**Injection (A03)**
- MongoDB queries using string interpolation → must use Mongoose (parameterized)
- `eval()` anywhere → 0 acceptable
- XSS via `innerHTML` in web/admin-ui
- Socket.io event data used in DB queries without validation

**Broken Auth (A07)**
```
□ JWT: RS256, 15min TTL, refresh 30d  
□ bcrypt 12 rounds (not MD5/SHA1)
□ Rate limit: 5 attempts → 15min block
□ Socket.io: JWT verified on EVERY connection event
□ Refresh token rotation implemented
```

**Sensitive Data (A02)**
```
□ Passwords never logged
□ PII not in error messages
□ MongoDB Atlas TLS enabled
□ Redis AUTH set
□ HTTPS only (no HTTP fallback)
```

**Broken Access Control (A01)**
```
□ Every API endpoint has auth middleware
□ Users can only access their own data (userId from JWT, not body)
□ Admin endpoints protected by admin role check
□ Room ownership verified before control actions
```

**Security Misconfiguration (A05)**
```
□ CORS whitelist (not *) in production
□ helmet() middleware on all services
□ No default MongoDB credentials
□ Redis requirepass set
□ NODE_ENV=production in deployment
```

**Injection via Socket.io**
```typescript
// BAD
socket.on('join-room', (roomId) => db.findRoom(roomId));

// GOOD  
socket.on('join-room', async (data) => {
  const { roomId } = joinRoomSchema.parse(data);  // Zod validation
  const room = await roomService.findById(roomId);
});
```

### 3. WeWatch-Specific Checks

**Firebase FCM tokens**
```
□ FCM tokens stored encrypted, not plaintext
□ Token refresh handled on 401
□ Old tokens cleaned up
```

**Bull Queue**
```
□ Job data doesn't contain sensitive user info
□ Failed jobs don't expose credentials in logs
□ Redis connection uses AUTH
```

**Elasticsearch**
```
□ No raw user input in ES queries
□ ES not exposed to public internet
□ Index names don't leak user IDs
```

### 4. Report Format

```
## Security Audit: WeWatch
Date: <date>
Scope: <what was checked>

### CRITICAL (fix before deploy)
- [service]: Finding — file:line — Fix: ...

### HIGH (fix this sprint)  
- [service]: Finding — file:line — Fix: ...

### MEDIUM (fix next sprint)
- ...

### PASSED ✅
- JWT configuration: RS256, TTL correct
- bcrypt rounds: 12 ✓
- ...

### Recommended Actions
1. Rotate <credential> (found in <file>)
2. Add rate limiting to <endpoint>
3. Upgrade <package> to <version>
```

## Running

```bash
/security-audit           # full audit
/security-audit secrets   # secrets only
/security-audit auth      # JWT/auth only
/security-audit deps      # npm audit only
```
