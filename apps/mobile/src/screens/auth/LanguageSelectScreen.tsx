// CineSync Mobile — Language Select Screen
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme, createThemedStyles, spacing, borderRadius, typography } from '@theme/index';
import { AuthStackParamList } from '@app-types/index';
import { useLanguageStore, Language } from '@store/language.store';
import { t as translate } from '@i18n/translations';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'LanguageSelect'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface LangOption {
  code: Language;
  flag: string;
  native: string;
  subtitle: string;
}

const LANGUAGES: LangOption[] = [
  { code: 'en', flag: '\u{1F1EC}\u{1F1E7}', native: 'English', subtitle: 'English' },
  { code: 'ru', flag: '\u{1F1F7}\u{1F1FA}', native: '\u0420\u0443\u0441\u0441\u043A\u0438\u0439', subtitle: 'Russian' },
  { code: 'uz', flag: '\u{1F1FA}\u{1F1FF}', native: "O'zbek", subtitle: 'Uzbek' },
];

export function LanguageSelectScreen() {
  const navigation = useNavigation<Nav>();
  const { lang: storedLang, setLang } = useLanguageStore();
  const [selected, setSelected] = useState<Language>(storedLang);
  const { colors } = useTheme();
  const styles = useStyles();

  const handleContinue = () => {
    setLang(selected);
    navigation.replace('Onboarding');
  };

  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoWrap}>
        <Text style={styles.logo}>CINE</Text>
        <Text style={styles.logoAccent}>SYNC</Text>
      </View>

      {/* Title */}
      <Text style={styles.title}>{translate('languageSelect', 'chooseLanguage', selected)}</Text>

      {/* Language cards */}
      <View style={styles.cardsWrap}>
        {LANGUAGES.map((lang) => {
          const isActive = selected === lang.code;
          return (
            <TouchableOpacity
              key={lang.code}
              style={[styles.card, isActive && styles.cardActive]}
              activeOpacity={0.7}
              onPress={() => setSelected(lang.code)}
            >
              <Text style={styles.flag}>{lang.flag}</Text>
              <View style={styles.cardText}>
                <Text style={styles.langNative}>{lang.native}</Text>
                <Text style={styles.langSubtitle}>{lang.subtitle}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Continue button */}
      <TouchableOpacity style={styles.continueBtn} onPress={handleContinue}>
        <Text style={styles.continueText}>{translate('languageSelect', 'continue', selected)}</Text>
      </TouchableOpacity>
    </View>
  );
}

const CARD_WIDTH = SCREEN_WIDTH - spacing.xl * 2;

const useStyles = createThemedStyles((colors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.bgBase,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  logoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  logo: {
    fontSize: 40,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 2,
  },
  logoAccent: {
    fontSize: 40,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 2,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  cardsWrap: {
    width: CARD_WIDTH,
    gap: spacing.md,
    marginBottom: spacing.xxxl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderWidth: 2,
    borderColor: colors.border,
  },
  cardActive: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  flag: {
    fontSize: 32,
    marginRight: spacing.lg,
  },
  cardText: {
    flex: 1,
  },
  langNative: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  langSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  continueBtn: {
    width: CARD_WIDTH,
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.full,
    alignItems: 'center',
  },
  continueText: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 16,
  },
}));
