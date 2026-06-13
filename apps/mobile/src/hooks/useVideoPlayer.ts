// WeWatch — Video Player hook (playback status, controls, double-tap)
import { useRef, useState, useCallback, useEffect } from 'react';
import { Animated, Dimensions } from 'react-native';
import { useVideoPlayer as useExpoVideoPlayer } from 'expo-video';
import { useEvent } from 'expo';
import { CONTROLS_TIMEOUT, SEEK_SEC, DOUBLE_TAP_MS } from '@utils/videoPlayer';

const { width: SW } = Dimensions.get('window');

export function useVideoPlayer(url: string) {
  const expoPlayer = useExpoVideoPlayer({ uri: url }, (player) => {
    player.play();
  });

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
  const loadedOnceRef = useRef(false);

  // expo-video events (reactive state driven by player events)
  const { status: evStatus } = useEvent(expoPlayer, 'statusChange', { status: expoPlayer.status });
  const { isPlaying: evIsPlaying } = useEvent(expoPlayer, 'playingChange', { isPlaying: expoPlayer.playing, oldIsPlaying: expoPlayer.playing });
  const { currentTime: evCurrentTime } = useEvent(expoPlayer, 'timeUpdate', { currentTime: 0, currentLiveTimestamp: null, currentOffsetFromLive: null, bufferedPosition: 0 });

  useEffect(() => { setPlaying(evIsPlaying); }, [evIsPlaying]);

  useEffect(() => {
    setPos(evCurrentTime * 1000);
    if (expoPlayer.duration) setDur(expoPlayer.duration * 1000);
  }, [evCurrentTime, expoPlayer.duration]);

  useEffect(() => {
    if (evStatus === 'readyToPlay') {
      if (!loadedOnceRef.current) { loadedOnceRef.current = true; setLoading(false); }
      setBuffering(false);
      if (expoPlayer.duration) setDur(expoPlayer.duration * 1000);
    } else if (evStatus === 'loading') {
      if (loadedOnceRef.current) setBuffering(true);
    } else if (evStatus === 'error') {
      setLoading(false);
      setBuffering(false);
      setErr('Video load error');
    }
  }, [evStatus, expoPlayer.duration]);

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

  const togglePlay = useCallback(() => {
    Animated.sequence([
      Animated.timing(playBtnScale, { toValue: 0.75, duration: 80, useNativeDriver: true }),
      Animated.spring(playBtnScale, { toValue: 1, useNativeDriver: true, friction: 4, tension: 200 }),
    ]).start();
    if (expoPlayer.playing) expoPlayer.pause();
    else expoPlayer.play();
    revealControls();
  }, [expoPlayer, revealControls, playBtnScale]);

  const skipBy = useCallback((seconds: number) => {
    const newTime = Math.max(0, Math.min(expoPlayer.duration ?? 0, expoPlayer.currentTime + seconds));
    expoPlayer.currentTime = newTime;
    revealControls();
  }, [expoPlayer, revealControls]);

  const seekTo = useCallback((locationX: number) => {
    const duration = expoPlayer.duration;
    if (!duration || seekBarW <= 1) return;
    expoPlayer.currentTime = Math.min(1, Math.max(0, locationX / seekBarW)) * duration;
    revealControls();
  }, [expoPlayer, seekBarW, revealControls]);

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
    expoPlayer,
    playing, pos, dur, showControls, buffering, err, loading,
    seekBarW, setSeekBarW,
    doubleTapSide,
    progress: dur > 0 ? pos / dur : 0,
    controlsOpacity, playBtnScale, doubleTapAnim, loadingRotate,
    togglePlay, skipBy, seekTo, handleScreenTap,
  };
}
