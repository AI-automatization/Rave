// ⚠️ BU FAYLNI O'ZGARTIRISH 3 TA PLATFORMANI BUZADI!
// O'zgartirish kerak bo'lsa → barcha dasturchilarga xabar bering

// Server → Client events
export const SERVER_EVENTS = Object.freeze({
  ROOM_JOINED: 'room:joined',
  ROOM_LEFT: 'room:left',
  ROOM_CLOSED: 'room:closed',
  ROOM_UPDATED: 'room:updated',
  OWNER_TRANSFERRED: 'room:owner_transferred',

  VIDEO_PLAY: 'video:play',
  VIDEO_PAUSE: 'video:pause',
  VIDEO_SEEK: 'video:seek',
  VIDEO_SYNC: 'video:sync',
  VIDEO_BUFFER: 'video:buffer',
  VIDEO_HEARTBEAT: 'video:heartbeat',

  MEMBER_JOINED: 'member:joined',
  MEMBER_LEFT: 'member:left',
  MEMBER_KICKED: 'member:kicked',
  MEMBER_MUTED: 'member:muted',

  ROOM_MESSAGE: 'room:message',
  ROOM_EMOJI: 'room:emoji',

  VOICE_JOINED:     'voice:joined',
  VOICE_USER_JOINED: 'voice:user_joined',
  VOICE_USER_LEFT:  'voice:user_left',
  VOICE_OFFER:      'voice:offer',
  VOICE_ANSWER:     'voice:answer',
  VOICE_ICE:        'voice:ice',
  VOICE_SPEAKING:   'voice:speaking',

  ERROR: 'error',
} as const);

// Client → Server events
export const CLIENT_EVENTS = Object.freeze({
  JOIN_ROOM: 'room:join',
  LEAVE_ROOM: 'room:leave',

  PLAY: 'video:play',
  PAUSE: 'video:pause',
  SEEK: 'video:seek',
  BUFFER_START: 'video:buffer_start',
  BUFFER_END: 'video:buffer_end',
  HEARTBEAT: 'video:heartbeat',

  SEND_MESSAGE: 'room:message',
  SEND_EMOJI: 'room:emoji',

  KICK_MEMBER: 'member:kick',
  MUTE_MEMBER: 'member:mute',

  VOICE_JOIN:     'voice:join',
  VOICE_LEAVE:    'voice:leave',
  VOICE_OFFER:    'voice:offer',
  VOICE_ANSWER:   'voice:answer',
  VOICE_ICE:      'voice:ice',
  VOICE_SPEAKING: 'voice:speaking',

  // Owner xona mediasini almashtiradi → server room:updated broadcast qiladi barcha memberlarga
  CHANGE_MEDIA: 'room:media:change',
} as const);

export type ServerEvent = (typeof SERVER_EVENTS)[keyof typeof SERVER_EVENTS];
export type ClientEvent = (typeof CLIENT_EVENTS)[keyof typeof CLIENT_EVENTS];
