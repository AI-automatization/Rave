import { app, ipcMain, type IpcMainInvokeEvent } from 'electron';
import { APP_ORIGIN } from './config';
import { isAppOrigin } from './urls';
import { closeVb, focusVb, getAdsBlocked, openVb, type VbResult } from './vb';

type Result = VbResult | ({ ok: true } & Record<string, unknown>);

/** The bridge is only served to our own origin — a foreign page in the main window gets 'forbidden'. */
const guard =
  <A extends unknown[]>(handler: (...args: A) => Result) =>
  (event: IpcMainInvokeEvent, ...args: A): Result => {
    if (!isAppOrigin(event.senderFrame?.url ?? '', APP_ORIGIN)) return { ok: false, reason: 'forbidden' };
    return handler(...args);
  };

export function registerIpc(): void {
  ipcMain.handle('vb:open', guard((url: unknown) => (typeof url === 'string' ? openVb(url) : { ok: false, reason: 'invalid_url' })));
  ipcMain.handle('vb:close', guard(() => closeVb()));
  ipcMain.handle('vb:focus', guard(() => focusVb()));
  ipcMain.handle(
    'vb:metrics',
    guard(() => {
      const m = app.getAppMetrics();
      return {
        ok: true,
        ramMb: Math.round(m.reduce((s, p) => s + (p.memory.workingSetSize || 0), 0) / 1024),
        cpu: Math.round(m.reduce((s, p) => s + (p.cpu.percentCPUUsage || 0), 0)),
        processes: m.length,
        adsBlocked: getAdsBlocked(),
      };
    }),
  );
}
