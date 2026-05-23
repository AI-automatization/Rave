// WeWatch — Video Player hook (playback status, controls, double-tap)
import { useRef, useState, useCallback, useEffect } from 'react';
import { Animated, Dimensions } from 'react-native';
import { Video, AVPlaybackStatus } from 'expo-av';
import { CONTROLS_TIMEOUT, SEEK_SEC, DOUBLE_TAP_MS } from '@utils/videoPlayer';

const { width: SW } = Dimensions.get('window');

export function useVideoPlayer() {
  const videoRef = useRef<Video>(null);

  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const [dur, setDur] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [buffering, setBuffering] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [seekBarW, setSeekBarW] = useState(1);
  const [doubleTapSide, setDoubleTapSide] = useState<'left' | 'right' | null>(null);

  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const playBtnScale = useRef(new Animated.Value(1)).current;
  const doubleTapAnim = useRef(new Animated.Value(0)).current;
  const loadingRotate = useRef(new Animated.Value(0)).current;

  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapRef = useRef(0);
  const lastSideRef = useRef<'left' | 'right' | null>(null);

  // Spinner rotation animation while loading
  useEffect(() => {
    if (!loading) return;
    const loop = Animated.loop(
      Animated.timing(loadingRotate, { toValue: 1, duration: 1200, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [loading, loadingRotate]);

  // Show controls and schedule auto-hide
  const revealControls = useCallback(() => {
    setShowControls(true);
    Animated.timing(controlsOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      Animated.timing(controlsOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(
        () => setShowControls(false),
      );
    }, CONTROLS_TIMEOUT);
  }, [controlsOpacity]);

  const onStatus = useCallback((st: AVPlaybackStatus) => {
    if (!st.isLoaded) {
      if (st.error) setErr(st.error);
      return;
    }

    if (loading && st.isLoaded) setLoading(false);
    setPlaying(st.isPlaying);
    setBuffering(st.isBuffering);
    setPos(st.positionMillis);
    if (st.durationMillis) setDur(st.durationMillis);
  }, [loading]);

  const togglePlay = useCallback(async () => {
    if (!videoRef.current) return;
    Animated.sequence([
      Animated.timing(playBtnScale, { toValue: 0.75, duration: 80, useNativeDriver: true }),
      Animated.spring(playBtnScale, { toValue: 1, useNativeDriver: true, friction: 4, tension: 200 }),
    ]).start();
    if (playing) await videoRef.current.pauseAsync();
    else await videoRef.current.playAsync();
    revealControls();
  }, [playing, revealControls, playBtnScale]);

  const skipBy = useCallback(async (seconds: number) => {
    if (!videoRef.current) return;
    await videoRef.current.setPositionAsync(Math.max(0, Math.min(dur, pos + seconds * 1000)));
    revealControls();
  }, [dur, pos, revealControls]);

  const seekTo = useCallback((locationX: number) => {
    if (!dur || !videoRef.current || seekBarW <= 1) return;
    videoRef.current.setPositionAsync(Math.min(1, Math.max(0, locationX / seekBarW)) * dur);
    revealControls();
  }, [dur, seekBarW, revealControls]);

  const showDoubleTapFeedback = useCallback((side: 'left' | 'right') => {
    setDoubleTapSide(side);
    doubleTapAnim.setValue(1);
    Animated.timing(doubleTapAnim, { toValue: 0, duration: 600, useNativeDriver: true }).start(
      () => setDoubleTapSide(null),
    );
  }, [doubleTapAnim]);

  const handleScreenTap = useCallback((locationX: number) => {
    const now = Date.now();
    const side: 'left' | 'right' = locationX < SW / 2 ? 'left' : 'right';
    if (now - lastTapRef.current < DOUBLE_TAP_MS && lastSideRef.current === side) {
      skipBy(side === 'left' ? -SEEK_SEC : SEEK_SEC);
      showDoubleTapFeedback(side);
      lastTapRef.current = 0;
      lastSideRef.current = null;
    } else {
      lastTapRef.current = now;
      lastSideRef.current = side;
      revealControls();
    }
  }, [skipBy, revealControls, showDoubleTapFeedback]);

  return {
    videoRef,
    playing, pos, dur, showControls, buffering, err, loading,
    seekBarW, setSeekBarW,
    doubleTapSide,
    progress: dur > 0 ? pos / dur : 0,
    controlsOpacity, playBtnScale, doubleTapAnim, loadingRotate,
    onStatus, togglePlay, skipBy, seekTo, handleScreenTap,
  };
}
