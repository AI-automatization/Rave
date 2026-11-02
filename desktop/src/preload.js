// Exposes window.wewatchDesktop to the web app. The web app checks for it to know it runs inside the
// Windows app and can offer "Virtual Browser on your computer". Every call is re-checked in the main
// process against the app origin, so a foreign page can't drive the VB.
const { contextBridge, ipcRenderer } = require('electron');

const listen = (channel) => (cb) => {
  const fn = (_e, payload) => cb(payload);
  ipcRenderer.on(channel, fn);
  return () => ipcRenderer.removeListener(channel, fn);
};

contextBridge.exposeInMainWorld('wewatchDesktop', {
  platform: 'windows',
  version: 1,
  vb: {
    /** Open (or navigate) the local Virtual Browser. Resolves { ok } or { ok:false, reason }. */
    open: (url) => ipcRenderer.invoke('vb:open', url),
    close: () => ipcRenderer.invoke('vb:close'),
    focus: () => ipcRenderer.invoke('vb:focus'),
    /** After open(): navigator.mediaDevices.getDisplayMedia({ video: true, audio: true }) returns
     * the VB window with sound — the same WebRTC send code as tab sharing in the browser. */
    onState: listen('vb:state'),
    onBlocked: listen('vb:blocked'),
    metrics: () => ipcRenderer.invoke('vb:metrics'),
  },
});
