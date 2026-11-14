import { app, ipcMain, type IpcMainInvokeEvent } from 'electron';
import { APP_ORIGIN } from './config';
import { isAppOrigin } from './urls';
import { closePicker, openPicker, pickerNav, reapplyPicker, setPickerBounds, takePick } from './picker';
import { closeVb, focusVb, getAdsBlocked, openVb, setVbDockRect, setVbVideoOnly, type VbResult } from './vb';

type Result = VbResult | ({ ok: true } & Record<string, unknown>);
type MaybeAsync = Result | Promise<Result>;

/** The bridge is only served to our own origin — a foreign page in the main window gets 'forbidden'. */
const guard =
  <A extends unknown[]>(handler: (...args: A) => MaybeAsync) =>
  (event: IpcMainInvokeEvent, ...args: A): MaybeAsync => {
    if (!isAppOrigin(event.senderFrame?.url ?? '', APP_ORIGIN)) return { ok: false, reason: 'forbidden' };
    return handler(...args);
  };

export function registerIpc(): void {
  // opts.docked = true: the VB page opens INSIDE the app window, over the room's video area (see vb.ts); otherwise a separate window.
  ipcMain.handle(
    'vb:open',
    guard((url: unknown, opts?: unknown) =>
      typeof url === 'string' ? openVb(url, typeof opts === 'object' && opts !== null && (opts as { docked?: unknown }).docked === true) : { ok: false, reason: 'invalid_url' }),
  );
  // The docked VB re-adds itself on top whenever the room page moves its box; an open picker panel must stay above it.
  ipcMain.handle('vb:setBounds', guard((rect: unknown) => {
    const r = setVbDockRect(rect);
    reapplyPicker();
    return r;
  }));
  ipcMain.handle('vb:setVideoOnly', guard((on: unknown) => setVbVideoOnly(on === true)));
  ipcMain.handle('vb:close', guard(() => closeVb()));
  // The in-app picker ("Videoni olish", picker.ts) — same channels as the Windows app.
  ipcMain.handle('pick:open', guard((url: unknown) => openPicker(url)));
  ipcMain.handle('pick:bounds', guard((box: unknown) => setPickerBounds(box)));
  ipcMain.handle('pick:nav', guard((action: unknown) => pickerNav(action)));
  ipcMain.handle('pick:take', guard(() => takePick() as Promise<Result>));
  ipcMain.handle('pick:close', guard(() => closePicker()));
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
