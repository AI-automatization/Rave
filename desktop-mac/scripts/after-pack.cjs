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
  checkRuntimeDependencies(context);
  checkBundledWeb(context);
};

// The bundled web app (scripts/build-web.sh → Resources/web, run by src/main/local-web.ts). Without it the packaged app
// would map app.wewatch.uz to nothing; fail the build instead.
function checkBundledWeb(context) {
  const fs = require('node:fs');
  const web = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`, 'Contents', 'Resources', 'web');
  const need = ['server.js', '.next/BUILD_ID', '.next/static', 'public', 'node_modules/next/package.json'];
  const missing = need.filter((rel) => !fs.existsSync(path.join(web, rel)));
  if (missing.length) throw new Error(`afterPack: bundled web app incomplete in ${web}: ${missing.join(', ')} (run npm run build:web)`);
}

// The 2026-11-12 DMG shipped without @ghostery/adblocker: the app showed "Cannot find module" on every start. Every
// runtime dependency (the whole `npm ls --omit=dev` tree) must sit in Resources/node_modules (electron-builder.yml
// extraResources), and each one in package.json must load from where the app's own code lives — with the packaged
// Electron itself when it can run on this machine. Any miss fails the build instead of shipping a broken app.
function checkRuntimeDependencies(context) {
  const projectDir = context.packager.projectDir;
  const app = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`);
  const resources = path.join(app, 'Contents', 'Resources');
  const fs = require('node:fs');
  const tree = execFileSync('npm', ['ls', '--omit=dev', '--all', '--parseable'], { cwd: projectDir, encoding: 'utf8' })
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.includes(`${path.sep}node_modules${path.sep}`))
    .map((l) => l.slice(l.lastIndexOf(`node_modules${path.sep}`)));
  const missing = [...new Set(tree)].filter((rel) => !fs.existsSync(path.join(resources, rel, 'package.json')));
  if (missing.length) throw new Error(`afterPack: runtime dependencies missing from the app: ${missing.join(', ')}`);

  const deps = Object.keys(require(path.join(projectDir, 'package.json')).dependencies ?? {});
  const hostArch = process.arch === 'arm64' ? 'arm64' : 'x64';
  const builtArch = context.arch === 3 ? 'arm64' : context.arch === 1 ? 'x64' : String(context.arch); // builder-util Arch enum
  if (deps.length === 0 || builtArch !== hostArch) return; // another CPU: the file check above is what we can do
  const bin = path.join(app, 'Contents', 'MacOS', context.packager.appInfo.productFilename);
  const from = path.join(resources, 'app.asar', 'dist', 'main');
  const probe = `for (const d of ${JSON.stringify(deps)}) require(require.resolve(d, { paths: [${JSON.stringify(from)}] })); console.log('ok');`;
  const out = execFileSync(bin, ['-e', probe], { env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' }, encoding: 'utf8' });
  if (!out.includes('ok')) throw new Error(`afterPack: runtime dependencies did not load in the packaged app: ${out}`);
}
