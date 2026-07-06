const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Monorepo: watch shared/* as well
config.watchFolders = [workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Force single React 19 instance — root has React 18 (apps/web), mobile needs React 19
// extraNodeModules is fallback only; resolveRequest is the true override
const mobileNodeModules = path.resolve(projectRoot, 'node_modules');

config.resolver.extraNodeModules = {
  'react-dom': path.resolve(mobileNodeModules, 'react-dom'),
  'react-native': path.resolve(workspaceRoot, 'node_modules/react-native'),
  'react-native-gesture-handler': path.resolve(workspaceRoot, 'node_modules/react-native-gesture-handler'),
  'zustand': path.resolve(workspaceRoot, 'node_modules/zustand'),
  '@tanstack/react-query': path.resolve(workspaceRoot, 'node_modules/@tanstack/react-query'),
};

// Intercept ALL react/* imports and redirect to mobile's React 19
const reactModules = new Set(['react', 'react/jsx-runtime', 'react/jsx-dev-runtime']);

// expo-notifications native modules removed from Expo Go SDK 53+:
// - DevicePushTokenAutoRegistration.fx.js: calls addPushTokenListener at module level → throws
// - TopicSubscriptionModule.android.js: requireNativeModule('ExpoTopicSubscriptionModule') → throws
// - ServerRegistrationModule.native.js: requireNativeModule('NotificationsServerRegistrationModule') → throws
// - PushTokenManager.native.js: requireNativeModule('ExpoPushTokenManager') → throws
// Redirect each to a compat shim that uses requireOptionalNativeModule: the REAL
// native module in release/dev-client builds, a no-op stub only in Expo Go where it's
// absent. (The previous unconditional no-op leaked into production bundles and silently
// broke getDevicePushTokenAsync — the FCM token resolved null on every real device.)
const PUSH_TOKEN_FX_NOOP = path.resolve(
  projectRoot,
  'src/mocks/DevicePushTokenAutoRegistration.noop.js'
);

// module-name fragment → per-module compat shim (NOT one shared stub)
const EXPO_NOTIFICATIONS_COMPAT_SHIMS = {
  TopicSubscriptionModule: path.resolve(
    projectRoot,
    'src/mocks/expo-notifications-topic-subscription.compat.js'
  ),
  PushTokenManager: path.resolve(
    projectRoot,
    'src/mocks/expo-notifications-push-token-manager.compat.js'
  ),
  ServerRegistrationModule: path.resolve(
    projectRoot,
    'src/mocks/expo-notifications-server-registration.compat.js'
  ),
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName.includes('DevicePushTokenAutoRegistration') ||
    (context.originModulePath &&
      context.originModulePath.includes('DevicePushTokenAutoRegistration'))
  ) {
    return { filePath: PUSH_TOKEN_FX_NOOP, type: 'sourceFile' };
  }

  // Swap expo-notifications native-module wrappers for compat shims (real module in
  // release/dev-client, stub only in Expo Go)
  const isExpoNotificationsModule =
    context.originModulePath &&
    context.originModulePath.includes('expo-notifications');
  if (isExpoNotificationsModule) {
    const shimKey = Object.keys(EXPO_NOTIFICATIONS_COMPAT_SHIMS).find((name) =>
      moduleName.includes(name)
    );
    if (shimKey) {
      return { filePath: EXPO_NOTIFICATIONS_COMPAT_SHIMS[shimKey], type: 'sourceFile' };
    }
  }

  if (reactModules.has(moduleName)) {
    const suffix = moduleName === 'react' ? 'index.js' : moduleName.split('/')[1] + '.js';
    return {
      filePath: path.resolve(mobileNodeModules, 'react', suffix),
      type: 'sourceFile',
    };
  }

  // Fix: expo is hoisted to workspace root, so expo/AppEntry.js does `../../App`
  // which resolves to Rave/App (not found). Two cases to handle:

  // Case 1: someone imports 'expo/AppEntry' → redirect to our index.ts
  if (moduleName.endsWith('expo/AppEntry') || moduleName.endsWith('expo/AppEntry.js')) {
    return {
      filePath: path.resolve(projectRoot, 'index.ts'),
      type: 'sourceFile',
    };
  }

  // Case 2: AppEntry.js itself (at workspace root) tries `../../App` → resolve to our App.tsx
  if (
    moduleName === '../../App' &&
    context.originModulePath &&
    context.originModulePath.replace(/\\/g, '/').includes('expo/AppEntry')
  ) {
    return {
      filePath: path.resolve(projectRoot, 'App.tsx'),
      type: 'sourceFile',
    };
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
