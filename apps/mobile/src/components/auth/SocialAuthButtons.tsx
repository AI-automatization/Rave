// CineSync Mobile — Social auth buttons (Google + Telegram)
import React from 'react';
import { View, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import { colors, BRAND_COLORS } from '@theme/index';

function GradientGoogleIcon() {
  return (
    <MaskedView
      maskElement={<FontAwesome5 name="google" size={20} color={colors.black} />}
    >
      <LinearGradient
        colors={[...BRAND_COLORS.googleGradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <FontAwesome5 name="google" size={20} style={s.iconHidden} />
      </LinearGradient>
    </MaskedView>
  );
}

interface SocialAuthButtonsProps {
  googleLoading: boolean;
  telegramLoading: boolean;
  googleDisabled?: boolean;
  onGooglePress: () => void;
  onTelegramPress: () => void;
}

export function SocialAuthButtons({
  googleLoading,
  telegramLoading,
  googleDisabled,
  onGooglePress,
  onTelegramPress,
}: SocialAuthButtonsProps) {
  return (
    <View style={s.socialRow}>
      <TouchableOpacity
        onPress={onGooglePress}
        disabled={googleLoading || googleDisabled}
        activeOpacity={0.85}
        style={[s.socialHalf, googleLoading && s.btnDisabled]}
      >
        <LinearGradient
          colors={[...BRAND_COLORS.googleGradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.socialBorder}
        >
          <View style={s.socialInner}>
            {googleLoading ? (
              <ActivityIndicator color={colors.textPrimary} size="small" />
            ) : (
              <GradientGoogleIcon />
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onTelegramPress}
        disabled={telegramLoading}
        activeOpacity={0.85}
        style={[s.socialHalf, telegramLoading && s.btnDisabled]}
      >
        <LinearGradient
          colors={[...BRAND_COLORS.telegramGradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.socialBorder}
        >
          <View style={s.socialInner}>
            {telegramLoading ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <FontAwesome5 name="telegram-plane" size={20} color={BRAND_COLORS.telegramBlue} />
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  socialRow: { flexDirection: 'row', gap: 14 },
  socialHalf: { flex: 1 },
  socialBorder: { height: 56, borderRadius: 16, padding: 1.5 },
  socialInner: {
    flex: 1,
    borderRadius: 14.5,
    backgroundColor: colors.bgVoid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  iconHidden: { opacity: 0 },
});
