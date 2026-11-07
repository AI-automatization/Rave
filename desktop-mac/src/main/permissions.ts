import { session } from 'electron';
import { APP_ORIGIN } from './config';
import { isAppOrigin } from './urls';

/**
 * The main window shows only WeWatch pages. Electron grants every permission when no handler is set;
 * here a permission (microphone for voice chat, screen share, notifications, …) is granted to the app
 * origin only, and refused to anything else that might end up in that window.
 */
export function installPermissionPolicy(ses: Electron.Session = session.defaultSession): void {
  ses.setPermissionRequestHandler((wc, _perm, cb, details) => cb(isAppOrigin(details.requestingUrl || wc.getURL(), APP_ORIGIN)));
  ses.setPermissionCheckHandler((_wc, _perm, requestingOrigin) => isAppOrigin(requestingOrigin, APP_ORIGIN));
}
