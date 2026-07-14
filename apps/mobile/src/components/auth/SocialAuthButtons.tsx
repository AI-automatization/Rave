// WeWatch Mobile — Social auth buttons (Google wide top + Apple/Telegram row below)
import React from 'react';
import { View, ActivityIndicator, Platform, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import { TrackedTouchable } from '@components/common/TrackedTouchable';
import { useTheme, createThemedStyles, BRAND_COLORS } from '@theme/index';
import { useT } from '@i18n/index';

const APPLE_GRADIENT = ['rgba(255,255,255,0.22)', 'rgba(255,255,255,0.07)'] as const;

function GradientGoogleIcon({ size = 20 }: { size?: number }) {
  const { colors } = useTheme();
  return (
    <MaskedView maskElement={<FontAwesome5 name="google" size={size} color={colors.black} />}>
      <LinearGradient
        colors={[...BRAND_COLORS.googleGradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <FontAwesome5 name="google" size={size} style={s_hidden} />
      </LinearGradient>
    </MaskedView>
  );
}

interface SocialAuthButtonsProps {
  googleLoading: boolean;
  telegramLoading: boolean;
  appleLoading?: boolean;
  appleAvailable?: boolean;
  googleDisabled?: boolean;
  onGooglePress: () => void;
  onTelegramPress: () => void;
  onApplePress?: () => void;
}

// ── Wide button (Google) ─────────────────────────────────────────────────────
interface WideBtnProps {
  gradient: readonly string[];
  icon: React.ReactNode;
  label: string;
  loading: boolean;
  disabled?: boolean;
  onPress: () => void;
}

function WideBtn({ gradient, icon, label, loading, disabled, onPress }: WideBtnProps) {
  const s = useStyles();
  const { colors } = useTheme();
  return (
    <TrackedTouchable
      trackId="social_auth:google"
      onPress={onPress}
      disabled={loading || disabled}
      activeOpacity={0.82}
      style={(loading || disabled) && s.btnDisabled}
    >
      <LinearGradient
        colors={gradient as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.wideBorder}
      >
        <View style={s.wideInner}>
          {loading ? (
            <ActivityIndicator color={colors.textPrimary} size="small" />
          ) : (
            <>
              {icon}
              <Text style={s.wideLabel}>{label}</Text>
            </>
          )}
        </View>
      </LinearGradient>
    </TrackedTouchable>
  );
}

// ── Small icon button (Apple / Telegram) ─────────────────────────────────────
interface IconBtnProps {
  gradient: readonly string[];
  icon: React.ReactNode;
  label: string;
  loading: boolean;
  disabled?: boolean;
  onPress: () => void;
}

function IconBtn({ gradient, icon, label, loading, disabled, onPress }: IconBtnProps) {
  const s = useStyles();
  const { colors } = useTheme();
  return (
    <TrackedTouchable
      trackId={`social_auth:${label.toLowerCase()}`}
      onPress={onPress}
      disabled={loading || disabled}
      activeOpacity={0.82}
      style={[s.iconWrap, (loading || disabled) && s.btnDisabled]}
    >
      <LinearGradient
        colors={gradient as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.iconBorder}
      >
        <View style={s.iconInner}>
          {loading
            ? <ActivityIndicator color={colors.textPrimary} size="small" />
            : icon as React.ReactElement}
        </View>
      </LinearGradient>
      <Text style={s.iconLabel}>{label}</Text>
    </TrackedTouchable>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export function SocialAuthButtons({
  googleLoading,
  telegramLoading,
  appleLoading = false,
  appleAvailable = false,
  googleDisabled,
  onGooglePress,
  onTelegramPress,
  onApplePress,
}: SocialAuthButtonsProps) {
  const showApple = Platform.OS === 'ios' && appleAvailable && !!onApplePress;
  const { t } = useT();

  return (
    <View style={{ gap: 12 }}>
      {/* Google — wide top button */}
      <WideBtn
        gradient={[...BRAND_COLORS.googleGradient]}
        icon={<GradientGoogleIcon size={20} />}
        label={t('login', 'googleBtn')}
        loading={googleLoading}
        disabled={googleDisabled}
        onPress={onGooglePress}
      />

      {/* Apple + Telegram — icon row below */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {showApple && (
          <IconBtn
            gradient={APPLE_GRADIENT}
            icon={<FontAwesome5 name="apple" size={22} color="#fff" />}
            label="Apple"
            loading={appleLoading}
            onPress={onApplePress!}
          />
        )}
        <IconBtn
          gradient={[...BRAND_COLORS.telegramGradient]}
          icon={<FontAwesome5 name="telegram-plane" size={20} color={BRAND_COLORS.telegramBlue} />}
          label="Telegram"
          loading={telegramLoading}
          onPress={onTelegramPress}
        />
      </View>
    </View>
  );
}

const s_hidden = { opacity: 0 };

const useStyles = createThemedStyles((colors) => ({
  btnDisabled: { opacity: 0.45 },

  // Wide button (Google)
  wideBorder: {
    height: 56,
    borderRadius: 16,
    padding: 1.5,
  },
  wideInner: {
    flex: 1,
    borderRadius: 14.5,
    backgroundColor: colors.bgVoid,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  wideLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: 0.2,
  },

  // Icon button (Apple / Telegram)
  iconWrap: {
    flex: 1,
    alignItems: 'center',
    gap: 7,
  },
  iconBorder: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    padding: 1.5,
  },
  iconInner: {
    flex: 1,
    borderRadius: 14.5,
    backgroundColor: colors.bgVoid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
}));
