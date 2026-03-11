// CineSync Mobile — SettingsScreen
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '@theme/index';

type Language = 'uz' | 'ru' | 'en';

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'uz', label: "O'zbekcha", flag: '🇺🇿' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

interface ToggleItem {
  key: string;
  label: string;
  sub?: string;
}

const NOTIFICATION_TOGGLES: ToggleItem[] = [
  { key: 'friendRequest', label: 'Do\'stlik so\'rovlari' },
  { key: 'watchPartyInvite', label: 'Watch Party taklifi' },
  { key: 'battleInvite', label: 'Battle taklifi' },
  { key: 'achievementUnlocked', label: 'Yutuq ochildi' },
  { key: 'dailyReminder', label: 'Kunlik eslatma', sub: 'Har kuni soat 20:00' },
];

const PRIVACY_TOGGLES: ToggleItem[] = [
  { key: 'showOnlineStatus', label: 'Onlayn statusni ko\'rsatish' },
  { key: 'showWatchHistory', label: 'Ko\'rish tarixini ko\'rsatish' },
];

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function ToggleRow({ item, value, onChange }: { item: ToggleItem; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleLeft}>
        <Text style={styles.toggleLabel}>{item.label}</Text>
        {item.sub && <Text style={styles.toggleSub}>{item.sub}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.bgElevated, true: colors.primary }}
        thumbColor={colors.textPrimary}
      />
    </View>
  );
}

export function SettingsScreen() {
  const navigation = useNavigation();
  const [language, setLanguage] = useState<Language>('uz');
  const [notifToggles, setNotifToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIFICATION_TOGGLES.map(t => [t.key, true])),
  );
  const [privacyToggles, setPrivacyToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(PRIVACY_TOGGLES.map(t => [t.key, true])),
  );

  const toggleNotif = (key: string, value: boolean) =>
    setNotifToggles(prev => ({ ...prev, [key]: value }));

  const togglePrivacy = (key: string, value: boolean) =>
    setPrivacyToggles(prev => ({ ...prev, [key]: value }));

  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Sozlamalar</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Language */}
        <SectionHeader title="TIL" />
        <View style={styles.card}>
          {LANGUAGES.map((lang, i) => (
            <TouchableOpacity
              key={lang.code}
              style={[styles.langRow, i < LANGUAGES.length - 1 && styles.rowBorder]}
              onPress={() => setLanguage(lang.code)}
              activeOpacity={0.8}
            >
              <Text style={styles.langFlag}>{lang.flag}</Text>
              <Text style={styles.langLabel}>{lang.label}</Text>
              {language === lang.code && (
                <Ionicons name="checkmark" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Notifications */}
        <SectionHeader title="BILDIRISHNOMALAR" />
        <View style={styles.card}>
          {NOTIFICATION_TOGGLES.map((item, i) => (
            <View key={item.key} style={i < NOTIFICATION_TOGGLES.length - 1 && styles.rowBorder}>
              <ToggleRow
                item={item}
                value={notifToggles[item.key] ?? true}
                onChange={v => toggleNotif(item.key, v)}
              />
            </View>
          ))}
        </View>

        {/* Privacy */}
        <SectionHeader title="MAXFIYLIK" />
        <View style={styles.card}>
          {PRIVACY_TOGGLES.map((item, i) => (
            <View key={item.key} style={i < PRIVACY_TOGGLES.length - 1 && styles.rowBorder}>
              <ToggleRow
                item={item}
                value={privacyToggles[item.key] ?? true}
                onChange={v => togglePrivacy(item.key, v)}
              />
            </View>
          ))}
        </View>

        {/* App info */}
        <SectionHeader title="ILOVA" />
        <View style={styles.card}>
          {[
            { label: 'Versiya', value: '1.0.0' },
            { label: 'Platforma', value: 'Expo SDK 54' },
          ].map((item, i) => (
            <View key={item.label} style={[styles.infoRow, i === 0 && styles.rowBorder]}>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={styles.infoValue}>{item.value}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ height: spacing.xxxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgBase },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: spacing.xs },
  title: { ...typography.h2, color: colors.textPrimary },
  content: { padding: spacing.lg, gap: spacing.sm },
  sectionHeader: { ...typography.label, color: colors.textMuted, marginTop: spacing.md, marginBottom: spacing.xs },
  card: { backgroundColor: colors.bgSurface, borderRadius: borderRadius.lg, overflow: 'hidden' },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  langFlag: { fontSize: 20 },
  langLabel: { ...typography.body, color: colors.textPrimary, flex: 1 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  toggleLeft: { flex: 1, gap: 2 },
  toggleLabel: { ...typography.body, color: colors.textPrimary },
  toggleSub: { ...typography.caption, color: colors.textMuted },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  infoLabel: { ...typography.body, color: colors.textSecondary },
  infoValue: { ...typography.body, color: colors.textMuted },
});
