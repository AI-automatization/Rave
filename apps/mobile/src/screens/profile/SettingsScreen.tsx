// CineSync Mobile — SettingsScreen
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '@theme/index';
import { authApi } from '@api/auth.api';
import { userApi } from '@api/user.api';
import { useAuthStore } from '@store/auth.store';
import { useMyProfile } from '@hooks/useProfile';
import { useLanguageStore, Language } from '@store/language.store';
import { useT } from '@i18n/index';

const SETTINGS_KEY = 'cinesync_settings';

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'uz', label: "O'zbekcha", flag: '\u{1F1FA}\u{1F1FF}' },
  { code: 'ru', label: '\u0420\u0443\u0441\u0441\u043A\u0438\u0439', flag: '\u{1F1F7}\u{1F1FA}' },
  { code: 'en', label: 'English', flag: '\u{1F1EC}\u{1F1E7}' },
];

interface ToggleItem { key: string; labelKey: string; subKey?: string }

const NOTIFICATION_TOGGLES: ToggleItem[] = [
  { key: 'friendRequest', labelKey: 'friendRequest' },
  { key: 'watchPartyInvite', labelKey: 'watchPartyInvite' },
  { key: 'battleInvite', labelKey: 'battleInvite' },
  { key: 'achievementUnlocked', labelKey: 'achievementUnlocked' },
  { key: 'dailyReminder', labelKey: 'dailyReminder', subKey: 'dailyReminderSub' },
];

const PRIVACY_TOGGLES: ToggleItem[] = [
  { key: 'showOnlineStatus', labelKey: 'showOnlineStatus' },
  { key: 'showWatchHistory', labelKey: 'showWatchHistory' },
];

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function ToggleRow({ label, sub, value, onChange }: { label: string; sub?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleLeft}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {sub && <Text style={styles.toggleSub}>{sub}</Text>}
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

type ActiveModal = 'editProfile' | 'changePassword' | null;

export function SettingsScreen() {
  const navigation = useNavigation();
  const { user, logout } = useAuthStore();
  const { updateProfileMutation } = useMyProfile();
  const { lang: language, setLang: setLanguage } = useLanguageStore();
  const { t } = useT();

  const [notifToggles, setNotifToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIFICATION_TOGGLES.map(item => [item.key, true])),
  );
  const [privacyToggles, setPrivacyToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(PRIVACY_TOGGLES.map(item => [item.key, true])),
  );

  // Edit profile state
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');

  // Change password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [pwdLoading, setPwdLoading] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync(SETTINGS_KEY).then((raw) => {
      if (!raw) return;
      try {
        const saved = JSON.parse(raw) as {
          notifToggles?: Record<string, boolean>;
          privacyToggles?: Record<string, boolean>;
        };
        if (saved.notifToggles) setNotifToggles(saved.notifToggles);
        if (saved.privacyToggles) setPrivacyToggles(saved.privacyToggles);
      } catch { /* empty */ }
    });
  }, []);

  useEffect(() => {
    SecureStore.setItemAsync(
      SETTINGS_KEY,
      JSON.stringify({ notifToggles, privacyToggles }),
    ).catch(() => { /* empty */ });
  }, [notifToggles, privacyToggles]);

  const toggleNotif = (key: string, value: boolean) =>
    setNotifToggles(prev => ({ ...prev, [key]: value }));
  const togglePrivacy = (key: string, value: boolean) =>
    setPrivacyToggles(prev => ({ ...prev, [key]: value }));

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

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) return;

    if (newPassword.length < 6) {
      Alert.alert(t('common', 'error'), t('settings', 'passwordTooShort'));
      return;
    }
    setPwdLoading(true);
    try {
      await authApi.changePassword(oldPassword, newPassword);
      setActiveModal(null);
      setOldPassword('');
      setNewPassword('');

      Alert.alert(t('settings', 'success'), t('settings', 'passwordChanged'));
    } catch {
      Alert.alert(t('common', 'error'), t('settings', 'oldPasswordError'));
    } finally {
      setPwdLoading(false);
    }
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
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('settings', 'title')}</Text>
          <View style={{ width: 40 }} />
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

        <View style={{ height: spacing.xxxl }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={activeModal === 'editProfile'} transparent animationType="slide" onRequestClose={() => setActiveModal(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{t('settings', 'editProfile')}</Text>
            <Text style={styles.inputLabel}>{t('profile', 'username')}</Text>
            <TextInput
              style={styles.modalInput}
              value={editUsername}
              onChangeText={setEditUsername}
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
            />
            <Text style={styles.inputLabel}>{t('profile', 'bio')}</Text>
            <TextInput
              style={[styles.modalInput, styles.modalInputMulti]}
              value={editBio}
              onChangeText={(txt: string) => setEditBio(txt.slice(0, 200))}
              placeholderTextColor={colors.textMuted}
              multiline
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setActiveModal(null)}>
                <Text style={styles.cancelText}>{t('common', 'cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, updateProfileMutation.isPending && styles.btnDisabled]}
                onPress={handleSaveProfile}
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending
                  ? <ActivityIndicator size="small" color={colors.textPrimary} />
                  : <Text style={styles.saveText}>{t('common', 'save')}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={activeModal === 'changePassword'} transparent animationType="slide" onRequestClose={() => setActiveModal(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{t('settings', 'changePassword')}</Text>
            <Text style={styles.inputLabel}>{t('settings', 'currentPassword')}</Text>
            <TextInput
              style={styles.modalInput}
              value={oldPassword}
              onChangeText={setOldPassword}
              secureTextEntry
              placeholderTextColor={colors.textMuted}
              placeholder="••••••••"
            />
            <Text style={styles.inputLabel}>{t('settings', 'newPassword')}</Text>
            <TextInput
              style={styles.modalInput}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              placeholderTextColor={colors.textMuted}
              placeholder="••••••••"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setActiveModal(null)}>
                <Text style={styles.cancelText}>{t('common', 'cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, pwdLoading && styles.btnDisabled]}
                onPress={handleChangePassword}
                disabled={pwdLoading}
              >
                {pwdLoading
                  ? <ActivityIndicator size="small" color={colors.textPrimary} />
                  : <Text style={styles.saveText}>{t('settings', 'change')}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
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
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  navLabel: { ...typography.body, color: colors.textPrimary, flex: 1 },
  langRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  langFlag: { fontSize: 20 },
  langLabel: { ...typography.body, color: colors.textPrimary, flex: 1 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  toggleLeft: { flex: 1, gap: 2 },
  toggleLabel: { ...typography.body, color: colors.textPrimary },
  toggleSub: { ...typography.caption, color: colors.textMuted },
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
  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalSheet: {
    backgroundColor: colors.bgSurface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xl,
    gap: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.sm,
  },
  modalTitle: { ...typography.h2, color: colors.textPrimary },
  inputLabel: { ...typography.label, color: colors.textMuted },
  modalInput: {
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: 15,
  },
  modalInputMulti: { height: 80, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  cancelBtn: {
    flex: 1, backgroundColor: colors.bgElevated, borderRadius: borderRadius.lg,
    height: 48, alignItems: 'center', justifyContent: 'center',
  },
  cancelText: { ...typography.body, color: colors.textSecondary },
  saveBtn: {
    flex: 1, backgroundColor: colors.primary, borderRadius: borderRadius.lg,
    height: 48, alignItems: 'center', justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  saveText: { color: colors.textPrimary, fontWeight: '700', fontSize: 15 },
});
