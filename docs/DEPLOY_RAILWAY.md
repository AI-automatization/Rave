# CineSync — Railway Deployment Guide

**Arxitektura:** 7 ta microservice, har biri Railway da alohida Service sifatida deploy qilinadi.
**Build strategiyasi:** Railway har servis uchun `Dockerfile` ni repo root kontekstida build qiladi.

---

## Tezkor cheat-sheet

```
Services:     auth(3001) user(3002) content(3003) watch-party(3004)
              battle(3005) notification(3007) admin(3008)
Health:       GET /health → { status: "ok" }
MongoDB:      MongoDB Atlas (bitta cluster, 7 ta database)
Redis:        Railway Redis plugin yoki Upstash
Elasticsearch: Elastic Cloud yoki Railway community plugin
```

---

## 1. Tashqi servislarni tayyorlash

Railway deploy qilishdan OLDIN quyidagilar tayyor bo'lishi kerak.

### 1.1 MongoDB Atlas

1. [cloud.mongodb.com](https://cloud.mongodb.com) → yangi cluster yarating (M0 Free yoki M10)
2. **Database Access** → yangi user yarating:
   - Username: `cinesync`
   - Password: kuchli parol (saqlang)
   - Role: `readWriteAnyDatabase`
3. **Network Access** → `0.0.0.0/0` qo'shing (Railway IP larni whitelist qilish qiyin)
4. **Connect** → connection string olish:
   ```
   mongodb+srv://cinesync:<password>@cluster0.xxxxx.mongodb.net
   ```

Har servis uchun alohida database ishlatiladi — bitta cluster ichida:
| Service | Database |
|---------|----------|
| auth | `cinesync_auth` |
| user | `cinesync_user` |
| content | `cinesync_content` |
| watch-party | `cinesync_watch_party` |
| battle | `cinesync_battle` |
| notification | `cinesync_notification` |
| admin | `cinesync` |

Connection string format (har servis uchun database nomini o'zgartirish):
```
mongodb+srv://cinesync:PASSWORD@cluster0.xxxxx.mongodb.net/cinesync_auth?retryWrites=true&w=majority
```

### 1.2 Redis

**Variant A — Railway Redis Plugin (tavsiya):**
1. Railway Project → **+ New** → **Database** → **Redis**
2. Railway avtomatik `REDIS_URL` env var beradi
3. Boshqa servislar uchun: plugin ni reference qilish → `${{Redis.REDIS_URL}}`

**Variant B — Upstash:**
1. [upstash.com](https://upstash.com) → Redis database yarating
2. TLS connection URL olish: `redis://:password@hostname:port`

### 1.3 Elasticsearch

**Variant A — Elastic Cloud (tavsiya):**
1. [cloud.elastic.co](https://cloud.elastic.co) → 14 kun free trial
2. Deployment yarating → Elasticsearch endpoint URL olish
3. API key yoki username/password olish

**Variant B — Railway community plugin:**
Railway Marketplace da Elasticsearch plugin mavjud (agar topilsa).

### 1.4 JWT Key pair yaratish

```bash
# Private key (auth servis uchun)
openssl genrsa -out private.pem 2048
openssl pkcs8 -topk8 -nocrypt -in private.pem -out private_pkcs8.pem

# Public key (barcha servislar uchun)
openssl rsa -in private.pem -pubout -out public.pem

# Railway env var uchun \n bilan bitta qatorga:
# Private key:
awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' private_pkcs8.pem

# Public key:
awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' public.pem
```

### 1.5 Internal Secret

Barcha servislar uchun bitta umumiy secret:
```bash
openssl rand -hex 32
# Masalan: a1b2c3d4e5f6...
```

---

## 2. Railway Project yaratish

1. [railway.app](https://railway.app) → Login
2. **New Project** → **Empty Project**
3. Project nomini bering: `cinesync`
4. **GitHub** → reponi ulang

---

## 3. Har servis uchun Railway Service yaratish

7 ta servis uchun quyidagi jarayonni takrorlang.

### 3.1 Servis yaratish

```
Project → + New → GitHub Repo → Repo tanlang
```

Har servis uchun **Settings** da:

| Setting | Qiymat |
|---------|--------|
| **Service Name** | `auth` (yoki `user`, `content`, ...) |
| **Root Directory** | `/` (repo root) |
| **Config File Path** | `services/auth/railway.toml` |
| **Branch** | `main` |

> **MUHIM:** Root Directory = `/` bo'lishi SHART. Aks holda Docker build context `services/auth/` bo'lib, `shared/` papkasini topa olmaydi.

### 3.2 Config File Path — har servis uchun

| Service | Config File Path |
|---------|-----------------|
| auth | `services/auth/railway.toml` |
| user | `services/user/railway.toml` |
| content | `services/content/railway.toml` |
| watch-party | `services/watch-party/railway.toml` |
| battle | `services/battle/railway.toml` |
| notification | `services/notification/railway.toml` |
| admin | `services/admin/railway.toml` |

### 3.3 Environment Variables — har servis uchun

**auth** (services/auth):
```env
NODE_ENV=production
PORT=3001
MONGO_URI=mongodb+srv://cinesync:PASSWORD@cluster0.xxxxx.mongodb.net/cinesync_auth?retryWrites=true&w=majority
REDIS_URL=${{Redis.REDIS_URL}}
JWT_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----
JWT_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxxxxxxxxx
EMAIL_FROM=noreply@cinesync.app
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://auth.up.railway.app/auth/google/callback
CLIENT_URL=https://your-web-app.vercel.app
ADMIN_URL=https://your-admin.vercel.app
USER_SERVICE_URL=https://user.up.railway.app
LOG_LEVEL=info
INTERNAL_SECRET=your_shared_internal_secret
```

**user** (services/user):
```env
NODE_ENV=production
PORT=3002
MONGO_URI=mongodb+srv://cinesync:PASSWORD@cluster0.xxxxx.mongodb.net/cinesync_user?retryWrites=true&w=majority
REDIS_URL=${{Redis.REDIS_URL}}
JWT_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----
UPLOAD_PATH=/tmp/uploads
LOG_LEVEL=info
INTERNAL_SECRET=your_shared_internal_secret
```

**content** (services/content):
```env
NODE_ENV=production
PORT=3003
MONGO_URI=mongodb+srv://cinesync:PASSWORD@cluster0.xxxxx.mongodb.net/cinesync_content?retryWrites=true&w=majority
REDIS_URL=${{Redis.REDIS_URL}}
ELASTICSEARCH_URL=https://your-cluster.es.io:9243
JWT_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----
UPLOAD_PATH=/tmp/uploads
LOG_LEVEL=info
INTERNAL_SECRET=your_shared_internal_secret
```

**watch-party** (services/watch-party):
```env
NODE_ENV=production
PORT=3004
MONGO_URI=mongodb+srv://cinesync:PASSWORD@cluster0.xxxxx.mongodb.net/cinesync_watch_party?retryWrites=true&w=majority
REDIS_URL=${{Redis.REDIS_URL}}
JWT_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----
LOG_LEVEL=info
INTERNAL_SECRET=your_shared_internal_secret
```

**battle** (services/battle):
```env
NODE_ENV=production
PORT=3005
MONGO_URI=mongodb+srv://cinesync:PASSWORD@cluster0.xxxxx.mongodb.net/cinesync_battle?retryWrites=true&w=majority
REDIS_URL=${{Redis.REDIS_URL}}
JWT_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----
LOG_LEVEL=info
INTERNAL_SECRET=your_shared_internal_secret
```

**notification** (services/notification):
```env
NODE_ENV=production
PORT=3007
MONGO_URI=mongodb+srv://cinesync:PASSWORD@cluster0.xxxxx.mongodb.net/cinesync_notification?retryWrites=true&w=majority
REDIS_URL=${{Redis.REDIS_URL}}
JWT_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxxxxxxxxx
EMAIL_FROM=noreply@cinesync.app
LOG_LEVEL=info
INTERNAL_SECRET=your_shared_internal_secret
```

**admin** (services/admin):
```env
NODE_ENV=production
PORT=3008
MONGO_URI=mongodb+srv://cinesync:PASSWORD@cluster0.xxxxx.mongodb.net/cinesync?retryWrites=true&w=majority
REDIS_URL=${{Redis.REDIS_URL}}
JWT_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----
LOG_LEVEL=info
INTERNAL_SECRET=your_shared_internal_secret
```

---

## 4. Deploy tartibi

Servislarni quyidagi tartibda deploy qiling (dependency bo'yicha):

```
1. Redis plugin      ← boshqa hammaga kerak
2. auth              ← JWT key lar shu yerda yaratiladi
3. user              ← auth dan keyin
4. content           ← mustaqil, lekin auth kerak
5. watch-party       ← user + auth kerak
6. battle            ← user + auth kerak
7. notification      ← barcha servislar tayyor bo'lgandan keyin
8. admin             ← oxirida
```

### Deploy qilish

Har bir servis uchun:
```
Service Settings → Deploy → Trigger Deploy
```

Yoki `main` branch ga push qilsangiz, barcha servislar avtomatik qayta deploy bo'ladi.

---

## 5. Health check tekshirish

Deploy tugagandan keyin:

```bash
# Har servis uchun Railway domain olish (Settings → Domains)
curl https://auth.up.railway.app/health
curl https://user.up.railway.app/health
curl https://content.up.railway.app/health
curl https://watch-party.up.railway.app/health
curl https://battle.up.railway.app/health
curl https://notification.up.railway.app/health
curl https://admin.up.railway.app/health

# Javob:
# { "status": "ok", "service": "auth", "timestamp": "..." }
```

---

## 6. Custom domain (ixtiyoriy)

```
Service → Settings → Domains → Add Custom Domain

auth.cinesync.app      → auth Railway service
api.cinesync.app       → nginx gateway (agar ishlatilsa)
```

---

## 7. Railway Private Networking (servislar arasi)

Railway ichida servislar bir-biriga **private** URL orqali murojaat qilishi mumkin (traffic tekin va tez):

```
Format: https://SERVICE_NAME.up.railway.app
        yoki private: SERVICE_NAME.railway.internal (TCP port bilan)
```

Hozircha `USER_SERVICE_URL` kabi env var larda Railway public URL lardan foydalaning. Railway Pro planda private networking tavsiya qilinadi.

---

## 8. Monitoring

Railway da built-in monitoring mavjud:
- **Metrics** tab: CPU, RAM, Network
- **Logs** tab: real-time container logs
- **Deployments** tab: har deploy tarixi

Xato bo'lsa:
```
Service → Deployments → oxirgi deploy → Logs ni ko'ring
```

---

## 9. Muammolar va yechimlar

### Build fails — "cannot find module shared"
**Sabab:** Root Directory `/` emas, boshqa papkaga o'rnatilgan
**Yechim:** Settings → Root Directory = `/`

### Health check fails
**Sabab:** Servis start bo'lmadi (env var yoki DB connection xato)
**Yechim:** Logs → xato xabarni ko'ring → env var ni tekshiring

### MongoDB connection error
**Sabab:** Atlas Network Access → `0.0.0.0/0` qo'shilmagan
**Yechim:** Atlas → Network Access → Add IP → `0.0.0.0/0`

### JWT key multiline xato
**Sabab:** Railway env var da `\n` literal sifatida yozilishi kerak
**Yechim:**
```bash
# To'g'ri format (bitta qatorda, \n bilan):
-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkq...\n-----END PUBLIC KEY-----
```

### Redis connection refused
**Sabab:** `REDIS_URL` noto'g'ri yoki Redis plugin ulanmagan
**Yechim:** Railway Redis plugin → Connect → `REDIS_URL` ni nusxalang

---

## 10. Auto-deploy workflow

GitHub Actions (`.github/workflows/docker-build.yml`) har `main` push da Docker image larni `ghcr.io` ga push qiladi.

Railway ham `main` push da avtomatik deploy qiladi (`railway.toml` da `builder = "DOCKERFILE"` sababli Railway o'zi build qiladi).

Ikkita parallel build bo'lmasligi uchun Railway avtomatik deployni o'chirib, faqat GHCR dan image pull qilishni sozlash ham mumkin (Railway Settings → Deploy → Docker Image URL).

---

*docs/DEPLOY_RAILWAY.md | CineSync | 2026-03-02*
