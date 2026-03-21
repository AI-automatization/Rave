module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            '@screens': './src/screens',
            '@components': './src/components',
            '@api': './src/api',
            '@store': './src/store',
            '@socket': './src/socket',
            '@theme': './src/theme',
            '@utils': './src/utils',
            '@app-types': './src/types',
            '@navigation': './src/navigation',
            '@hooks': './src/hooks',
            '@i18n': './src/i18n',
            '@shared': '../../shared/src',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
