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

const SETTINGS_KEY = 'cinesync_settings';
type Language = 'uz' | 'ru' | 'en';

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'uz', label: "O'zbekcha", flag: '🇺🇿' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

interface ToggleItem { key: string; label: string; sub?: string }

const NOTIFICATION_TOGGLES: ToggleItem[] = [
  { key: 'friendRequest', label: "Do'stlik so'rovlari" },
  { key: 'watchPartyInvite', label: 'Watch Party taklifi' },
  { key: 'battleInvite', label: 'Battle taklifi' },
  { key: 'achievementUnlocked', label: 'Yutuq ochildi' },
  { key: 'dailyReminder', label: 'Kunlik eslatma', sub: 'Har kuni soat 20:00' },
];

const PRIVACY_TOGGLES: ToggleItem[] = [
  { key: 'showOnlineStatus', label: "Onlayn statusni ko'rsatish" },
  { key: 'showWatchHistory', label: "Ko'rish tarixini ko'rsatish" },
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

type ActiveModal = 'editProfile' | 'changePassword' | null;

export function SettingsScreen() {
  const navigation = useNavigation();
  const { user, logout } = useAuthStore();
  const { updateProfileMutation } = useMyProfile();

  const [language, setLanguage] = useState<Language>('uz');
  const [notifToggles, setNotifToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIFICATION_TOGGLES.map(t => [t.key, true])),
  );
  const [privacyToggles, setPrivacyToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(PRIVACY_TOGGLES.map(t => [t.key, true])),
  );

  // Edit profile state
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');

  // Change password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync(SETTINGS_KEY).then((raw) => {
      if (!raw) return;
      try {
        const saved = JSON.parse(raw) as {
          language?: Language;
          notifToggles?: Record<string, boolean>;
          privacyToggles?: Record<string, boolean>;
        };
        if (saved.language) setLanguage(saved.language);
        if (saved.notifToggles) setNotifToggles(saved.notifToggles);
        if (saved.privacyToggles) setPrivacyToggles(saved.privacyToggles);
      } catch {}
    });
  }, []);

  useEffect(() => {
    SecureStore.setItemAsync(
      SETTINGS_KEY,
      JSON.stringify({ language, notifToggles, privacyToggles }),
    ).catch(() => {});
  }, [language, notifToggles, privacyToggles]);

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
    if (newPassword !== confirmPassword) {
      Alert.alert('Xato', 'Yangi parollar mos kelmadi');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Xato', 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak');
      return;
    }
    setPwdLoading(true);
    try {
      await authApi.changePassword(oldPassword, newPassword);
      setActiveModal(null);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Muvaffaqiyat', 'Parol o\'zgartirildi');
    } catch {
      Alert.alert('Xato', 'Eski parol noto\'g\'ri yoki server xatosi');
    } finally {
      setPwdLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Hisobni o\'chirish',
      'Bu amalni qaytarib bo\'lmaydi. Davom etasizmi?',
      [
        { text: 'Bekor', style: 'cancel' },
        {
          text: 'Davom etish',
          style: 'destructive',
          onPress: () => {
            Alert.prompt(
              'Tasdiqlang',
              '"TASDIQLASH" so\'zini kiriting',
              [
                { text: 'Bekor', style: 'cancel' },
                {
                  text: 'O\'chirish',
                  style: 'destructive',
                  onPress: async (input) => {
                    if (input !== 'TASDIQLASH') {
                      Alert.alert('Xato', 'Noto\'g\'ri tasdiqlash so\'zi');
                      return;
                    }
                    try {
                      await userApi.deleteAccount();
                      logout();
                    } catch {
                      Alert.alert('Xato', 'Hisob o\'chirishda xatolik yuz berdi');
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
          <Text style={styles.title}>Sozlamalar</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          {/* Account */}
          <SectionHeader title="HISOB" />
          <View style={styles.card}>
            <TouchableOpacity style={[styles.navRow, styles.rowBorder]} onPress={openEditProfile} activeOpacity={0.8}>
              <Ionicons name="person-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.navLabel}>Profilni tahrirlash</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.navRow} onPress={() => setActiveModal('changePassword')} activeOpacity={0.8}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.navLabel}>Parolni o'zgartirish</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

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
              <View key={item.key} style={i < NOTIFICATION_TOGGLES.length - 1 ? styles.rowBorder : undefined}>
                <ToggleRow item={item} value={notifToggles[item.key] ?? true} onChange={v => toggleNotif(item.key, v)} />
              </View>
            ))}
          </View>

          {/* Privacy */}
          <SectionHeader title="MAXFIYLIK" />
          <View style={styles.card}>
            {PRIVACY_TOGGLES.map((item, i) => (
              <View key={item.key} style={i < PRIVACY_TOGGLES.length - 1 ? styles.rowBorder : undefined}>
                <ToggleRow item={item} value={privacyToggles[item.key] ?? true} onChange={v => togglePrivacy(item.key, v)} />
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

          {/* Danger zone */}
          <SectionHeader title="XAVFLI ZONA" />
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount} activeOpacity={0.8}>
            <Ionicons name="trash-outline" size={18} color={colors.error} />
            <Text style={styles.deleteText}>Hisobni o'chirish</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: spacing.xxxl }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={activeModal === 'editProfile'} transparent animationType="slide" onRequestClose={() => setActiveModal(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Profilni tahrirlash</Text>
            <Text style={styles.inputLabel}>Foydalanuvchi nomi</Text>
            <TextInput
              style={styles.modalInput}
              value={editUsername}
              onChangeText={setEditUsername}
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
            />
            <Text style={styles.inputLabel}>Bio</Text>
            <TextInput
              style={[styles.modalInput, styles.modalInputMulti]}
              value={editBio}
              onChangeText={(t: string) => setEditBio(t.slice(0, 200))}
              placeholderTextColor={colors.textMuted}
              multiline
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setActiveModal(null)}>
                <Text style={styles.cancelText}>Bekor</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, updateProfileMutation.isPending && styles.btnDisabled]}
                onPress={handleSaveProfile}
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending
                  ? <ActivityIndicator size="small" color={colors.textPrimary} />
                  : <Text style={styles.saveText}>Saqlash</Text>}
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
            <Text style={styles.modalTitle}>Parolni o'zgartirish</Text>
            <Text style={styles.inputLabel}>Eski parol</Text>
            <TextInput
              style={styles.modalInput}
              value={oldPassword}
              onChangeText={setOldPassword}
              secureTextEntry
              placeholderTextColor={colors.textMuted}
              placeholder="••••••••"
            />
            <Text style={styles.inputLabel}>Yangi parol</Text>
            <TextInput
              style={styles.modalInput}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              placeholderTextColor={colors.textMuted}
              placeholder="Kamida 6 belgi"
            />
            <Text style={styles.inputLabel}>Yangi parolni tasdiqlang</Text>
            <TextInput
              style={styles.modalInput}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              placeholderTextColor={colors.textMuted}
              placeholder="••••••••"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setActiveModal(null)}>
                <Text style={styles.cancelText}>Bekor</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, pwdLoading && styles.btnDisabled]}
                onPress={handleChangePassword}
                disabled={pwdLoading}
              >
                {pwdLoading
                  ? <ActivityIndicator size="small" color={colors.textPrimary} />
                  : <Text style={styles.saveText}>O'zgartirish</Text>}
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
