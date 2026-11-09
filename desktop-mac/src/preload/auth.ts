// Bridge for the native sign-in view only. The renderer hands over the values the user typed (plain strings) and asks
// for fixed actions; it never chooses a URL and never sees a token. The main process (src/main/shell.ts) checks the
// sender of every call and the type/length of every value.
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('wewatchAuth', {
  ready: () => ipcRenderer.invoke('auth:ready'),
  login: (email: string, password: string) => ipcRenderer.invoke('auth:login', email, password),
  register: (username: string, email: string, password: string) => ipcRenderer.invoke('auth:register', username, email, password),
  confirm: (email: string, code: string) => ipcRenderer.invoke('auth:confirm', email, code),
  forgot: (email: string) => ipcRenderer.invoke('auth:forgot', email),
  reset: (password: string, confirm: string) => ipcRenderer.invoke('auth:reset', password, confirm),
  google: () => ipcRenderer.invoke('auth:google'),
  cancelGoogle: () => ipcRenderer.invoke('auth:cancelGoogle'),
  help: () => ipcRenderer.invoke('auth:help'),
  about: () => ipcRenderer.invoke('auth:about'),
  onData: (cb: (data: unknown) => void): (() => void) => {
    const fn = (_e: unknown, data: unknown): void => cb(data);
    ipcRenderer.on('auth:data', fn);
    return () => {
      ipcRenderer.removeListener('auth:data', fn);
    };
  },
});
