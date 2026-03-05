const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Monorepo: shared/ papkasini Metro ko'ra olishi uchun
config.watchFolders = [path.resolve(__dirname, '../../shared')];

// Lottie asset support
config.resolver.assetExts.push('lottie');

module.exports = config;
