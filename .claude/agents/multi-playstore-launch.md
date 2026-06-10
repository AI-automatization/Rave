# НАТИСК — MULTI-AGENT: Play Store Launch Prep
# T-E124 (graphics) + T-S094 (privacy policy) — parallel

## ЗАДАЧА
Подготовить всё необходимое для публикации в Play Store:
1. T-E124: Feature Graphic (1024×500) + 5 screenshots
2. T-S094: Privacy Policy + DMCA page (уже ✅ Bajarildi — verify URL is live)

## PRE-CHECK
```bash
# Проверить что privacy policy живой:
curl -I https://wewatch.uz/privacy-policy
# Если 404 → T-S094 не задеплоен
```

## Agent 1 — Play Store Graphics (T-E124)
```javascript
Agent({
  subagent_type: "general-purpose",
  prompt: `
[ВСТАВЬ СОДЕРЖИМОЕ .claude/agents/marketing-agent.md]

TASK SPEC:
  ID: T-E124
  Title: Play Store Feature Graphic + 5 Screenshots

  WHAT TO CREATE:
    1. Feature Graphic — 1024×500px
       - Dark background #0A0A0F
       - WeWatch logo centered
       - Tagline: "Watch Together. Sync'd."
       - Purple gradient #7B72F8
       - Export: marketing/playstore/feature-graphic.png

    2. Screenshot descriptions (for manual capture or AI generation):
       screenshot-1-home.png    — HomeScreen, film feed, dark UI
       screenshot-2-party.png   — WatchParty, 2 users synced
       screenshot-3-friends.png — Friends list, online indicators
       screenshot-4-battle.png  — BattleScreen, versus mode
       screenshot-5-achieve.png — Achievements, progress

    3. Create marketing/playstore/README.md with spec + dimensions

  Zone: marketing/playstore/ (create if needed)
  Style: dark glass morphism, Bebas Neue font, premium cinematic
  Return: created files list + dimensions verified
  `
})
```

## Agent 2 — Privacy Policy Verify + EAS Config (T-S094)
```javascript
Agent({
  subagent_type: "general-purpose",
  prompt: `
[ВСТАВЬ СОДЕРЖИМОЕ .claude/agents/devops-agent.md]

TASK SPEC:
  ID: T-S094 verification + EAS production config

  Steps:
    1. Check if apps/web/src/app/privacy-policy/ exists → read it
    2. Verify the page exports proper Next.js component
    3. Check apps/mobile/eas.json — does "production" profile exist with correct settings?
    4. Verify app.json: version, versionCode, package name (com.wewatch.app)
    5. Verify google-services.json present (ravetokenauth)

  Expected eas.json production:
    autoIncrement: true
    android.buildType: "app-bundle"
    appVersionSource: "remote"

  Return: STATUS of each check + any fixes needed
  `
})
```

## POST-CHECKLIST (Play Store submission)
```
[ ] Feature Graphic: marketing/playstore/feature-graphic.png (1024×500)
[ ] 5 screenshots: marketing/playstore/screenshot-*.png
[ ] Privacy Policy URL live: https://wewatch.uz/privacy-policy
[ ] eas.json production profile correct
[ ] app.json version 1.0.x, versionCode N
[ ] google-services.json = ravetokenauth
[ ] Play Console: app created, com.wewatch.app
[ ] Run: cd apps/mobile && eas build -p android --profile production
[ ] Run: cd apps/mobile && eas submit -p android --latest
```

## SKILL
Подробный гайд: .claude/skills/app-store-publish.md
