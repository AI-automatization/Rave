// electron-builder `beforeBuild` hook. Returning false tells it that node_modules are handled outside it.
// Inside this monorepo the builder would otherwise walk up to the repo root and fail on the root's uninstalled packages.
// The app's runtime dependencies (@ghostery/adblocker and its tree) are therefore copied by electron-builder.yml
// `extraResources`, and scripts/after-pack.cjs fails the build if one is missing (2026-11-12: a DMG shipped without them).
module.exports = async () => false;
