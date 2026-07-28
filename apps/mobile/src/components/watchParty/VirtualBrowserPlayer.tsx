// WeWatch Mobile — Shared Virtual Browser player (T-S188)
// Mirrors apps/app-web/src/components/party/VirtualBrowserPlayer.tsx: a real headless Chromium
// page runs on the server (services/watch-party/src/services/virtualBrowser.service.ts), the
// owner drives it with touch, every room member just watches the same live JPEG frame stream.
// Renders in place of VideoSection whenever useVirtualBrowser(isOwner).active is true — see
// WatchPartyScreen.tsx. Text/keyboard input forwarding (web's handleKeyDown/handleKeyUp) is
// deliberately out of scope here: the described flow is "tap play on the real page", which touch
// already covers; typing into the remote page would need a hidden TextInput + soft-keyboard
// bridge, a separate follow-up if ever needed.
import React, { useCallback, useRef, useState } from 'react';
import { View, Text, Image, ActivityIndicator, StyleSheet, PanResponder, GestureResponderEvent, PanResponderGestureState, LayoutChangeEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TrackedTouchable } from '@components/common/TrackedTouchable';
import { useT } from '@i18n/index';
import type { VBInput } from '@hooks/useVirtualBrowser';
import { VIDEO_HEIGHT } from './VideoSection.styles';

interface Props {
  isOwner: boolean;
  frame: string | null;
  dimensions: { width: number; height: number } | null;
  error: string | null;
  remoteCursor: { x: number; y: number } | null;
  stop: () => void;
  sendInput: (input: VBInput) => void;
}

// Below this the finger hasn't really moved — treat the gesture as a tap (mousedown+mouseup),
// same slop threshold as web's touch handler.
const TAP_SLOP_PX = 10;
const MOVE_THROTTLE_MS = 40; // ~25fps for mousemove — matches web

export function VirtualBrowserPlayer({ isOwner, frame, dimensions, error, remoteCursor, stop, sendInput }: Props) {
  const { t } = useT();
  const [layout, setLayout] = useState<{ width: number; height: number } | null>(null);
  const lastMoveRef = useRef(0);
  const startRef = useRef({ x: 0, y: 0 });
  const movedRef = useRef(false);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setLayout({ width, height });
  }, []);

  // Maps a touch point in this view's local coordinate space to the server-side browser's fixed
  // viewport (VB_VIEWPORT, typically 1280x720) — same math as web's clientToViewport.
  const toViewportCoords = useCallback((localX: number, localY: number): { x: number; y: number } | null => {
    if (!layout || !dimensions) return null;
    const scaleX = dimensions.width / layout.width;
    const scaleY = dimensions.height / layout.height;
    return { x: Math.round(localX * scaleX), y: Math.round(localY * scaleY) };
  }, [layout, dimensions]);

  // Inverse — places the OWNER's cursor (received in server-viewport space via VB_CURSOR) at the
  // right spot on THIS client's rendered frame, whatever size it happens to be displayed at.
  const viewportToLocal = useCallback((vx: number, vy: number): { x: number; y: number } | null => {
    if (!layout || !dimensions) return null;
    return { x: (vx / dimensions.width) * layout.width, y: (vy / dimensions.height) * layout.height };
  }, [layout, dimensions]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isOwner,
      onMoveShouldSetPanResponder: () => isOwner,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        const { locationX, locationY } = evt.nativeEvent;
        startRef.current = { x: locationX, y: locationY };
        movedRef.current = false;
        const pos = toViewportCoords(locationX, locationY);
        if (pos) sendInput({ type: 'mousemove', x: pos.x, y: pos.y });
      },
      onPanResponderMove: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        const { locationX, locationY } = evt.nativeEvent;
        if (Math.abs(locationX - startRef.current.x) > TAP_SLOP_PX || Math.abs(locationY - startRef.current.y) > TAP_SLOP_PX) {
          movedRef.current = true;
        }
        if (!movedRef.current) return;
        const now = Date.now();
        if (now - lastMoveRef.current < MOVE_THROTTLE_MS) return;
        lastMoveRef.current = now;
        // Negated: dragging the finger UP should scroll the content DOWN — same convention as
        // native touch scrolling, matches web's touch handler.
        sendInput({ type: 'wheel', deltaX: -gestureState.dx, deltaY: -gestureState.dy });
      },
      onPanResponderRelease: (evt: GestureResponderEvent) => {
        if (movedRef.current) return; // it was a drag/scroll, not a tap
        const { locationX, locationY } = evt.nativeEvent;
        const pos = toViewportCoords(locationX, locationY);
        if (!pos) return;
        sendInput({ type: 'mousedown', x: pos.x, y: pos.y });
        sendInput({ type: 'mouseup' });
      },
    }),
  ).current;

  if (!frame) {
    return (
      <View style={[s.root, s.centered]}>
        <ActivityIndicator size="large" color="#A78BFA" />
        {error && <Text style={s.errorText}>{error}</Text>}
      </View>
    );
  }

  const remoteCursorLocal = !isOwner && remoteCursor ? viewportToLocal(remoteCursor.x, remoteCursor.y) : null;

  return (
    <View style={s.root}>
      {isOwner && (
        <TrackedTouchable trackId="watchparty:vb_close" style={s.closeBtn} onPress={stop} activeOpacity={0.75}>
          <Ionicons name="close" size={16} color="#fff" />
        </TrackedTouchable>
      )}

      {/* Nothing auto-plays here on purpose — the whole point of falling back to VB is a real
          page the owner has to tap through (play button, ads, captcha). */}
      <View style={s.hint} pointerEvents="none">
        <View style={s.hintDot} />
        <Text style={s.hintText}>{t('watchParty', 'vbStartVideo')}</Text>
      </View>

      <View style={s.frameWrap} onLayout={onLayout} {...(isOwner ? panResponder.panHandlers : {})}>
        {/* eslint-disable-next-line react-native/no-inline-styles -- base64 data URI, not a static asset */}
        <Image
          source={{ uri: `data:image/jpeg;base64,${frame}` }}
          style={s.frameImg}
          resizeMode="contain"
        />

        {/* Everyone else sees the OWNER's cursor, synced via VB_CURSOR — otherwise nobody but
            the owner has any idea what they're pointing at. */}
        {remoteCursorLocal && (
          <Ionicons
            name="locate"
            size={16}
            color="#FBBF24"
            style={[s.remoteCursor, { left: remoteCursorLocal.x - 2, top: remoteCursorLocal.y - 2 }]}
          />
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    width: '100%',
    height: VIDEO_HEIGHT,
    backgroundColor: '#000',
    borderRadius: 14,
    overflow: 'hidden',
  },
  centered: { alignItems: 'center', justifyContent: 'center', gap: 10 },
  errorText: { color: '#F87171', fontSize: 12, textAlign: 'center', paddingHorizontal: 20 },
  frameWrap: { flex: 1 },
  frameImg: { width: '100%', height: '100%' },
  closeBtn: {
    position: 'absolute', top: 8, right: 8, zIndex: 10,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  hint: {
    position: 'absolute', top: 8, left: 8, zIndex: 10,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderWidth: 1, borderColor: 'rgba(123,114,248,0.3)',
  },
  hintDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#A78BFA' },
  hintText: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '600' },
  remoteCursor: { position: 'absolute' },
});
