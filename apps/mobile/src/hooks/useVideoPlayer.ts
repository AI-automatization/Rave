// CineSync — Video Player hook (progress save, playback status, controls, double-tap)
import { useRef, useState, useCallback, useEffect } from 'react';
import { Animated, Dimensions } from 'react-native';
import { Video, AVPlaybackStatus } from 'expo-av';
import { contentApi } from '@api/content.api';
import { CONTROLS_TIMEOUT, SEEK_SEC, DOUBLE_TAP_MS } from '@utils/videoPlayer';

const { width: SW } = Dimensions.get('window');

export function useVideoPlayer(movieId: string) {
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
  const progressSaveRef = useRef(0);
  const completedRef = useRef(false);
  const lastTapRef = useRef(0);
  const lastSideRef = useRef<'left' | 'right' | null>(null);
  const resumedRef = useRef(false);
  const resumePositionRef = useRef<number | null>(null);

  // Resume position fetch on mount
  useEffect(() => {
    contentApi.getWatchProgress(movieId).then((prog) => {
      if (prog && !prog.isCompleted && prog.progress > 0) {
        resumePositionRef.current = prog.progress * 1000;
      }
    }).catch(() => {});
  }, [movieId]);

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
      if (!playing) return;
      Animated.timing(controlsOpacity, { toValue: 0, duration: 400, useNativeDriver: true }).start(
        () => setShowControls(false),
      );
    }, CONTROLS_TIMEOUT);
  }, [controlsOpacity, playing]);

  useEffect(() => {
    revealControls();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [revealControls]);

  // Handle expo-av playback status updates
  const onStatus = useCallback((st: AVPlaybackStatus) => {
    if (!st.isLoaded) {
      if (st.error) setErr(st.error);
      return;
    }
    setLoading(false);
    setPos(st.positionMillis);
    setPlaying(st.isPlaying);
    setBuffering(st.isBuffering);
    if (st.durationMillis) setDur(st.durationMillis);

    // Seek to saved position once video is ready
    if (!resumedRef.current && resumePositionRef.current && videoRef.current && st.durationMillis) {
      resumedRef.current = true;
      videoRef.current.setPositionAsync(resumePositionRef.current);
    }

    // Auto-save progress every 30 s
    const now = Date.now();
    if (now - progressSaveRef.current >= 30_000 && st.durationMillis) {
      progressSaveRef.current = now;
      contentApi
        .updateProgress(movieId, Math.floor(st.positionMillis / 1000), Math.floor(st.durationMillis / 1000))
        .catch(() => {});
    }

    // Mark completed at 90 %
    if (!completedRef.current && st.durationMillis && st.positionMillis / st.durationMillis >= 0.9) {
      completedRef.current = true;
      contentApi.markComplete(movieId).catch(() => {});
    }
  }, [movieId]);

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
