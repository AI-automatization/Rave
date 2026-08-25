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
  MEMBER_UNMUTED: 'member:unmuted',

  ROOM_MESSAGE: 'room:message',
  ROOM_EMOJI: 'room:emoji',

  REACTION_BROADCAST: 'reaction:broadcast',
  // Sender-only: burst limit hit (20+ reactions in the trailing 60s window) — client should
  // disable its emoji picker and show retryAfterSec as a countdown, not silently drop taps.
  REACTION_COOLDOWN: 'reaction:cooldown',

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
  // The page VB navigated to (or into, on a later in-session click) is a bot-challenge wall —
  // room-wide, not tied to any one request/response (see virtualBrowser.service.ts's
  // detectBotChallenge and vbSession.helper.ts's startVBForRoom). Not solved/bypassed — this is
  // purely a "can't get through, pick a different source" signal for the UI.
  VB_BLOCKED: 'vb:blocked',
  // Free-tier request is waiting for a VB slot instead of failing outright — see
  // vbQueue.helper.ts. `position` is 1-indexed, re-broadcast to the whole room every time it
  // changes (another room dequeues ahead of it) so the UI can show "N-я в очереди" live.
  VB_QUEUED: 'vb:queued',

  // Owner-only: the video-candidate picker. Server pushes whatever candidates it currently has
  // for the room's video session (from generic-extraction regex matches and/or VB's sniffer) —
  // see REQUEST_CANDIDATES below for when this fires.
  VIDEO_CANDIDATES: 'video:candidates',

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
  UNMUTE_MEMBER: 'member:unmute',

  VOICE_JOIN:     'voice:join',
  VOICE_LEAVE:    'voice:leave',
  VOICE_OFFER:    'voice:offer',
  VOICE_ANSWER:   'voice:answer',
  VOICE_ICE:      'voice:ice',
  VOICE_SPEAKING: 'voice:speaking',

  SEND_REACTION: 'reaction:send',

  // Owner xona mediasini almashtiradi → server room:updated broadcast qiladi barcha memberlarga
  CHANGE_MEDIA: 'room:media:change',

  // Owner xona nomini o'zgartiradi → server room:updated broadcast qiladi barcha memberlarga
  RENAME_ROOM: 'room:rename',

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

  // Owner-only: "show me what candidates you've found so far" — fires when opening the picker
  // (either the initial "is this the right video?" flow, or later via the player's "Это не то
  // видео" menu entry). Server answers from Redis (VIDEO_CANDIDATES below), no re-extraction —
  // candidates are collected proactively as a side effect of CHANGE_MEDIA / VB sniffing, not on
  // demand here.
  REQUEST_CANDIDATES: 'video:candidates:request',
} as const);

export type ServerEvent = (typeof SERVER_EVENTS)[keyof typeof SERVER_EVENTS];
export type ClientEvent = (typeof CLIENT_EVENTS)[keyof typeof CLIENT_EVENTS];
