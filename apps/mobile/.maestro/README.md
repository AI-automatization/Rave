# CineSync — Maestro E2E Tests

## O'rnatish (bir marta)
```bash
# macOS / Linux:
curl -Ls "https://get.maestro.mobile.dev" | bash

# Windows:
iex "& { $(irm 'https://get.maestro.mobile.dev') }"
```

## Ishga tushirish
```bash
# Bitta flow:
maestro test .maestro/01_auth_login.yaml

# Barcha flowlar:
maestro test .maestro/

# Debug rejimida:
maestro test --debug .maestro/01_auth_login.yaml
```

## Tayyorlov
1. Emulyator yoki telefon ulangan bo'lsin
2. App ishlab tursin (`npx expo start`)
3. Maestro ishga tushirilsin

## Flow-lar
| Fayl | Test qilinadi |
|------|--------------|
| `01_auth_login.yaml` | Login → HomeScreen |
| `02_home_to_movie_detail.yaml` | Home → MovieDetail → VideoPlayer → Back |
| `03_watchparty_create_join.yaml` | "+" → SourcePicker → YouTube → Back |
| `04_notification_deep_link.yaml` | Bell → Notifications → Friends → Profile → Home |
