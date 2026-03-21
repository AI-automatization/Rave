// CineSync Mobile — Forgot Password Screen
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, createThemedStyles } from '@theme/index';
import { AuthStackParamList } from '@app-types/index';
import { authApi } from '@api/auth.api';
import { useT } from '@i18n/index';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

type Nav = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { t } = useT();
  const { colors } = useTheme();
  const s = useStyles();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [focused, setFocused] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const checkScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleSubmit = async () => {
    if (!email.trim()) return;
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch {
      setSent(true);
    } finally {
      setLoading(false);
      Animated.spring(checkScale, { toValue: 1, tension: 50, friction: 6, useNativeDriver: true }).start();
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Grid bg */}
      <View style={s.bgGrid}>
        {Array.from({ length: 8 }).map((_, i) => (
          <View key={`h${i}`} style={[s.gridLineH, { top: (SCREEN_H / 8) * i }]} />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={`v${i}`} style={[s.gridLineV, { left: (SCREEN_W / 6) * i }]} />
        ))}
        <LinearGradient
          colors={['transparent', 'rgba(124,58,237,0.12)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={s.accentLine}
        />
      </View>

      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View style={[s.container, { paddingTop: insets.top + 16, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

          {/* Back */}
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={s.content}>
            {sent ? (
              <>
                {/* Success state */}
                <Animated.View style={[s.iconCircle, s.iconCircleSuccess, { transform: [{ scale: checkScale }] }]}>
                  <Ionicons name="checkmark" size={36} color={colors.success} />
                </Animated.View>

                <Text style={s.title}>{t('forgotPassword', 'sentTitle')}</Text>
                <Text style={s.sub}>{t('forgotPassword', 'sentSub')}</Text>

                <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.85} style={{ width: '100%', marginTop: 32 }}>
                  <LinearGradient
                    colors={['#7C3AED', '#9333EA']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={s.primaryBtn}
                  >
                    <Text style={s.primaryBtnText}>{t('forgotPassword', 'backToLogin')}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* Form state */}
                <View style={s.iconCircle}>
                  <Ionicons name="key-outline" size={32} color={colors.primary} />
                </View>

                <Text style={s.title}>{t('forgotPassword', 'title')}</Text>
                <Text style={s.sub}>{t('forgotPassword', 'sub')}</Text>

                <View style={[s.inputOuter, focused && s.inputOuterFocused]}>
                  <Ionicons name="mail-outline" size={17} color={focused ? colors.primary : colors.textDim} />
                  <TextInput
                    style={s.input}
                    placeholder={t('login', 'emailPlaceholder')}
                    placeholderTextColor={colors.textDim}
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={loading || !email.trim()}
                  activeOpacity={0.85}
                  style={[{ width: '100%' }, (loading || !email.trim()) && s.btnDisabled]}
                >
                  <LinearGradient
                    colors={loading ? ['#3F3F46', '#3F3F46'] : ['#7C3AED', '#9333EA']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={s.primaryBtn}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={s.primaryBtnText}>{t('forgotPassword', 'sendBtn')}</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.bgVoid },
  flex: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 28 },

  bgGrid: { ...StyleSheet.absoluteFillObject },
  gridLineH: { position: 'absolute', left: 0, right: 0, height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.03)' },
  gridLineV: { position: 'absolute', top: 0, bottom: 0, width: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.03)' },
  accentLine: { position: 'absolute', top: SCREEN_H * 0.12, left: 0, right: 0, height: 1 },

  backBtn: { marginBottom: 24 },

  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },

  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(124,58,237,0.08)',
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 28,
  },
  iconCircleSuccess: {
    backgroundColor: 'rgba(52,211,153,0.08)',
    borderColor: 'rgba(52,211,153,0.2)',
  },

  title: {
    fontSize: 24, fontWeight: '800', color: colors.textPrimary,
    textAlign: 'center', marginBottom: 10,
  },
  sub: {
    fontSize: 14, color: colors.textMuted,
    textAlign: 'center', lineHeight: 22,
    paddingHorizontal: 10, marginBottom: 32,
  },

  inputOuter: {
    flexDirection: 'row', alignItems: 'center',
    height: 54, borderRadius: 16, width: '100%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 18, gap: 12,
    marginBottom: 18,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  inputOuterFocused: {
    borderColor: 'rgba(124,58,237,0.45)',
    backgroundColor: 'rgba(124,58,237,0.05)',
  },
  input: { flex: 1, color: colors.textPrimary, fontSize: 15 },

  primaryBtn: { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },

  btnDisabled: { opacity: 0.5 },
}));
