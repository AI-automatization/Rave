import { Platform, Dimensions, PixelRatio, Appearance } from 'react-native';
import Constants from 'expo-constants';

const INGEST_URL = `${process.env.EXPO_PUBLIC_ADMIN_URL ?? 'https://admin-production-8d2a.up.railway.app/api/v1'}/errors/ingest`;
const API_KEY = process.env.EXPO_PUBLIC_ERROR_KEY ?? 'rave-mobile-errors';

interface StackFrame {
  filename: string;
  function: string;
  lineno: number;
}

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
      stacktrace?: { frames: StackFrame[] };
    }>;
  };
  message?: string;
  contexts: {
    os: { name: string; version: string };
    device: {
      model: string;
      name: string;
      year_class: number | null;
      screen_width: number;
      screen_height: number;
      screen_density: number;
      color_scheme: string;
    };
    app: {
      app_version: string;
      build_number: string;
      app_name: string;
      ownership: string;
    };
    runtime: {
      expo_sdk: string;
      js_engine: string;
    };
  };
  extra?: Record<string, unknown>;
  user?: { id: string };
}

function parseStack(stack: string): StackFrame[] {
  return stack.split('\n').slice(1).map((line) => {
    const match = line.match(/at (.+?) \((.+?):(\d+):\d+\)/);
    if (match) return { function: match[1], filename: match[2], lineno: parseInt(match[3], 10) };
    return { function: line.trim(), filename: '?', lineno: 0 };
  }).filter((f) => f.function);
}

function getDeviceContexts(): ErrorPayload['contexts'] {
  const { width, height } = Dimensions.get('screen');
  return {
    os: {
      name: Platform.OS === 'ios' ? 'iOS' : 'Android',
      version: String(Platform.Version),
    },
    device: {
      model: Constants.deviceName ?? 'unknown',
      name: Constants.deviceName ?? 'unknown',
      year_class: Constants.deviceYearClass ?? null,
      screen_width: width,
      screen_height: height,
      screen_density: PixelRatio.get(),
      color_scheme: Appearance.getColorScheme() ?? 'unknown',
    },
    app: {
      app_version: Constants.expoConfig?.version ?? '0.0.0',
      build_number: String(Constants.expoConfig?.ios?.buildNumber ?? Constants.expoConfig?.android?.versionCode ?? '0'),
      app_name: Constants.expoConfig?.name ?? 'CineSync',
      ownership: Constants.appOwnership ?? 'unknown',
    },
    runtime: {
      expo_sdk: Constants.expoConfig?.sdkVersion ?? 'unknown',
      js_engine: (global as Record<string, unknown>).HermesInternal ? 'hermes' : 'jsc',
    },
  };
}

function buildPayload(error: Error, extra?: Record<string, unknown>): ErrorPayload {
  return {
    event_id: Math.random().toString(36).slice(2),
    level: 'error',
    platform: Platform.OS,
    release: Constants.expoConfig?.version ?? '0.0.0',
    environment: __DEV__ ? 'development' : 'production',
    exception: {
      values: [{
        type: error.name,
        value: error.message,
        stacktrace: error.stack ? { frames: parseStack(error.stack) } : undefined,
      }],
    },
    contexts: getDeviceContexts(),
    extra,
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

export function captureError(error: Error, extra?: Record<string, unknown>): void {
  void send(buildPayload(error, extra));
}

export function captureMessage(message: string, level: 'info' | 'warning' = 'info'): void {
  void send({
    event_id: Math.random().toString(36).slice(2),
    level,
    platform: Platform.OS,
    release: Constants.expoConfig?.version ?? '0.0.0',
    environment: __DEV__ ? 'development' : 'production',
    message,
    contexts: getDeviceContexts(),
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
    void send({ ...buildPayload(error), level: isFatal ? 'fatal' : 'error' });
    originalHandler?.(error, isFatal);
  });
}
