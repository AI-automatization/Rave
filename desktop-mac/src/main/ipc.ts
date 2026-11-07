import { app, ipcMain, type IpcMainInvokeEvent } from 'electron';
import { APP_ORIGIN } from './config';
import { isAppOrigin } from './urls';

type Result = { ok: true; [k: string]: unknown } | { ok: false; reason: string };

/** The bridge is only served to our own origin — a foreign page in the main window gets 'forbidden'. */
const guard =
  <A extends unknown[]>(handler: (...args: A) => Result | Promise<Result>) =>
  (event: IpcMainInvokeEvent, ...args: A): Result | Promise<Result> => {
    if (!isAppOrigin(event.senderFrame?.url ?? '', APP_ORIGIN)) return { ok: false, reason: 'forbidden' };
    return handler(...args);
  };

const notImplemented = (): Result => ({ ok: false, reason: 'not_implemented' });

export function registerIpc(): void {
  // Virtual Browser (M3): the contract matches the Windows app; real behaviour lands in M3.
  ipcMain.handle('vb:open', guard((_url: unknown) => notImplemented()));
  ipcMain.handle('vb:close', guard(() => notImplemented()));
  ipcMain.handle('vb:focus', guard(() => notImplemented()));
  ipcMain.handle(
    'vb:metrics',
    guard(() => {
      const m = app.getAppMetrics();
      return {
        ok: true,
        ramMb: Math.round(m.reduce((s, p) => s + (p.memory.workingSetSize || 0), 0) / 1024),
        cpu: Math.round(m.reduce((s, p) => s + (p.cpu.percentCPUUsage || 0), 0)),
        processes: m.length,
      };
    }),
  );
}
