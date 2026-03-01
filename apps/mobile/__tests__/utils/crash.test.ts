/**
 * crash.ts uchun unit testlar
 * __DEV__ = true (jest muhitida)
 */

// jest muhitida __DEV__ = true
(global as Record<string, unknown>).__DEV__ = true;

// Actual modulni import qilish uchun mock ni o'chiramiz
jest.unmock('@utils/crash');

import {
  initCrashReporting,
  reportError,
  reportMessage,
  setUserContext,
  clearUserContext,
} from '../../src/utils/crash';

describe('crash utils (__DEV__ mode)', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.log as jest.Mock).mockRestore();
    (console.warn as jest.Mock).mockRestore();
  });

  it('initCrashReporting console.log chaqiradi', () => {
    initCrashReporting();
    expect(console.log).toHaveBeenCalledWith('[crash] Crash reporting initialized (stub)');
  });

  it('reportError console.warn chaqiradi', () => {
    const err = new Error('test error');
    reportError(err, { screen: 'HomeScreen' });
    expect(console.warn).toHaveBeenCalledWith('[crash] Error reported:', 'test error', { screen: 'HomeScreen' });
  });

  it('reportMessage to\'g\'ri level bilan console.warn chaqiradi', () => {
    reportMessage('Test message', 'warning');
    expect(console.warn).toHaveBeenCalledWith('[crash] Message (warning):', 'Test message');
  });

  it('setUserContext va clearUserContext __DEV__ da hech narsa qilmaydi', () => {
    expect(() => setUserContext('user-1', 'testuser')).not.toThrow();
    expect(() => clearUserContext()).not.toThrow();
  });
});
