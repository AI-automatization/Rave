// No-op replacement for expo-notifications DevicePushTokenAutoRegistration.fx.js
// The original calls addPushTokenListener at module level, which throws in Expo Go SDK 53+.
// Metro config redirects the fx file here when running in development with Expo Go.

export async function setAutoServerRegistrationEnabledAsync() {}
export async function __handlePersistedRegistrationInfoAsync() {}
