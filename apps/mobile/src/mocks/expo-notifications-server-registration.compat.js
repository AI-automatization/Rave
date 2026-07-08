// Compat shim for expo-notifications ServerRegistrationModule — see
// expo-notifications-push-token-manager.compat.js for the rationale.
// Real native module when available (release / dev-client), no-op stub in Expo Go.

import { requireOptionalNativeModule } from 'expo-modules-core';

const stub = {
  setRegistrationInfoAsync: async () => null,
  getRegistrationInfoAsync: async () => null,
};

export default requireOptionalNativeModule('NotificationsServerRegistrationModule') ?? stub;
