// CineSync Mobile — Video Player Screen (premium design)
// YouTube → m.youtube.com WebView | Direct → expo-av + custom controls
import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Dimensions,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import WebView from 'react-native-webview';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { HomeStackParamList } from '@app-types/index';
import { contentApi } from '@api/content.api';
import { useTheme } from '@theme/index';

type Props = NativeStackScreenProps<HomeStackParamList, 'VideoPlayer'>;

const { width: SW, height: SH } = Dimensions.get('window');
const SEEK_SEC = 10;
const DOUBLE_TAP_MS = 300;
const CONTROLS_TIMEOUT = 4000;
const YOUTUBE_RE = /(?:youtube\.com|youtu\.be)/i;

const MOBILE_UA =
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36';

function getYouTubeMobileUrl(url: string): string {
  const m =
    url.match(/[?&]v=([^&]+)/) ??
    url.match(/youtu\.be\/([^?&/]+)/) ??
    url.match(/\/shorts\/([^?&/]+)/) ??
    url.match(/\/embed\/([^?&/]+)/);
  const id = m ? m[1] : null;
  if (id) return `https://m.youtube.com/watch?v=${id}`;
  return url.replace('www.youtube.com', 'm.youtube.com');
}

function fmtTime(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const mn = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  if (h > 0) return `${h}:${pad(mn)}:${pad(s)}`;
  return `${mn}:${pad(s)}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Router
// ═══════════════════════════════════════════════════════════════════════════
export function VideoPlayerScreen({ route, navigation }: Props) {
  const { movieId, videoUrl, title } = route.params;
  const isYouTube = YOUTUBE_RE.test(videoUrl);

  if (isYouTube) {
    return <YouTubePlayer url={videoUrl} title={title} navigation={navigation} />;
  }
  return <DirectPlayer movieId={movieId} videoUrl={videoUrl} title={title} navigation={navigation} />;
}

// ═══════════════════════════════════════════════════════════════════════════
// YouTube Player — WebView m.youtube.com
// ═══════════════════════════════════════════════════════════════════════════
function YouTubePlayer({
  url,
  title,
  navigation,
}: {
  url: string;
  title: string;
  navigation: Props['navigation'];
}) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const mobileUrl = getYouTubeMobileUrl(url);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fadeAnim]);

  if (error) {
    return <ErrorScreen message="YouTube video yuklanmadi" onBack={() => navigation.goBack()} colors={colors} />;
  }

  return (
    <Animated.View style={[s.root, { opacity: fadeAnim }]}>
      <StatusBar hidden />

      <WebView
        source={{ uri: mobileUrl }}
        style={s.fill}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        allowsFullscreenVideo
        userAgent={MOBILE_UA}
        onLoadEnd={() => setLoading(false)}
        onError={() => { setLoading(false); setError(true); }}
        onHttpError={({ nativeEvent }) => {
          if (nativeEvent.statusCode >= 400) { setLoading(false); setError(true); }
        }}
        onShouldStartLoadWithRequest={(req) => {
          const scheme = req.url.split(':')[0].toLowerCase();
          return ['http', 'https', 'blob', 'data'].includes(scheme);
        }}
      />

      {/* Loading overlay */}
      {loading && (
        <View style={s.loadingOverlay}>
          <LinearGradient colors={['#0A0A0F', '#1a0a2e', '#0A0A0F']} style={StyleSheet.absoluteFill} />
          <View style={s.ytLogoWrap}>
            <Ionicons name="logo-youtube" size={52} color="#FF0000" />
          </View>
          <Text style={s.loadingTitle} numberOfLines={2}>{title}</Text>
          <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 16 }} />
          <Text style={s.loadingHint}>Yuklanmoqda...</Text>
        </View>
      )}

      {/* Back button — glassmorphism pill */}
      {!loading && (
        <View style={[s.ytBackWrap, { top: insets.top + 12 }]}>
          <BlurView intensity={50} tint="dark" style={s.ytBackBlur}>
            <TouchableOpacity style={s.ytBackBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={18} color="#fff" />
              <Text style={s.ytBackText} numberOfLines={1}>{title}</Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      )}
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Direct Player — expo-av + custom animated controls
// ═══════════════════════════════════════════════════════════════════════════
function DirectPlayer({
  movieId,
  videoUrl,
  title,
  navigation,
}: {
  movieId: string;
  videoUrl: string;
  title: string;
  navigation: Props['navigation'];
}) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const videoRef = useRef<Video>(null);

  // State
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const [dur, setDur] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [buffering, setBuffering] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [seekBarW, setSeekBarW] = useState(1);

  // Animated values
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const playBtnScale = useRef(new Animated.Value(1)).current;
  const doubleTapAnim = useRef(new Animated.Value(0)).current;
  const [doubleTapSide, setDoubleTapSide] = useState<'left' | 'right' | null>(null);
  const loadingRotate = useRef(new Animated.Value(0)).current;

  // Refs
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressSaveRef = useRef(0);
  const completedRef = useRef(false);
  const lastTapRef = useRef(0);
  const lastSideRef = useRef<'left' | 'right' | null>(null);

  // Resume from last position — fetch on mount, apply when video is ready
  const resumedRef = useRef(false);
  const resumePositionRef = useRef<number | null>(null);
  useEffect(() => {
    contentApi.getWatchProgress(movieId).then((progress) => {
      if (progress && !progress.isCompleted && progress.progress > 0) {
        resumePositionRef.current = progress.progress * 1000;
      }
    }).catch(() => { /* silent */ });
  }, [movieId]);

  // Loading animation
  useEffect(() => {
    if (!loading) return;
    const loop = Animated.loop(
      Animated.timing(loadingRotate, { toValue: 1, duration: 1200, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [loading, loadingRotate]);

  // Show/hide controls
  const revealControls = useCallback(() => {
    setShowControls(true);
    Animated.timing(controlsOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (!playing) return; // don't hide if paused
      Animated.timing(controlsOpacity, { toValue: 0, duration: 400, useNativeDriver: true }).start(() =>
        setShowControls(false),
      );
    }, CONTROLS_TIMEOUT);
  }, [controlsOpacity, playing]);

  useEffect(() => {
    revealControls();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [revealControls]);

  // Playback status
  const onStatus = useCallback(
    (st: AVPlaybackStatus) => {
      if (!st.isLoaded) {
        if (st.error) setErr(st.error);
        return;
      }
      setLoading(false);
      setPos(st.positionMillis);
      setPlaying(st.isPlaying);
      setBuffering(st.isBuffering);
      if (st.durationMillis) setDur(st.durationMillis);

      // Resume from saved position (once, when video first loads)
      if (!resumedRef.current && resumePositionRef.current && videoRef.current && st.durationMillis) {
        resumedRef.current = true;
        videoRef.current.setPositionAsync(resumePositionRef.current);
      }

      // Auto-save progress every 30s
      const now = Date.now();
      if (now - progressSaveRef.current >= 30_000 && st.durationMillis) {
        progressSaveRef.current = now;
        contentApi
          .updateProgress(movieId, Math.floor(st.positionMillis / 1000), Math.floor(st.durationMillis / 1000))
          .catch(() => {});
      }
      // Mark completed at 90%
      if (!completedRef.current && st.durationMillis && st.positionMillis / st.durationMillis >= 0.9) {
        completedRef.current = true;
        contentApi.markComplete(movieId).catch(() => {});
      }
    },
    [movieId],
  );

  // Toggle play/pause
  const togglePlay = useCallback(async () => {
    if (!videoRef.current) return;
    Animated.sequence([
      Animated.timing(playBtnScale, { toValue: 0.75, duration: 80, useNativeDriver: true }),
      Animated.spring(playBtnScale, { toValue: 1, useNativeDriver: true, friction: 4, tension: 200 }),
    ]).start();
    if (playing) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
    revealControls();
  }, [playing, revealControls, playBtnScale]);

  // Skip forward/back
  const skipBy = useCallback(
    async (seconds: number) => {
      if (!videoRef.current) return;
      const newPos = Math.max(0, Math.min(dur, pos + seconds * 1000));
      await videoRef.current.setPositionAsync(newPos);
      revealControls();
    },
    [dur, pos, revealControls],
  );

  // Seek bar press
  const seekTo = useCallback(
    (locationX: number) => {
      if (!dur || !videoRef.current || seekBarW <= 1) return;
      const ratio = Math.min(1, Math.max(0, locationX / seekBarW));
      videoRef.current.setPositionAsync(ratio * dur);
      revealControls();
    },
    [dur, seekBarW, revealControls],
  );

  // Double-tap feedback
  const showDoubleTapFeedback = useCallback(
    (side: 'left' | 'right') => {
      setDoubleTapSide(side);
      doubleTapAnim.setValue(1);
      Animated.timing(doubleTapAnim, { toValue: 0, duration: 600, useNativeDriver: true }).start(() =>
        setDoubleTapSide(null),
      );
    },
    [doubleTapAnim],
  );

  // Tap handler (single = toggle controls, double = seek)
  const handleScreenTap = useCallback(
    (locationX: number) => {
      const now = Date.now();
      const side: 'left' | 'right' = locationX < SW / 2 ? 'left' : 'right';

      if (now - lastTapRef.current < DOUBLE_TAP_MS && lastSideRef.current === side) {
        // Double tap
        skipBy(side === 'left' ? -SEEK_SEC : SEEK_SEC);
        showDoubleTapFeedback(side);
        lastTapRef.current = 0;
        lastSideRef.current = null;
      } else {
        lastTapRef.current = now;
        lastSideRef.current = side;
        revealControls();
      }
    },
    [skipBy, revealControls, showDoubleTapFeedback],
  );

  const progress = dur > 0 ? pos / dur : 0;

  if (err) return <ErrorScreen message={err} onBack={() => navigation.goBack()} colors={colors} />;

  return (
    <View style={s.root}>
      <StatusBar hidden />

      {/* Loading screen */}
      {loading && (
        <View style={s.loadingOverlay}>
          <LinearGradient colors={['#0A0A0F', '#12091e', '#0A0A0F']} style={StyleSheet.absoluteFill} />
          <Animated.View
            style={{
              transform: [
                {
                  rotate: loadingRotate.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            }}
          >
            <View style={[s.loadingRing, { borderColor: colors.primary + '30', borderTopColor: colors.primary }]} />
          </Animated.View>
          <Text style={s.loadingTitle} numberOfLines={2}>
            {title}
          </Text>
          <Text style={s.loadingHint}>Tayyorlanmoqda...</Text>
        </View>
      )}

      {/* Video */}
      <TouchableWithoutFeedback onPress={(e) => handleScreenTap(e.nativeEvent.locationX)}>
        <View style={s.fill}>
          <Video
            ref={videoRef}
            source={{ uri: videoUrl }}
            style={s.fill}
            resizeMode={ResizeMode.CONTAIN}
            onPlaybackStatusUpdate={onStatus}
            shouldPlay
            useNativeControls={false}
          />

          {/* Double-tap ripple */}
          {doubleTapSide && (
            <Animated.View
              style={[
                s.dtOverlay,
                doubleTapSide === 'left' ? s.dtLeft : s.dtRight,
                { opacity: doubleTapAnim },
              ]}
            >
              <LinearGradient
                colors={
                  doubleTapSide === 'left'
                    ? ['rgba(255,255,255,0.08)', 'transparent']
                    : ['transparent', 'rgba(255,255,255,0.08)']
                }
                start={{ x: doubleTapSide === 'left' ? 0 : 1, y: 0.5 }}
                end={{ x: doubleTapSide === 'left' ? 1 : 0, y: 0.5 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={s.dtBubble}>
                <Ionicons
                  name={doubleTapSide === 'left' ? 'play-back' : 'play-forward'}
                  size={22}
                  color="#fff"
                />
                <Text style={s.dtText}>{SEEK_SEC} сек</Text>
              </View>
            </Animated.View>
          )}

          {/* Controls overlay */}
          {showControls && (
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: controlsOpacity }]}>
              {/* ─── Top bar ─── */}
              <LinearGradient
                colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.4)', 'transparent']}
                locations={[0, 0.6, 1]}
                style={[s.topGrad, { paddingTop: insets.top + 8 }]}
              >
                <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.7}>
                  <BlurView intensity={30} tint="dark" style={s.backBtnBlur}>
                    <Ionicons name="chevron-back" size={20} color="#fff" />
                  </BlurView>
                </TouchableOpacity>
                <View style={s.titleWrap}>
                  <Text style={s.topTitle} numberOfLines={1}>
                    {title}
                  </Text>
                  {dur > 0 && (
                    <Text style={s.topSubtitle}>
                      {fmtTime(pos)} / {fmtTime(dur)}
                    </Text>
                  )}
                </View>
                <View style={{ width: 40 }} />
              </LinearGradient>

              {/* ─── Center controls ─── */}
              <View style={s.centerWrap}>
                {buffering ? (
                  <ActivityIndicator color="#fff" size="large" />
                ) : (
                  <View style={s.centerRow}>
                    {/* Skip back */}
                    <TouchableOpacity onPress={() => skipBy(-SEEK_SEC)} activeOpacity={0.7}>
                      <View style={s.skipButton}>
                        <Ionicons name="play-back" size={22} color="#fff" />
                        <Text style={s.skipText}>{SEEK_SEC}</Text>
                      </View>
                    </TouchableOpacity>

                    {/* Play/Pause */}
                    <Animated.View style={{ transform: [{ scale: playBtnScale }] }}>
                      <TouchableOpacity onPress={togglePlay} activeOpacity={0.8}>
                        <LinearGradient
                          colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.1)']}
                          style={s.playButton}
                        >
                          <Ionicons
                            name={playing ? 'pause' : 'play'}
                            size={36}
                            color="#fff"
                            style={playing ? undefined : { marginLeft: 4 }}
                          />
                        </LinearGradient>
                      </TouchableOpacity>
                    </Animated.View>

                    {/* Skip forward */}
                    <TouchableOpacity onPress={() => skipBy(SEEK_SEC)} activeOpacity={0.7}>
                      <View style={s.skipButton}>
                        <Ionicons name="play-forward" size={22} color="#fff" />
                        <Text style={s.skipText}>{SEEK_SEC}</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* ─── Bottom bar ─── */}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.9)']}
                locations={[0, 0.4, 1]}
                style={[s.botGrad, { paddingBottom: (insets.bottom || 12) + 12 }]}
              >
                {/* Progress bar */}
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={(e) => seekTo(e.nativeEvent.locationX)}
                  onLayout={(e) => setSeekBarW(e.nativeEvent.layout.width)}
                  style={s.seekArea}
                >
                  {/* Buffer track */}
                  <View style={s.seekTrack} />
                  {/* Filled track */}
                  <View
                    style={[
                      s.seekFilled,
                      { width: `${progress * 100}%` },
                    ]}
                  >
                    <LinearGradient
                      colors={[colors.primary, colors.primaryLight ?? '#9333EA']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFill}
                    />
                  </View>
                  {/* Thumb */}
                  <View
                    style={[
                      s.seekThumb,
                      {
                        left: Math.max(0, progress * seekBarW - 8),
                        backgroundColor: colors.primary,
                      },
                    ]}
                  />
                </TouchableOpacity>

                {/* Time row */}
                <View style={s.timeRow}>
                  <Text style={s.timeCurrent}>{fmtTime(pos)}</Text>
                  <View style={s.timeSpacer} />
                  <Text style={s.timeDuration}>{fmtTime(dur)}</Text>
                </View>
              </LinearGradient>
            </Animated.View>
          )}
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Error Screen
// ═══════════════════════════════════════════════════════════════════════════
function ErrorScreen({
  message,
  onBack,
  colors,
}: {
  message: string;
  onBack: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fadeAnim]);

  return (
    <Animated.View style={[s.root, s.errorRoot, { opacity: fadeAnim }]}>
      <StatusBar hidden />
      <LinearGradient colors={['#1a0a2e', '#0A0A0F']} style={StyleSheet.absoluteFill} />
      <View style={[s.errorIconWrap, { backgroundColor: colors.error + '18' }]}>
        <Ionicons name="alert-circle" size={48} color={colors.error} />
      </View>
      <Text style={s.errorTitle}>Video xatosi</Text>
      <Text style={[s.errorMsg, { color: colors.textMuted }]}>{message}</Text>
      <TouchableOpacity
        style={[s.errorBtn, { backgroundColor: colors.primary }]}
        onPress={onBack}
        activeOpacity={0.8}
      >
        <Ionicons name="arrow-back" size={18} color="#fff" />
        <Text style={s.errorBtnText}>Orqaga qaytish</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════════════════════
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  fill: { flex: 1 },

  // ─── Loading ───
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ytLogoWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,0,0,0.15)',
  },
  loadingRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    marginBottom: 20,
  },
  loadingTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 4,
  },
  loadingHint: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginTop: 8,
  },

  // ─── YouTube back pill ───
  ytBackWrap: {
    position: 'absolute',
    left: 14,
    zIndex: 20,
    borderRadius: 22,
    overflow: 'hidden',
    maxWidth: SW * 0.65,
  },
  ytBackBlur: { borderRadius: 22, overflow: 'hidden' },
  ytBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingLeft: 12,
    paddingRight: 18,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  ytBackText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  // ─── Top bar ───
  topGrad: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 14,
    paddingBottom: 48,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  backBtnBlur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
  },
  titleWrap: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
    marginTop: 4,
  },
  topTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  topSubtitle: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    marginTop: 2,
  },

  // ─── Center controls ───
  centerWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 44,
  },
  skipButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.1)',
    gap: 1,
  },
  skipText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '700',
  },
  playButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },

  // ─── Bottom bar ───
  botGrad: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 18,
    paddingTop: 56,
  },
  seekArea: {
    height: 36,
    justifyContent: 'center',
  },
  seekTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 2,
  },
  seekFilled: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  seekThumb: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    top: 10,
    borderWidth: 2.5,
    borderColor: '#fff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
      },
      android: { elevation: 6 },
    }),
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  timeCurrent: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  timeSpacer: { flex: 1 },
  timeDuration: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
  },

  // ─── Double-tap overlay ───
  dtOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: SW * 0.4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dtLeft: { left: 0 },
  dtRight: { right: 0 },
  dtBubble: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dtText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  // ─── Error screen ───
  errorRoot: { alignItems: 'center', justifyContent: 'center' },
  errorIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  errorTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  errorMsg: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 48,
    marginBottom: 28,
  },
  errorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 28,
  },
  errorBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
