// Bridge for the native shell view only (sidebar + toolbar). Not the web app's bridge (that is ./index.ts).
// The renderer can only ask for navigation by sidebar item id; the main process validates every call
// (sender must be the shell view itself, id must be a known item — src/main/shell.ts).
import { contextBridge, ipcRenderer } from 'electron';

interface ShellState {
  activeId: string | null;
  canGoBack: boolean;
  canGoForward: boolean;
  searchVisible: boolean;
  sidebarOpen: boolean;
  query: string;
}

contextBridge.exposeInMainWorld('wewatchShell', {
  model: () => ipcRenderer.invoke('shell:model'),
  navigate: (id: string) => ipcRenderer.invoke('shell:navigate', id),
  back: () => ipcRenderer.invoke('shell:back'),
  forward: () => ipcRenderer.invoke('shell:forward'),
  search: (q: string) => ipcRenderer.invoke('shell:search', q),
  newRoom: () => ipcRenderer.invoke('shell:newRoom'),
  setLocale: (l: string) => ipcRenderer.invoke('shell:locale', l),
  onState: (cb: (s: ShellState) => void): (() => void) => {
    const fn = (_e: unknown, s: ShellState): void => cb(s);
    ipcRenderer.on('shell:state', fn);
    return () => {
      ipcRenderer.removeListener('shell:state', fn);
    };
  },
});
