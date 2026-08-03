// WeWatch Mobile — WatchParty RoomInfoBar
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TrackedTouchable } from '@components/common/TrackedTouchable';

interface RoomInfoBarProps {
  roomName: string;
  memberCount: number;
  /** Localized "participants" suffix — was hardcoded Uzbek ("ishtirokchi") regardless of the
   * app's selected language; caller now passes t('watchParty', 'participantsSuffix'). */
  participantsLabel: string;
  /** Localized "Owner" badge text — was hardcoded Uzbek ("Egasi") for the same reason. */
  ownerLabel: string;
  /** p2p/turn = mesh DataChannel is carrying sync (turn = routed via TURN relay, not direct);
   * socket = mesh silent/unavailable, server relay in use. See useWatchParty's activeTransport. */
  activeTransport?: 'p2p' | 'turn' | 'socket';
  isOwner: boolean;
  hasMessages: boolean;
  /** T-S167 (variant C): mute lives here so it's reachable with the chat/voice panel fully
   * closed — previously it only existed inside VoiceChatControls, gated behind `showVoice`. */
  isVoiceJoined: boolean;
  isVoiceMuted: boolean;
  onToggleInvite: () => void;
  onToggleChat: () => void;
  onToggleMute: () => void;
  onLeave: () => void;
}

const TRANSPORT_META = {
  p2p: { label: 'P2P', color: '#4ADE80', icon: 'flash' as const },
  turn: { label: 'TURN', color: '#FBBF24', icon: 'swap-horizontal' as const },
  socket: { label: 'Server', color: 'rgba(255,255,255,0.4)', icon: 'cloud-outline' as const },
};

export const RoomInfoBar = React.memo(function RoomInfoBar({
  roomName,
  memberCount,
  participantsLabel,
  ownerLabel,
  activeTransport,
  isOwner,
  hasMessages,
  isVoiceJoined,
  isVoiceMuted,
  onToggleInvite,
  onToggleChat,
  onToggleMute,
  onLeave,
}: RoomInfoBarProps) {
  const transport = activeTransport ? TRANSPORT_META[activeTransport] : null;
  return (
    <View style={s.container}>
      {/* Left: room info */}
      <View style={s.left}>
        <View style={s.liveIndicator}>
          <View style={s.livePip} />
        </View>
        <View style={s.textGroup}>
          <Text style={s.roomName} numberOfLines={1}>{roomName}</Text>
          <View style={s.metaRow}>
            <Ionicons name="people" size={11} color="rgba(255,255,255,0.35)" />
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
        </View>
      </View>

      {/* Right: actions */}
      <View style={s.actions}>
        <TrackedTouchable trackId="roombar:toggle_invite" onPress={onToggleInvite} style={s.actionBtn} activeOpacity={0.7}>
          <Ionicons name="person-add-outline" size={19} color="rgba(255,255,255,0.70)" />
        </TrackedTouchable>

        <TrackedTouchable trackId="roombar:toggle_chat" onPress={onToggleChat} style={s.actionBtn} activeOpacity={0.7}>
          <Ionicons name="chatbubble-outline" size={19} color="rgba(255,255,255,0.70)" />
          {hasMessages && <View style={s.notifDot} />}
        </TrackedTouchable>

        <TrackedTouchable
          trackId="roombar:toggle_mute"
          onPress={onToggleMute}
          style={[s.actionBtn, isVoiceJoined && !isVoiceMuted && s.actionBtnMicLive]}
          activeOpacity={0.7}
          trackMeta={{ willMute: !isVoiceMuted }}
        >
          <Ionicons
            name={isVoiceMuted || !isVoiceJoined ? 'mic-off-outline' : 'mic'}
            size={19}
            color={isVoiceJoined && !isVoiceMuted ? '#4ADE80' : 'rgba(255,255,255,0.70)'}
          />
        </TrackedTouchable>

        <TrackedTouchable trackId="roombar:leave" onPress={onLeave} style={[s.actionBtn, s.leaveBtn]} activeOpacity={0.7}>
          <Ionicons name="exit-outline" size={19} color="#F87171" />
        </TrackedTouchable>
      </View>
    </View>
  );
});

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 16,
    backgroundColor: '#0F0F1C',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    gap: 14,
    minHeight: 60,
  },

  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
  },

  liveIndicator: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: 'rgba(74,222,128,0.18)',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  livePip: {
    width: 5, height: 5, borderRadius: 2.5,
    backgroundColor: '#4ADE80',
  },

  textGroup: { flex: 1, minWidth: 0 },

  roomName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
    flexWrap: 'nowrap',
  },
  metaText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.38)',
  },
  separator: {
    width: 2, height: 2, borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginHorizontal: 2,
  },
  ownerLabel: {
    fontSize: 11,
    color: '#FFD700',
    fontWeight: '600',
  },
  transportLabel: {
    fontSize: 11,
    fontWeight: '600',
  },

  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexShrink: 0,
  },

  actionBtn: {
    width: 38, height: 38,
    borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },

  leaveBtn: {
    backgroundColor: 'rgba(248,113,113,0.10)',
    marginLeft: 2,
  },

  actionBtnMicLive: {
    backgroundColor: 'rgba(74,222,128,0.14)',
  },

  notifDot: {
    position: 'absolute',
    top: 7, right: 7,
    width: 7, height: 7, borderRadius: 3.5,
    backgroundColor: '#7B72F8',
    borderWidth: 1.5,
    borderColor: '#0F0F1C',
  },
});
