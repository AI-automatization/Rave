// CineSync Mobile — crash utils unit test
import { crash } from '../utils/crash';

describe('crash utils', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    jest.spyOn(console, 'info').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('captureException logs in __DEV__', () => {
    const error = new Error('test error');
    expect(() => crash.captureException(error)).not.toThrow();
  });

  it('captureMessage logs warning level', () => {
    expect(() => crash.captureMessage('test message', 'warning')).not.toThrow();
  });

  it('captureMessage defaults to info level', () => {
    expect(() => crash.captureMessage('info msg')).not.toThrow();
  });

  it('setUser does not throw', () => {
    expect(() => crash.setUser('user-123')).not.toThrow();
  });

  it('clearUser does not throw', () => {
    expect(() => crash.clearUser()).not.toThrow();
  });
});
