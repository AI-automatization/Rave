// WeWatch Mobile — Guest Join Screen (room link opened while signed out: name only, no account)
import React, { useState } from 'react';
import { View, Text, TextInput, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TrackedTouchable } from '@components/common/TrackedTouchable';
import { useTheme, createThemedStyles } from '@theme/index';
import { AuthStackParamList } from '@app-types/index';
import { authApi } from '@api/auth.api';
import { useAuthStore } from '@store/auth.store';
import { useT } from '@i18n/index';
import { AuthGridBackground } from '@components/auth/AuthGridBackground';
import { WeWatchLogo } from '@components/common/WeWatchLogo';
import { profileSetupStorage } from '@utils/storage';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'GuestJoin'>;

export function GuestJoinScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { setAuth } = useAuthStore();
  const { t } = useT();
  const { colors } = useTheme();
  const s = useStyles();

  const [name, setName] = useState('');
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async () => {
    const trimmed = name.trim();
    if (!trimmed) { setError(t('guestJoin', 'errorEmpty')); return; }
    setLoading(true);
    setError('');
    try {
      const { user, accessToken, refreshToken } = await authApi.guest(trimmed);
      // Guests are never asked for a profile — mark it done BEFORE setAuth reads the flag.
      await profileSetupStorage.markDone(user._id);
      // AppNavigator opens the pending room link once the main stack is mounted.
      await setAuth(user, accessToken, refreshToken);
    } catch (err: unknown) {
      const resp = (err as { response?: { data?: { message?: string; errors?: string[] } } })?.response;
      setError(resp?.data?.errors?.[0] ?? resp?.data?.message ?? t('guestJoin', 'errorFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <AuthGridBackground accentLinePosition={0.18} accentOpacity={0.15} />

      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={[s.container, { paddingTop: insets.top + 20 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={s.header}>
            <WeWatchLogo variant="stacked" size={80} theme="dark" />
            <Text style={s.title}>{t('guestJoin', 'title')}</Text>
            <Text style={s.subtitle}>{t('guestJoin', 'subtitle')}</Text>
          </View>

          {error ? (
            <View style={s.errorBox}>
              <Ionicons name="alert-circle" size={16} color={colors.error} />
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={[s.inputOuter, focused && s.inputOuterFocused]}>
            <Ionicons name="person-outline" size={17} color={focused ? colors.primary : colors.textDim} />
            <TextInput
              style={s.input}
              placeholder={t('guestJoin', 'namePlaceholder')}
              placeholderTextColor={colors.textDim}
              value={name}
              onChangeText={setName}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              maxLength={32}
              autoCorrect={false}
              returnKeyType="go"
              onSubmitEditing={handleJoin}
            />
          </View>

          <TrackedTouchable trackId="guest_join:submit" onPress={handleJoin} disabled={loading} activeOpacity={0.85}>
            <LinearGradient
              colors={loading ? [colors.bgLoading, colors.bgLoading] : [colors.primary, colors.primaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.primaryBtn}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={s.primaryBtnText}>{t('guestJoin', 'joinBtn')}</Text>
              )}
            </LinearGradient>
          </TrackedTouchable>

          <View style={s.footer}>
            <TrackedTouchable trackId="guest_join:go_to_login" onPress={() => navigation.navigate('Login')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={s.footerLink}>{t('guestJoin', 'haveAccount')}</Text>
            </TrackedTouchable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.bgVoid },
  flex: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingBottom: 40 },

  header: { alignItems: 'center', marginBottom: 36, gap: 10 },
  title: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginTop: 8 },
  subtitle: { fontSize: 14, color: colors.textMuted, letterSpacing: 0.3, textAlign: 'center' },

  errorBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(248,113,113,0.08)',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12,
    gap: 8, marginBottom: 12,
  },
  errorText: { color: colors.error, fontSize: 13, flex: 1 },

  inputOuter: {
    flexDirection: 'row', alignItems: 'center',
    height: 54, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 18, gap: 12,
    marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  inputOuterFocused: {
    borderColor: 'rgba(124,58,237,0.45)',
    backgroundColor: 'rgba(124,58,237,0.05)',
  },
  input: { flex: 1, color: colors.textPrimary, fontSize: 15 },

  primaryBtn: { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  primaryBtnText: { color: colors.white, fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
  footerLink: { color: colors.link, fontSize: 14, fontWeight: '700' },
}));
