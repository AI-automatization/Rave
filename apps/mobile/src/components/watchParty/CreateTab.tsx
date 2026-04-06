// CineSync — Create tab for WatchPartyCreateScreen
import React, { useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Switch, ActivityIndicator, Animated,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing } from '@theme/index';
import { useWatchPartyCreate } from '@hooks/useWatchPartyCreate';
import { FilmSelector } from './FilmSelector';
import { FriendPicker } from './FriendPicker';
import { FadeSlideIn } from '@components/common/FadeSlideIn';
import { useWatchPartyCreateStyles } from './watchPartyCreate.styles';
import type { ModalStackParamList } from '@app-types/index';
import { translations } from '@i18n/index';

type Nav = NativeStackNavigationProp<ModalStackParamList, 'WatchPartyCreate'>;
type TFn = (section: keyof typeof translations, key: string) => string;

interface Props {
  navigation: Nav;
  t: TFn;
}

export function CreateTab({ navigation, t }: Props) {
  const wp = useWatchPartyCreate();
  const { colors } = useTheme();
  const s = useWatchPartyCreateStyles();
  const btnScale = useRef(new Animated.Value(1)).current;
  const insets = useSafeAreaInsets();

  const handleCreatePress = () => {
    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(btnScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    wp.handleCreate((roomId: string) => navigation.replace('WatchParty', { roomId }));
  };

  return (
    <>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <FadeSlideIn delay={100}>
          <FilmSelector
            filmMode={wp.filmMode} onSwitchToCatalog={wp.switchToCatalog} onSwitchToUrl={wp.switchToUrl}
            selectedMovie={wp.selectedMovie} onSelectMovie={wp.selectMovie} onClearMovie={wp.clearSelectedMovie}
            searchQuery={wp.searchQuery} onSearchChange={wp.setSearchQuery}
            searching={wp.searching} searchResults={wp.searchResults}
            videoUrl={wp.videoUrl} onVideoUrlChange={wp.setVideoUrl}
            isExtracting={wp.isExtracting} extractResult={wp.extractResult} fallbackMode={wp.fallbackMode}
          />
        </FadeSlideIn>

        <FadeSlideIn delay={150}>
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Ionicons name="text-outline" size={16} color={colors.primary} />
              <Text style={s.label}>{t('watchParty', 'roomNameLabel')}</Text>
            </View>
            <TextInput
              style={s.input} value={wp.roomName} onChangeText={wp.setRoomName}
              placeholder={t('watchParty', 'roomNamePlaceholder')} placeholderTextColor={colors.textMuted} maxLength={50}
            />
            <Text style={s.charCount}>{wp.roomName.length}/50</Text>
          </View>
        </FadeSlideIn>

        <FadeSlideIn delay={200}>
          <View style={s.section}>
            <View style={s.toggleCard}>
              <View style={s.toggleLeft}>
                <View style={[s.toggleIcon, { backgroundColor: colors.secondary + '15' }]}>
                  <Ionicons name={wp.isPrivate ? 'lock-closed' : 'globe-outline'} size={18} color={colors.secondary} />
                </View>
                <View>
                  <Text style={s.rowTitle}>{wp.isPrivate ? t('watchParty', 'private') : t('watchParty', 'public')}</Text>
                  <Text style={s.rowSub}>{wp.isPrivate ? t('watchParty', 'privateDesc') : t('watchParty', 'publicDesc')}</Text>
                </View>
              </View>
              <Switch value={wp.isPrivate} onValueChange={wp.setIsPrivate}
                trackColor={{ false: colors.bgMuted, true: colors.primary + '80' }}
                thumbColor={wp.isPrivate ? colors.primary : colors.textSecondary} />
            </View>

            <View style={s.sectionHeader}>
              <Ionicons name="people-outline" size={16} color={colors.primary} />
              <Text style={s.label}>{t('watchParty', 'maxMembers')}</Text>
            </View>
            <View style={s.membersRow}>
              {wp.maxMembersOptions.map(n => (
                <TouchableOpacity
                  key={n} style={[s.memberChip, wp.maxMembers === n && s.memberChipActive]}
                  onPress={() => wp.setMaxMembers(n)} activeOpacity={0.7}
                >
                  <Text style={[s.memberChipText, wp.maxMembers === n && s.memberChipTextActive]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </FadeSlideIn>

        <FadeSlideIn delay={250}>
          <FriendPicker
            friends={wp.friends} selectedFriendIds={wp.selectedFriendIds}
            selectedFriends={wp.selectedFriends} onToggleFriend={wp.toggleFriend}
          />
        </FadeSlideIn>

        <FadeSlideIn delay={300}>
          <View style={s.infoCard}>
            <View style={[s.infoIconWrap, { backgroundColor: colors.secondary + '15' }]}>
              <Ionicons name="information-circle" size={18} color={colors.secondary} />
            </View>
            <Text style={s.infoText}>{t('watchParty', 'infoMessage')}</Text>
          </View>
        </FadeSlideIn>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={[s.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <TouchableOpacity style={[s.createBtn, wp.loading && s.createBtnDisabled]}
            onPress={handleCreatePress} disabled={wp.loading} activeOpacity={0.85}>
            <LinearGradient colors={[colors.primary, colors.primaryLight ?? '#9333EA']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.createBtnGradient}>
              {wp.loading ? <ActivityIndicator color={colors.white} /> : (
                <>
                  <Ionicons name="play-circle" size={22} color={colors.white} />
                  <Text style={s.createBtnText}>{t('watchParty', 'createRoom')}</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </>
  );
}
