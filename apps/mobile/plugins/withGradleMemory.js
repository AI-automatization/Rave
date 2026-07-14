const { withGradleProperties } = require('@expo/config-plugins');

// Default org.gradle.jvmargs (-Xmx2048m -XX:MaxMetaspaceSize=512m) OOMs during
// :app:minifyReleaseWithR8 on memory-constrained CI runners (GitHub Actions
// ubuntu-latest = 7GB) — R8 loads the full class graph of every native module
// into Metaspace at once. Raised here; still well within a 7GB runner's budget
// alongside the JS bundler + Gradle daemon workers running concurrently.
module.exports = function withGradleMemory(config) {
  return withGradleProperties(config, (cfg) => {
    const setProp = (key, value) => {
      const existing = cfg.modResults.find((item) => item.type === 'property' && item.key === key);
      if (existing) {
        existing.value = value;
      } else {
        cfg.modResults.push({ type: 'property', key, value });
      }
    };
    setProp('org.gradle.jvmargs', '-Xmx4096m -XX:MaxMetaspaceSize=1024m');
    setProp('org.gradle.workers.max', '2');
    return cfg;
  });
};
