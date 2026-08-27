// WeWatch Mobile — VideoCandidatePicker (T-S190)
// Owner-only: review video candidates the server already collected as a side effect of the
// current CHANGE_MEDIA (see services/watch-party roomEvents.handler.ts) — lets the owner fix
// it when the extractor's anti-ad heuristics picked up the wrong video next to the real one.
// Manual entry only (player's gear-row "Это не то видео" chip) — no auto-trigger on room load.
//
// Two states, modeled after QualityMenu/EpisodeMenu's bottom-sheet pattern:
//   - cycle:  one candidate at a time in a private, non-broadcast preview (UniversalPlayer,
//             no CHANGE_MEDIA emit — the owner is just looking). "Не то, дальше" advances;
//             cycling past the last candidate without confirming falls through to the grid.
//   - grid:   every candidate as a card (thumbnail/poster + duration). Tapping one opens the
//             same private preview, with a "confirm" replacing "next".
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  FlatList,
  Dimensions,
  SafeAreaView,
  Animated,
  ActivityIndicator,
  StyleSheet,
  ListRenderItemInfo,
} from 'react-native';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { Ionicons } from '@expo/vector-icons';
import { TrackedTouchable } from '@components/common/TrackedTouchable';
import { UniversalPlayer, UniversalPlayerRef } from '@components/video/UniversalPlayer';
import { videoStyles as vs } from './VideoSection.styles';
import { useTheme, spacing, borderRadius, typography } from '@theme/index';
import { useT } from '@i18n/index';
import type { VideoCandidate } from '@app-types/index';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface Props {
  visible: boolean;
  /** null = awaiting the server's Redis-backed response (see useWatchParty.requestCandidates);
   * [] = server answered, nothing extra was found. */
  candidates: VideoCandidate[] | null;
  onSelect: (candidate: VideoCandidate) => void;
  onClose: () => void;
}

type Mode = 'cycle' | 'grid' | 'gridPreview';

const SCREEN_W = Dimensions.get('window').width;
const SCREEN_H = Dimensions.get('window').height;
const PREVIEW_H = Math.round(SCREEN_W * (9 / 16));

// Frame carousel shown in the single-candidate preview while the real video isn't playable yet
// (VB-sourced candidates can take a while — see hiddenPlayer note below). Once expo-video reports
// isBuffering:false for the first time, the actual video takes over from these static frames.
const CAROUSEL_TIMES_SEC = [3, 10, 20, 30];
const CAROUSEL_INTERVAL_MS = 1300;

function formatDuration(secs?: number): string | null {
  if (!secs || secs <= 0) return null;
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
}

export function VideoCandidatePicker({ visible, candidates, onSelect, onClose }: Props) {
  const { colors } = useTheme();
  const { t } = useT();
  const previewRef = useRef<UniversalPlayerRef>(null);

  const [mode, setMode] = useState<Mode>('cycle');
  const [cycleIndex, setCycleIndex] = useState(0);
  const [gridPreviewIndex, setGridPreviewIndex] = useState(0);
  // Real prod gap 2026-08-08: VB-sourced candidates never carry a `poster` from the server (web
  // has the same gap, fixed there via a browser <canvas> frame capture — no RN equivalent exists,
  // no <canvas>/HTMLVideoElement here). expo-video-thumbnails generates a real frame directly from
  // the candidate's own URL instead — same "actual video content, not a placeholder" result, just
  // a native-appropriate way to get it. Keyed by index, cached for the life of this sheet.
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});
  const thumbnailAttempted = useRef<Set<number>>(new Set());
  // Server never sends duration for mp4 candidates (only hls/dash, parsed from the manifest) —
  // by design, the client is expected to read it off the actually-playing element instead (see
  // vbSession.helper.ts). Mirrors web's onCapture: once a candidate is previewed, its real
  // duration lands here and wins over the (usually absent) server-provided one.
  const [capturedDurations, setCapturedDurations] = useState<Record<number, number>>({});
  // Multi-frame carousel for the single-candidate preview (cycle/gridPreview only — grid cards
  // keep their single `thumbnails` frame above). Populated progressively as each of
  // CAROUSEL_TIMES_SEC resolves, so the carousel can start cycling before all 4 are in.
  const [previewFrames, setPreviewFrames] = useState<Record<number, string[]>>({});
  const previewFramesAttempted = useRef<Set<number>>(new Set());
  const [frameCycleIdx, setFrameCycleIdx] = useState(0);
  // True once the hidden player for this candidate has reported isBuffering:false at least
  // once — i.e. it's actually playable, not just "started loading". Flips the preview from the
  // static frame carousel to the live player itself.
  const [liveReady, setLiveReady] = useState<Record<number, boolean>>({});
  // Real prod bug 2026-08-25: a poster/thumbnail URI can go dead (the VB session backing it
  // already ended by the time the owner gets around to looking, after cycling through several
  // candidates) — RN's <Image> has no built-in fallback, a broken URI just renders blank, not
  // an error state or the placeholder icon. Track failed URIs and treat them as absent below.
  const [failedUris, setFailedUris] = useState<Set<string>>(new Set());
  const markUriFailed = useCallback((uri: string | undefined) => {
    if (!uri) return;
    setFailedUris((prev) => (prev.has(uri) ? prev : new Set(prev).add(uri)));
  }, []);

  // Real feedback 2026-08-25: closing and reopening this sheet (same VB session, same
  // candidates) forced every thumbnail/frame to refetch from scratch — the owner had already
  // waited once and had to wait again for data that was still perfectly valid. Only wipe the
  // fetched-data caches when the candidate LIST itself actually changed (new VB session); always
  // reset navigation (mode/index) on open regardless, since landing on a stale mode/index from a
  // previous, different session is a real bug this same effect used to guard against.
  const candidatesSignatureRef = useRef<string>('');
  useEffect(() => {
    if (visible) {
      setMode('cycle');
      setCycleIndex(0);
      setGridPreviewIndex(0);
      setFrameCycleIdx(0);
      const signature = candidates?.map((c) => c.url).join('|') ?? '';
      if (signature !== candidatesSignatureRef.current) {
        candidatesSignatureRef.current = signature;
        setThumbnails({});
        setFailedUris(new Set());
        thumbnailAttempted.current = new Set();
        setCapturedDurations({});
        setPreviewFrames({});
        previewFramesAttempted.current = new Set();
        setLiveReady({});
      }
    }
  }, [visible, candidates]);

  // Lazy — generating a thumbnail costs a real network fetch per candidate, not worth paying for
  // ones the owner never looks at. Originally grid-only; 2026-08-23 extended to cycle/gridPreview
  // too, since those single-candidate views now show this same static frame instead of a live
  // player (see renderPreview below — live playback in this sheet turned out to be exactly as
  // unreliable as everything else about these slow VB-sourced candidates, and a stalled black
  // rectangle told the owner nothing useful while they're just trying to confirm "is this the
  // right video"). Grid still does all candidates at once; cycle/gridPreview do just the one
  // currently on screen.
  useEffect(() => {
    // 2026-08-23 real bug: auto-opened picker (VB's "media_found" flow — see useVirtualBrowser.ts)
    // showed black on the FIRST open but worked fine on a manual reopen right after. Root cause —
    // `visible` wasn't a dependency here. mode/cycleIndex/gridPreviewIndex are already at their
    // useState-declared defaults ('cycle'/0/0) the very first time this sheet ever opens in a
    // room, so the reset effect above's setMode('cycle')/setCycleIndex(0)/setGridPreviewIndex(0)
    // are no-op state updates (same value as before) — nothing in THIS effect's old dependency
    // list necessarily changed at the exact moment the sheet actually became visible, so the
    // fetch could end up scheduled before `visible` flips, racing the thumbnail against the
    // modal's own mount. A manual reopen right after always worked because by then something
    // (mode/index) really had changed at least once. Depending on `visible` directly removes the
    // race — it always re-evaluates right when the sheet is shown, not just when some other value
    // happens to differ from its already-current default.
    if (!visible || !candidates) return;
    const indices = mode === 'grid'
      ? candidates.map((_, i) => i)
      : mode === 'cycle' ? [cycleIndex] : [gridPreviewIndex];
    indices.forEach((i) => {
      const c = candidates[i];
      if (!c || c.poster || c.type === 'embed' || thumbnailAttempted.current.has(i)) return;
      thumbnailAttempted.current.add(i);
      VideoThumbnails.getThumbnailAsync(c.url, { time: 3000 })
        .then(({ uri }) => setThumbnails((prev) => ({ ...prev, [i]: uri })))
        .catch((e: unknown) => {
          // Some candidates (e.g. a DASH manifest with no direct-file byte range, or a site that
          // blocks the device's own fetch) just won't thumbnail — falls back to the existing
          // placeholder icon, same as a missing server-provided poster already did. Logged
          // (dev-only, per CLAUDE.md) rather than fully silent — 2026-08-26 live report ("вижу
          // только один кадр из нескольких") had no client-side trail at all to confirm which
          // candidate failed or why, only a structural guess from reading the code.
          if (__DEV__) console.log('[VideoCandidatePicker] thumbnail failed', { index: i, url: c.url.slice(0, 120), error: e instanceof Error ? e.message : String(e) });
        });
    });
  }, [visible, mode, candidates, cycleIndex, gridPreviewIndex]);

  // Multi-frame carousel source — only for the single-candidate preview (cycle/gridPreview),
  // and only the one candidate currently on screen. Same rationale as the effect above for not
  // doing this for every candidate up front (real network fetch each).
  useEffect(() => {
    if (!visible || !candidates) return;
    if (mode !== 'cycle' && mode !== 'gridPreview') return;
    const index = mode === 'cycle' ? cycleIndex : gridPreviewIndex;
    const c = candidates[index];
    if (!c || c.type === 'embed' || previewFramesAttempted.current.has(index)) return;
    previewFramesAttempted.current.add(index);
    CAROUSEL_TIMES_SEC.forEach((t) => {
      VideoThumbnails.getThumbnailAsync(c.url, { time: t * 1000 })
        .then(({ uri }) => setPreviewFrames((prev) => ({ ...prev, [index]: [...(prev[index] ?? []), uri] })))
        .catch(() => { /* that timestamp just doesn't exist / isn't reachable for this candidate —
          whatever frames DID resolve still carousel fine, this one's simply skipped */ });
    });
  }, [visible, mode, candidates, cycleIndex, gridPreviewIndex]);

  // Cycles frameCycleIdx through whatever frames have resolved so far for the candidate on
  // screen. Stops once liveReady flips (real video takes over) or the sheet closes.
  useEffect(() => {
    setFrameCycleIdx(0);
    if (!visible || (mode !== 'cycle' && mode !== 'gridPreview')) return;
    const index = mode === 'cycle' ? cycleIndex : gridPreviewIndex;
    if (liveReady[index]) return;
    const frames = previewFrames[index];
    if (!frames || frames.length < 2) return;
    const id = setInterval(() => {
      setFrameCycleIdx((i) => (i + 1) % frames.length);
    }, CAROUSEL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [visible, mode, cycleIndex, gridPreviewIndex, previewFrames, liveReady]);

  // Loading badge pulse — same animation as VideoSection's "waiting for the video" overlay,
  // reused here for the equivalent "waiting for the candidates list" moment.
  const pulseAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!visible) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1100, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1100, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [visible, pulseAnim]);
  const pulseScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });
  const pulseOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0.15] });

  const handleConfirm = useCallback((candidate: VideoCandidate) => {
    onSelect(candidate);
    onClose();
  }, [onSelect, onClose]);

  const handleNext = useCallback(() => {
    if (!candidates) return;
    // Cycled past the last one without confirming — fall back to the grid instead of wrapping.
    if (cycleIndex >= candidates.length - 1) { setMode('grid'); return; }
    setCycleIndex((i) => i + 1);
  }, [candidates, cycleIndex]);

  const renderPreview = (candidate: VideoCandidate, index: number, secondary: { label: string; icon: IconName; onPress: () => void }) => {
    const frames = previewFrames[index];
    const carouselFrame = frames?.[frameCycleIdx % frames.length];
    const rawPoster = carouselFrame ?? candidate.poster ?? thumbnails[index];
    const poster = rawPoster && !failedUris.has(rawPoster) ? rawPoster : undefined;
    const isLive = !!liveReady[index];
    return (
    <View style={styles.previewWrap}>
      <View style={[styles.previewBox, { height: PREVIEW_H }]}>
        {!isLive && (poster ? (
          <Image source={{ uri: poster }} style={styles.previewThumb} resizeMode="cover" onError={() => markUriFailed(poster)} />
        ) : (
          <View style={[styles.previewThumb, styles.gridThumbPlaceholder]}>
            <ActivityIndicator size="small" color="rgba(255,255,255,0.5)" />
          </View>
        ))}
        {/* Live playback in this sheet used to be unconditionally unreliable for these slow
            VB-sourced candidates — a black rectangle stuck loading told the owner nothing while
            confirming "is this the right video". 2026-08-23: default view became the static frame
            carousel above (same expo-video-thumbnails path grid already used). This player stays
            mounted throughout — invisible while buffering, promoted to visible (styles.livePlayer)
            the first time expo-video reports isBuffering:false, i.e. once it's actually smooth
            enough to watch. Also still the source of the real duration via onProgress (server
            never sends it for mp4 — see vbSession.helper.ts). */}
        <View style={isLive ? styles.livePlayer : styles.hiddenPlayer} pointerEvents="none">
          <UniversalPlayer
            // Re-mount per candidate — a shared ref across different URLs would carry over
            // expo-video's internal source state instead of loading the new one cleanly.
            key={candidate.url}
            ref={previewRef}
            url={candidate.url}
            extractedType={candidate.type === 'embed' ? undefined : candidate.type}
            isOwner
            onPlay={() => {}}
            onPause={() => {}}
            onSeek={() => {}}
            onReady={() => { void previewRef.current?.play(); }}
            onProgress={(currentTimeSecs, durationSecs) => {
              if (durationSecs > 0) {
                setCapturedDurations((prev) => (prev[index] ? prev : { ...prev, [index]: durationSecs }));
              }
              // Real prod bug 2026-08-24: using status.isBuffering:false alone flipped this to
              // "live" on the very first status tick — right when metadata loads, before any
              // frame has actually been decoded — producing an instant black rectangle instead
              // of the intended carousel-then-video handoff. currentTimeSecs actually advancing
              // means expo-video is genuinely decoding and displaying frames, not just "ready to
              // start" — a much stronger readiness signal.
              if (currentTimeSecs > 0.15) {
                setLiveReady((prev) => (prev[index] ? prev : { ...prev, [index]: true }));
              }
            }}
          />
        </View>
        {(() => {
          const dur = formatDuration(capturedDurations[index] ?? candidate.duration);
          return dur ? (
            <View style={styles.previewDurationBadge}>
              <Text style={styles.gridDurationText}>{dur}</Text>
            </View>
          ) : null;
        })()}
      </View>
      <View style={styles.previewActions}>
        <TrackedTouchable trackId="candidate_picker:secondary" style={styles.secondaryBtn} onPress={secondary.onPress} activeOpacity={0.8}>
          <Ionicons name={secondary.icon} size={16} color="rgba(255,255,255,0.85)" />
          <Text style={styles.secondaryBtnText}>{secondary.label}</Text>
        </TrackedTouchable>
        <TrackedTouchable trackId="candidate_picker:confirm" style={styles.confirmBtn} onPress={() => handleConfirm(candidate)} activeOpacity={0.85}>
          <Ionicons name="checkmark-circle" size={18} color="#fff" />
          <Text style={styles.confirmBtnText}>{t('watchParty', 'candidateConfirm')}</Text>
        </TrackedTouchable>
      </View>
    </View>
    );
  };

  const renderGridItem = ({ item, index }: ListRenderItemInfo<VideoCandidate>) => {
    const duration = formatDuration(capturedDurations[index] ?? item.duration);
    // Real feedback 2026-08-25: grid showed bare placeholder icons even for candidates the owner
    // had ALREADY cycled through (and whose frames genuinely loaded) — thumbnails[index] is a
    // separate fetch from the carousel frames cycle mode already collected in previewFrames, and
    // by grid time the plain thumbnail fetch often hadn't resolved yet even though carousel
    // frames had. Fall back to whatever carousel frame is already in hand instead of re-showing
    // an empty placeholder for data that's sitting right there.
    const rawPoster = item.poster ?? thumbnails[index] ?? previewFrames[index]?.[0];
    const poster = rawPoster && !failedUris.has(rawPoster) ? rawPoster : undefined;
    return (
      <TrackedTouchable
        trackId="candidate_picker:grid_select"
        style={styles.gridCard}
        onPress={() => { setGridPreviewIndex(index); setMode('gridPreview'); }}
        activeOpacity={0.8}
      >
        {poster ? (
          <Image source={{ uri: poster }} style={styles.gridThumb} resizeMode="cover" onError={() => markUriFailed(poster)} />
        ) : (
          <View style={[styles.gridThumb, styles.gridThumbPlaceholder]}>
            <Ionicons name="film-outline" size={22} color="rgba(255,255,255,0.3)" />
          </View>
        )}
        {duration && (
          <View style={styles.gridDurationBadge}>
            <Text style={styles.gridDurationText}>{duration}</Text>
          </View>
        )}
      </TrackedTouchable>
    );
  };

  const cycleCandidate = mode === 'cycle' ? candidates?.[cycleIndex] : undefined;
  const gridPreviewCandidate = mode === 'gridPreview' ? candidates?.[gridPreviewIndex] : undefined;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <TrackedTouchable trackId="candidate_picker:backdrop_close" style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <SafeAreaView style={[styles.sheet, { backgroundColor: colors.bgElevated }]} pointerEvents="box-none">
        <View style={[styles.handle, { backgroundColor: colors.bgMuted }]} />
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {mode === 'grid' ? t('watchParty', 'candidatesGridTitle') : t('watchParty', 'candidatesTitle')}
            {/* Real feedback 2026-08-25: cycle mode had no indication of which candidate is on
                screen or whether "не то видео" actually advanced — owner couldn't tell if a tap
                did anything. A plain position counter answers both at once. */}
            {mode === 'cycle' && candidates && candidates.length > 0 ? ` (${cycleIndex + 1}/${candidates.length})` : null}
          </Text>
          <TrackedTouchable trackId="candidate_picker:close" onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={22} color={colors.textMuted} />
          </TrackedTouchable>
        </View>

        {candidates === null ? (
          <View style={styles.loadingWrap}>
            <View style={vs.loadingIconWrap}>
              <Animated.View style={[vs.loadingGlow, { transform: [{ scale: pulseScale }], opacity: pulseOpacity }]} />
              <Ionicons name="film-outline" size={26} color={colors.primary} />
            </View>
            <Text style={vs.loadingTitle}>{t('watchParty', 'candidatesLoading')}</Text>
            <ActivityIndicator size="small" color="rgba(255,255,255,0.5)" />
          </View>
        ) : candidates.length === 0 ? (
          <View style={styles.loadingWrap}>
            <Ionicons name="film-outline" size={32} color="rgba(255,255,255,0.25)" />
            <Text style={styles.emptyText}>{t('watchParty', 'candidatesEmpty')}</Text>
          </View>
        ) : mode === 'cycle' && cycleCandidate ? (
          renderPreview(cycleCandidate, cycleIndex, {
            label: t('watchParty', 'candidateNext'),
            icon: 'play-skip-forward-outline',
            onPress: handleNext,
          })
        ) : mode === 'gridPreview' && gridPreviewCandidate ? (
          renderPreview(gridPreviewCandidate, gridPreviewIndex, {
            label: t('common', 'back'),
            icon: 'arrow-back-outline',
            onPress: () => setMode('grid'),
          })
        ) : (
          <FlatList
            data={candidates}
            keyExtractor={(item, i) => `${item.url}-${i}`}
            renderItem={renderGridItem}
            numColumns={2}
            columnWrapperStyle={styles.gridRow}
            style={styles.grid}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const GRID_CARD_W = (SCREEN_W - spacing.lg * 2 - 10) / 2;

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    maxHeight: SCREEN_H * 0.85,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: borderRadius.full,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
    borderBottomWidth: 0.5,
  },
  title: { ...typography.h3 },

  loadingWrap: {
    height: PREVIEW_H,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  emptyText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },

  previewWrap: { gap: spacing.md, marginTop: spacing.sm },
  previewBox: {
    width: '100%',
    backgroundColor: '#000',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  previewThumb: { width: '100%', height: '100%' },
  // Mounted purely to capture duration via onProgress (see renderPreview) — never meant to be
  // seen, so it's sized like the real preview but pinned invisible rather than removed, avoiding
  // a remount (and re-fetch) every time the owner flips back to a candidate they already visited.
  hiddenPlayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0 },
  livePlayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 1 },
  previewDurationBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.72)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  previewActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 13,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  secondaryBtnText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
  confirmBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 13,
    borderRadius: borderRadius.md,
    backgroundColor: '#7B72F8',
    shadowColor: '#7B72F8',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
  },
  confirmBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  grid: { marginTop: spacing.sm },
  gridRow: { gap: 10, marginBottom: 10 },
  gridCard: {
    width: GRID_CARD_W,
    aspectRatio: 16 / 9,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  gridThumb: { width: '100%', height: '100%' },
  gridThumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  gridDurationBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.72)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  gridDurationText: { fontSize: 10, fontWeight: '700', color: '#fff' },
});
