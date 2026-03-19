// CineSync Mobile — Video extract ready state: player + info + actions
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { RefObject } from 'react';
import { UniversalPlayer, UniversalPlayerRef } from '@components/video/UniversalPlayer';
import { colors, spacing, borderRadius, typography } from '@theme/index';
import type { VideoExtractResult } from '@api/content.api';
import { PLATFORM_LABELS } from '@hooks/useVideoExtract';

const PLAYER_HEIGHT = 220;

interface Props {
  result: VideoExtractResult;
  playerUrl: string;
  playerRef: RefObject<UniversalPlayerRef | null>;
  onReset: () => void;
  onWatchParty: () => void;
}

export function VideoExtractReady({ result, playerUrl, playerRef, onReset, onWatchParty }: Props) {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgVoid} />

      <View style={styles.playerWrap}>
        <UniversalPlayer
          ref={playerRef}
          url={playerUrl}
          isOwner
          onPlay={() => {}}
          onPause={() => {}}
          onSeek={() => {}}
        />
      </View>

      <View style={styles.infoBar}>
        <View style={styles.infoLeft}>
          <View style={styles.platformBadge}>
            <Text style={styles.platformText}>{PLATFORM_LABELS[result.platform]}</Text>
          </View>
          {result.isLive && (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>JONLI EFIR</Text>
            </View>
          )}
        </View>
        {result.duration != null && (
          <Text style={styles.duration}>
            {Math.floor(result.duration / 60)}:{String(result.duration % 60).padStart(2, '0')}
          </Text>
        )}
      </View>

      <Text style={styles.videoTitle} numberOfLines={2}>
        {result.title}
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtnSecondary} onPress={onReset}>
          <Ionicons name="link-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.actionBtnSecondaryText}>Boshqa URL</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtnPrimary} onPress={onWatchParty}>
          <Ionicons name="people" size={18} color={colors.textPrimary} />
          <Text style={styles.actionBtnPrimaryText}>Watch Party</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgBase },
  playerWrap: { height: PLAYER_HEIGHT, backgroundColor: colors.bgVoid },
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  infoLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  platformBadge: {
    backgroundColor: colors.bgElevated,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  platformText: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.error,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.textPrimary },
  liveText: { ...typography.caption, color: colors.textPrimary, fontWeight: '700' },
  duration: { ...typography.caption, color: colors.textMuted },
  videoTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionBtnSecondaryText: { ...typography.body, color: colors.textSecondary, fontWeight: '600' },
  actionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
  },
  actionBtnPrimaryText: { ...typography.body, color: colors.textPrimary, fontWeight: '700' },
});
