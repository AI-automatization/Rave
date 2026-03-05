
module.exports = {
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
          '@navigation': './src/navigation',
          '@hooks': './src/hooks',
          '@api': './src/api',
          '@store': './src/store',
          '@socket': './src/socket',
          '@theme': './src/theme',
          '@utils': './src/utils',
          '@app-types': './src/types',
          '@shared': '../../shared/src',
        },
      },
    ],
    'react-native-reanimated/plugin',
  ],
};
