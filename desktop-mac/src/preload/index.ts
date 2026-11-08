// Exposes window.wewatchDesktop to the web app (contract v1, same shape as the Windows app, platform 'macos').
// Every call is re-checked in the main process against the app origin (src/main/ipc.ts).
import { contextBridge, ipcRenderer } from 'electron';

const listen =
  <T>(channel: string) =>
  (cb: (payload: T) => void): (() => void) => {
    const fn = (_e: unknown, payload: T): void => cb(payload);
    ipcRenderer.on(channel, fn);
    return () => {
      ipcRenderer.removeListener(channel, fn);
    };
  };

contextBridge.exposeInMainWorld('wewatchDesktop', {
  platform: 'macos',
  version: 1,
  vb: {
    open: (url: string) => ipcRenderer.invoke('vb:open', url),
    close: () => ipcRenderer.invoke('vb:close'),
    focus: () => ipcRenderer.invoke('vb:focus'),
    onState: listen('vb:state'),
    onBlocked: listen('vb:blocked'),
    metrics: () => ipcRenderer.invoke('vb:metrics'),
  },
});
