// WeWatch Mobile — SettingsScreen (composed)
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, Linking, AppState } from 'react-native';
import Constants from 'expo-constants';
import { TrackedTouchable } from '@components/common/TrackedTouchable';
import * as Notifications from 'expo-notifications';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '@app-types/index';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing } from '@theme/index';
import { userApi } from '@api/user.api';
import { authApi } from '@api/auth.api';
import { useAuthStore } from '@store/auth.store';
import { useMyProfile } from '@hooks/useProfile';
import { useLanguageStore, Language } from '@store/language.store';
import { ensureNotificationPermission } from '@hooks/usePushNotifications';
// theme.store import removed — dark mode only
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
import { useStyles } from './SettingsScreen.styles';
import { appAlert } from '@components/common/AppAlert';

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'uz', label: "O'zbekcha", flag: '\u{1F1FA}\u{1F1FF}' },
  { code: 'ru', label: '\u0420\u0443\u0441\u0441\u043A\u0438\u0439', flag: '\u{1F1F7}\u{1F1FA}' },
  { code: 'en', label: 'English', flag: '\u{1F1EC}\u{1F1E7}' },
];

// WeWatch — Dark mode ONLY. Light tema o'chirilgan.

type ActiveModal = 'editProfile' | 'changePassword' | null;

const TAB_BAR_HEIGHT = 60;

export function SettingsScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const { updateProfileMutation } = useMyProfile();
  const { lang: language, setLang: setLanguage } = useLanguageStore();
  // Dark mode ONLY — tema tanlash o'chirilgan
  const { t } = useT();

  const handleLanguageChange = (code: Language) => {
    setLanguage(code);
    userApi.updateSettings({ language: code }).catch(() => { /* silent */ });
  };
  const { notifToggles, privacyToggles, toggleNotif, togglePrivacy } = useSettingsStorage();
  const { colors } = useTheme();
  const styles = useStyles();

  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');

  // System notification permission — drives the "Enable notifications" row visibility.
  // Re-checked when the app returns to foreground (e.g. after the user toggles it in
  // system settings) so the row disappears once granted.
  const [notifGranted, setNotifGranted] = useState(true);
  useEffect(() => {
    const check = () => {
      void Notifications.getPermissionsAsync().then(({ status }) => setNotifGranted(status === 'granted'));
    };
    check();
    const sub = AppState.addEventListener('change', s => { if (s === 'active') check(); });
    return () => sub.remove();
  }, []);

  const handleEnableNotifs = async () => {
    const status = await ensureNotificationPermission();
    if (status === 'granted') {
      setNotifGranted(true);
    } else {
      // Already denied — the OS won't prompt again, so send the user to system settings.
      void Linking.openSettings();
    }
  };

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
    appAlert(
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
                      appAlert(t('common', 'error'), t('settings', 'deleteAccountWrongWord'));
                      return;
                    }
                    try {
                      await userApi.deleteAccount();
                      logout();
                    } catch {
                      appAlert(t('common', 'error'), t('settings', 'deleteAccountError'));
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
          <TrackedTouchable trackId="settings:back" onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TrackedTouchable>
          <Text style={styles.title}>{t('settings', 'title')}</Text>
          <View style={styles.spacer} />
        </View>

        <View style={styles.content}>
          {/* Account */}
          <SectionHeader title={t('settings', 'accountSection')} />
          <View style={styles.card}>
            <TrackedTouchable trackId="settings:edit_profile" style={[styles.navRow, styles.rowBorder]} onPress={openEditProfile} activeOpacity={0.8}>
              <Ionicons name="person-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.navLabel}>{t('settings', 'editProfile')}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TrackedTouchable>
            <TrackedTouchable trackId="settings:change_password" style={styles.navRow} onPress={() => setActiveModal('changePassword')} activeOpacity={0.8}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.navLabel}>{t('settings', 'changePassword')}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TrackedTouchable>
          </View>

          {/* Language */}
          <SectionHeader title={t('settings', 'langSection')} />
          <View style={styles.card}>
            {LANGUAGES.map((lang, i) => (
              <TrackedTouchable
                trackId="settings:change_language"
                key={lang.code}
                style={[styles.langRow, i < LANGUAGES.length - 1 && styles.rowBorder]}
                onPress={() => handleLanguageChange(lang.code)}
                activeOpacity={0.8}
                trackMeta={{ lang: lang.code }}
              >
                <Text style={styles.langFlag}>{lang.flag}</Text>
                <Text style={styles.langLabel}>{lang.label}</Text>
                {language === lang.code && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TrackedTouchable>
            ))}
          </View>

          {/* Notifications */}
          <SectionHeader title={t('settings', 'notifSection')} />
          {!notifGranted && (
            <View style={styles.card}>
              <TrackedTouchable trackId="settings:enable_notifications" style={styles.navRow} onPress={handleEnableNotifs} activeOpacity={0.8}>
                <Ionicons name="notifications-off-outline" size={18} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.navLabel}>{t('settings', 'enableNotifs')}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
                    {t('settings', 'enableNotifsSub')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TrackedTouchable>
            </View>
          )}
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
                  sub={item.subKey ? t('settings', item.subKey) : undefined}
                  value={privacyToggles[item.key] ?? true}
                  onChange={v => togglePrivacy(item.key, v)}
                />
              </View>
            ))}
          </View>

          {/* Support */}
          <SectionHeader title={t('settings', 'helpSection')} />
          <View style={styles.card}>
            <TrackedTouchable
              trackId="settings:write_support"
              style={styles.navRow}
              onPress={() => navigation.navigate('Modal', { screen: 'SupportChat' })}
              activeOpacity={0.8}
            >
              <Ionicons name="headset-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.navLabel}>{t('settings', 'writeSupport')}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TrackedTouchable>
          </View>

          {/* App info */}
          <SectionHeader title={t('settings', 'appSection')} />
          <View style={styles.card}>
            {[
              { label: t('settings', 'version'), value: Constants.expoConfig?.version ?? '1.0.0' },
            ].map((item, i) => (
              <View key={item.label} style={[styles.infoRow, i === 0 && styles.rowBorder]}>
                <Text style={styles.infoLabel}>{item.label}</Text>
                <Text style={styles.infoValue}>{item.value}</Text>
              </View>
            ))}
          </View>

          {/* Legal */}
          <SectionHeader title={t('settings', 'legalSection')} />
          <View style={styles.card}>
            <TrackedTouchable
              trackId="settings:open_privacy_policy"
              style={[styles.navRow, styles.rowBorder]}
              onPress={() => Linking.openURL('https://wewatch.uz/privacy-policy')}
              activeOpacity={0.8}
            >
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.textMuted} />
              <Text style={styles.navLabel}>{t('settings', 'privacyLabel')}</Text>
              <Ionicons name="open-outline" size={16} color={colors.textMuted} />
            </TrackedTouchable>
            <TrackedTouchable
              trackId="settings:open_terms"
              style={[styles.navRow, styles.rowBorder]}
              onPress={() => Linking.openURL('https://wewatch.uz/terms')}
              activeOpacity={0.8}
            >
              <Ionicons name="document-text-outline" size={18} color={colors.textMuted} />
              <Text style={styles.navLabel}>{t('settings', 'termsLabel')}</Text>
              <Ionicons name="open-outline" size={16} color={colors.textMuted} />
            </TrackedTouchable>
            {/* 2026-08-28: the web app has had a DMCA takedown-procedure page (apps/web/src/app/
                dmca) since before this screen existed, but nothing in the mobile app ever linked
                to it — Play reviews the APK's own content, not the website, so an app whose only
                path for a copyright holder to file a claim required already knowing the URL read
                as having no procedure at all. Same nav-row pattern as Privacy/Terms above. */}
            <TrackedTouchable
              trackId="settings:open_dmca"
              style={styles.navRow}
              onPress={() => Linking.openURL('https://wewatch.uz/dmca')}
              activeOpacity={0.8}
            >
              <Ionicons name="alert-circle-outline" size={18} color={colors.textMuted} />
              <Text style={styles.navLabel}>{t('settings', 'dmcaLabel')}</Text>
              <Ionicons name="open-outline" size={16} color={colors.textMuted} />
            </TrackedTouchable>
          </View>

          {/* Danger zone */}
          <SectionHeader title={t('settings', 'dangerZone')} />
          <View style={styles.card}>
            <TrackedTouchable
              trackId="settings:logout_all"
              style={[styles.navRow, styles.rowBorder]}
              onPress={() => {
                appAlert(
                  t('settings', 'logoutAllTitle'),
                  t('settings', 'logoutAllMsg'),
                  [
                    { text: t('common', 'cancel'), style: 'cancel' },
                    {
                      text: t('settings', 'logoutAllBtn'),
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          await userApi.removeFcmToken();
                        } catch { /* silent */ }
                        try {
                          await authApi.logoutAll();
                        } catch { /* silent */ }
                        logout();
                      },
                    },
                  ],
                );
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="log-out-outline" size={18} color={colors.warning} />
              <Text style={[styles.navLabel, { color: colors.warning }]}>
                {t('settings', 'logoutAll')}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TrackedTouchable>
            <TrackedTouchable trackId="settings:delete_account" style={styles.navRow} onPress={handleDeleteAccount} activeOpacity={0.8}>
              <Ionicons name="trash-outline" size={18} color={colors.error} />
              <Text style={[styles.navLabel, { color: colors.error }]}>{t('settings', 'deleteAccount')}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TrackedTouchable>
          </View>
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

