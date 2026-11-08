// electron-builder `beforeBuild` hook. Returning false tells it that node_modules are handled outside it.
// The app has NO runtime dependencies (everything it runs is in dist/, Electron itself is built in), and inside this
// monorepo the builder would otherwise walk up to the repo root and fail on the root's uninstalled packages.
module.exports = async () => false;
