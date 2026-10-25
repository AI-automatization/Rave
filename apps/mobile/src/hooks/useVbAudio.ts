// Sound for the virtual browser — the JPEG screencast carries none. Plays the server's live MP3 of
// the VB page (GET /vb-audio/:roomId, services/watch-party vbAudio.service.ts) through an audio-only
// expo-video player (AVPlayer/ExoPlayer stream MP3 natively, no VideoView needed). Web twin:
// apps/app-web/src/components/party/VirtualBrowserAudio.tsx.
import { useEffect, useState } from 'react';
import { useVideoPlayer } from 'expo-video';
import { useEvent } from 'expo';

const RECONNECT_MS = 1500;

/** `enabled` false (non-owner, no frame yet, or the HLS stream already carries sound) = silent. */
export function useVbAudio(roomId: string, enabled: boolean) {
  const [muted, setMuted] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const player = useVideoPlayer(null, (p) => { p.loop = false; });
  const { status } = useEvent(player, 'statusChange', { status: player.status });

  useEffect(() => {
    if (!enabled) { player.pause(); return; }
    // attempt in the query: a fresh request after a dropped stream, not a cached dead one
    player.replace({ uri: `${process.env.EXPO_PUBLIC_WATCH_PARTY_URL}/api/v1/watch-party/vb-audio/${roomId}?r=${attempt}` });
    player.play();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- player identity is stable per useVideoPlayer's own contract
  }, [roomId, enabled, attempt]);

  useEffect(() => {
    if (!enabled || status !== 'error') return;
    const retry = setTimeout(() => setAttempt((n) => n + 1), RECONNECT_MS);
    return () => clearTimeout(retry);
  }, [enabled, status]);

  useEffect(() => { player.muted = muted; }, [player, muted]);

  return { muted, toggleMuted: () => setMuted((m) => !m) };
}
