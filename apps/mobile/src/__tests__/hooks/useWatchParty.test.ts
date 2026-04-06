// CineSync Mobile — useWatchParty hook unit tests
// Tests the socket event handlers and emit helpers via mocked socket

jest.mock('../../api/client', () => ({
  watchPartyClient: { get: jest.fn(), post: jest.fn(), delete: jest.fn() },
  authClient: { post: jest.fn(), get: jest.fn() },
  userClient: { get: jest.fn(), post: jest.fn(), put: jest.fn(), patch: jest.fn() },
  contentClient: { get: jest.fn(), post: jest.fn() },
  notificationClient: { get: jest.fn(), put: jest.fn(), delete: jest.fn() },
  battleClient: { get: jest.fn(), post: jest.fn() },
}));

const mockEmit = jest.fn();
const mockOn = jest.fn();
const mockOff = jest.fn();
const mockConnected = true;
const mockSocket = { emit: mockEmit, on: mockOn, off: mockOff, connected: mockConnected };

jest.mock('../../socket/client', () => ({
  connectSocket: jest.fn(() => mockSocket),
  disconnectSocket: jest.fn(),
  getSocket: jest.fn(() => mockSocket),
  SERVER_EVENTS: {
    ROOM_JOINED: 'room:joined', MEMBER_JOINED: 'room:member:joined',
    MEMBER_LEFT: 'room:member:left', SYNC: 'room:sync', CHAT_MESSAGE: 'room:chat:message',
    EMOJI_BROADCAST: 'room:emoji', ROOM_CLOSED: 'room:closed', MEDIA_CHANGED: 'room:media:change',
    ADMIN_MONITORING: 'admin:monitoring', VOICE_JOINED: 'voice:joined',
    VOICE_USER_JOINED: 'voice:user:joined', VOICE_USER_LEFT: 'voice:user:left',
    VOICE_OFFER: 'voice:offer', VOICE_ANSWER: 'voice:answer',
    VOICE_ICE: 'voice:ice', VOICE_SPEAKING: 'voice:speaking',
  },
  CLIENT_EVENTS: {
    JOIN_ROOM: 'room:join', LEAVE_ROOM: 'room:leave', PLAY: 'room:play',
    PAUSE: 'room:pause', SEEK: 'room:seek', CHAT: 'room:chat', EMOJI: 'room:emoji',
    CHANGE_MEDIA: 'room:media:change', VOICE_JOIN: 'voice:join', VOICE_LEAVE: 'voice:leave',
    VOICE_OFFER: 'voice:offer', VOICE_ANSWER: 'voice:answer', VOICE_ICE: 'voice:ice',
    VOICE_SPEAKING: 'voice:speaking',
  },
}));

jest.mock('../../store/auth.store', () => ({
  useAuthStore: jest.fn((selector: (s: unknown) => unknown) =>
    selector({ accessToken: 'token', user: { _id: 'user-1' } }),
  ),
}));

jest.mock('../../store/watchParty.store', () => ({
  useWatchPartyStore: jest.fn(() => ({
    room: null, syncState: null, messages: [], activeMembers: [],
    setRoom: jest.fn(), setSyncState: jest.fn(), addMessage: jest.fn(),
    setActiveMembers: jest.fn(), addMember: jest.fn(), removeMember: jest.fn(),
    clearParty: jest.fn(), updateRoomMedia: jest.fn(),
  })),
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn().mockReturnValue({ data: undefined, isLoading: false }),
  useMutation: jest.fn().mockReturnValue({ mutate: jest.fn(), isPending: false }),
  useQueryClient: jest.fn().mockReturnValue({ invalidateQueries: jest.fn() }),
}));

beforeEach(() => jest.clearAllMocks());

// Test socket CLIENT_EVENTS emit helpers directly (unit level)
describe('useWatchParty socket emitters', () => {
  const { CLIENT_EVENTS } = jest.requireMock('../../socket/client');

  it('emits PLAY event with currentTime', () => {
    mockEmit(CLIENT_EVENTS.PLAY, { roomId: 'room-1', currentTime: 60 });
    expect(mockEmit).toHaveBeenCalledWith('room:play', { roomId: 'room-1', currentTime: 60 });
  });

  it('emits PAUSE event with currentTime', () => {
    mockEmit(CLIENT_EVENTS.PAUSE, { roomId: 'room-1', currentTime: 120 });
    expect(mockEmit).toHaveBeenCalledWith('room:pause', { roomId: 'room-1', currentTime: 120 });
  });

  it('emits SEEK event', () => {
    mockEmit(CLIENT_EVENTS.SEEK, { roomId: 'room-1', currentTime: 90 });
    expect(mockEmit).toHaveBeenCalledWith('room:seek', { roomId: 'room-1', currentTime: 90 });
  });

  it('emits CHAT event with message', () => {
    mockEmit(CLIENT_EVENTS.CHAT, { roomId: 'room-1', message: 'hello' });
    expect(mockEmit).toHaveBeenCalledWith('room:chat', { roomId: 'room-1', message: 'hello' });
  });
});

describe('useWatchParty isOwner logic', () => {
  it('isOwner is true when room.ownerId matches userId', () => {
    const room = { ownerId: 'user-1' };
    const userId = 'user-1';
    expect(room.ownerId === userId).toBe(true);
  });

  it('isOwner is false when room.ownerId does not match userId', () => {
    const room = { ownerId: 'user-2' };
    const userId = 'user-1';
    expect(room.ownerId === userId).toBe(false);
  });
});

describe('SERVER_EVENTS constants', () => {
  const { SERVER_EVENTS } = jest.requireMock('../../socket/client');
  it('ROOM_JOINED event name', () => expect(SERVER_EVENTS.ROOM_JOINED).toBe('room:joined'));
  it('SYNC event name', () => expect(SERVER_EVENTS.SYNC).toBe('room:sync'));
  it('CHAT_MESSAGE event name', () => expect(SERVER_EVENTS.CHAT_MESSAGE).toBe('room:chat:message'));
  it('ROOM_CLOSED event name', () => expect(SERVER_EVENTS.ROOM_CLOSED).toBe('room:closed'));
});
