import { describe, expect, it } from 'vitest';
import { microphoneStep } from '../src/main/permissions-model';

// What the app does with a "may this page use the microphone?" request, given what macOS itself says about WeWatch.
describe('microphoneStep — macOS microphone access for the voice chat', () => {
  it('a request that is not about the microphone is not our business (just allow, the origin check ran before)', () => {
    expect(microphoneStep('notifications', undefined, 'darwin', 'denied')).toBe('allow');
    expect(microphoneStep('media', ['video'], 'darwin', 'denied')).toBe('allow'); // camera only
  });
  it('already granted by macOS -> allow', () => {
    expect(microphoneStep('media', ['audio'], 'darwin', 'granted')).toBe('allow');
    expect(microphoneStep('media', ['audio', 'video'], 'darwin', 'granted')).toBe('allow');
  });
  it('macOS has not been asked yet -> ask it (shows the system prompt)', () => {
    expect(microphoneStep('media', ['audio'], 'darwin', 'not-determined')).toBe('ask');
  });
  it('denied or restricted in System Settings -> refuse and point the user to System Settings', () => {
    expect(microphoneStep('media', ['audio'], 'darwin', 'denied')).toBe('open-settings');
    expect(microphoneStep('media', ['audio'], 'darwin', 'restricted')).toBe('open-settings');
  });
  it('other systems are not touched', () => {
    expect(microphoneStep('media', ['audio'], 'win32', 'denied')).toBe('allow');
    expect(microphoneStep('media', ['audio'], 'linux', 'unknown')).toBe('allow');
  });
  it('an unknown macOS status never blocks the microphone', () => {
    expect(microphoneStep('media', ['audio'], 'darwin', 'unknown')).toBe('allow');
  });
  it('a media request without a mediaTypes list is treated as the microphone too (older request shape)', () => {
    expect(microphoneStep('media', undefined, 'darwin', 'denied')).toBe('open-settings');
  });
});
