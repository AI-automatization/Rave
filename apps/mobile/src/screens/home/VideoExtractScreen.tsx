// CineSync Mobile — Video Extract Screen
// URL kiritish → backend extract → UniversalPlayer
import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '@theme/index';
import { contentApi, VideoExtractResult } from '@api/content.api';
import { UniversalPlayer, UniversalPlayerRef } from '@components/video/UniversalPlayer';
import type { RootStackParamList, HomeStackParamList } from '@app-types/index';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'VideoExtract'>;
type RootNav = NativeStackNavigationProp<RootStackParamList>;

type State = 'input' | 'loading' | 'error' | 'ready';

const PLATFORM_LABELS: Record<VideoExtractResult['platform'], string> = {
  youtube:    'YouTube',
  vimeo:      'Vimeo',
  tiktok:     'TikTok',
  dailymotion: 'Dailymotion',
  rutube:     'Rutube',
  facebook:   'Facebook',
  instagram:  'Instagram',
  twitch:     'Twitch',
  vk:         'VK Video',
  streamable: 'Streamable',
  reddit:     'Reddit',
  twitter:    'Twitter/X',
  generic:    'Video',
  unknown:    'Video',
};

export function VideoExtractScreen() {
  const navigation = useNavigation<Nav>();
  const rootNav = useNavigation<RootNav>();

  const [url, setUrl] = useState('');
  const [state, setState] = useState<State>('input');
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState<VideoExtractResult | null>(null);
  const playerRef = useRef<UniversalPlayerRef>(null);

  // URL ga qarab player uchun to'g'ri URL tanlash:
  // useProxy=true → YouTube URL → UniversalPlayer YouTube proxy ishlatadi
  // useProxy=false → videoUrl (direct mp4/hls)
  const playerUrl = result
    ? result.useProxy
      ? url
      : result.videoUrl
    : '';

  const handleExtract = useCallback(async () => {
    const trimmed = url.trim();
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      setErrorMsg('URL http:// yoki https:// bilan boshlanishi kerak');
      setState('error');
      return;
    }
    setState('loading');
    setErrorMsg('');
    setResult(null);
    try {
      const extracted = await contentApi.extractVideo(trimmed);
      setResult(extracted);
      setState('ready');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Extraction failed';
      setErrorMsg(msg.includes('Invalid URL')
        ? 'Noto\'g\'ri URL format'
        : msg.includes('Private')
          ? 'Xususiy yoki ichki URL ruxsat etilmagan'
          : 'Video topilmadi. Boshqa URL sinab ko\'ring');
      setState('error');
    }
  }, [url]);

  const handleReset = useCallback(() => {
    setState('input');
    setErrorMsg('');
    setResult(null);
  }, []);

  const handleWatchParty = useCallback(() => {
    rootNav.navigate('Modal', { screen: 'WatchPartyCreate' });
  }, [rootNav]);

  // ─── INPUT ────────────────────────────────────────────────────────────────
  if (state === 'input' || state === 'error') {
    return (
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <StatusBar barStyle="light-content" backgroundColor={colors.bgBase} />

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Video qo'shish</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.inputContent} keyboardShouldPersistTaps="handled">
          <View style={styles.iconRow}>
            <Ionicons name="link" size={40} color={colors.primary} />
          </View>
          <Text style={styles.hint}>
            Istalgan video sayt URL sini kiriting — YouTube, Vimeo, TikTok va boshqalar
          </Text>

          <View style={styles.inputWrap}>
            <Ionicons name="link-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={url}
              onChangeText={setUrl}
              placeholder="https://..."
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              onSubmitEditing={handleExtract}
              returnKeyType="go"
            />
            {url.length > 0 && (
              <TouchableOpacity onPress={() => setUrl('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {state === 'error' && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.extractBtn, !url.trim() && styles.extractBtnDisabled]}
            onPress={handleExtract}
            disabled={!url.trim()}
            activeOpacity={0.8}
          >
            <Ionicons name="search" size={18} color={colors.textPrimary} />
            <Text style={styles.extractBtnText}>Video topish</Text>
          </TouchableOpacity>

          <View style={styles.supportedRow}>
            <Text style={styles.supportedLabel}>Qo'llab-quvvatlanadi:</Text>
            <Text style={styles.supportedList}>
              YouTube · Vimeo · TikTok · Dailymotion · Rutube · Facebook · Instagram · Twitch · VK · va boshqalar
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ─── LOADING ──────────────────────────────────────────────────────────────
  if (state === 'loading') {
    return (
      <View style={[styles.root, styles.center]}>
        <StatusBar barStyle="light-content" backgroundColor={colors.bgBase} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingTitle}>Video tahlil qilinmoqda...</Text>
        <Text style={styles.loadingHint}>Bu 3-30 soniya vaqt olishi mumkin</Text>
      </View>
    );
  }

  // ─── READY ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgVoid} />

      {/* Video Player */}
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

      {/* Video info */}
      <View style={styles.infoBar}>
        <View style={styles.infoLeft}>
          <View style={styles.platformBadge}>
            <Text style={styles.platformText}>{PLATFORM_LABELS[result!.platform]}</Text>
          </View>
          {result!.isLive && (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>JONLI EFIR</Text>
            </View>
          )}
        </View>
        {result!.duration != null && (
          <Text style={styles.duration}>
            {Math.floor(result!.duration / 60)}:{String(result!.duration % 60).padStart(2, '0')}
          </Text>
        )}
      </View>

      <Text style={styles.videoTitle} numberOfLines={2}>
        {result!.title}
      </Text>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtnSecondary} onPress={handleReset}>
          <Ionicons name="link-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.actionBtnSecondaryText}>Boshqa URL</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtnPrimary} onPress={handleWatchParty}>
          <Ionicons name="people" size={18} color={colors.textPrimary} />
          <Text style={styles.actionBtnPrimaryText}>Watch Party</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const PLAYER_HEIGHT = 220;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgBase },
  center: { justifyContent: 'center', alignItems: 'center', gap: spacing.md },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: spacing.xs },
  headerTitle: { ...typography.h3, color: colors.textPrimary },

  // Input state
  inputContent: { padding: spacing.xl, gap: spacing.lg },
  iconRow: { alignItems: 'center', paddingVertical: spacing.xl },
  hint: { ...typography.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputIcon: { marginRight: spacing.sm },
  input: { flex: 1, color: colors.textPrimary, fontSize: 15, paddingVertical: 0 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: `${colors.error}15`,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: `${colors.error}40`,
  },
  errorText: { ...typography.caption, color: colors.error, flex: 1 },
  extractBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
  },
  extractBtnDisabled: { opacity: 0.5 },
  extractBtnText: { ...typography.body, color: colors.textPrimary, fontWeight: '700' },
  supportedRow: { gap: spacing.xs },
  supportedLabel: { ...typography.label, color: colors.textMuted },
  supportedList: { ...typography.caption, color: colors.textMuted, lineHeight: 18 },

  // Loading state
  loadingTitle: { ...typography.h3, color: colors.textPrimary, textAlign: 'center' },
  loadingHint: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },

  // Ready state
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
