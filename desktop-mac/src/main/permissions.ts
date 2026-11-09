import { session, shell, systemPreferences } from 'electron';
import { APP_ORIGIN, BACKGROUND } from './config';
import { microphoneStep } from './permissions-model';
import { isAppOrigin } from './urls';

const MIC_SETTINGS = 'x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone';

/**
 * The main window shows only WeWatch pages. Electron grants every permission when no handler is set;
 * here a permission (microphone for voice chat, screen share, notifications, …) is granted to the app
 * origin only, and refused to anything else that might end up in that window.
 */
export function installPermissionPolicy(ses: Electron.Session = session.defaultSession): void {
  ses.setPermissionRequestHandler((wc, perm, cb, details) => {
    if (!isAppOrigin(details.requestingUrl || wc.getURL(), APP_ORIGIN)) return cb(false);
    const types = (details as { mediaTypes?: string[] }).mediaTypes;
    // Automated run: never the real microphone/camera of the user's Mac, never a macOS prompt or its settings.
    if (BACKGROUND && perm === 'media' && (types?.includes('audio') || types?.includes('video'))) return cb(false);
    const step = microphoneStep(perm, types, process.platform, process.platform === 'darwin' ? systemPreferences.getMediaAccessStatus('microphone') : 'unknown');
    if (step === 'ask') {
      systemPreferences.askForMediaAccess('microphone').then(cb, () => cb(false));
    } else if (step === 'open-settings') {
      void shell.openExternal(MIC_SETTINGS); // the user said no to WeWatch in macOS: show them where to change it
      cb(false);
    } else {
      cb(true);
    }
  });
  ses.setPermissionCheckHandler((_wc, _perm, requestingOrigin) => isAppOrigin(requestingOrigin, APP_ORIGIN));
}
