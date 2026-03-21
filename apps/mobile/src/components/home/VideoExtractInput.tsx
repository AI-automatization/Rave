// CineSync Mobile — Video extract input + error UI
import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, createThemedStyles, spacing, borderRadius, typography } from '@theme/index';
import type { ExtractState } from '@hooks/useVideoExtract';

interface Props {
  url: string;
  setUrl: (url: string) => void;
  state: Extract<ExtractState, 'input' | 'error'>;
  errorMsg: string;
  onExtract: () => void;
  onBack: () => void;
}

export function VideoExtractInput({ url, setUrl, state, errorMsg, onExtract, onBack }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.bgBase} />

      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
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
            onSubmitEditing={onExtract}
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
          onPress={onExtract}
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

const useStyles = createThemedStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.bgBase },
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
}));
