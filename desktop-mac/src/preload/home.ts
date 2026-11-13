// Bridge for the native Home view only. The renderer can say "I am ready", "open this room id", "retry" and
// "start watching card N of rail K". Everything else (data, URLs, search text) is pushed by the main process
// (src/main/shell.ts), which validates every call.
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('wewatchHome', {
  ready: () => ipcRenderer.invoke('home:ready'),
  open: (id: string) => ipcRenderer.invoke('home:open', id),
  retry: () => ipcRenderer.invoke('home:retry'),
  watch: (kind: string, index: number) => ipcRenderer.invoke('home:watch', kind, index),
  forget: (index: number) => ipcRenderer.invoke('home:forget', index),
  sort: (key: string) => ipcRenderer.invoke('home:sort', key),
  newRoom: () => ipcRenderer.invoke('home:newRoom'),
  // Sozlamalar: the renderer says what the user did; the main process validates, asks the server and answers { ok } / { ok: false, kind }.
  settings: {
    reload: () => ipcRenderer.invoke('settings:reload'),
    saveProfile: (username: string, bio: string) => ipcRenderer.invoke('settings:saveProfile', username, bio),
    pickAvatar: () => ipcRenderer.invoke('settings:pickAvatar'),
    setLanguage: (l: string) => ipcRenderer.invoke('settings:language', l),
    changePassword: (current: string, next: string, confirm: string) => ipcRenderer.invoke('settings:password', current, next, confirm),
    signOutAll: () => ipcRenderer.invoke('settings:signOutAll'),
    deleteAccount: (password: string) => ipcRenderer.invoke('settings:delete', password),
    logout: () => ipcRenderer.invoke('settings:logout'),
  },
  join: () => ipcRenderer.invoke('home:join'),
  createRoom: (url: string, name: string, isPrivate: boolean, title: string | null, thumbnail: string | null) =>
    ipcRenderer.invoke('home:createRoom', url, name, isPrivate, title, thumbnail),
  joinRoom: (code: string) => ipcRenderer.invoke('home:joinRoom', code),
  searchVideos: (q: string) => ipcRenderer.invoke('home:searchVideos', q),
  videoMeta: (url: string) => ipcRenderer.invoke('home:videoMeta', url),
  readClipboard: () => ipcRenderer.invoke('home:readClipboard'),
  openPlatform: (id: string) => ipcRenderer.invoke('home:openPlatform', id),
  onOpenDialog: (cb: (kind: string) => void): (() => void) => {
    const fn = (_e: unknown, kind: unknown): void => {
      if (kind === 'create' || kind === 'join') cb(kind);
    };
    ipcRenderer.on('home:openDialog', fn);
    return () => {
      ipcRenderer.removeListener('home:openDialog', fn);
    };
  },
  onData: (cb: (data: unknown) => void): (() => void) => {
    const fn = (_e: unknown, data: unknown): void => cb(data);
    ipcRenderer.on('home:data', fn);
    return () => {
      ipcRenderer.removeListener('home:data', fn);
    };
  },
});
