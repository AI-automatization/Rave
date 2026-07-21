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

  // NTP-style clock sync: server echoes client ping with its own timestamp so the
  // client can measure the server↔client clock offset (used to de-skew scheduledAt +
  // drift math on the socket sync path). Mesh path has its own DataChannel NTP.
  CLOCK_PONG: 'clock:pong',

  MEMBER_JOINED: 'member:joined',
  MEMBER_LEFT: 'member:left',
  MEMBER_KICKED: 'member:kicked',
  MEMBER_MUTED: 'member:muted',

  ROOM_MESSAGE: 'room:message',
  ROOM_EMOJI: 'room:emoji',

  REACTION_BROADCAST: 'reaction:broadcast',

  PLAYLIST_UPDATED: 'playlist:updated',

  VOICE_JOINED:     'voice:joined',
  VOICE_USER_JOINED: 'voice:user_joined',
  VOICE_USER_LEFT:  'voice:user_left',
  VOICE_OFFER:      'voice:offer',
  VOICE_ANSWER:     'voice:answer',
  VOICE_ICE:        'voice:ice',
  VOICE_SPEAKING:   'voice:speaking',

  // WebRTC mesh signalling (Bosqich B)
  PEER_OFFER:        'mesh:peer_offer',
  PEER_ANSWER:       'mesh:peer_answer',
  PEER_ICE:          'mesh:peer_ice',
  MESH_PEER_JOINED:  'mesh:peer_joined',
  MESH_PEER_LEFT:    'mesh:peer_left',

  ADMIN_MONITORING: 'admin:monitoring',
  ADMIN_LEFT_ROOM:  'admin:left',

  NOTIFICATION_NEW: 'notification:new',

  DM_MESSAGE: 'dm:message',
  DM_READ:    'dm:read',

  // Kosmi-style shared virtual browser: server runs a real headless Chromium page (Playwright
  // CDP screencast), owner controls it, JPEG frames broadcast to every room member.
  VB_STARTED: 'vb:started',
  VB_FRAME:   'vb:frame',
  VB_STOPPED: 'vb:stopped',
  VB_ERROR:   'vb:error',
  // Owner's pointer position relayed to everyone else — headless Chrome's screencast frames
  // never include an OS cursor, so without this nobody but the owner can tell where they're
  // about to click (Kosmi shows a synced cursor for exactly this reason).
  VB_CURSOR:  'vb:cursor',

  ERROR: 'error',
} as const);

// Client → Server events
export const CLIENT_EVENTS = Object.freeze({
  ADMIN_JOIN_ROOM:  'admin:join',
  ADMIN_LEAVE_ROOM: 'admin:leave',

  JOIN_ROOM: 'room:join',
  LEAVE_ROOM: 'room:leave',

  PLAY: 'video:play',
  PAUSE: 'video:pause',
  SEEK: 'video:seek',
  BUFFER_START: 'video:buffer_start',
  BUFFER_END: 'video:buffer_end',
  HEARTBEAT: 'video:heartbeat',
  CLOCK_PING: 'clock:ping',

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

  SEND_REACTION: 'reaction:send',

  // Owner xona mediasini almashtiradi → server room:updated broadcast qiladi barcha memberlarga
  CHANGE_MEDIA: 'room:media:change',

  // WebRTC mesh signalling (Bosqich B)
  PEER_OFFER:  'mesh:peer_offer',
  PEER_ANSWER: 'mesh:peer_answer',
  PEER_ICE:    'mesh:peer_ice',
  MESH_JOIN:   'mesh:join',
  MESH_LEAVE:  'mesh:leave',

  DM_SEND: 'dm:send',
  DM_READ_UNTIL: 'dm:read_until',

  // Kosmi-style shared virtual browser (owner-only)
  VB_START: 'vb:start',
  VB_INPUT: 'vb:input',
  VB_STOP:  'vb:stop',
} as const);

export type ServerEvent = (typeof SERVER_EVENTS)[keyof typeof SERVER_EVENTS];
export type ClientEvent = (typeof CLIENT_EVENTS)[keyof typeof CLIENT_EVENTS];
