// WeWatch Mobile — WatchParty RoomInfoBar
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TrackedTouchable } from '@components/common/TrackedTouchable';

interface RoomInfoBarProps {
  roomName: string;
  memberCount: number;
  participantsLabel: string;
  ownerLabel: string;
  /** p2p/turn = mesh DataChannel is carrying sync; socket = server relay. */
  activeTransport?: 'p2p' | 'turn' | 'socket';
  isOwner: boolean;
  /** Variant B (Stitch, 2026-11-03): actions live in one horizontal chip row under the title. */
  children?: React.ComponentProps<typeof ScrollView>['children'];
}

const TRANSPORT_META = {
  p2p: { label: 'P2P', color: '#4ADE80', icon: 'flash' as const },
  turn: { label: 'TURN', color: '#FBBF24', icon: 'swap-horizontal' as const },
  socket: { label: 'Server', color: 'rgba(255,255,255,0.4)', icon: 'cloud-outline' as const },
};

interface RoomChipProps {
  trackId: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  tone?: 'default' | 'live' | 'danger' | 'accent';
  disabled?: boolean;
  badge?: number;
}

export const RoomChip = React.memo(function RoomChip({ trackId, icon, label, onPress, tone = 'default', disabled, badge }: RoomChipProps) {
  const color = tone === 'live' ? '#4ADE80' : tone === 'danger' ? '#F87171' : tone === 'accent' ? '#A89FFF' : 'rgba(255,255,255,0.75)';
  return (
    <TrackedTouchable
      trackId={trackId}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[s.chip, tone === 'live' && s.chipLive, tone === 'danger' && s.chipDanger, tone === 'accent' && s.chipAccent]}
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={15} color={color} />
      <Text style={[s.chipText, { color }]} numberOfLines={1}>{label}</Text>
      {badge ? <View style={s.chipBadge}><Text style={s.chipBadgeText}>{badge}</Text></View> : null}
    </TrackedTouchable>
  );
});

export const RoomInfoBar = React.memo(function RoomInfoBar({
  roomName,
  memberCount,
  participantsLabel,
  ownerLabel,
  activeTransport,
  isOwner,
  children,
}: RoomInfoBarProps) {
  const transport = activeTransport ? TRANSPORT_META[activeTransport] : null;
  return (
    <View style={s.container}>
      <Text style={s.roomName} numberOfLines={1}>{roomName}</Text>
      <View style={s.metaRow}>
        <View style={s.livePip} />
        <Text style={s.metaText}>{memberCount} {participantsLabel}</Text>
        {isOwner && (
          <>
            <View style={s.separator} />
            <Ionicons name="star" size={10} color="#FFD700" />
            <Text style={s.ownerLabel}>{ownerLabel}</Text>
          </>
        )}
        {transport && (
          <>
            <View style={s.separator} />
            <Ionicons name={transport.icon} size={10} color={transport.color} />
            <Text style={[s.transportLabel, { color: transport.color }]}>{transport.label}</Text>
          </>
        )}
      </View>
      {children ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : null}
    </View>
  );
});

const s = StyleSheet.create({
  container: {
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: '#0F0F1C',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  roomName: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', paddingHorizontal: 14 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2, paddingHorizontal: 14 },
  livePip: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ADE80', marginRight: 2 },
  metaText: { fontSize: 11, color: 'rgba(255,255,255,0.45)' },
  separator: { width: 2, height: 2, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.25)', marginHorizontal: 2 },
  ownerLabel: { fontSize: 11, color: '#FFD700', fontWeight: '600' },
  transportLabel: { fontSize: 11, fontWeight: '600' },

  chipRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingTop: 10 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    height: 34, paddingHorizontal: 12, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  chipLive: { backgroundColor: 'rgba(74,222,128,0.12)', borderColor: 'rgba(74,222,128,0.30)' },
  chipDanger: { backgroundColor: 'rgba(248,113,113,0.10)', borderColor: 'rgba(248,113,113,0.25)' },
  chipAccent: { backgroundColor: 'rgba(123,114,248,0.16)', borderColor: 'rgba(123,114,248,0.35)' },
  chipText: { fontSize: 12, fontWeight: '600' },
  chipBadge: {
    minWidth: 16, height: 16, borderRadius: 8, backgroundColor: '#7B72F8',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  chipBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
});
