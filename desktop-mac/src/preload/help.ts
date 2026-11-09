// Bridge for the native Help view only. The renderer can say "I am ready", "go back to the login" and "open contact N"
// (an id from a fixed list — never a URL). Everything it draws is pushed by the main process (src/main/shell.ts),
// which checks the sender of every call.
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('wewatchHelp', {
  ready: () => ipcRenderer.invoke('help:ready'),
  back: () => ipcRenderer.invoke('help:back'),
  openContact: (id: string) => ipcRenderer.invoke('help:contact', id),
  onData: (cb: (data: unknown) => void): (() => void) => {
    const fn = (_e: unknown, data: unknown): void => cb(data);
    ipcRenderer.on('help:data', fn);
    return () => {
      ipcRenderer.removeListener('help:data', fn);
    };
  },
});
