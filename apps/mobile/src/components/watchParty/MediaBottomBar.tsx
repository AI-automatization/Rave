// WeWatch — MediaBottomBar: one always-available "open room" action
// T-S189: user doesn't care whether detection succeeded — the whole flow they expect is
// enter -> pick a site -> pick a video -> it plays. Previously this bar showed different
// non-actionable states (analyzing/hint/bot-protected) and only had a working button once
// detection succeeded — if it never did, there was no path forward at all. Now there is
// always exactly one button: uses the confirmed detectedMedia when available (fast path,
// no server round-trip needed to know it's good), otherwise falls back to the raw current
// page URL and lets the room's own extraction + Virtual Browser fallback handle it.
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TrackedTouchable } from '@components/common/TrackedTouchable';
import { colors, spacing, borderRadius } from '@theme/index';
import { useT } from '@i18n/index';
import type { RoomMedia } from '@utils/mediaDetector';

interface Props {
  detectedMedia: RoomMedia | null;
  isImporting: boolean;
  paddingBottom: number;
  barTranslateY: Animated.AnimatedInterpolation<number>;
  onImport: (media: RoomMedia) => void;
  onTryCurrentPage: () => void;
}

export function MediaBottomBar({
  detectedMedia, isImporting, paddingBottom, barTranslateY, onImport, onTryCurrentPage,
}: Props) {
  const { t } = useT();

  return (
    <Animated.View style={[s.bar, { transform: [{ translateY: barTranslateY }], paddingBottom: paddingBottom || spacing.md }]}>
      <View style={s.left}>
        <Ionicons name="play-circle" size={22} color={colors.primary} />
        <Text style={s.title} numberOfLines={1}>
          {detectedMedia?.videoTitle || t('watchParty', 'mediaDetected')}
        </Text>
      </View>
      <TrackedTouchable
        trackId="media_bottom_bar:start_watch_party"
        style={[s.btn, isImporting && s.btnDisabled]}
        onPress={() => (detectedMedia ? onImport(detectedMedia) : onTryCurrentPage())}
        disabled={isImporting} activeOpacity={0.8}
      >
        {isImporting ? <ActivityIndicator size="small" color="#fff" /> : (
          <>
            <Ionicons name="tv-outline" size={16} color="#fff" />
            <Text style={s.btnText}>Watch Party</Text>
          </>
        )}
      </TrackedTouchable>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  bar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#111118', borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.12)',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingTop: spacing.md, gap: spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 12,
  },
  left: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minWidth: 0 },
  title: { flex: 1, fontSize: 13, fontWeight: '600', color: '#fff' },
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.primary, paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm, borderRadius: borderRadius.md,
    minWidth: 110, justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
