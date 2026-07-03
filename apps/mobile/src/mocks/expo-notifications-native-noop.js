// No-op native module stub for Expo Go compatibility.
// Replaces native modules removed from Expo Go in SDK 53+:
//   ExpoPushTokenManager, NotificationsServerRegistrationModule, ExpoTopicSubscriptionModule
// These native modules are not present in Expo Go — requireNativeModule() throws on import.
// Metro redirects their wrapper files here to prevent crash.

const noop = () => {};
const noopAsync = async () => null;
const noopSubscription = { remove: noop };

export default {
  // EventEmitter interface (PushTokenManager)
  addListener: () => noopSubscription,
  removeListeners: noop,
  removeAllListeners: noop,
  startObserving: noop,
  stopObserving: noop,

  // Topic subscription (ExpoTopicSubscriptionModule)
  subscribeToTopicAsync: noopAsync,
  unsubscribeFromTopicAsync: noopAsync,

  // Server registration (NotificationsServerRegistrationModule)
  setRegistrationInfoAsync: noopAsync,
  getRegistrationInfoAsync: noopAsync,

  // Push token (ExpoPushTokenManager)
  getDevicePushTokenAsync: noopAsync,
};
