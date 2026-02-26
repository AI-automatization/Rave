// ⚠️ BU FAYLNI O'ZGARTIRISH 3 TA PLATFORMANI BUZADI!
// O'zgartirish kerak bo'lsa → barcha dasturchilarga xabar bering

// Server → Client events
export const SERVER_EVENTS = Object.freeze({
  ROOM_JOINED: 'room:joined',
  ROOM_LEFT: 'room:left',
  ROOM_CLOSED: 'room:closed',
  ROOM_UPDATED: 'room:updated',

  VIDEO_PLAY: 'video:play',
  VIDEO_PAUSE: 'video:pause',
  VIDEO_SEEK: 'video:seek',
  VIDEO_SYNC: 'video:sync',
  VIDEO_BUFFER: 'video:buffer',

  MEMBER_JOINED: 'member:joined',
  MEMBER_LEFT: 'member:left',
  MEMBER_KICKED: 'member:kicked',
  MEMBER_MUTED: 'member:muted',

  ROOM_MESSAGE: 'room:message',
  ROOM_EMOJI: 'room:emoji',

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

  SEND_MESSAGE: 'room:message',
  SEND_EMOJI: 'room:emoji',

  KICK_MEMBER: 'member:kick',
  MUTE_MEMBER: 'member:mute',
} as const);

export type ServerEvent = (typeof SERVER_EVENTS)[keyof typeof SERVER_EVENTS];
export type ClientEvent = (typeof CLIENT_EVENTS)[keyof typeof CLIENT_EVENTS];
