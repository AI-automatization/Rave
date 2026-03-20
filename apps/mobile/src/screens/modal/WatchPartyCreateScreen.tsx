// CineSync Mobile — WatchPartyCreateScreen
// Composition-only screen: delegates logic to useWatchPartyCreate,
// UI sections to FilmSelector and FriendPicker
import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '@theme/index';
import type { ModalStackParamList } from '@app-types/index';
import { useWatchPartyCreate } from '@hooks/useWatchPartyCreate';
import { FilmSelector } from '@components/watchParty/FilmSelector';
import { FriendPicker } from '@components/watchParty/FriendPicker';

type Nav = NativeStackNavigationProp<ModalStackParamList, 'WatchPartyCreate'>;

export function WatchPartyCreateScreen() {
  const navigation = useNavigation<Nav>();
  const wp = useWatchPartyCreate();

  const onCreateSuccess = (roomId: string) => {
    navigation.replace('WatchParty', { roomId });
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Watch Party</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Create | Join tabs */}
      <View style={styles.modeTabs}>
        <View style={[styles.modeTab, styles.modeTabActive]}>
          <Ionicons name="add-circle-outline" size={16} color={colors.primary} />
          <Text style={[styles.modeTabText, styles.modeTabTextActive]}>Yaratish</Text>
        </View>
        <TouchableOpacity
          style={styles.modeTab}
          onPress={() => navigation.navigate('WatchPartyJoin')}
          activeOpacity={0.8}
        >
          <Ionicons name="enter-outline" size={16} color={colors.textMuted} />
          <Text style={styles.modeTabText}>Kod orqali</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Film selection */}
        <FilmSelector
          filmMode={wp.filmMode}
          onSwitchToCatalog={wp.switchToCatalog}
          onSwitchToUrl={wp.switchToUrl}
          selectedMovie={wp.selectedMovie}
          onSelectMovie={wp.selectMovie}
          onClearMovie={wp.clearSelectedMovie}
          searchQuery={wp.searchQuery}
          onSearchChange={wp.setSearchQuery}
          searching={wp.searching}
          searchResults={wp.searchResults}
          videoUrl={wp.videoUrl}
          onVideoUrlChange={wp.setVideoUrl}
          isExtracting={wp.isExtracting}
          extractResult={wp.extractResult}
          fallbackMode={wp.fallbackMode}
        />

        {/* Room name */}
        <View style={styles.section}>
          <Text style={styles.label}>XONA NOMI</Text>
          <TextInput
            style={styles.input}
            value={wp.roomName}
            onChangeText={wp.setRoomName}
            placeholder="Masalan: Kecha filmlar kechasi"
            placeholderTextColor={colors.textMuted}
            maxLength={50}
          />
          <Text style={styles.charCount}>{wp.roomName.length}/50</Text>
        </View>

        {/* Private toggle + Max members */}
        <View style={styles.section}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons
                name={wp.isPrivate ? 'lock-closed' : 'globe-outline'}
                size={20}
                color={colors.secondary}
              />
              <View>
                <Text style={styles.rowTitle}>{wp.isPrivate ? 'Shaxsiy' : 'Ommaviy'}</Text>
                <Text style={styles.rowSub}>
                  {wp.isPrivate ? 'Faqat invite kod orqali' : 'Barcha qo\'shila oladi'}
                </Text>
              </View>
            </View>
            <Switch
              value={wp.isPrivate}
              onValueChange={wp.setIsPrivate}
              trackColor={{ false: colors.bgElevated, true: colors.primary }}
              thumbColor={colors.textPrimary}
            />
          </View>
          <Text style={[styles.label, styles.membersLabel]}>MAKSIMAL A'ZOLAR</Text>
          <View style={styles.membersRow}>
            {wp.maxMembersOptions.map(n => (
              <TouchableOpacity
                key={n}
                style={[styles.memberChip, wp.maxMembers === n && styles.memberChipActive]}
                onPress={() => wp.setMaxMembers(n)}
              >
                <Text
                  style={[styles.memberChipText, wp.maxMembers === n && styles.memberChipTextActive]}
                >
                  {n}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Friends */}
        <FriendPicker
          friends={wp.friends}
          selectedFriendIds={wp.selectedFriendIds}
          selectedFriends={wp.selectedFriends}
          onToggleFriend={wp.toggleFriend}
        />

        {/* Info card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={16} color={colors.secondary} />
          <Text style={styles.infoText}>
            Xona yaratilgach invite kod hosil bo'ladi. Tanlangan do'stlaringizga yuboring!
          </Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.createBtn, wp.loading && styles.createBtnDisabled]}
          onPress={() => wp.handleCreate(onCreateSuccess)}
          disabled={wp.loading}
          activeOpacity={0.8}
        >
          {wp.loading ? (
            <ActivityIndicator color={colors.textPrimary} />
          ) : (
            <>
              <Ionicons name="play-circle" size={20} color={colors.textPrimary} />
              <Text style={styles.createBtnText}>Xona yaratish</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgBase },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: spacing.xs },
  title: { ...typography.h2, color: colors.textPrimary },
  headerSpacer: { width: 40 },
  modeTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  modeTabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  modeTabText: { ...typography.body, color: colors.textMuted, fontWeight: '600' },
  modeTabTextActive: { color: colors.primary },
  content: { padding: spacing.lg, gap: spacing.xl },
  section: { gap: spacing.sm },
  label: { ...typography.label, color: colors.textMuted },
  membersLabel: { marginTop: spacing.md },

  // Input
  input: {
    backgroundColor: colors.bgElevated,
    color: colors.textPrimary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  charCount: { ...typography.caption, color: colors.textMuted, textAlign: 'right' },

  // Row (private toggle)
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgElevated,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  rowTitle: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  rowSub: { ...typography.caption, color: colors.textMuted },

  // Max members
  membersRow: { flexDirection: 'row', gap: spacing.sm },
  memberChip: {
    flex: 1,
    paddingVertical: spacing.md,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  memberChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  memberChipText: { ...typography.body, color: colors.textMuted, fontWeight: '600' },
  memberChipTextActive: { color: colors.textPrimary },

  // Info card
  infoCard: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.bgElevated,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.secondary,
  },
  infoText: { ...typography.caption, color: colors.textSecondary, flex: 1 },

  // Footer
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  createBtnDisabled: { opacity: 0.6 },
  createBtnText: { ...typography.h3, color: colors.textPrimary },
});
