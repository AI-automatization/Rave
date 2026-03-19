// CineSync Mobile — Video Extract Screen
import React, { useRef } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { UniversalPlayerRef } from '@components/video/UniversalPlayer';
import { VideoExtractInput } from '@components/home/VideoExtractInput';
import { VideoExtractReady } from '@components/home/VideoExtractReady';
import { useVideoExtract } from '@hooks/useVideoExtract';
import { colors, spacing, typography } from '@theme/index';
import type { HomeStackParamList } from '@app-types/index';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'VideoExtract'>;

export function VideoExtractScreen() {
  const navigation = useNavigation<Nav>();
  const playerRef = useRef<UniversalPlayerRef>(null);
  const {
    url, setUrl, state, errorMsg, result, playerUrl,
    handleExtract, handleReset, handleWatchParty,
  } = useVideoExtract();

  if (state === 'input' || state === 'error') {
    return (
      <VideoExtractInput
        url={url}
        setUrl={setUrl}
        state={state}
        errorMsg={errorMsg}
        onExtract={handleExtract}
        onBack={() => navigation.goBack()}
      />
    );
  }

  if (state === 'loading') {
    return (
      <View style={styles.loading}>
        <StatusBar barStyle="light-content" backgroundColor={colors.bgBase} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingTitle}>Video tahlil qilinmoqda...</Text>
        <Text style={styles.loadingHint}>Bu 3-30 soniya vaqt olishi mumkin</Text>
      </View>
    );
  }

  return (
    <VideoExtractReady
      result={result!}
      playerUrl={playerUrl}
      playerRef={playerRef}
      onReset={handleReset}
      onWatchParty={handleWatchParty}
    />
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.bgBase,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingTitle: { ...typography.h3, color: colors.textPrimary, textAlign: 'center' },
  loadingHint: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
});
