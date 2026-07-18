// Web analog of mobile's dmScrollPositionStorage (apps/mobile/src/utils/storage.ts) — remembers
// which message a DM chat was scrolled to so reopening a conversation restores position instead
// of always jumping to the bottom. localStorage instead of AsyncStorage; guarded for SSR since
// this module can be imported by code that also runs server-side.
const KEY_PREFIX = 'wewatch_dm_scroll_';

function hasWindow(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export const dmScrollPositionStorage = {
  save(peerId: string, messageId: string): void {
    if (!hasWindow()) return;
    try {
      window.localStorage.setItem(`${KEY_PREFIX}${peerId}`, messageId);
    } catch {
      // localStorage can throw (private mode, quota) — losing scroll memory is not critical
    }
  },

  get(peerId: string): string | null {
    if (!hasWindow()) return null;
    try {
      return window.localStorage.getItem(`${KEY_PREFIX}${peerId}`);
    } catch {
      return null;
    }
  },

  clear(peerId: string): void {
    if (!hasWindow()) return;
    try {
      window.localStorage.removeItem(`${KEY_PREFIX}${peerId}`);
    } catch {
      // no-op
    }
  },
};
