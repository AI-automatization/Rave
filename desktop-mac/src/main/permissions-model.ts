// Pure decision for the microphone (no Electron imports — unit-tested).
//
// The web page may use the microphone only if the user also allowed WeWatch in macOS (System Settings → Privacy →
// Microphone). Electron does not ask macOS by itself in every case, and a "denied" answer used to end as a silent
// failure of the voice chat's Join button. So: ask macOS when it has not been asked, and when the user has said no
// there, send them to the right System Settings page instead of failing quietly.

export type MicStep = 'allow' | 'ask' | 'open-settings';

/** `status` is `systemPreferences.getMediaAccessStatus('microphone')`: granted | not-determined | denied | restricted | unknown. */
export function microphoneStep(permission: string, mediaTypes: readonly string[] | undefined, platform: string, status: string): MicStep {
  if (platform !== 'darwin' || permission !== 'media') return 'allow';
  if (mediaTypes && !mediaTypes.includes('audio')) return 'allow'; // camera only
  if (status === 'not-determined') return 'ask';
  if (status === 'denied' || status === 'restricted') return 'open-settings';
  return 'allow'; // granted, or a status we do not know: never block the microphone because of it
}
