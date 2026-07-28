// WeWatch — MediaBottomBar: video found, analyzing, bot-protection, and hint states
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TrackedTouchable } from '@components/common/TrackedTouchable';
import { colors, spacing, borderRadius } from '@theme/index';
import { useT } from '@i18n/index';
import type { RoomMedia } from '@utils/mediaDetector';
import { getSourceHint } from '@utils/webViewScripts';

interface Props {
  detectedMedia: RoomMedia | null;
  isBackendExtracting: boolean;
  isBotProtected: boolean;
  isLoading: boolean;
  isImporting: boolean;
  sourceId: string;
  paddingBottom: number;
  barTranslateY: Animated.AnimatedInterpolation<number>;
  onImport: (media: RoomMedia) => void;
  // T-S189: neither client JS detection nor server extraction found a video (cross-origin
  // iframe, unsupported player, bot-protected page) — before this, the user had NO path to
  // create a room at all in that case. This lets them force it with the raw current page URL;
  // the room's own extraction+Virtual Browser fallback (same pipeline web already has) takes
  // over from there instead of requiring client-side detection to succeed first.
  onTryCurrentPage: () => void;
}

export function MediaBottomBar({
  detectedMedia, isBackendExtracting, isBotProtected, isLoading,
  isImporting, sourceId, paddingBottom, barTranslateY, onImport, onTryCurrentPage,
}: Props) {
  const { t } = useT();
  const pb = { paddingBottom: paddingBottom || spacing.sm };

  if (detectedMedia) {
    return (
      <Animated.View style={[s.videoBar, { transform: [{ translateY: barTranslateY }], paddingBottom: paddingBottom || spacing.md }]}>
        <View style={s.videoBarLeft}>
          <Ionicons name="play-circle" size={22} color={colors.primary} />
          <Text style={s.videoBarTitle} numberOfLines={1}>{detectedMedia.videoTitle || t('watchParty', 'mediaDetected')}</Text>
        </View>
        <TrackedTouchable
          trackId="media_bottom_bar:start_watch_party"
          style={[s.videoBarBtn, isImporting && s.videoBarBtnDisabled]}
          onPress={() => onImport(detectedMedia)} disabled={isImporting} activeOpacity={0.8}
        >
          {isImporting ? <ActivityIndicator size="small" color="#fff" /> : (
            <>
              <Ionicons name="tv-outline" size={16} color="#fff" />
              <Text style={s.videoBarBtnText}>Watch Party</Text>
            </>
          )}
        </TrackedTouchable>
      </Animated.View>
    );
  }

  if (!isLoading && isBackendExtracting) {
    return (
      <View style={[s.hintBar, pb]}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={s.hintText}>{t('watchParty', 'videoAnalyzing')}</Text>
      </View>
    );
  }

  if (isBotProtected) {
    return (
      <View style={[s.hintBar, s.hintBarWarning, pb]}>
        <Ionicons name="shield-outline" size={15} color="#F59E0B" />
        <Text style={[s.hintText, s.hintTextWarning]} numberOfLines={3}>
          Сайт показал защиту (reCAPTCHA / DDoS-Guard). Google не работает в встроенном браузере — используйте поиск Yandex или другой источник.
        </Text>
        <TryBtn onPress={onTryCurrentPage} disabled={isImporting} isImporting={isImporting} />
      </View>
    );
  }

  if (!isLoading && !isBackendExtracting) {
    return (
      <View style={[s.hintBar, pb]}>
        <Ionicons name="search-outline" size={15} color="#6B7280" />
        <Text style={s.hintText} numberOfLines={2}>{getSourceHint(sourceId)}</Text>
        <TryBtn onPress={onTryCurrentPage} disabled={isImporting} isImporting={isImporting} />
      </View>
    );
  }

  return null;
}

// T-S189: same action from both "no signal" hint states — creates the room with the raw
// current page URL, no client/server detection required first. Kept small (icon-first, no
// label) so it fits next to hint text without crowding a 2-3 line warning.
function TryBtn({ onPress, disabled, isImporting }: { onPress: () => void; disabled: boolean; isImporting: boolean }) {
  const { t } = useT();
  return (
    <TrackedTouchable
      trackId="media_bottom_bar:try_current_page"
      style={[s.tryBtn, disabled && s.videoBarBtnDisabled]}
      onPress={onPress} disabled={disabled} activeOpacity={0.8}
    >
      {isImporting
        ? <ActivityIndicator size="small" color={colors.primary} />
        : <Ionicons name="play-forward-outline" size={16} color={colors.primary} />}
      <Text style={s.tryBtnText} numberOfLines={1}>{t('watchParty', 'tryCurrentPage')}</Text>
    </TrackedTouchable>
  );
}

const s = StyleSheet.create({
  hintBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingHorizontal: spacing.md, paddingTop: spacing.sm,
    backgroundColor: 'rgba(17,17,24,0.92)',
    borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.06)',
  },
  hintText: { flex: 1, fontSize: 12, color: '#6B7280', lineHeight: 17 },
  hintBarWarning: { borderTopColor: 'rgba(245,158,11,0.2)' },
  hintTextWarning: { color: '#F59E0B' },
  videoBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#111118', borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.12)',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingTop: spacing.md, gap: spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 12,
  },
  videoBarLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minWidth: 0 },
  videoBarTitle: { flex: 1, fontSize: 13, fontWeight: '600', color: '#fff' },
  videoBarBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.primary, paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm, borderRadius: borderRadius.md,
    minWidth: 110, justifyContent: 'center',
  },
  videoBarBtnDisabled: { opacity: 0.6 },
  videoBarBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  tryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0,
    paddingHorizontal: spacing.sm, paddingVertical: 6,
    borderRadius: borderRadius.md, borderWidth: 1, borderColor: 'rgba(124,58,237,0.35)',
    backgroundColor: 'rgba(124,58,237,0.1)',
  },
  tryBtnText: { color: colors.primary, fontWeight: '600', fontSize: 11 },
});
