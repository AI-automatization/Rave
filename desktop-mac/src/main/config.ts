import { app } from 'electron';

// WW_* variables are for development only. The installed (packaged) app always opens production:
// a WW_APP_URL left in the user's environment once sent the Windows build to localhost:3000.
export const devEnv = (name: string): string => (app.isPackaged ? '' : process.env[name] ?? '');

export const APP_URL = devEnv('WW_APP_URL') || 'https://app.wewatch.uz';
export const APP_ORIGIN = new URL(APP_URL).origin;
/** Hosts the main window may show without leaving for the system browser. */
export const IN_APP_HOSTS: ReadonlySet<string> = new Set([new URL(APP_URL).hostname, 'wewatch.uz', 'www.wewatch.uz']);
export const PROTOCOL = 'wewatch';
