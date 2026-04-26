import { Platform, Dimensions, PixelRatio, Appearance, AppState } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

const INGEST_URL = `${process.env.EXPO_PUBLIC_ADMIN_URL ?? 'https://admin-production-8d2a.up.railway.app/api/v1'}/errors/ingest`;
const API_KEY = process.env.EXPO_PUBLIC_ERROR_KEY ?? 'rave-mobile-errors';

interface StackFrame {
  filename: string;
  function: string;
  lineno: number;
}

interface AndroidConstants {
  Brand?: string;
  Manufacturer?: string;
  Model?: string;
  Release?: string;
  Version?: number;
  Fingerprint?: string;
  ServerHost?: string;
  uiMode?: string;
}

interface IOSConstants {
  systemName?: string;
  systemVersion?: string;
  model?: string;
  localizedModel?: string;
  userInterfaceIdiom?: string;
  isTablet?: boolean;
}

interface ErrorPayload {
  event_id: string;
  timestamp: string;
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
  contexts: Record<string, Record<string, unknown>>;
  extra?: Record<string, unknown>;
  user?: { id: string };
  tags?: Record<string, string>;
}

function parseStack(stack: string): StackFrame[] {
  return stack
    .split('\n')
    .slice(1)
    .map((line) => {
      const match = line.match(/at (.+?) \((.+?):(\d+):\d+\)/);
      if (match) return { function: match[1], filename: match[2], lineno: parseInt(match[3], 10) };
      return { function: line.trim(), filename: '?', lineno: 0 };
    })
    .filter((f) => f.function);
}

function getTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'unknown';
  }
}

function getLocale(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale;
  } catch {
    return 'unknown';
  }
}

function getDeviceContexts(): ErrorPayload['contexts'] {
  const { width, height } = Dimensions.get('screen');
  const window = Dimensions.get('window');
  const isHermes = !!(global as Record<string, unknown>).HermesInternal;

  const androidC = (Platform.constants as AndroidConstants) ?? {};
  const iosC = (Platform.constants as IOSConstants) ?? {};

  const osCtx: Record<string, unknown> =
    Platform.OS === 'android'
      ? {
          name: 'Android',
          version: androidC.Release ?? String(Platform.Version),
          api_level: Platform.Version,
          brand: androidC.Brand ?? 'unknown',
          manufacturer: androidC.Manufacturer ?? 'unknown',
          fingerprint: androidC.Fingerprint ?? 'unknown',
        }
      : {
          name: 'iOS',
          version: iosC.systemVersion ?? String(Platform.Version),
          model: iosC.model ?? 'unknown',
          ui_idiom: iosC.userInterfaceIdiom ?? 'unknown',
          is_tablet: iosC.isTablet ?? false,
        };

  const deviceCtx: Record<string, unknown> =
    Platform.OS === 'android'
      ? {
          model: androidC.Model ?? Constants.deviceName ?? 'unknown',
          brand: androidC.Brand ?? 'unknown',
          manufacturer: androidC.Manufacturer ?? 'unknown',
          name: Constants.deviceName ?? 'unknown',
          screen_width: width,
          screen_height: height,
          window_width: window.width,
          window_height: window.height,
          screen_density: PixelRatio.get(),
          screen_scale: PixelRatio.getFontScale(),
          color_scheme: Appearance.getColorScheme() ?? 'unknown',
          is_tablet: width >= 600,
        }
      : {
          model: iosC.localizedModel ?? iosC.model ?? Constants.deviceName ?? 'unknown',
          name: Constants.deviceName ?? 'unknown',
          screen_width: width,
          screen_height: height,
          window_width: window.width,
          window_height: window.height,
          screen_density: PixelRatio.get(),
          screen_scale: PixelRatio.getFontScale(),
          color_scheme: Appearance.getColorScheme() ?? 'unknown',
          is_tablet: iosC.isTablet ?? false,
        };

  const appCtx: Record<string, unknown> = {
    app_version: Constants.expoConfig?.version ?? '0.0.0',
    build_number: String(
      Constants.expoConfig?.ios?.buildNumber ??
        Constants.expoConfig?.android?.versionCode ??
        '0',
    ),
    app_name: Constants.expoConfig?.name ?? 'CineSync',
    execution_env: Constants.executionEnvironment ?? 'unknown',
    is_expo_go: Constants.executionEnvironment === ExecutionEnvironment.StoreClient,
    app_state: AppState.currentState,
    session_id: Constants.sessionId ?? 'unknown',
  };

  const runtimeCtx: Record<string, unknown> = {
    expo_sdk: Constants.expoConfig?.sdkVersion ?? 'unknown',
    js_engine: isHermes ? 'hermes' : 'jsc',
    hermes_version: isHermes
      ? String((global as Record<string, unknown>).HermesInternal ?? '')
      : null,
    rn_version: (() => {
      const v = Platform.constants.reactNativeVersion as { major: number; minor: number; patch: number } | undefined;
      return v ? `${v.major}.${v.minor}.${v.patch}` : 'unknown';
    })(),
  };

  const cultureCtx: Record<string, unknown> = {
    timezone: getTimezone(),
    locale: getLocale(),
  };

  return {
    os: osCtx,
    device: deviceCtx,
    app: appCtx,
    runtime: runtimeCtx,
    culture: cultureCtx,
  };
}

function buildPayload(error: Error, extra?: Record<string, unknown>): ErrorPayload {
  return {
    event_id: Math.random().toString(36).slice(2),
    timestamp: new Date().toISOString(),
    level: 'error',
    platform: Platform.OS,
    release: Constants.expoConfig?.version ?? '0.0.0',
    environment: __DEV__ ? 'development' : 'production',
    exception: {
      values: [
        {
          type: error.name,
          value: error.message,
          stacktrace: error.stack ? { frames: parseStack(error.stack) } : undefined,
        },
      ],
    },
    contexts: getDeviceContexts(),
    extra,
    tags: {
      platform: Platform.OS,
      environment: __DEV__ ? 'development' : 'production',
      app_version: Constants.expoConfig?.version ?? '0.0.0',
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
      const body = res.status >= 400 ? await res.text() : '';
      console.log(
        '[ErrorLogger] sent:',
        payload.exception?.values?.[0]?.type ?? payload.message,
        '→',
        res.status,
        body || '',
      );
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
    timestamp: new Date().toISOString(),
    level,
    platform: Platform.OS,
    release: Constants.expoConfig?.version ?? '0.0.0',
    environment: __DEV__ ? 'development' : 'production',
    message,
    contexts: getDeviceContexts(),
    tags: {
      platform: Platform.OS,
      environment: __DEV__ ? 'development' : 'production',
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
    void send({ ...buildPayload(error), level: isFatal ? 'fatal' : 'error' });
    originalHandler?.(error, isFatal);
  });
}
