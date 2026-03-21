// CineSync Mobile — SettingsScreen (composed)
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, createThemedStyles, spacing, borderRadius, typography } from '@theme/index';
import { userApi } from '@api/user.api';
import { useAuthStore } from '@store/auth.store';
import { useMyProfile } from '@hooks/useProfile';
import { useLanguageStore, Language } from '@store/language.store';
import { useThemeStore } from '@store/theme.store';
import { useT } from '@i18n/index';
import {
  SectionHeader,
  ToggleRow,
  EditProfileModal,
  ChangePasswordModal,
  useSettingsStorage,
  NOTIFICATION_TOGGLES,
  PRIVACY_TOGGLES,
} from '@components/settings';

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'uz', label: "O'zbekcha", flag: '\u{1F1FA}\u{1F1FF}' },
  { code: 'ru', label: '\u0420\u0443\u0441\u0441\u043A\u0438\u0439', flag: '\u{1F1F7}\u{1F1FA}' },
  { code: 'en', label: 'English', flag: '\u{1F1EC}\u{1F1E7}' },
];

const THEMES: { mode: 'dark' | 'light'; icon: keyof typeof Ionicons.glyphMap; labelKey: string }[] = [
  { mode: 'dark', icon: 'moon-outline', labelKey: 'themeDark' },
  { mode: 'light', icon: 'sunny-outline', labelKey: 'themeLight' },
];

type ActiveModal = 'editProfile' | 'changePassword' | null;

const TAB_BAR_HEIGHT = 60;

export function SettingsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const { updateProfileMutation } = useMyProfile();
  const { lang: language, setLang: setLanguage } = useLanguageStore();
  const { mode: themeMode, setMode: setThemeMode } = useThemeStore();
  const { t } = useT();
  const { notifToggles, privacyToggles, toggleNotif, togglePrivacy } = useSettingsStorage();
  const { colors } = useTheme();
  const styles = useStyles();

  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');

  const openEditProfile = () => {
    setEditUsername(user?.username ?? '');
    setEditBio(user?.bio ?? '');
    setActiveModal('editProfile');
  };

  const handleSaveProfile = () => {
    if (!editUsername.trim()) return;
    updateProfileMutation.mutate(
      { username: editUsername.trim(), bio: editBio.trim() },
      { onSuccess: () => setActiveModal(null) },
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('settings', 'deleteConfirmTitle'),
      t('settings', 'deleteAccountConfirm'),
      [
        { text: t('common', 'cancel'), style: 'cancel' },
        {
          text: t('settings', 'deleteAccountProceed'),
          style: 'destructive',
          onPress: () => {
            Alert.prompt(
              t('settings', 'deleteAccountVerify'),
              t('settings', 'deleteAccountPrompt'),
              [
                { text: t('common', 'cancel'), style: 'cancel' },
                {
                  text: t('settings', 'deleteBtn'),
                  style: 'destructive',
                  onPress: async (input?: string) => {
                    if (input !== t('settings', 'deleteAccountWord')) {
                      Alert.alert(t('common', 'error'), t('settings', 'deleteAccountWrongWord'));
                      return;
                    }
                    try {
                      await userApi.deleteAccount();
                      logout();
                    } catch {
                      Alert.alert(t('common', 'error'), t('settings', 'deleteAccountError'));
                    }
                  },
                },
              ],
            );
          },
        },
      ],
    );
  };

  return (
    <>
      <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('settings', 'title')}</Text>
          <View style={styles.spacer} />
        </View>

        <View style={styles.content}>
          {/* Account */}
          <SectionHeader title={t('settings', 'accountSection')} />
          <View style={styles.card}>
            <TouchableOpacity style={[styles.navRow, styles.rowBorder]} onPress={openEditProfile} activeOpacity={0.8}>
              <Ionicons name="person-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.navLabel}>{t('settings', 'editProfile')}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.navRow} onPress={() => setActiveModal('changePassword')} activeOpacity={0.8}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.navLabel}>{t('settings', 'changePassword')}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Theme */}
          <SectionHeader title={t('settings', 'themeSection')} />
          <View style={styles.card}>
            {THEMES.map((theme, i) => (
              <TouchableOpacity
                key={theme.mode}
                style={[styles.langRow, i < THEMES.length - 1 && styles.rowBorder]}
                onPress={() => setThemeMode(theme.mode)}
                activeOpacity={0.8}
              >
                <Ionicons name={theme.icon} size={20} color={colors.textSecondary} />
                <Text style={styles.langLabel}>{t('settings', theme.labelKey)}</Text>
                {themeMode === theme.mode && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Language */}
          <SectionHeader title={t('settings', 'langSection')} />
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
          <SectionHeader title={t('settings', 'notifSection')} />
          <View style={styles.card}>
            {NOTIFICATION_TOGGLES.map((item, i) => (
              <View key={item.key} style={i < NOTIFICATION_TOGGLES.length - 1 ? styles.rowBorder : undefined}>
                <ToggleRow
                  label={t('settings', item.labelKey)}
                  sub={item.subKey ? t('settings', item.subKey) : undefined}
                  value={notifToggles[item.key] ?? true}
                  onChange={v => toggleNotif(item.key, v)}
                />
              </View>
            ))}
          </View>

          {/* Privacy */}
          <SectionHeader title={t('settings', 'privacySection')} />
          <View style={styles.card}>
            {PRIVACY_TOGGLES.map((item, i) => (
              <View key={item.key} style={i < PRIVACY_TOGGLES.length - 1 ? styles.rowBorder : undefined}>
                <ToggleRow
                  label={t('settings', item.labelKey)}
                  value={privacyToggles[item.key] ?? true}
                  onChange={v => togglePrivacy(item.key, v)}
                />
              </View>
            ))}
          </View>

          {/* App info */}
          <SectionHeader title={t('settings', 'appSection')} />
          <View style={styles.card}>
            {[
              { label: t('settings', 'version'), value: '1.0.0' },
              { label: t('settings', 'platform'), value: 'Expo SDK 54' },
            ].map((item, i) => (
              <View key={item.label} style={[styles.infoRow, i === 0 && styles.rowBorder]}>
                <Text style={styles.infoLabel}>{item.label}</Text>
                <Text style={styles.infoValue}>{item.value}</Text>
              </View>
            ))}
          </View>

          {/* Danger zone */}
          <SectionHeader title={t('settings', 'dangerZone')} />
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount} activeOpacity={0.8}>
            <Ionicons name="trash-outline" size={18} color={colors.error} />
            <Text style={styles.deleteText}>{t('settings', 'deleteAccount')}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: TAB_BAR_HEIGHT + insets.bottom + spacing.xl }} />
      </ScrollView>

      {/* Modals */}
      <EditProfileModal
        visible={activeModal === 'editProfile'}
        onClose={() => setActiveModal(null)}
        username={editUsername}
        onUsernameChange={setEditUsername}
        bio={editBio}
        onBioChange={setEditBio}
        onSave={handleSaveProfile}
        saving={updateProfileMutation.isPending}
      />
      <ChangePasswordModal
        visible={activeModal === 'changePassword'}
        onClose={() => setActiveModal(null)}
      />
    </>
  );
}

const useStyles = createThemedStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.bgBase },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: spacing.xs },
  title: { ...typography.h2, color: colors.textPrimary },
  spacer: { width: 40 },
  content: { padding: spacing.lg, gap: spacing.xs },
  card: { backgroundColor: colors.bgSurface, borderRadius: borderRadius.lg, overflow: 'hidden' },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  navRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  navLabel: { ...typography.body, color: colors.textPrimary, flex: 1 },
  langRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  langFlag: { fontSize: 20 },
  langLabel: { ...typography.body, color: colors.textPrimary, flex: 1 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md },
  infoLabel: { ...typography.body, color: colors.textSecondary },
  infoValue: { ...typography.body, color: colors.textMuted },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.bgSurface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.error + '44',
  },
  deleteText: { ...typography.body, color: colors.error },
}));
