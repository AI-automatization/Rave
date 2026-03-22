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
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (reactModules.has(moduleName)) {
    const suffix = moduleName === 'react' ? 'index.js' : moduleName.split('/')[1] + '.js';
    return {
      filePath: path.resolve(mobileNodeModules, 'react', suffix),
      type: 'sourceFile',
    };
  }

  // Fix: expo is hoisted to workspace root, so expo/AppEntry.js does `../../App`
  // which resolves to Rave/App (not found). Redirect to our index.ts instead.
  if (moduleName.endsWith('expo/AppEntry') || moduleName.endsWith('expo/AppEntry.js')) {
    return {
      filePath: path.resolve(projectRoot, 'index.ts'),
      type: 'sourceFile',
    };
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
