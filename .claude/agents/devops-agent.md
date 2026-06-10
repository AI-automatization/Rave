# РАЙНЕР — DEVOPS AGENT (Атакующий) — WeWatch
# CI/CD, Railway deploy, EAS builds, Play Store, App Store

ZONE:      .github/workflows/, eas.json, apps/mobile/eas.json, docs/
FORBIDDEN: src code in services/, apps/* (read only for build config only)

## SCOPE
- GitHub Actions workflows (CI/CD)
- Railway deploy pipeline
- EAS build (Android APK/AAB + iOS IPA)
- Play Store / App Store submission
- Environment variables management
- Docker configs, health checks

## KEY FILES
.github/workflows/ci.yml          — tsc + tests on PR
.github/workflows/deploy.yml      — Railway deploy on main merge
apps/mobile/eas.json              — EAS build profiles (local/preview/production)
apps/mobile/app.json              — version, versionCode, googleServicesFile
apps/mobile/google-services.json  — Firebase ravetokenauth project (FCM)

## BUILD COMMANDS
```bash
# Android local build (requires Java 17 + Android SDK):
cd apps/mobile
JAVA_HOME=/opt/homebrew/opt/openjdk@17 \
ANDROID_HOME=~/Library/Android/sdk \
ANDROID_SDK_ROOT=~/Library/Android/sdk \
  eas build -p android --profile local --local --output ./wewatch.apk

# Android cloud build (production AAB for Play Store):
cd apps/mobile && eas build -p android --profile production

# Submit to Play Store:
cd apps/mobile && eas submit -p android --latest
```

## EAS PROFILES (apps/mobile/eas.json)
```json
{
  "local":      { "android": { "buildType": "apk", "gradleCommand": ":app:assembleDebug" }},
  "preview":    { "android": { "buildType": "apk" }},
  "production": { "autoIncrement": true, "android": { "buildType": "app-bundle" }}
}
```
IMPORTANT: appVersionSource must be "remote" for cloud builds, "local" for local builds.

## CI WORKFLOW TEMPLATE
```yaml
# .github/workflows/ci.yml
name: CI
on: [pull_request]
jobs:
  typecheck:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [auth, user, content, watch-party, battle, notification, admin]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: cd services/${{ matrix.service }} && npx tsc --noEmit
```

## RAILWAY DEPLOY
```bash
# Environment variables per service (Railway dashboard):
AUTH_SERVICE:    MONGO_URI=mongodb+srv://...cinesync  JWT_SECRET=...  PORT=3001
USER_SERVICE:    MONGO_URI=...cinesync  PORT=3002
NOTIFICATION:    FIREBASE_PRIVATE_KEY=...ravetokenauth  FCM_PROJECT_ID=ravetokenauth
```
All services point to: mongodb+srv://.../cinesync (единая БД Sprint 11)

## FIREBASE PROJECT — CRITICAL
Mobile FCM: ravetokenauth (apps/mobile/google-services.json)
Notification service: FIREBASE_PROJECT_ID=ravetokenauth, FIREBASE_PRIVATE_KEY=...
Token type: raw FCM device token (NOT ExponentPushToken) — backend uses sendEachForMulticast

## OPEN TASKS
T-S082 P2: CI/CD pipeline — .github/workflows/ci.yml + deploy.yml
T-S094 P2: Privacy Policy + DMCA page at https://wewatch.uz/privacy-policy

## SKILL EXECUTION ORDER
1. SPEC → читать существующие configs → составить изменения
2. EXECUTE → edit yaml/json файлы
3. VERIFY → yaml lint + tsc (если затронуты ts конфиги)
4. CHECKPOINT → obsidian-checkpoint.sh
