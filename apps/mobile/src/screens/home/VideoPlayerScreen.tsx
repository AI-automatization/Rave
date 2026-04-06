// CineSync Mobile — Video Player Screen
// YouTube → m.youtube.com WebView | Direct → expo-av + custom controls
import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, StatusBar, Dimensions,
  TouchableOpacity, TouchableWithoutFeedback, ActivityIndicator, Animated,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import WebView from 'react-native-webview';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { HomeStackParamList } from '@app-types/index';
import { useTheme } from '@theme/index';
import { useVideoPlayer } from '@hooks/useVideoPlayer';
import { YOUTUBE_RE, MOBILE_UA, getYouTubeMobileUrl, fmtTime, SEEK_SEC } from '@utils/videoPlayer';
import { s } from './VideoPlayerScreen.styles';

type Props = NativeStackScreenProps<HomeStackParamList, 'VideoPlayer'>;
const { width: SW } = Dimensions.get('window');

// ─── Main Router ──────────────────────────────────────────────────────────────
export function VideoPlayerScreen({ route, navigation }: Props) {
  const { movieId, videoUrl, title } = route.params;
  if (YOUTUBE_RE.test(videoUrl)) {
    return <YouTubePlayer url={videoUrl} title={title} navigation={navigation} />;
  }
  return <DirectPlayer movieId={movieId} videoUrl={videoUrl} title={title} navigation={navigation} />;
}

// ─── YouTube Player ───────────────────────────────────────────────────────────
function YouTubePlayer({
  url, title, navigation,
}: { url: string; title: string; navigation: Props['navigation'] }) {
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
        source={{ uri: mobileUrl }} style={s.fill}
        javaScriptEnabled domStorageEnabled allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false} allowsFullscreenVideo userAgent={MOBILE_UA}
        onLoadEnd={() => setLoading(false)}
        onError={() => { setLoading(false); setError(true); }}
        onHttpError={({ nativeEvent }) => {
          if (nativeEvent.statusCode >= 400) { setLoading(false); setError(true); }
        }}
        onShouldStartLoadWithRequest={(req) =>
          ['http', 'https', 'blob', 'data'].includes(req.url.split(':')[0].toLowerCase())
        }
      />
      {loading && (
        <View style={s.loadingOverlay}>
          <LinearGradient colors={['#0A0A0F', '#1a0a2e', '#0A0A0F']} style={StyleSheet.absoluteFill} />
          <View style={s.ytLogoWrap}><Ionicons name="logo-youtube" size={52} color="#FF0000" /></View>
          <Text style={s.loadingTitle} numberOfLines={2}>{title}</Text>
          <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 16 }} />
          <Text style={s.loadingHint}>Yuklanmoqda...</Text>
        </View>
      )}
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

// ─── Direct Player ────────────────────────────────────────────────────────────
function DirectPlayer({
  movieId, videoUrl, title, navigation,
}: { movieId: string; videoUrl: string; title: string; navigation: Props['navigation'] }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const {
    videoRef, playing, pos, dur, showControls, buffering, err, loading,
    seekBarW, setSeekBarW, doubleTapSide, progress,
    controlsOpacity, playBtnScale, doubleTapAnim, loadingRotate,
    onStatus, togglePlay, skipBy, seekTo, handleScreenTap,
  } = useVideoPlayer(movieId);

  if (err) return <ErrorScreen message={err} onBack={() => navigation.goBack()} colors={colors} />;

  return (
    <View style={s.root}>
      <StatusBar hidden />

      {loading && (
        <View style={s.loadingOverlay}>
          <LinearGradient colors={['#0A0A0F', '#12091e', '#0A0A0F']} style={StyleSheet.absoluteFill} />
          <Animated.View style={{ transform: [{ rotate: loadingRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }}>
            <View style={[s.loadingRing, { borderColor: colors.primary + '30', borderTopColor: colors.primary }]} />
          </Animated.View>
          <Text style={s.loadingTitle} numberOfLines={2}>{title}</Text>
          <Text style={s.loadingHint}>Tayyorlanmoqda...</Text>
        </View>
      )}

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

          {doubleTapSide && (
            <Animated.View style={[s.dtOverlay, doubleTapSide === 'left' ? s.dtLeft : s.dtRight, { opacity: doubleTapAnim }]}>
              <LinearGradient
                colors={doubleTapSide === 'left' ? ['rgba(255,255,255,0.08)', 'transparent'] : ['transparent', 'rgba(255,255,255,0.08)']}
                start={{ x: doubleTapSide === 'left' ? 0 : 1, y: 0.5 }}
                end={{ x: doubleTapSide === 'left' ? 1 : 0, y: 0.5 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={s.dtBubble}>
                <Ionicons name={doubleTapSide === 'left' ? 'play-back' : 'play-forward'} size={22} color="#fff" />
                <Text style={s.dtText}>{SEEK_SEC} сек</Text>
              </View>
            </Animated.View>
          )}

          {showControls && (
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: controlsOpacity }]}>
              {/* Top bar */}
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
                  <Text style={s.topTitle} numberOfLines={1}>{title}</Text>
                  {dur > 0 && <Text style={s.topSubtitle}>{fmtTime(pos)} / {fmtTime(dur)}</Text>}
                </View>
                <View style={{ width: 40 }} />
              </LinearGradient>

              {/* Center play/pause/skip */}
              <View style={s.centerWrap}>
                {buffering ? (
                  <ActivityIndicator color="#fff" size="large" />
                ) : (
                  <View style={s.centerRow}>
                    <TouchableOpacity onPress={() => skipBy(-SEEK_SEC)} activeOpacity={0.7}>
                      <View style={s.skipButton}>
                        <Ionicons name="play-back" size={22} color="#fff" />
                        <Text style={s.skipText}>{SEEK_SEC}</Text>
                      </View>
                    </TouchableOpacity>
                    <Animated.View style={{ transform: [{ scale: playBtnScale }] }}>
                      <TouchableOpacity onPress={togglePlay} activeOpacity={0.8}>
                        <LinearGradient colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.1)']} style={s.playButton}>
                          <Ionicons name={playing ? 'pause' : 'play'} size={36} color="#fff" style={playing ? undefined : { marginLeft: 4 }} />
                        </LinearGradient>
                      </TouchableOpacity>
                    </Animated.View>
                    <TouchableOpacity onPress={() => skipBy(SEEK_SEC)} activeOpacity={0.7}>
                      <View style={s.skipButton}>
                        <Ionicons name="play-forward" size={22} color="#fff" />
                        <Text style={s.skipText}>{SEEK_SEC}</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Bottom seek bar */}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.9)']}
                locations={[0, 0.4, 1]}
                style={[s.botGrad, { paddingBottom: (insets.bottom || 12) + 12 }]}
              >
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={(e) => seekTo(e.nativeEvent.locationX)}
                  onLayout={(e) => setSeekBarW(e.nativeEvent.layout.width)}
                  style={s.seekArea}
                >
                  <View style={s.seekTrack} />
                  <View style={[s.seekFilled, { width: `${progress * 100}%` }]}>
                    <LinearGradient
                      colors={[colors.primary, colors.primaryLight ?? '#9333EA']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFill}
                    />
                  </View>
                  <View style={[s.seekThumb, { left: Math.max(0, progress * seekBarW - 8), backgroundColor: colors.primary }]} />
                </TouchableOpacity>
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

// ─── Error Screen ─────────────────────────────────────────────────────────────
function ErrorScreen({
  message, onBack, colors,
}: { message: string; onBack: () => void; colors: ReturnType<typeof useTheme>['colors'] }) {
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
      <TouchableOpacity style={[s.errorBtn, { backgroundColor: colors.primary }]} onPress={onBack} activeOpacity={0.8}>
        <Ionicons name="arrow-back" size={18} color="#fff" />
        <Text style={s.errorBtnText}>Orqaga qaytish</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

