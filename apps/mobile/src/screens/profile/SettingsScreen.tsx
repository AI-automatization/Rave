// WeWatch Mobile — SettingsScreen (composed)
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
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

          {/* Language */}
          <SectionHeader title={t('settings', 'langSection')} />
          <View style={styles.card}>
            {LANGUAGES.map((lang, i) => (
              <TouchableOpacity
                key={lang.code}
                style={[styles.langRow, i < LANGUAGES.length - 1 && styles.rowBorder]}
                onPress={() => handleLanguageChange(lang.code)}
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

          {/* Support */}
          <SectionHeader title={t('settings', 'helpSection')} />
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.navRow}
              onPress={() => navigation.navigate('Modal', { screen: 'SupportChat' })}
              activeOpacity={0.8}
            >
              <Ionicons name="headset-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.navLabel}>{t('settings', 'writeSupport')}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* App info */}
          <SectionHeader title={t('settings', 'appSection')} />
          <View style={styles.card}>
            {[
              { label: t('settings', 'version'), value: '1.0.0' },
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
            <TouchableOpacity
              style={[styles.navRow, styles.rowBorder]}
              onPress={() => Linking.openURL('https://wewatch.app/privacy-policy')}
              activeOpacity={0.8}
            >
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.textMuted} />
              <Text style={styles.navLabel}>{t('settings', 'privacyLabel')}</Text>
              <Ionicons name="open-outline" size={16} color={colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navRow}
              onPress={() => Linking.openURL('https://wewatch.app/terms')}
              activeOpacity={0.8}
            >
              <Ionicons name="document-text-outline" size={18} color={colors.textMuted} />
              <Text style={styles.navLabel}>{t('settings', 'termsLabel')}</Text>
              <Ionicons name="open-outline" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Danger zone */}
          <SectionHeader title={t('settings', 'dangerZone')} />
          <View style={styles.card}>
            <TouchableOpacity
              style={[styles.navRow, styles.rowBorder]}
              onPress={() => {
                Alert.alert(
                  t('settings', 'logoutAllTitle') || 'Barcha qurilmalardan chiqish',
                  t('settings', 'logoutAllMsg') || 'Barcha sessiyalar tugatiladi. Davom etasizmi?',
                  [
                    { text: t('common', 'cancel'), style: 'cancel' },
                    {
                      text: t('settings', 'logoutAllBtn') || 'Chiqish',
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
                {t('settings', 'logoutAll') || 'Barcha qurilmalardan chiqish'}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.navRow} onPress={handleDeleteAccount} activeOpacity={0.8}>
              <Ionicons name="trash-outline" size={18} color={colors.error} />
              <Text style={[styles.navLabel, { color: colors.error }]}>{t('settings', 'deleteAccount')}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
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

