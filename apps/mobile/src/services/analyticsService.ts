import { AppState, AppStateStatus, Platform } from 'react-native';
import { adminClient } from '@api/client';
import Constants from 'expo-constants';

interface AnalyticsEvent {
  event: string;
  screen?: string;
  ts: number;
  meta?: Record<string, unknown>;
}

interface ScreenVisit {
  screen: string;
  enteredAt: number;
  exitedAt?: number;
  duration?: number;
}

let sessionId = '';
let userId: string | undefined;
let isNewUser = false;
let sessionStart = 0;
let isActive = true;

const events: AnalyticsEvent[]  = [];
const screens: ScreenVisit[]    = [];
let currentScreen: ScreenVisit | null = null;
let watchPartyStart: number | null    = null;
let totalWatchPartyDuration           = 0;

let flushTimer: ReturnType<typeof setInterval> | null = null;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getAppVersion(): string {
  return (Constants.expoConfig?.version ?? '0.0.0') as string;
}

function getDeviceInfo() {
  const osVersion = (Constants.platform?.ios?.systemVersion
    ?? Constants.platform?.android?.versionCode?.toString()
    ?? 'unknown') as string;
  return {
    deviceModel: (Constants.deviceName ?? 'unknown') as string,
    osVersion,
    platform: Platform.OS,
  };
}

async function flush(closing = false): Promise<void> {
  if (!sessionId || (events.length === 0 && !closing)) return;

  const sessionEnd = closing ? Date.now() : undefined;

  if (currentScreen && closing) {
    currentScreen.exitedAt = Date.now();
    currentScreen.duration = Date.now() - currentScreen.enteredAt;
    screens.push({ ...currentScreen });
    currentScreen = null;
  }

  const exitScreen  = screens.length > 0 ? screens[screens.length - 1].screen : undefined;
  const exitContext = deriveExitContext();

  const payload = {
    sessionId,
    userId,
    ...getDeviceInfo(),
    appVersion: getAppVersion(),
    isNewUser,
    events: [...events],
    screens: [...screens],
    sessionStart,
    sessionEnd,
    exitScreen,
    exitContext,
    watchPartyDuration: totalWatchPartyDuration,
    isActive: !closing,
  };

  try {
    await adminClient.post('/analytics/ingest', payload);
    events.splice(0);
  } catch {
    // silent — we never block the user for analytics
  }
}

function deriveExitContext(): string | undefined {
  const hasRegister  = events.some((e) => e.event === 'action:register');
  const hasWatchRoom = screens.some((s) => ['WatchRoom', 'WatchParty', 'Room'].includes(s.screen));
  const sessionDuration = Date.now() - sessionStart;

  if (hasRegister && screens.length <= 2) return 'after_register';
  if (hasWatchRoom && totalWatchPartyDuration > 0) return 'after_watch_party';
  if (sessionDuration < 10000) return 'immediate_exit';
  if (screens.length <= 1) return 'single_screen';
  return 'normal';
}

export const analyticsService = {
  init(uid?: string, isNew = false): void {
    sessionId   = generateId();
    userId      = uid;
    isNewUser   = isNew;
    sessionStart = Date.now();
    events.length  = 0;
    screens.length = 0;
    currentScreen  = null;
    watchPartyStart = null;
    totalWatchPartyDuration = 0;
    isActive = true;

    this.track('app_open');

    if (flushTimer) clearInterval(flushTimer);
    flushTimer = setInterval(() => { void flush(); }, 30_000);

    AppState.addEventListener('change', handleAppState);
  },

  setUser(uid: string): void {
    userId = uid;
  },

  markAsNewUser(): void {
    isNewUser = true;
  },

  track(event: string, screen?: string, meta?: Record<string, unknown>): void {
    if (!sessionId) return;
    events.push({ event, screen: screen ?? currentScreen?.screen, ts: Date.now(), meta });
  },

  /** Fire-and-forget tap tracking — id should be a stable, human-readable label
   * (e.g. 'home:create_room', 'watchparty:play_pause'), not derived from dynamic content. */
  click(id: string, meta?: Record<string, unknown>): void {
    this.track(`click:${id}`, undefined, meta);
  },

  screenEnter(screen: string): void {
    if (!sessionId) return;

    if (currentScreen) {
      currentScreen.exitedAt = Date.now();
      currentScreen.duration = Date.now() - currentScreen.enteredAt;
      screens.push({ ...currentScreen });
    }
    currentScreen = { screen, enteredAt: Date.now() };
    this.track('screen_view', screen);
  },

  screenExit(screen: string): void {
    if (!sessionId) return;
    this.track('screen_exit', screen);
    if (currentScreen?.screen === screen) {
      currentScreen.exitedAt = Date.now();
      currentScreen.duration = Date.now() - currentScreen.enteredAt;
      screens.push({ ...currentScreen });
      currentScreen = null;
    }
  },

  watchPartyEnter(): void {
    watchPartyStart = Date.now();
    this.track('action:watch_start');
  },

  watchPartyExit(): void {
    if (watchPartyStart) {
      totalWatchPartyDuration += Date.now() - watchPartyStart;
      watchPartyStart = null;
    }
    this.track('action:watch_end', undefined, { totalMs: totalWatchPartyDuration });
  },

  async end(): Promise<void> {
    if (flushTimer) { clearInterval(flushTimer); flushTimer = null; }
    this.track('app_close');
    isActive = false;
    await flush(true);
    sessionId = '';
  },
};

function handleAppState(state: AppStateStatus): void {
  if (state === 'background' || state === 'inactive') {
    analyticsService.track('app_background');
    void flush(true);
  } else if (state === 'active' && !sessionId) {
    analyticsService.init(userId, false);
  }
}
