// Bridge for the native Home view only. The renderer can say "I am ready", "open this room id", "retry" and
// "start watching card N of rail K". Everything else (data, URLs, search text) is pushed by the main process
// (src/main/shell.ts), which validates every call.
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('wewatchHome', {
  ready: () => ipcRenderer.invoke('home:ready'),
  open: (id: string) => ipcRenderer.invoke('home:open', id),
  retry: () => ipcRenderer.invoke('home:retry'),
  watch: (kind: string, index: number) => ipcRenderer.invoke('home:watch', kind, index),
  sort: (key: string) => ipcRenderer.invoke('home:sort', key),
  newRoom: () => ipcRenderer.invoke('home:newRoom'),
  join: () => ipcRenderer.invoke('home:join'),
  onData: (cb: (data: unknown) => void): (() => void) => {
    const fn = (_e: unknown, data: unknown): void => cb(data);
    ipcRenderer.on('home:data', fn);
    return () => {
      ipcRenderer.removeListener('home:data', fn);
    };
  },
});
