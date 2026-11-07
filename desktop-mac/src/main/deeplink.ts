import { APP_URL } from './config';
import { focusMainWindow, getMainWindow } from './window';
import { parseDeepLink } from './urls';

let pending: string | null = null;

/** Remember a link that arrives before the window exists (macOS `open-url` fires before `ready`). */
export function queueDeepLink(link: string | undefined | null): void {
  if (link) pending = link;
}

/** Handle a link now, or keep it queued until the main window exists. Returns what was done. */
export function handleDeepLink(link: string | undefined | null): 'room' | 'focus' | 'ignored' | 'queued' {
  const parsed = parseDeepLink(link, APP_URL);
  if (!parsed) return 'ignored';
  const win = getMainWindow();
  if (!win) {
    pending = link ?? null;
    return 'queued';
  }
  if (parsed.kind === 'room') void win.loadURL(parsed.url);
  focusMainWindow();
  return parsed.kind;
}

/** Call once the main window exists. */
export function flushPendingDeepLink(): void {
  const link = pending;
  pending = null;
  if (link) handleDeepLink(link);
}
