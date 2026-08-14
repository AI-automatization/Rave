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

function formatDuration(secs?: number): string | null {
  if (!secs || secs <= 0) return null;
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
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

  // Fresh cycle-through every time the sheet opens — a stale mode/index from a previous
  // session would otherwise show the wrong candidate (or land straight in the grid).
  useEffect(() => {
    if (visible) {
      setMode('cycle');
      setCycleIndex(0);
      setGridPreviewIndex(0);
      setThumbnails({});
      thumbnailAttempted.current = new Set();
    }
  }, [visible]);

  // Lazy, on entering the grid (not eagerly on load) — generating a thumbnail costs a real
  // network fetch per candidate, not worth paying for candidates the owner never looks at because
  // the first one in cycle mode was already the right one.
  useEffect(() => {
    if (mode !== 'grid' || !candidates) return;
    candidates.forEach((c, i) => {
      if (c.poster || c.type === 'embed' || thumbnailAttempted.current.has(i)) return;
      thumbnailAttempted.current.add(i);
      VideoThumbnails.getThumbnailAsync(c.url, { time: 3000 })
        .then(({ uri }) => setThumbnails((prev) => ({ ...prev, [i]: uri })))
        .catch(() => { /* some candidates (e.g. a DASH manifest with no direct-file byte range,
          or a site that blocks the device's own fetch) just won't thumbnail — falls back to the
          existing placeholder icon, same as a missing server-provided poster already did */ });
    });
  }, [mode, candidates]);

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

  const renderPreview = (candidate: VideoCandidate, secondary: { label: string; icon: IconName; onPress: () => void }) => (
    <View style={styles.previewWrap}>
      <View style={[styles.previewBox, { height: PREVIEW_H }]}>
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
        />
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

  const renderGridItem = ({ item, index }: ListRenderItemInfo<VideoCandidate>) => {
    const duration = formatDuration(item.duration);
    const poster = item.poster ?? thumbnails[index];
    return (
      <TrackedTouchable
        trackId="candidate_picker:grid_select"
        style={styles.gridCard}
        onPress={() => { setGridPreviewIndex(index); setMode('gridPreview'); }}
        activeOpacity={0.8}
      >
        {poster ? (
          <Image source={{ uri: poster }} style={styles.gridThumb} resizeMode="cover" />
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
          renderPreview(cycleCandidate, {
            label: t('watchParty', 'candidateNext'),
            icon: 'play-skip-forward-outline',
            onPress: handleNext,
          })
        ) : mode === 'gridPreview' && gridPreviewCandidate ? (
          renderPreview(gridPreviewCandidate, {
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
