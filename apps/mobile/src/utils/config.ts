// ─── App Configuration ────────────────────────────────────────────────────────
//
// react-native-config o'rnatilganda:
//   import Config from 'react-native-config';
//   export const GOOGLE_WEB_CLIENT_ID = Config.GOOGLE_WEB_CLIENT_ID ?? '';
//
// Hozircha google-services.json / GoogleService-Info.plist boshqaradi.
// .env.example ga GOOGLE_WEB_CLIENT_ID qo'shing.

export const APP_SCHEME = 'cinesync';
export const APP_DEEP_LINK_PREFIX = `${APP_SCHEME}://`;

// Google OAuth — Android: google-services.json, iOS: GoogleService-Info.plist
// Web OAuth uchun webClientId kerak (Google Cloud Console dan)
export const GOOGLE_WEB_CLIENT_ID: string =
  (process.env.GOOGLE_WEB_CLIENT_ID as string | undefined) ?? '';
