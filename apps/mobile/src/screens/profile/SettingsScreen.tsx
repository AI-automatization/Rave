import React, { memo, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors, spacing, borderRadius, typography } from '@theme/index';
import { userApi } from '@api/user.api';
import type { ProfileStackParams } from '@navigation/types';
import type { IUserSettings } from '@types/index';

type Props = NativeStackScreenProps<ProfileStackParams, 'Settings'>;

const LANGUAGES = [
  { code: 'uz', label: "O'zbekcha" },
  { code: 'ru', label: 'Русский' },
  { code: 'en', label: 'English' },
];

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

const Section = memo(({ title, children }: SectionProps) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionCard}>{children}</View>
  </View>
));

interface ToggleRowProps {
  label: string;
  sub?: string;
  value: boolean;
  onToggle: (v: boolean) => void;
  isLast?: boolean;
}

const ToggleRow = memo(({ label, sub, value, onToggle, isLast }: ToggleRowProps) => (
  <View style={[styles.row, !isLast && styles.rowBorder]}>
    <View style={styles.rowText}>
      <Text style={styles.rowLabel}>{label}</Text>
      {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
    </View>
    <Switch
      value={value}
      onValueChange={onToggle}
      trackColor={{ false: colors.bgOverlay, true: colors.primary }}
      thumbColor={colors.textPrimary}
    />
  </View>
));

export default function SettingsScreen({ navigation }: Props) {
  const queryClient = useQueryClient();
  const [localSettings, setLocalSettings] = useState<IUserSettings | null>(null);

  const { isLoading } = useQuery({
    queryKey: ['my-settings'],
    queryFn: async () => {
      const res = await userApi.getSettings();
      if (res.data) setLocalSettings(res.data);
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { mutate: saveSettings, isPending: isSaving } = useMutation({
    mutationFn: (payload: Partial<IUserSettings>) => userApi.updateSettings(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-settings'] });
      Alert.alert('Saqlandi', 'Sozlamalar muvaffaqiyatli saqlandi.');
    },
    onError: () => {
      Alert.alert('Xato', 'Sozlamalarni saqlashda xatolik yuz berdi.');
    },
  });

  const setNotif = useCallback(
    (key: keyof IUserSettings['notifications'], val: boolean) => {
      setLocalSettings((prev) =>
        prev ? { ...prev, notifications: { ...prev.notifications, [key]: val } } : prev,
      );
    },
    [],
  );

  const setPrivacy = useCallback(
    (key: keyof IUserSettings['privacy'], val: boolean) => {
      setLocalSettings((prev) =>
        prev ? { ...prev, privacy: { ...prev.privacy, [key]: val } } : prev,
      );
    },
    [],
  );

  const handleSave = () => {
    if (!localSettings) return;
    saveSettings(localSettings);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Orqaga</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Sozlamalar</Text>
        <View style={{ width: 60 }} />
      </View>

      {isLoading || !localSettings ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Language */}
          <Section title="Til">
            <View style={styles.langRow}>
              {LANGUAGES.map((lang, idx) => {
                const isSelected = localSettings.language === lang.code;
                return (
                  <TouchableOpacity
                    key={lang.code}
                    style={[
                      styles.langBtn,
                      isSelected && styles.langBtnActive,
                      idx < LANGUAGES.length - 1 && styles.langBtnBorder,
                    ]}
                    onPress={() =>
                      setLocalSettings((prev) => prev ? { ...prev, language: lang.code } : prev)
                    }
                  >
                    <Text style={[styles.langLabel, isSelected && styles.langLabelActive]}>
                      {lang.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Section>

          {/* Notifications */}
          <Section title="Bildirishnomalar">
            <ToggleRow
              label="Push bildirishnomalar"
              sub="Barcha push'larni yoqish / o'chirish"
              value={localSettings.notifications.pushEnabled}
              onToggle={(v) => setNotif('pushEnabled', v)}
            />
            <ToggleRow
              label="Do'stlik so'rovi"
              value={localSettings.notifications.friendRequest}
              onToggle={(v) => setNotif('friendRequest', v)}
            />
            <ToggleRow
              label="Watch Party taklifi"
              value={localSettings.notifications.watchPartyInvite}
              onToggle={(v) => setNotif('watchPartyInvite', v)}
            />
            <ToggleRow
              label="Battle taklifi"
              value={localSettings.notifications.battleInvite}
              onToggle={(v) => setNotif('battleInvite', v)}
            />
            <ToggleRow
              label="Yutuq qo'lga kiritildi"
              value={localSettings.notifications.achievementUnlocked}
              onToggle={(v) => setNotif('achievementUnlocked', v)}
              isLast
            />
          </Section>

          {/* Privacy */}
          <Section title="Maxfiylik">
            <ToggleRow
              label="Online statusni ko'rsatish"
              sub="Do'stlar sizni online ko'ra oladi"
              value={localSettings.privacy.showOnlineStatus}
              onToggle={(v) => setPrivacy('showOnlineStatus', v)}
            />
            <ToggleRow
              label="Ko'rish tarixini ko'rsatish"
              sub="Profilga kirganda ko'rinadi"
              value={localSettings.privacy.showWatchHistory}
              onToggle={(v) => setPrivacy('showWatchHistory', v)}
              isLast
            />
          </Section>

          {/* Theme — locked dark */}
          <Section title="Ko'rinish">
            <View style={styles.row}>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>Mavzu</Text>
                <Text style={styles.rowSub}>Faqat qorong'u rejim qo'llab-quvvatlanadi</Text>
              </View>
              <View style={styles.themeBadge}>
                <Text style={styles.themeText}>🌙 Dark</Text>
              </View>
            </View>
          </Section>

          {/* Save button */}
          <TouchableOpacity
            style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color={colors.textPrimary} size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Saqlash</Text>
            )}
          </TouchableOpacity>

          <View style={{ height: spacing.xxxl * 2 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgBase },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  back: { color: colors.textSecondary, fontSize: typography.sizes.md, width: 60 },
  title: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.textPrimary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: spacing.lg },

  section: { marginBottom: spacing.xl },
  sectionTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  sectionCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    gap: spacing.md,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowText: { flex: 1, gap: 2 },
  rowLabel: { fontSize: typography.sizes.md, color: colors.textPrimary },
  rowSub: { fontSize: typography.sizes.xs, color: colors.textMuted },

  langRow: { flexDirection: 'row' },
  langBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  langBtnBorder: { borderRightWidth: 1, borderRightColor: colors.border },
  langBtnActive: { backgroundColor: colors.primary + '22' },
  langLabel: { fontSize: typography.sizes.sm, color: colors.textMuted },
  langLabelActive: { color: colors.primary, fontWeight: typography.weights.semibold },

  themeBadge: {
    backgroundColor: colors.bgOverlay,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  themeText: { fontSize: typography.sizes.sm, color: colors.textSecondary },

  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: {
    color: colors.textPrimary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
});
