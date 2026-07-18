// WeWatch — Join tab for WatchPartyCreateScreen
import React, { useState, useRef, useCallback } from 'react';
import { View, Text, TextInput, ActivityIndicator } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { TrackedTouchable } from '@components/common/TrackedTouchable';
import { useTheme } from '@theme/index';
import { watchPartyApi } from '@api/watchParty.api';
import { FadeSlideIn } from '@components/common/FadeSlideIn';
import { useWatchPartyCreateStyles } from './watchPartyCreate.styles';
import type { ModalStackParamList } from '@app-types/index';
import { translations } from '@i18n/index';
import { appAlert } from '@components/common/AppAlert';

type Nav = NativeStackNavigationProp<ModalStackParamList, 'WatchPartyCreate'>;
type TFn = (section: keyof typeof translations, key: string) => string;

interface Props {
  navigation: Nav;
  t: TFn;
}

const CODE_LENGTH = 6;

export function JoinTab({ navigation, t }: Props) {
  const { colors } = useTheme();
  const s = useWatchPartyCreateStyles();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleChangeCode = (text: string) => {
    setCode(text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LENGTH));
  };

  const handleJoin = useCallback(async () => {
    if (code.length < CODE_LENGTH) {
      appAlert(t('watchParty', 'error'), t('watchParty', 'joinCodeShort'));
      return;
    }
    setLoading(true);
    try {
      const room = await watchPartyApi.joinByInviteCode(code);
      navigation.replace('WatchParty', { roomId: room._id });
    } catch {
      appAlert(t('watchParty', 'error'), t('watchParty', 'joinError'));
    } finally {
      setLoading(false);
    }
  }, [code, navigation, t]);

  return (
    <View style={s.joinContent}>
      <FadeSlideIn delay={100}>
        <View style={s.joinIconWrap}>
          <LinearGradient colors={[colors.secondary + '20', colors.primary + '20']} style={s.joinIconGradient}>
            <Ionicons name="key-outline" size={48} color={colors.secondary} />
          </LinearGradient>
        </View>
      </FadeSlideIn>

      <FadeSlideIn delay={150}>
        <Text style={s.joinHeading}>{t('watchParty', 'joinHeading')}</Text>
      </FadeSlideIn>
      <FadeSlideIn delay={200}>
        <Text style={s.joinSub}>{t('watchParty', 'joinSub')}</Text>
      </FadeSlideIn>

      <FadeSlideIn delay={250}>
        <TrackedTouchable trackId="join_room:focus_code_input" onPress={() => inputRef.current?.focus()} activeOpacity={0.9}>
          <View style={s.codeRow}>
            {Array.from({ length: CODE_LENGTH }).map((_, i) => (
              <View key={i} style={[s.codeBox, code.length === i && s.codeBoxActive, i < code.length && s.codeBoxFilled]}>
                <Text style={s.codeChar}>{code[i] ?? ''}</Text>
              </View>
            ))}
          </View>
        </TrackedTouchable>
        <TextInput
          ref={inputRef} value={code} onChangeText={handleChangeCode}
          autoCapitalize="characters" autoCorrect={false} maxLength={CODE_LENGTH}
          style={s.hiddenInput} autoFocus={false}
        />
      </FadeSlideIn>

      <FadeSlideIn delay={300}>
        <TrackedTouchable
          trackId="join_room:submit"
          style={[s.joinBtn, (loading || code.length < CODE_LENGTH) && s.joinBtnDisabled]}
          onPress={handleJoin} disabled={loading || code.length < CODE_LENGTH} activeOpacity={0.85}
        >
          <LinearGradient colors={[colors.secondary, '#3B82F6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.joinBtnGradient}>
            {loading ? <ActivityIndicator color={colors.white} /> : (
              <>
                <Ionicons name="enter-outline" size={20} color={colors.white} />
                <Text style={s.joinBtnText}>{t('watchParty', 'joinBtn')}</Text>
              </>
            )}
          </LinearGradient>
        </TrackedTouchable>
      </FadeSlideIn>
    </View>
  );
}
