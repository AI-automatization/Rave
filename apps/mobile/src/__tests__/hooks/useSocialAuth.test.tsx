// useSocialAuth — Google regressions: Android browser-fallback polling, DEVELOPER_ERROR fallback
import React from 'react';
import { act, create } from 'react-test-renderer';

const mockSignIn = jest.fn();
const mockSetAuth = jest.fn();
const mockGoogleInit = jest.fn();
const mockGooglePoll = jest.fn();
const mockGoogleToken = jest.fn();
const mockOpenBrowser = jest.fn();

jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
  Linking: { addEventListener: jest.fn(() => ({ remove: jest.fn() })), openURL: jest.fn() },
}));
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(async () => true),
    signOut: jest.fn(async () => undefined),
    signIn: (...a: unknown[]) => mockSignIn(...a),
  },
  statusCodes: { SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED', IN_PROGRESS: 'IN_PROGRESS', PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE' },
}));
jest.mock('expo-web-browser', () => ({
  openBrowserAsync: (...a: unknown[]) => mockOpenBrowser(...a),
  dismissBrowser: jest.fn(),
}));
jest.mock('expo-apple-authentication', () => ({ isAvailableAsync: jest.fn(async () => false) }));
jest.mock('@api/auth.api', () => ({
  authApi: {
    googleInit: (...a: unknown[]) => mockGoogleInit(...a),
    googlePoll: (...a: unknown[]) => mockGooglePoll(...a),
    googleToken: (...a: unknown[]) => mockGoogleToken(...a),
  },
}));
jest.mock('@store/auth.store', () => ({ useAuthStore: () => ({ setAuth: mockSetAuth }) }));
jest.mock('@i18n/index', () => ({ useT: () => ({ t: (_s: string, k: string) => k }) }));

import { useSocialAuth } from '../../hooks/useSocialAuth';

type Api = ReturnType<typeof useSocialAuth>;
let api: Api;
function Probe() {
  api = useSocialAuth();
  return null;
}

const LOGIN = { user: { _id: 'u1' }, accessToken: 'a', refreshToken: 'r' };

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  mockGoogleInit.mockResolvedValue({ state: 'st' });
  mockOpenBrowser.mockResolvedValue({ type: 'opened' }); // Android: resolves immediately
});
afterEach(() => jest.useRealTimers());

async function flush(ms: number) {
  await act(async () => { await jest.advanceTimersByTimeAsync(ms); });
}

describe('useSocialAuth — Google', () => {
  it('Android DEVELOPER_ERROR → falls back to browser flow and keeps polling past 6s', async () => {
    mockSignIn.mockRejectedValue({ code: '10' });
    mockGooglePoll.mockResolvedValue(null);
    act(() => { create(<Probe />); });

    await act(async () => { api.promptGoogleAsync(); });
    await flush(0);
    expect(mockGoogleInit).toHaveBeenCalled();
    expect(mockOpenBrowser).toHaveBeenCalledWith(expect.stringContaining('/api/v1/auth/google/mobile?state=st'));

    // user still picking an account 20s later — polling must be alive (old code stopped at 6s)
    await flush(20_000);
    const pollsSoFar = mockGooglePoll.mock.calls.length;
    expect(pollsSoFar).toBeGreaterThanOrEqual(9);

    mockGooglePoll.mockResolvedValue(LOGIN);
    await flush(2_000);
    expect(mockSetAuth).toHaveBeenCalledWith(LOGIN.user, 'a', 'r');
    expect(api.socialError).toBe('');
  });

  it('native cancel ({ type: cancelled }) shows no error', async () => {
    mockSignIn.mockResolvedValue({ type: 'cancelled', data: null });
    act(() => { create(<Probe />); });
    await act(async () => { await api.promptGoogleAsync(); });
    expect(api.socialError).toBe('');
    expect(mockOpenBrowser).not.toHaveBeenCalled();
  });

  it('native success → googleToken → setAuth', async () => {
    mockSignIn.mockResolvedValue({ type: 'success', data: { idToken: 'id' } });
    mockGoogleToken.mockResolvedValue(LOGIN);
    act(() => { create(<Probe />); });
    await act(async () => { await api.promptGoogleAsync(); });
    expect(mockGoogleToken).toHaveBeenCalledWith('id');
    expect(mockSetAuth).toHaveBeenCalledWith(LOGIN.user, 'a', 'r');
  });
});
