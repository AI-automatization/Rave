// electron-builder `afterPack` hook (runs before signing). The builder always writes NSAllowsArbitraryLoads=true into the
// app's Info.plist (for electron-updater's localhost proxy, which this app does not use) and does so AFTER `mac.extendInfo`,
// so the only place to take it back is here. The app itself only talks https (window.ts / urls.ts keepInApp).
const { execFileSync } = require('node:child_process');
const path = require('node:path');

module.exports = async (context) => {
  if (context.electronPlatformName !== 'darwin') return;
  const plist = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`, 'Contents', 'Info.plist');
  const buddy = (cmd) => execFileSync('/usr/libexec/PlistBuddy', ['-c', cmd, plist], { stdio: 'pipe' });
  try {
    buddy('Delete :NSAppTransportSecurity');
  } catch {
    /* key absent: nothing to remove */
  }
  buddy('Add :NSAppTransportSecurity dict');
  buddy('Add :NSAppTransportSecurity:NSAllowsArbitraryLoads bool false');
};
