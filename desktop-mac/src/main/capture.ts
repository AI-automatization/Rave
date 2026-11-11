// "Share the VB with the room": the web app calls the ordinary
//   navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
// and this handler answers with the VB window's FRAME — picture and sound of that one window only.
//
// Why a frame and not desktopCapturer/loopback (M1 spike, macOS 27.2, Electron 45.2.1):
//  - frame capture keeps working while the VB window is minimised or hidden (window capture does not),
//  - only the VB's own sound is captured (loopback mixes in everything else, e.g. the room's voice chat),
//  - it needs no Screen Recording / System Audio permission at all.
import { dialog, session } from 'electron';
import { APP_ORIGIN, BACKGROUND } from './config';
import { getDialogLocale } from './auth';
import type { Locale } from './i18n';
import { getVbWebContents } from './vb';
import { isAppOrigin } from './urls';
import { getMainWindow } from './window';

// The first share of a run asks the owner: the VB picture and sound go to everyone in the room. Automated runs have no human.
let consented = false;

const ASK: Record<Locale, { message: (host: string) => string; detail: string; share: string; cancel: string }> = {
  uz: {
    message: (h) => `Virtual Browser${h ? ` (${h})` : ''} xonadagilarga ko'rsatilsinmi?`,
    detail: "Bu oynaning tasviri va tovushini xonadagi hamma ko'radi va eshitadi.",
    share: 'Ulashish',
    cancel: 'Bekor qilish',
  },
  ru: {
    message: (h) => `Показать Virtual Browser${h ? ` (${h})` : ''} всем в комнате?`,
    detail: 'Картинку и звук этого окна увидят и услышат все в комнате.',
    share: 'Поделиться',
    cancel: 'Отмена',
  },
  en: {
    message: (h) => `Share the Virtual Browser${h ? ` (${h})` : ''} with the room?`,
    detail: 'Everyone in the room will see and hear this window.',
    share: 'Share',
    cancel: 'Cancel',
  },
};

async function askShare(host: string): Promise<boolean> {
  if (consented || BACKGROUND) return true;
  const t = ASK[getDialogLocale()];
  const win = getMainWindow();
  const opts: Electron.MessageBoxOptions = {
    type: 'question',
    buttons: [t.share, t.cancel],
    defaultId: 1,
    cancelId: 1,
    message: t.message(host),
    detail: t.detail,
  };
  const r = win ? await dialog.showMessageBox(win, opts) : await dialog.showMessageBox(opts);
  consented = r.response === 0;
  return consented;
}

export function installCapture(ses: Electron.Session = session.defaultSession): void {
  ses.setDisplayMediaRequestHandler((request, callback) => {
    void handle(request, callback);
  });
  async function handle(request: Electron.DisplayMediaRequestHandlerHandlerRequest, callback: (s: Electron.Streams) => void): Promise<void> {
    const vb = getVbWebContents();
    const origin = request.securityOrigin || request.frame?.url || '';
    // Nothing else can be shared from inside the app: no VB window, or a foreign page → refused.
    if (!vb || !isAppOrigin(origin, APP_ORIGIN)) {
      callback({});
      return;
    }
    let host = '';
    try { host = new URL(vb.getURL()).hostname; } catch { /* no page yet */ }
    if (!(await askShare(host))) {
      callback({});
      return;
    }
    callback({ video: vb.mainFrame, audio: vb.mainFrame, enableLocalEcho: true });
  }
}
