const { withAndroidManifest } = require('@expo/config-plugins');

// T-S178 — Android 11+ (API 30+) hides package visibility by default: without an explicit
// <queries> declaration, canOpenURL/isPackageInstalled checks against com.instagram.android
// silently return false even when Instagram genuinely is installed, and Share.shareSingle's
// Instagram Stories intent fails to resolve. This is the standard @expo/config-plugins pattern
// for injecting a <queries><package/></queries> block into AndroidManifest.xml.
module.exports = function withInstagramQueries(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    if (!manifest.queries) manifest.queries = [{}];
    if (manifest.queries.length === 0) manifest.queries.push({});

    const queriesBlock = manifest.queries[0];
    if (!queriesBlock.package) queriesBlock.package = [];

    const alreadyPresent = queriesBlock.package.some(
      (p) => p.$ && p.$['android:name'] === 'com.instagram.android',
    );
    if (!alreadyPresent) {
      queriesBlock.package.push({ $: { 'android:name': 'com.instagram.android' } });
    }

    return cfg;
  });
};
