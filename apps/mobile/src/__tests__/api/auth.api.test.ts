// CineSync Mobile — auth.api unit tests
import { authApi } from '../../api/auth.api';

const mockPost = jest.fn();
const mockGet = jest.fn();

jest.mock('../../api/client', () => ({
  authClient: {
    post: (...args: unknown[]) => mockPost(...args),
    get: (...args: unknown[]) => mockGet(...args),
  },
  userClient: { get: jest.fn(), post: jest.fn(), put: jest.fn(), patch: jest.fn() },
  contentClient: { get: jest.fn(), post: jest.fn() },
  notificationClient: { get: jest.fn(), put: jest.fn(), delete: jest.fn() },
  battleClient: { get: jest.fn(), post: jest.fn() },
  watchPartyClient: { get: jest.fn(), post: jest.fn(), delete: jest.fn() },
}));

const USER_STUB = {
  _id: 'user-1', email: 'test@test.com', username: 'testuser',
  avatar: null, bio: '', role: 'user',
};
const LOGIN_RESPONSE = {
  user: USER_STUB, accessToken: 'access-token', refreshToken: 'refresh-token',
};

beforeEach(() => jest.clearAllMocks());

describe('authApi.login', () => {
  it('returns login response on success', async () => {
    mockPost.mockResolvedValueOnce({ data: { data: LOGIN_RESPONSE, success: true } });
    const result = await authApi.login({ email: 'test@test.com', password: 'pass123' });
    expect(mockPost).toHaveBeenCalledWith('/auth/login', { email: 'test@test.com', password: 'pass123' });
    expect(result).toEqual(LOGIN_RESPONSE);
  });

  it('throws when response data is null', async () => {
    mockPost.mockResolvedValueOnce({ data: { data: null, success: false } });
    await expect(authApi.login({ email: 'test@test.com', password: 'wrong' })).rejects.toThrow('Login response is empty');
  });
});

describe('authApi.register', () => {
  it('posts registration data and returns empty object by default', async () => {
    mockPost.mockResolvedValueOnce({ data: { data: undefined, success: true } });
    const result = await authApi.register({ email: 'new@test.com', password: 'pass123', username: 'newuser' });
    expect(mockPost).toHaveBeenCalledWith('/auth/register', expect.any(Object));
    expect(result).toEqual({});
  });

  it('returns _dev_otp in dev mode', async () => {
    mockPost.mockResolvedValueOnce({ data: { data: { _dev_otp: '123456' }, success: true } });
    const result = await authApi.register({ email: 'dev@test.com', password: 'pass', username: 'dev' });
    expect(result._dev_otp).toBe('123456');
  });
});

describe('authApi.confirmRegister', () => {
  it('calls confirm endpoint with email and code', async () => {
    mockPost.mockResolvedValueOnce({ data: { data: { userId: 'user-1' }, success: true } });
    const result = await authApi.confirmRegister('test@test.com', '123456');
    expect(mockPost).toHaveBeenCalledWith('/auth/register/confirm', { email: 'test@test.com', code: '123456' });
    expect(result.userId).toBe('user-1');
  });
});

describe('authApi.forgotPassword', () => {
  it('calls forgot-password endpoint', async () => {
    mockPost.mockResolvedValueOnce({ data: { success: true } });
    await authApi.forgotPassword('test@test.com');
    expect(mockPost).toHaveBeenCalledWith('/auth/forgot-password', { email: 'test@test.com' });
  });
});

describe('authApi.resetPassword', () => {
  it('calls reset-password with token and new password', async () => {
    mockPost.mockResolvedValueOnce({ data: { success: true } });
    await authApi.resetPassword('reset-token', 'newpass123');
    expect(mockPost).toHaveBeenCalledWith('/auth/reset-password', { token: 'reset-token', newPassword: 'newpass123' });
  });
});

describe('authApi.refresh', () => {
  it('returns new access and refresh tokens', async () => {
    const tokens = { accessToken: 'new-access', refreshToken: 'new-refresh' };
    mockPost.mockResolvedValueOnce({ data: { data: tokens, success: true } });
    const result = await authApi.refresh('old-refresh');
    expect(mockPost).toHaveBeenCalledWith('/auth/refresh', { refreshToken: 'old-refresh' });
    expect(result.accessToken).toBe('new-access');
  });
});

describe('authApi.logout', () => {
  it('calls logout with refresh token', async () => {
    mockPost.mockResolvedValueOnce({ data: { success: true } });
    await authApi.logout('refresh-token');
    expect(mockPost).toHaveBeenCalledWith('/auth/logout', { refreshToken: 'refresh-token' });
  });
});

describe('authApi.changePassword', () => {
  it('calls change-password endpoint', async () => {
    mockPost.mockResolvedValueOnce({ data: { success: true } });
    await authApi.changePassword('oldpass', 'newpass');
    expect(mockPost).toHaveBeenCalledWith('/auth/change-password', { oldPassword: 'oldpass', newPassword: 'newpass' });
  });
});

describe('authApi.googleToken', () => {
  it('returns login response on valid id token', async () => {
    mockPost.mockResolvedValueOnce({ data: { data: LOGIN_RESPONSE, success: true } });
    const result = await authApi.googleToken('google-id-token');
    expect(mockPost).toHaveBeenCalledWith('/auth/google/token', { idToken: 'google-id-token' });
    expect(result.accessToken).toBe('access-token');
  });

  it('throws when response data is null', async () => {
    mockPost.mockResolvedValueOnce({ data: { data: null, success: false } });
    await expect(authApi.googleToken('bad-token')).rejects.toThrow('Google token response is empty');
  });
});

describe('authApi.resendVerification', () => {
  it('calls resend endpoint', async () => {
    mockPost.mockResolvedValueOnce({ data: { success: true } });
    await authApi.resendVerification('test@test.com');
    expect(mockPost).toHaveBeenCalledWith('/auth/register/resend', { email: 'test@test.com' });
  });
});
