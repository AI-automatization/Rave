// WeWatch Mobile — Shared Virtual Browser player (T-S188)
// 2026-10: phone viewport (portrait frame fitted by aspect, optional expand), server 'tap' input,
// drag -> incremental wheel, letterbox-aware coordinates (utils/vbGeometry), hidden-TextInput
// keyboard bridge, per-frame work isolated in VBFrameView, "site unreachable" state.
// Mirrors apps/app-web/src/components/party/VirtualBrowserPlayer.tsx: a real headless Chromium
// page runs on the server (services/watch-party/src/services/virtualBrowser.service.ts), the
// owner drives it with touch, every room member just watches the same live JPEG frame stream.
// Renders in place of VideoSection whenever useVirtualBrowser(isOwner).active is true — see
// WatchPartyScreen.tsx.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Image, ActivityIndicator, StyleSheet, PanResponder, GestureResponderEvent, LayoutChangeEvent, TextInput, useWindowDimensions } from 'react-native';
import { VideoView, useVideoPlayer as createExpoPlayer } from 'expo-video';
import { useEvent } from 'expo';
import { Ionicons } from '@expo/vector-icons';
import { TrackedTouchable } from '@components/common/TrackedTouchable';
import { useT } from '@i18n/index';
import type { VBInput, VBFrameStore } from '@hooks/useVirtualBrowser';
import { toViewportPoint, containRect, frameHeight, dragToWheel } from '@utils/vbGeometry';
import { useVbAudio } from '@hooks/useVbAudio';

interface Props {
  isOwner: boolean;
  frameStore: VBFrameStore;
  hasFrame: boolean;
  dimensions: { width: number; height: number } | null;
  error: string | null;
  /** Page VB is showing is a bot-challenge wall — mirrors web's VirtualBrowserPlayer.tsx. Needs to
   * show ON TOP of a live, still-streaming frame (Twitch/Rutube keep sending screencast frames of
   * the challenge page itself, which without this just reads as the stream flickering/stuck). */
  blocked: 'cloudflare' | 'recaptcha' | null;
  stop: () => void;
  sendInput: (input: VBInput) => void;
  /** Owner-only escape hatch out of a blocked session — opens the same "Это не то видео" picker. */
  onPickDifferentVideo?: () => void;
  /** For the optional HLS upgrade below — the JPEG frame stream needs no room context (it arrives
   * pre-addressed over the owner's own socket room), but the HLS stream is fetched by URL and has
   * to know which room's stream to ask for. */
  roomId: string;
}

// services/watch-party/src/services/vbStream.service.ts — same server session, mux'd to a real
// H.264/AAC HLS stream via ffmpeg (Xvfb + PulseAudio capture) alongside the JPEG screencast, gated
// server-side behind VB_STREAM_ENABLED (default off — if it's off, every attempt below just 404s
// forever and this silently stays on frames, which is exactly the intended fallback). Genuinely
// smoother than a few-frames-per-second JPEG stream once available: real video decode/frame pacing
// instead of a still image getting replaced a few times a second.
const VB_STREAM_RETRY_MS = 2000;
const VB_STREAM_MAX_ATTEMPTS = 10; // ~20s — long enough for ffmpeg's first HLS segment to land

// Below this the finger hasn't really moved — treat the gesture as a tap (mousedown+mouseup),
// same slop threshold as web's touch handler.
const TAP_SLOP_PX = 10;
const MOVE_THROTTLE_MS = 40; // ~25fps for wheel — matches web
const FIRST_FRAME_TIMEOUT_MS = 25000; // no frame by then = site unreachable
const MAX_HEIGHT_RATIO = 0.55; // collapsed: leave room for chat/members
const MAX_HEIGHT_RATIO_EXPANDED = 0.82;

/** Only this tiny component re-renders per frame (it subscribes to the store); the heavy parent
 * and the rest of WatchPartyScreen stay untouched. pointerEvents none: touches must land on the
 * wrapper so locationX/Y are wrapper-relative. */
const VBFrameView = React.memo(function VBFrameView({ store }: { store: VBFrameStore }) {
  const [frame, setFrame] = useState<string | null>(store.get());
  useEffect(() => {
    setFrame(store.get());
    return store.subscribe(() => setFrame(store.get()));
  }, [store]);
  const source = useMemo(() => (frame ? { uri: `data:image/jpeg;base64,${frame}` } : undefined), [frame]);
  if (!source) return null;
  return (
    <View style={s.frameImg} pointerEvents="none">
      <Image
        source={source}
        style={s.frameImg}
        resizeMode="contain"
        // Each frame is a fresh data URI; Android's default 300ms fade made it flicker black
        // (live report 2026-08-03). iOS already defaults to 0.
        fadeDuration={0}
      />
    </View>
  );
});

export function VirtualBrowserPlayer({ isOwner, frameStore, hasFrame, dimensions, error, blocked, stop, sendInput, onPickDifferentVideo, roomId }: Props) {
  const { t } = useT();
  const [layout, setLayout] = useState<{ width: number; height: number } | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const { width: winW, height: winH } = useWindowDimensions();
  const lastMoveRef = useRef(0);
  const startRef = useRef({ x: 0, y: 0 });
  const lastPointRef = useRef({ x: 0, y: 0 });
  const pendingRef = useRef({ dx: 0, dy: 0 });
  const movedRef = useRef(false);
  const kbInputRef = useRef<TextInput>(null);

  // Portrait phone viewport -> tall player; capped so chat/members stay reachable (expand = more).
  const height = frameHeight(winW, dimensions, winH * (expanded ? MAX_HEIGHT_RATIO_EXPANDED : MAX_HEIGHT_RATIO));

  // No first frame within the window = unreachable (DNS/blocked/crashed page) -> offer another link.
  useEffect(() => {
    if (!isOwner || hasFrame) { setTimedOut(false); return; }
    const timer = setTimeout(() => setTimedOut(true), FIRST_FRAME_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [isOwner, hasFrame]);

  // HLS upgrade attempt — see the constants/comment above. `hlsReady` flips true once expo-video
  // actually starts playing the stream; until then (or if it never does) the JPEG frames below
  // keep rendering exactly as before, so this can only make things better, never worse.
  const [hlsReady, setHlsReady] = useState(false);
  const hlsAttemptsRef = useRef(0);
  const hlsGaveUpRef = useRef(false);
  const hlsUrl = `${process.env.EXPO_PUBLIC_WATCH_PARTY_URL}/api/v1/watch-party/vb-stream/${roomId}/index.m3u8`;
  const hlsPlayer = createExpoPlayer(null, (p) => { p.loop = false; });
  const { status: hlsStatus } = useEvent(hlsPlayer, 'statusChange', { status: hlsPlayer.status });
  // The HLS stream carries its own sound; the JPEG fallback gets the separate MP3 tap.
  const vbAudio = useVbAudio(roomId, isOwner && hasFrame && !hlsReady);

  useEffect(() => {
    // Non-owners never receive VB_FRAME either (server-side, owner-only broadcast) — same
    // restriction applies here, no reason to spend a member's bandwidth on a stream only the
    // owner's controls ever get shown for.
    if (!isOwner || hlsGaveUpRef.current || hlsReady) return;
    hlsPlayer.replace({ uri: hlsUrl, contentType: 'hls' });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hlsPlayer identity is stable per createExpoPlayer's own contract
  }, [roomId, isOwner]);

  useEffect(() => {
    if (!isOwner || hlsGaveUpRef.current) return;
    if (hlsStatus === 'readyToPlay') {
      setHlsReady(true);
      hlsPlayer.play();
      return;
    }
    if (hlsStatus === 'error') {
      hlsAttemptsRef.current += 1;
      if (hlsAttemptsRef.current >= VB_STREAM_MAX_ATTEMPTS) {
        // Feature is off server-side, or genuinely broken — stop trying for the rest of this VB
        // session rather than hammering a 404 every couple seconds.
        hlsGaveUpRef.current = true;
        return;
      }
      const retryTimer = setTimeout(() => {
        hlsPlayer.replace({ uri: hlsUrl, contentType: 'hls' });
      }, VB_STREAM_RETRY_MS);
      return () => clearTimeout(retryTimer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hlsPlayer identity is stable per createExpoPlayer's own contract
  }, [hlsStatus, hlsUrl, isOwner]);

  // PanResponder.create() below runs ONCE (frozen via useRef) so its gesture identity survives
  // re-renders — but that also freezes any closure it reads. `layout` starts null and only gets
  // set later by onLayout (fires async, after mount); dimensions arrives even later over the
  // socket (VB_STARTED). Without these refs the responder's handlers would forever see the
  // values from the very first render — layout=null, dimensions=null — so the tap mapping
  // would always return null and every tap would silently no-op. This was the actual bug behind
  // "видел VB, не мог им управлять": nothing crashed, nothing errored, taps just went nowhere.
  const layoutRef = useRef(layout);
  layoutRef.current = layout;
  const dimensionsRef = useRef(dimensions);
  dimensionsRef.current = dimensions;
  const isOwnerRef = useRef(isOwner);
  isOwnerRef.current = isOwner;
  const sendInputRef = useRef(sendInput);
  sendInputRef.current = sendInput;

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setLayout({ width, height });
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isOwnerRef.current,
      onMoveShouldSetPanResponder: () => isOwnerRef.current,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        const { locationX, locationY } = evt.nativeEvent;
        startRef.current = { x: locationX, y: locationY };
        lastPointRef.current = { x: locationX, y: locationY };
        pendingRef.current = { dx: 0, dy: 0 };
        movedRef.current = false;
      },
      onPanResponderMove: (evt: GestureResponderEvent) => {
        const { locationX, locationY } = evt.nativeEvent;
        if (!movedRef.current) {
          if (Math.abs(locationX - startRef.current.x) <= TAP_SLOP_PX && Math.abs(locationY - startRef.current.y) <= TAP_SLOP_PX) return;
          movedRef.current = true;
          lastPointRef.current = { x: locationX, y: locationY }; // don't scroll by the slop distance
          return;
        }
        // INCREMENTAL deltas (accumulated between throttled sends). Sending the gesture's
        // cumulative dx/dy every tick made scrolling accelerate and overshoot.
        pendingRef.current.dx += locationX - lastPointRef.current.x;
        pendingRef.current.dy += locationY - lastPointRef.current.y;
        lastPointRef.current = { x: locationX, y: locationY };
        const now = Date.now();
        if (now - lastMoveRef.current < MOVE_THROTTLE_MS) return;
        lastMoveRef.current = now;
        const l = layoutRef.current;
        const d = dimensionsRef.current;
        const { dx, dy } = pendingRef.current;
        pendingRef.current = { dx: 0, dy: 0 };
        if (!l || !d) return;
        // Negated + scaled to viewport px: finger up scrolls content down (native convention).
        sendInputRef.current({ type: 'wheel', ...dragToWheel(dx, dy, containRect(l, d).scale) });
      },
      onPanResponderRelease: (evt: GestureResponderEvent) => {
        if (movedRef.current) return; // it was a drag/scroll, not a tap
        const { locationX, locationY } = evt.nativeEvent;
        const pos = toViewportPoint(locationX, locationY, layoutRef.current, dimensionsRef.current);
        if (!pos) return; // letterbox bar or not laid out yet
        sendInputRef.current({ type: 'tap', x: pos.x, y: pos.y });
      },
    }),
  ).current;

  // Hidden TextInput bridge: text goes out as 'type', Backspace/Enter as real key events. The
  // input is kept empty (controlled '') so every onChangeText is exactly the newly typed chunk.
  const [kbValue, setKbValue] = useState('');
  const onKbChange = useCallback((text: string) => {
    if (text) sendInputRef.current({ type: 'type', text });
    setKbValue('');
  }, []);
  const onKbKeyPress = useCallback((e: { nativeEvent: { key: string } }) => {
    const key = e.nativeEvent.key;
    if (key === 'Backspace') {
      sendInputRef.current({ type: 'keydown', key: 'Backspace' });
      sendInputRef.current({ type: 'keyup', key: 'Backspace' });
    }
  }, []);
  const onKbSubmit = useCallback(() => {
    sendInputRef.current({ type: 'keydown', key: 'Enter' });
    sendInputRef.current({ type: 'keyup', key: 'Enter' });
  }, []);

  // 2026-08-25 (Saidazim: "виден только владельцу"). VB_FRAME is now emitted to the owner's
  // socket only (vbSession.helper.ts) — non-owners never receive frame/dimensions data at all, so
  // there's nothing here for them to render but a status message instead of the live screencast.
  if (!isOwner) {
    return (
      <View style={[s.root, s.centered, { height }]}>
        <Ionicons name="globe-outline" size={28} color="#A78BFA" />
        <Text style={s.statusText}>{t('watchParty', 'vbOwnerPicking')}</Text>
      </View>
    );
  }

  if (!hasFrame) {
    const failed = !!error || timedOut;
    return (
      <View style={[s.root, s.centered, { height }]}>
        {failed ? (
          <>
            <Ionicons name="cloud-offline-outline" size={32} color="#F87171" />
            <Text style={s.statusText}>{t('watchParty', 'vbUnreachable')}</Text>
            {error ? <Text style={s.errorText}>{error}</Text> : null}
            <View style={s.actions}>
              {onPickDifferentVideo && (
                <TrackedTouchable trackId="watchparty:vb_unreachable_try_another" style={s.primaryBtn} onPress={onPickDifferentVideo} activeOpacity={0.8}>
                  <Text style={s.primaryBtnText}>{t('watchParty', 'vbTryAnotherLink')}</Text>
                </TrackedTouchable>
              )}
              <TrackedTouchable trackId="watchparty:vb_unreachable_close" style={s.secondaryBtn} onPress={stop} activeOpacity={0.8}>
                <Text style={s.secondaryBtnText}>{t('common', 'close')}</Text>
              </TrackedTouchable>
            </View>
          </>
        ) : (
          <ActivityIndicator size="large" color="#A78BFA" />
        )}
      </View>
    );
  }

  return (
    <View style={[s.root, { height }]}>
      <View style={s.toolbar}>
        {!hlsReady && (
          <TrackedTouchable trackId="watchparty:vb_sound" style={s.toolBtn} onPress={vbAudio.toggleMuted} activeOpacity={0.75} accessibilityLabel={t('watchParty', vbAudio.muted ? 'vbSoundOn' : 'vbSoundOff')}>
            <Ionicons name={vbAudio.muted ? 'volume-mute-outline' : 'volume-high-outline'} size={16} color="#fff" />
          </TrackedTouchable>
        )}
        <TrackedTouchable trackId="watchparty:vb_keyboard" style={s.toolBtn} onPress={() => kbInputRef.current?.focus()} activeOpacity={0.75} accessibilityLabel={t('watchParty', 'vbKeyboard')}>
          <Ionicons name="keypad-outline" size={16} color="#fff" />
        </TrackedTouchable>
        <TrackedTouchable trackId="watchparty:vb_expand" style={s.toolBtn} onPress={() => setExpanded((v) => !v)} activeOpacity={0.75} accessibilityLabel={t('watchParty', expanded ? 'vbCollapse' : 'vbExpand')}>
          <Ionicons name={expanded ? 'contract-outline' : 'expand-outline'} size={16} color="#fff" />
        </TrackedTouchable>
        <TrackedTouchable trackId="watchparty:vb_close" style={s.toolBtn} onPress={stop} activeOpacity={0.75}>
          <Ionicons name="close" size={16} color="#fff" />
        </TrackedTouchable>
      </View>

      <TextInput
        ref={kbInputRef}
        value={kbValue}
        onChangeText={onKbChange}
        onKeyPress={onKbKeyPress}
        onSubmitEditing={onKbSubmit}
        blurOnSubmit={false}
        autoCorrect={false}
        autoCapitalize="none"
        autoComplete="off"
        spellCheck={false}
        style={s.hiddenInput}
        caretHidden
      />

      {/* Nothing auto-plays here on purpose — the whole point of falling back to VB is a real
          page the owner has to tap through (play button, ads, captcha). Not shown once the HLS
          upgrade takes over — that stream already carries real audio/video motion, the frozen-
          frame problem this hint exists for doesn't apply to it. */}
      {!hlsReady && (
        <View style={s.hint} pointerEvents="none">
          <View style={s.hintDot} />
          <Text style={s.hintText}>{t('watchParty', 'vbStartVideo')}</Text>
        </View>
      )}

      {/* Touch/layout wrapper stays the same regardless of which of the two renders below is
          active — input still targets the same remote viewport either way, only the visual
          representation of it changes. */}
      <View style={s.frameWrap} onLayout={onLayout} {...panResponder.panHandlers}>
        {hlsReady ? (
          <View style={s.frameImg} pointerEvents="none">
            <VideoView player={hlsPlayer} style={s.frameImg} contentFit="contain" nativeControls={false} />
          </View>
        ) : (
          <VBFrameView store={frameStore} />
        )}
      </View>

      {/* Bot-challenge wall — not solved/bypassed (out of scope on purpose, see
          virtualBrowser.service.ts), just surfaced. Without this the owner just watches raw
          screencast frames of a captcha/challenge page with no indication what's happening and no
          way out except force-closing the room (live report 2026-08-28, Twitch/Rutube: "мигает,
          застряло"). Owner can tap straight through to the candidate picker instead of waiting out
          a screencast that will never resolve on its own. */}
      {blocked && (
        <TrackedTouchable
          trackId="watchparty:vb_blocked_pick_another"
          style={s.blockedBadge}
          onPress={() => onPickDifferentVideo?.()}
          disabled={!isOwner || !onPickDifferentVideo}
          activeOpacity={0.8}
        >
          <View style={s.blockedDot} />
          <Text style={s.blockedText}>
            {t('watchParty', 'vbBlocked')}
            {isOwner && onPickDifferentVideo ? ` — ${t('watchParty', 'playerPickAnother')}` : ''}
          </Text>
        </TrackedTouchable>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    width: '100%',
    backgroundColor: '#000',
    borderRadius: 14,
    overflow: 'hidden',
  },
  centered: { alignItems: 'center', justifyContent: 'center', gap: 10 },
  errorText: { color: '#F87171', fontSize: 12, textAlign: 'center', paddingHorizontal: 20 },
  statusText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600', textAlign: 'center', paddingHorizontal: 24 },
  frameWrap: { flex: 1 },
  frameImg: { width: '100%', height: '100%' },
  toolbar: { position: 'absolute', top: 8, right: 8, zIndex: 10, flexDirection: 'row', gap: 8 },
  toolBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  hiddenInput: { position: 'absolute', width: 1, height: 1, opacity: 0, top: 0, left: 0 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  primaryBtn: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10, backgroundColor: '#7B72F8' },
  primaryBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  secondaryBtn: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.12)' },
  secondaryBtnText: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600' },
  hint: {
    position: 'absolute', top: 8, left: 8, zIndex: 10,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderWidth: 1, borderColor: 'rgba(123,114,248,0.3)',
  },
  hintDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#A78BFA' },
  hintText: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '600' },
  blockedBadge: {
    position: 'absolute', bottom: 10, left: '50%', zIndex: 10,
    transform: [{ translateX: -110 }],
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.75)',
    maxWidth: 220,
  },
  blockedDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#F87171' },
  blockedText: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '600' },
});
