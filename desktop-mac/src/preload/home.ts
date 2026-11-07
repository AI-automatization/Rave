// Bridge for the native Home view only. The renderer can say "I am ready", "open this room id" and "retry";
// everything else (data, URLs, search text) is pushed by the main process (src/main/shell.ts).
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('wewatchHome', {
  ready: () => ipcRenderer.invoke('home:ready'),
  open: (id: string) => ipcRenderer.invoke('home:open', id),
  retry: () => ipcRenderer.invoke('home:retry'),
  onData: (cb: (data: unknown) => void): (() => void) => {
    const fn = (_e: unknown, data: unknown): void => cb(data);
    ipcRenderer.on('home:data', fn);
    return () => {
      ipcRenderer.removeListener('home:data', fn);
    };
  },
});
