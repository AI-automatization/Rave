// "Share the VB with the room": the web app calls the ordinary
//   navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
// and this handler answers with the VB window's FRAME — picture and sound of that one window only.
//
// Why a frame and not desktopCapturer/loopback (M1 spike, macOS 27.2, Electron 45.2.1):
//  - frame capture keeps working while the VB window is minimised or hidden (window capture does not),
//  - only the VB's own sound is captured (loopback mixes in everything else, e.g. the room's voice chat),
//  - it needs no Screen Recording / System Audio permission at all.
import { session } from 'electron';
import { APP_ORIGIN } from './config';
import { getVbWebContents } from './vb';
import { isAppOrigin } from './urls';

export function installCapture(ses: Electron.Session = session.defaultSession): void {
  ses.setDisplayMediaRequestHandler((request, callback) => {
    const vb = getVbWebContents();
    const origin = request.securityOrigin || request.frame?.url || '';
    // Nothing else can be shared from inside the app: no VB window, or a foreign page → refused.
    if (!vb || !isAppOrigin(origin, APP_ORIGIN)) {
      callback({});
      return;
    }
    callback({ video: vb.mainFrame, audio: vb.mainFrame, enableLocalEcho: true });
  });
}
