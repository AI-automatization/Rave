// WeWatch Mobile — FilmSelector component (URL mode only)
import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, createThemedStyles, spacing, typography } from '@theme/index';
import { useFilmSelectorStyles } from './FilmSelector.styles';
import { ExtractStatus } from '@components/watchParty/ExtractStatus';
import type { VideoExtractResult } from '@api/content.api';

interface FilmSelectorProps {
  videoUrl: string;
  onVideoUrlChange: (url: string) => void;
  isExtracting: boolean;
  extractResult: VideoExtractResult | null;
  fallbackMode: boolean;
  urlError?: string | null;
}

const useUrlErrorStyles = createThemedStyles((colors) => ({
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    flex: 1,
  },
}));

export function FilmSelector({
  videoUrl, onVideoUrlChange, isExtracting, extractResult, fallbackMode, urlError,
}: FilmSelectorProps) {
  const { colors } = useTheme();
  const s = useFilmSelectorStyles();
  const errorStyles = useUrlErrorStyles();
  return (
    <View style={s.section}>
      <Text style={s.label}>VIDEO MANBASI</Text>
      <TextInput
        style={[s.input, urlError ? { borderColor: colors.error } : undefined]}
        value={videoUrl}
        onChangeText={onVideoUrlChange}
        placeholder="YouTube, HLS yoki to'g'ri link..."
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        keyboardType="url"
      />
      {urlError ? (
        <View style={errorStyles.errorRow}>
          <Ionicons name="ban-outline" size={13} color={colors.error} />
          <Text style={errorStyles.errorText}>{urlError}</Text>
        </View>
      ) : null}
      <ExtractStatus isExtracting={isExtracting} extractResult={extractResult} fallbackMode={fallbackMode} />
    </View>
  );
}
