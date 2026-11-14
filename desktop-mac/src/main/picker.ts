// In-app video picker: the VB as a panel inside the main window, for finding a room's video ("Videoni olish").
//
// Ported from Polat's Windows app (origin/polat/dev desktop/src/main.js) to the same web contract
// (apps/app-web use-desktop-vb-picker.ts): the web app draws its toolbar and an empty box, reports where the box is,
// and this view is laid over it. Its own view, not the docked VB: picking the next video must never touch the stream
// the viewers are watching. Pure parts (stream notes, measuring, choosing): picker-model.ts.
import { WebContentsView, session, type Rectangle, type WebContents, type WebFrameMain } from 'electron';
import { parseDockRect, toWindowRect } from './vb-dock-model';
import {
  MEASURE_TIMEOUT_MS, PLAYER_PROBE, chooseStream, measureScript, noteFrom, remember, toMeasure,
  type Measured, type PickedStream, type SniffedStream,
} from './picker-model';
import { failPageUrl, sameSite } from './urls';
import { VB_PARTITION, VB_WEB_PREFS, clearVbCache, getVbWebContents, vbUrlProblem, type VbResult } from './vb';
import { getMainWindow, sendToMain } from './window';

const PROBE_TIMEOUT_MS = 1500;

let pickView: WebContentsView | null = null;
let pickRect: ReturnType<typeof parseDockRect> = null; // the web app's box, in web content view coordinates
let suppressed = false; // the web content view is not what the window shows
let origin: () => Rectangle | null = () => null;
const sniffed = new Map<string, SniffedStream>();

const pickContents = (): WebContents | null => (pickView && !pickView.webContents.isDestroyed() ? pickView.webContents : null);
const send = (p: Record<string, unknown>): void => {
  if (!/^data:/i.test(String(p.url ?? ''))) sendToMain('pick:state', p); // our own error page is not a page the user picked
};

/** Smoke only (src/main/smoke.ts): the panel's page. */
export const smokePickerContents = (): WebContents | null => pickContents();

/** shell.ts: where the web content view starts inside the window (the box is relative to it). */
export const setPickOrigin = (f: () => Rectangle | null): void => { origin = f; };

function apply(): void {
  const v = pickView;
  const host = getMainWindow();
  if (!v || !host) return;
  const o = origin();
  if (!pickRect || suppressed || !o) {
    v.setVisible(false);
    return;
  }
  v.setBounds(toWindowRect(pickRect, o));
  v.setVisible(true);
  host.contentView.addChildView(v); // on top of the room page
}

/** shell.ts: the window layout changed. */
export const reapplyPicker = (): void => apply();
/** shell.ts: only the web content view shows the picker; hidden whenever the window shows something else. */
export function setPickerSuppressed(on: boolean): void {
  suppressed = on;
  apply();
}

/** Once, when the app is ready: note every playlist / video file the picker's page loads (onBeforeRequest belongs to vb.ts). */
export function installPicker(): void {
  session.fromPartition(VB_PARTITION).webRequest.onResponseStarted((d) => {
    const wc = pickContents();
    if (!wc || d.webContentsId !== wc.id) return;
    let frameId: number | null = null;
    try {
      frameId = d.frame ? d.frame.frameTreeNodeId : null;
    } catch {
      /* the frame is already gone */
    }
    const note = noteFrom({ url: d.url, statusCode: d.statusCode, resourceType: d.resourceType, responseHeaders: d.responseHeaders }, frameId, Date.now());
    if (note) remember(sniffed, note);
  });
}

function wire(wc: WebContents): void {
  wc.on('did-fail-load', (_e, code, desc, url, isMainFrame) => {
    if (!isMainFrame || code === -3 || /^data:/i.test(url)) return; // -3: a redirect, our own cancel, a newer load
    void wc.loadURL(failPageUrl(url, desc)).catch(() => {});
  });
  // Popups open in the same view, only within the same site (free film sites fire window.open() to an ad on the first click).
  wc.setWindowOpenHandler(({ url }) => {
    if (vbUrlProblem(url) === null && sameSite(url, wc.getURL())) void wc.loadURL(url).catch(() => {});
    return { action: 'deny' };
  });
  // 'load' = a real page load, 'in-page' = SPA route change (YouTube/VK switch videos without reloading).
  wc.on('did-navigate', (_e, url) => {
    sniffed.clear(); // the previous page's streams are not this page's film
    send({ open: true, url, nav: 'load' });
  });
  wc.on('did-navigate-in-page', (_e, url, isMainFrame) => {
    if (isMainFrame) send({ open: true, url, nav: 'in-page' });
  });
  wc.on('page-title-updated', (_e, title) => send({ open: true, url: wc.getURL(), title }));
  wc.on('render-process-gone', (_e, d) => send({ open: true, crashed: d.reason }));
}

export function openPicker(url: unknown): VbResult {
  if (typeof url !== 'string') return { ok: false, reason: 'invalid_url' };
  const reason = vbUrlProblem(url);
  if (reason) return { ok: false, reason };
  const host = getMainWindow();
  if (!host) return { ok: false, reason: 'no_window' };
  if (!pickContents()) {
    pickView = new WebContentsView({ webPreferences: { ...VB_WEB_PREFS } });
    pickView.setBackgroundColor('#000000');
    pickView.setVisible(false); // until the web app reports where its box is
    host.contentView.addChildView(pickView);
    wire(pickView.webContents);
  }
  const wc = pickContents()!;
  void wc.loadURL(url).catch(() => {}); // aborted by a redirect / a blocked ad — the page events tell the rest
  wc.focus();
  return { ok: true };
}

/** The web app's empty box (CSS px of the room page), or null to hide the panel. */
export function setPickerBounds(raw: unknown): VbResult {
  if (!pickView) return { ok: false, reason: 'not_open' };
  pickRect = parseDockRect(raw);
  apply();
  return { ok: true };
}

export function pickerNav(action: unknown): VbResult {
  const wc = pickContents();
  if (!wc) return { ok: false, reason: 'not_open' };
  if (action === 'back' && wc.navigationHistory.canGoBack()) wc.navigationHistory.goBack();
  else if (action === 'reload') wc.reload();
  return { ok: true };
}

const frameId = (f: WebFrameMain): number | null => {
  try {
    return f.frameTreeNodeId;
  } catch {
    return null;
  }
};

/** The longest sniffed stream, the taken player's own first. null = nothing long enough was seen. */
async function pickStream(wc: WebContents, playerFrame: WebFrameMain | null): Promise<PickedStream | null> {
  if (!sniffed.size) return null;
  const byId = new Map(wc.mainFrame.framesInSubtree.map((f) => [frameId(f), f]));
  let inPlayer = new Set<number | null>();
  try {
    if (playerFrame) inPlayer = new Set(playerFrame.framesInSubtree.map(frameId));
  } catch {
    /* frame gone */
  }
  const list = [...sniffed.values()];
  const measured = new Map<string, { sec: number; master: boolean }>();
  await Promise.all(
    toMeasure(list, inPlayer).map(async (s) => {
      const f = byId.get(s.frameId) ?? playerFrame ?? wc.mainFrame;
      const r = (await Promise.race([
        Promise.resolve().then(() => f.executeJavaScript(measureScript(s.url, s.type))).catch(() => null),
        new Promise((res) => setTimeout(() => res(null), MEASURE_TIMEOUT_MS + 500)),
      ])) as { sec?: unknown; master?: unknown } | null;
      measured.set(s.url, { sec: Number(r?.sec) || 0, master: r?.master === true });
    }),
  );
  const all: Measured[] = list.map((s) => ({ ...s, sec: measured.get(s.url)?.sec ?? 0, master: measured.get(s.url)?.master ?? false, inPlayer: inPlayer.has(s.frameId) }));
  return chooseStream(all);
}

/** "Videoni olish": the frame where a video actually started (longest wins; nothing started → the page) + the film stream. */
export async function takePick(): Promise<Record<string, unknown> & { ok: boolean }> {
  const wc = pickContents();
  if (!wc) return { ok: false, reason: 'not_open' };
  const probe = (f: WebFrameMain): Promise<number> =>
    Promise.race([
      f.executeJavaScript(PLAYER_PROBE).then((d: unknown) => Number(d) || 0, () => 0),
      new Promise<number>((res) => setTimeout(() => res(0), PROBE_TIMEOUT_MS)),
    ]);
  const frames = wc.mainFrame.framesInSubtree;
  const durations = await Promise.all(frames.map(probe));
  let best = -1;
  durations.forEach((d, i) => {
    if (d > 0 && (best < 0 || d > durations[best]!)) best = i;
  });
  let frame: WebFrameMain = best >= 0 ? frames[best]! : wc.mainFrame;
  // A srcdoc / about:blank player has no address of its own — take the page that hosts it.
  while (frame.parent && !/^https?:/i.test(frame.url)) frame = frame.parent;
  const url = /^https?:/i.test(frame.url) ? frame.url : wc.getURL();
  const reason = vbUrlProblem(url);
  if (reason) return { ok: false, reason };
  const stream = await pickStream(wc, best >= 0 ? frame : null);
  // pageUrl = the site page around the player: the server opens the player with it as Referer (some hosts refuse without one).
  return { ok: true, url, pageUrl: wc.getURL(), title: wc.getTitle(), player: best >= 0, frame: frame !== wc.mainFrame, ...(stream ? { stream } : {}) };
}

export function closePicker(): VbResult {
  const v = pickView;
  if (!v) return { ok: true };
  pickView = null;
  pickRect = null;
  sniffed.clear();
  getMainWindow()?.contentView.removeChildView(v);
  if (!v.webContents.isDestroyed()) v.webContents.close();
  send({ open: false });
  if (!getVbWebContents()) clearVbCache(); // the room's VB may still be playing from the same cache
  return { ok: true };
}
