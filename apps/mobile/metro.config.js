const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  // shared/ papkasidagi fayllarni Metro ko'ra olishi uchun
  watchFolders: [path.resolve(__dirname, '../../shared')],
  resolver: {
    assetExts: [...defaultConfig.resolver.assetExts, 'lottie'],
  },
};

module.exports = mergeConfig(defaultConfig, config);
