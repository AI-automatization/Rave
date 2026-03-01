// ─── Native module mocks ───────────────────────────────────────────────────────

jest.mock('react-native-fast-image', () => {
  const React = require('react');
  const { Image } = require('react-native');
  const FastImage = (props) => React.createElement(Image, props);
  FastImage.priority = { low: 'low', normal: 'normal', high: 'high' };
  FastImage.resizeMode = { contain: 'contain', cover: 'cover', stretch: 'stretch', center: 'center' };
  FastImage.preload = jest.fn();
  return FastImage;
});

jest.mock('react-native-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  return (props) => React.createElement(View, props);
});

jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    set: jest.fn(),
    getString: jest.fn(),
    delete: jest.fn(),
    contains: jest.fn().mockReturnValue(false),
  })),
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }) => React.createElement(View, props, children),
    SafeAreaProvider: ({ children }) => children,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: () => null,
  show: jest.fn(),
  hide: jest.fn(),
}));

jest.mock('@react-native-firebase/messaging', () => () => ({
  getToken: jest.fn().mockResolvedValue('mock-fcm-token'),
  onMessage: jest.fn(() => jest.fn()),
  setBackgroundMessageHandler: jest.fn(),
  requestPermission: jest.fn().mockResolvedValue(1),
}));

jest.mock('@react-native-firebase/app', () => ({}));

jest.mock('react-native-splash-screen', () => ({
  hide: jest.fn(),
  show: jest.fn(),
}));

jest.mock('@utils/crash', () => ({
  initCrashReporting: jest.fn(),
  reportError: jest.fn(),
  reportMessage: jest.fn(),
  setUserContext: jest.fn(),
  clearUserContext: jest.fn(),
}));
