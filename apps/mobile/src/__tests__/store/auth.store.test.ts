// CineSync Mobile — auth.store unit tests
import { useAuthStore } from '../../store/auth.store';

const mockSaveTokens = jest.fn();
const mockGetRefreshToken = jest.fn();
const mockGetAll = jest.fn();
const mockClear = jest.fn();

jest.mock('../../utils/storage', () => ({
  tokenStorage: {
    saveTokens: (...args: unknown[]) => mockSaveTokens(...args),
    getRefreshToken: () => mockGetRefreshToken(),
    getAll: () => mockGetAll(),
    clear: () => mockClear(),
  },
}));

const mockGetMe = jest.fn();
const mockRemoveFcmToken = jest.fn();

jest.mock('../../api/user.api', () => ({
  userApi: {
    getMe: () => mockGetMe(),
    removeFcmToken: () => mockRemoveFcmToken(),
  },
}));

jest.mock('../../api/auth.api', () => ({
  authApi: { logout: jest.fn().mockResolvedValue(undefined) },
}));

jest.mock('../../socket/client', () => ({
  disconnectSocket: jest.fn(),
}));

const USER_STUB = {
  _id: 'user-1', email: 'test@test.com', username: 'testuser',
  avatar: null, bio: 'My bio', role: 'user', rank: 'Bronze', totalPoints: 0,
  isEmailVerified: true, isBlocked: false, fcmTokens: [],
  lastLoginAt: null, createdAt: new Date(), updatedAt: new Date(),
};

beforeEach(() => {
  jest.clearAllMocks();
  // Reset store to initial state
  useAuthStore.setState({
    user: null, accessToken: null, isAuthenticated: false,
    isHydrated: false, needsProfileSetup: false,
  });
});

describe('initial state', () => {
  it('starts with null user', () => expect(useAuthStore.getState().user).toBeNull());
  it('starts unauthenticated', () => expect(useAuthStore.getState().isAuthenticated).toBe(false));
  it('starts unhydrated', () => expect(useAuthStore.getState().isHydrated).toBe(false));
  it('starts without profile setup flag', () => expect(useAuthStore.getState().needsProfileSetup).toBe(false));
});

describe('updateUser', () => {
  it('updates the user in state', () => {
    useAuthStore.getState().updateUser(USER_STUB as never);
    expect(useAuthStore.getState().user?.username).toBe('testuser');
  });
});

describe('clearProfileSetup', () => {
  it('clears needsProfileSetup flag', () => {
    useAuthStore.setState({ needsProfileSetup: true });
    useAuthStore.getState().clearProfileSetup();
    expect(useAuthStore.getState().needsProfileSetup).toBe(false);
  });
});

describe('setAuth', () => {
  it('saves tokens and sets authenticated state', async () => {
    mockSaveTokens.mockResolvedValueOnce(undefined);
    mockGetMe.mockResolvedValueOnce(USER_STUB);
    await useAuthStore.getState().setAuth(USER_STUB as never, 'access-token', 'refresh-token');
    expect(mockSaveTokens).toHaveBeenCalledWith('access-token', 'refresh-token', 'user-1');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('sets needsProfileSetup=true when bio is empty', async () => {
    mockSaveTokens.mockResolvedValueOnce(undefined);
    const userNoBio = { ...USER_STUB, bio: '' };
    mockGetMe.mockResolvedValueOnce(userNoBio);
    await useAuthStore.getState().setAuth(userNoBio as never, 'access-token', 'refresh-token');
    expect(useAuthStore.getState().needsProfileSetup).toBe(true);
  });
});

describe('logout', () => {
  it('clears all auth state', async () => {
    useAuthStore.setState({ user: USER_STUB as never, accessToken: 'token', isAuthenticated: true });
    mockGetRefreshToken.mockResolvedValueOnce('refresh-token');
    mockRemoveFcmToken.mockResolvedValueOnce(undefined);
    mockClear.mockResolvedValueOnce(undefined);
    await useAuthStore.getState().logout();
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});

describe('hydrate — already authenticated', () => {
  it('sets isHydrated=true even when getAll returns null', async () => {
    mockGetAll.mockResolvedValueOnce({ accessToken: null, userId: null });
    await useAuthStore.getState().hydrate();
    expect(useAuthStore.getState().isHydrated).toBe(true);
  });

  it('sets isAuthenticated when valid tokens found', async () => {
    mockGetAll.mockResolvedValueOnce({ accessToken: 'valid-token', userId: 'user-1' });
    mockGetMe.mockResolvedValueOnce(USER_STUB);
    await useAuthStore.getState().hydrate();
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().isHydrated).toBe(true);
  });
});
