import { Platform } from 'react-native';
import Constants from 'expo-constants';

const INGEST_URL = `${process.env.EXPO_PUBLIC_ADMIN_URL ?? 'https://admin-production-8d2a.up.railway.app/api/v1'}/errors/ingest`;
const API_KEY = process.env.EXPO_PUBLIC_ERROR_KEY ?? 'rave-mobile-errors';

interface ErrorPayload {
  event_id: string;
  level: string;
  platform: string;
  release: string;
  environment: string;
  exception?: {
    values: Array<{
      type: string;
      value: string;
      stacktrace?: { frames: Array<{ filename: string; function: string; lineno: number }> };
    }>;
  };
  message?: string;
  contexts: {
    os: { name: string; version: string };
    device: { model: string };
    app: { app_version: string };
  };
  user?: { id: string };
}

function parseStack(stack: string): Array<{ filename: string; function: string; lineno: number }> {
  return stack.split('\n').slice(1).map((line) => {
    const match = line.match(/at (.+?) \((.+?):(\d+):\d+\)/);
    if (match) {
      return { function: match[1], filename: match[2], lineno: parseInt(match[3], 10) };
    }
    return { function: line.trim(), filename: '?', lineno: 0 };
  }).filter((f) => f.function);
}

function buildPayload(error: Error, level = 'error'): ErrorPayload {
  const appVersion = (Constants.expoConfig?.version ?? '0.0.0');
  return {
    event_id: Math.random().toString(36).slice(2),
    level,
    platform: Platform.OS,
    release: appVersion,
    environment: __DEV__ ? 'development' : 'production',
    exception: {
      values: [{
        type: error.name,
        value: error.message,
        stacktrace: error.stack
          ? { frames: parseStack(error.stack) }
          : undefined,
      }],
    },
    contexts: {
      os: { name: Platform.OS, version: String(Platform.Version) },
      device: { model: Constants.deviceName ?? 'unknown' },
      app: { app_version: appVersion },
    },
  };
}

async function send(payload: ErrorPayload): Promise<void> {
  try {
    const res = await fetch(INGEST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-error-key': API_KEY },
      body: JSON.stringify(payload),
    });
    if (__DEV__) {
      console.log('[ErrorLogger] sent:', payload.exception?.values?.[0]?.type ?? payload.message, '→', res.status);
    }
  } catch (e) {
    if (__DEV__) console.warn('[ErrorLogger] send failed:', e);
  }
}

export function captureError(error: Error, level: 'error' | 'warning' = 'error'): void {
  void send(buildPayload(error, level));
}

export function captureMessage(message: string, level: 'info' | 'warning' = 'info'): void {
  void send({
    event_id: Math.random().toString(36).slice(2),
    level,
    platform: Platform.OS,
    release: Constants.expoConfig?.version ?? '0.0.0',
    environment: __DEV__ ? 'development' : 'production',
    message,
    contexts: {
      os: { name: Platform.OS, version: String(Platform.Version) },
      device: { model: Constants.deviceName ?? 'unknown' },
      app: { app_version: Constants.expoConfig?.version ?? '0.0.0' },
    },
  });
}

let _initialized = false;

export function initErrorLogger(): void {
  if (_initialized) return;
  _initialized = true;

  if (__DEV__) console.log('[ErrorLogger] init, INGEST_URL:', INGEST_URL);

  const originalHandler = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
    if (__DEV__) console.log('[ErrorLogger] caught:', error.message, 'fatal:', isFatal);
    captureError(error, isFatal ? 'error' : 'warning');
    originalHandler?.(error, isFatal);
  });
}
