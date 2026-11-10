// Ad blocking for the VB, second layer. The small domain list in adblock.ts is instant but only knows a few dozen
// international networks; free movie sites (uzmovi, asilmedia...) pull 60+ hosts of Russian-speaking ad networks
// (adtec.ru, traffaret.com, ussp.io, suprion.ru, ...). This loads a real filter list (EasyList + RU AdList, the lists
// uBlock/AdGuard users run) into a matcher. Downloaded once, cached on disk, refreshed weekly; until it is loaded the
// domain list alone works, and if the download never succeeds nothing breaks.
import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';
import { FiltersEngine, Request } from '@ghostery/adblocker';

export const AD_LIST_URLS: readonly string[] = ['https://easylist-downloads.adblockplus.org/ruadlist+easylist.txt'];
const CACHE_FILE = 'adblock-engine.bin';
const CACHE_MAX_AGE_MS = 7 * 24 * 3600 * 1000;
const FETCH_TIMEOUT_MS = 30_000;

let engine: FiltersEngine | null = null;

/** Electron resourceType → the matcher's request type. */
export const TYPE_MAP: Readonly<Record<string, string>> = {
  mainFrame: 'main_frame', subFrame: 'sub_frame', stylesheet: 'stylesheet', script: 'script', image: 'image', font: 'font',
  object: 'object', xhr: 'xmlhttprequest', ping: 'ping', cspReport: 'csp_report', media: 'media', webSocket: 'websocket', other: 'other',
};

/** Would this engine cancel the request? Pure — used by the app and by the unit test. */
export function engineBlocks(eng: FiltersEngine, url: string, pageUrl: string, resourceType: string): boolean {
  try {
    const type = TYPE_MAP[resourceType] ?? 'other';
    return eng.match(Request.fromRawDetails({ url, sourceUrl: pageUrl, type: type as never })).match;
  } catch {
    return false; // a request the matcher cannot parse is never cancelled
  }
}

/** True when the loaded lists say "ad". False while nothing is loaded. Never used for page navigations (see vb.ts). */
export function adEngineMatches(url: string, pageUrl: string, resourceType: string): boolean {
  return engine !== null && engineBlocks(engine, url, pageUrl, resourceType);
}

export const adEngineReady = (): boolean => engine !== null;

/** Loads the cached matcher, or downloads the lists. Never throws; call once after the app is ready. */
export async function initAdEngine(log: (m: string) => void = () => {}): Promise<void> {
  const file = path.join(app.getPath('userData'), CACHE_FILE);
  let stale = true;
  try {
    const st = fs.statSync(file);
    engine = FiltersEngine.deserialize(new Uint8Array(fs.readFileSync(file)));
    stale = Date.now() - st.mtimeMs > CACHE_MAX_AGE_MS;
    log(`adblock: cached engine loaded${stale ? ' (stale, refreshing)' : ''}`);
  } catch {
    engine = null; // no cache or an unreadable one: download below
  }
  if (!stale) return;
  try {
    const fresh = await FiltersEngine.fromLists(
      (url: string) => fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }),
      [...AD_LIST_URLS],
    );
    engine = fresh;
    fs.writeFileSync(file, fresh.serialize());
    log('adblock: filter lists downloaded');
  } catch (e) {
    log(`adblock: download failed (${String(e)}) — ${engine ? 'keeping the cached engine' : 'domain list only'}`);
  }
}
