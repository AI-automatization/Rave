const { withAppBuildGradle } = require('@expo/config-plugins');

module.exports = function withAbiFilters(config, { abiFilters = ['arm64-v8a'] } = {}) {
  return withAppBuildGradle(config, (cfg) => {
    const abiList = abiFilters.map((a) => `"${a}"`).join(', ');
    const ndkBlock = `ndk {\n            abiFilters ${abiList}\n        }`;

    if (cfg.modResults.contents.includes('abiFilters')) {
      // Replace existing abiFilters block
      cfg.modResults.contents = cfg.modResults.contents.replace(
        /ndk\s*\{[^}]*abiFilters[^}]*\}/,
        ndkBlock,
      );
    } else {
      // Inject inside defaultConfig { ... }
      cfg.modResults.contents = cfg.modResults.contents.replace(
        /(defaultConfig\s*\{)/,
        `$1\n        ${ndkBlock}`,
      );
    }
    return cfg;
  });
};
