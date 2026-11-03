# Mobil ilovani lokal qurish — eslatmalar (2026-10-06)

Lokal test uchun topilgan muammolar va yechimlar (hammasi lokal/gitignored joylarda, repo kodiga kirmagan).

## Backend (lokal)
- Servislar `.env` ni `dotenv` bilan kech yuklaydi, `INTERNAL_SECRET` bo'sh qolib servislararo 401 beradi. Yechim: `.env` ni muhitga eksport qilib ishga tushirish.
- Redis kerak (`brew install redis`), MongoDB lokalda. Content servisi uchun `yt-dlp` (`brew install yt-dlp`), Elasticsearch ixtiyoriy.
- Lokal Playwright Chromium H.264 ni o'ynamaydi: `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` ni Google Chrome ga ko'rsating.
- Seed: `scripts/seed.ts` profil `_id` ni auth ID ga tenglaydi (aks holda `/users/me` 404).

## Android (emulator)
- `cd apps/mobile && npx expo prebuild --platform android --no-install`, keyin `cd android && ./gradlew :app:installDebug`.
- Emulatordan host servislariga: `adb reverse tcp:<port> tcp:<port>` (3001,3002,3003,3004,3007,3008,3009,8081), mobil `.env` da `http://127.0.0.1:<port>` ishlating.

## iOS (Xcode 27, simulyator)
- `expo run:ios` Xcode 27 `devicectl` formatida "code signing" xatosi beradi → `xcodebuild` bilan simulyator uchun quring.
- `ios/Podfile`: `pod 'GoogleUtilities', :modular_headers => true`, `pod 'RecaptchaInterop', :modular_headers => true`; `post_install` da pod'larning `IPHONEOS_DEPLOYMENT_TARGET` ini 16.4 gacha ko'tarish.
- `expo-modules-jsi` `JavaScriptRuntime.swift`: Swift 6.4 da `set == nil ? nil : setter` (C function pointer) xato — `if/else` ga ajrating.
- `SENTRY_DISABLE_AUTO_UPLOAD=true` bilan quring.
- Simulyatorda `CODE_SIGNING_ALLOWED=NO` bilan qurilsa Keychain ishlamaydi (`expo-secure-store`), login yolg'on xato beradi → `CODE_SIGN_IDENTITY="-" CODE_SIGNING_REQUIRED=YES CODE_SIGNING_ALLOWED=YES` ishlating.
