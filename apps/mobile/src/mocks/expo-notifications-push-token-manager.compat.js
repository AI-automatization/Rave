// Compat shim for expo-notifications PushTokenManager.
// In Expo Go (SDK 53+) the ExpoPushTokenManager native module was removed, so the
// original PushTokenManager.native.js (requireNativeModule) throws on import.
// requireOptionalNativeModule returns null instead of throwing, letting us fall back
// to a no-op stub ONLY when the native module is truly absent (Expo Go). In release
// and dev-client builds the real module is returned — previously an unconditional
// no-op was bundled into production, silently breaking getDevicePushTokenAsync
// (it resolved null → FCM token never reached the backend).

import { requireOptionalNativeModule } from 'expo-modules-core';

const noop = () => {};
const stub = {
  addListener: () => ({ remove: noop }),
  removeListeners: noop,
  removeAllListeners: noop,
  startObserving: noop,
  stopObserving: noop,
  getDevicePushTokenAsync: async () => null,
  unregisterForNotificationsAsync: async () => null,
};

export default requireOptionalNativeModule('ExpoPushTokenManager') ?? stub;
