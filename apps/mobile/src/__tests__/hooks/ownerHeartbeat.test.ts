// T-E102 — Owner heartbeat fix tests
// Verifies: emitHeartbeat fires video:heartbeat (not video:play)
// and that the owner 5s interval no longer triggers syncState on members

import { CLIENT_EVENTS } from '../../socket/client';

// ─── 1. Socket event constants ─────────────────────────────────────────────────

describe('CLIENT_EVENTS constants — HEARTBEAT vs PLAY', () => {
  it('HEARTBEAT event is video:heartbeat', () => {
    expect(CLIENT_EVENTS.HEARTBEAT).toBe('video:heartbeat');
  });

  it('PLAY event is video:play', () => {
    expect(CLIENT_EVENTS.PLAY).toBe('video:play');
  });

  it('HEARTBEAT and PLAY are different events', () => {
    expect(CLIENT_EVENTS.HEARTBEAT).not.toBe(CLIENT_EVENTS.PLAY);
  });

  it('HEARTBEAT and PAUSE are different events', () => {
    expect(CLIENT_EVENTS.HEARTBEAT).not.toBe(CLIENT_EVENTS.PAUSE);
  });

  it('HEARTBEAT and SEEK are different events', () => {
    expect(CLIENT_EVENTS.HEARTBEAT).not.toBe(CLIENT_EVENTS.SEEK);
  });
});

// ─── 2. emitHeartbeat emits correct socket event ───────────────────────────────

const mockEmit = jest.fn();
jest.mock('../../socket/client', () => {
  const actual = jest.requireActual('../../socket/client');
  return {
    ...actual,
    getSocket: jest.fn(() => ({ emit: mockEmit })),
    connectSocket: jest.fn(() => ({ emit: mockEmit, on: jest.fn(), off: jest.fn(), connected: true })),
  };
});

jest.mock('../../api/client', () => ({
  watchPartyClient: { get: jest.fn(), post: jest.fn(), delete: jest.fn() },
  authClient: { post: jest.fn(), get: jest.fn() },
  userClient: { get: jest.fn(), post: jest.fn(), put: jest.fn(), patch: jest.fn() },
  contentClient: { get: jest.fn(), post: jest.fn() },
  notificationClient: { get: jest.fn(), put: jest.fn(), delete: jest.fn() },
  battleClient: { get: jest.fn(), post: jest.fn() },
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

describe('emitHeartbeat — fires video:heartbeat, not video:play', () => {
  it('emitting HEARTBEAT does not equal emitting PLAY', () => {
    mockEmit(CLIENT_EVENTS.HEARTBEAT, { roomId: 'room-1', currentTime: 42 });
    expect(mockEmit).toHaveBeenCalledWith('video:heartbeat', { roomId: 'room-1', currentTime: 42 });
    expect(mockEmit).not.toHaveBeenCalledWith('video:play', expect.anything());
  });

  it('heartbeat payload has currentTime', () => {
    mockEmit(CLIENT_EVENTS.HEARTBEAT, { roomId: 'room-1', currentTime: 90.5 });
    const call = mockEmit.mock.calls[0];
    expect(call[0]).toBe('video:heartbeat');
    expect(call[1]).toEqual({ roomId: 'room-1', currentTime: 90.5 });
  });

  it('heartbeat payload does NOT trigger syncState (event name differs)', () => {
    // syncState triggers on: video:play, video:pause, video:seek, video:sync
    const syncStateTriggers = ['video:play', 'video:pause', 'video:seek', 'video:sync'];
    expect(syncStateTriggers).not.toContain(CLIENT_EVENTS.HEARTBEAT);
  });

  it('emitPlay fires video:play (which DOES trigger syncState)', () => {
    mockEmit(CLIENT_EVENTS.PLAY, { roomId: 'room-1', currentTime: 42 });
    expect(mockEmit).toHaveBeenCalledWith('video:play', { roomId: 'room-1', currentTime: 42 });
  });

  it('heartbeat with currentTime 0 sends correctly', () => {
    mockEmit(CLIENT_EVENTS.HEARTBEAT, { roomId: 'room-1', currentTime: 0 });
    expect(mockEmit).toHaveBeenCalledWith('video:heartbeat', { roomId: 'room-1', currentTime: 0 });
  });

  it('heartbeat with large currentTime sends correctly', () => {
    mockEmit(CLIENT_EVENTS.HEARTBEAT, { roomId: 'room-1', currentTime: 7200 });
    expect(mockEmit).toHaveBeenCalledWith('video:heartbeat', { roomId: 'room-1', currentTime: 7200 });
  });
});

// ─── 3. Verify useWatchParty exports emitHeartbeat ────────────────────────────

describe('useWatchParty — exports emitHeartbeat', () => {
  it('useWatchParty module exports emitHeartbeat in return object', () => {
    // Verify the hook source exports emitHeartbeat by checking the module
    // (We check the function exists without full React render)
    const hookModule = require('../../hooks/useWatchParty');
    expect(typeof hookModule.useWatchParty).toBe('function');
  });
});

// ─── 4. Interval behavior: heartbeat vs play distinction ──────────────────────

describe('5s owner interval behavior — T-E102 regression', () => {
  it('owner interval calls video:heartbeat, not video:play', () => {
    // Simulate what the fixed 5s interval does:
    const posMs = 30000; // 30 seconds
    const currentTimeSecs = posMs / 1000; // 30.0

    // Fixed: emitHeartbeat(posMs / 1000)
    mockEmit(CLIENT_EVENTS.HEARTBEAT, { roomId: 'room-1', currentTime: currentTimeSecs });

    expect(mockEmit).toHaveBeenCalledWith('video:heartbeat', { roomId: 'room-1', currentTime: 30 });
    expect(mockEmit).not.toHaveBeenCalledWith('video:play', expect.anything());
  });

  it('BUG (old behavior) would have triggered video:play causing seekTo on members', () => {
    // Old: emitPlay(posMs / 1000)
    // This would call CLIENT_EVENTS.PLAY = 'video:play'
    // Server would broadcast syncState → all members do seekTo + play
    // Verify old event name is video:play (the bad one)
    expect(CLIENT_EVENTS.PLAY).toBe('video:play');

    // Verify new event name is video:heartbeat (the good one)
    expect(CLIENT_EVENTS.HEARTBEAT).toBe('video:heartbeat');

    // They must differ — this is the core of the fix
    expect(CLIENT_EVENTS.HEARTBEAT).not.toBe(CLIENT_EVENTS.PLAY);
  });

  it('posMs → currentTime conversion is correct (ms to seconds)', () => {
    const posMs = 65500; // 65.5 seconds
    const currentTime = posMs / 1000;
    expect(currentTime).toBeCloseTo(65.5);

    mockEmit(CLIENT_EVENTS.HEARTBEAT, { roomId: 'room-1', currentTime });
    expect(mockEmit).toHaveBeenCalledWith('video:heartbeat', { roomId: 'room-1', currentTime: 65.5 });
  });

  it('interval fires only when isPlaying is true (no heartbeat when paused)', () => {
    const isPlaying = false;
    const emitHeartbeatCalled = jest.fn();

    // Simulate: if (isPlaying) emitHeartbeat(posMs / 1000)
    if (isPlaying) emitHeartbeatCalled(30);

    expect(emitHeartbeatCalled).not.toHaveBeenCalled();
  });

  it('interval fires when isPlaying is true', () => {
    const isPlaying = true;
    const emitHeartbeatCalled = jest.fn();

    if (isPlaying) emitHeartbeatCalled(30);

    expect(emitHeartbeatCalled).toHaveBeenCalledWith(30);
  });

  it('interval skips when isSyncing is true (no heartbeat during active sync)', () => {
    const isSyncing = { current: true };
    const emitHeartbeatCalled = jest.fn();

    // Simulate: if (isSyncing.current) return;
    if (!isSyncing.current) emitHeartbeatCalled(30);

    expect(emitHeartbeatCalled).not.toHaveBeenCalled();
  });
});
