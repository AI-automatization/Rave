// CineSync Mobile — watchParty.api unit tests
import { watchPartyApi } from '../../api/watchParty.api';

const mockGet = jest.fn();
const mockPost = jest.fn();
const mockDelete = jest.fn();

jest.mock('../../api/client', () => ({
  watchPartyClient: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
  },
  authClient: { post: jest.fn(), get: jest.fn() },
  userClient: { get: jest.fn(), post: jest.fn(), put: jest.fn(), patch: jest.fn() },
  contentClient: { get: jest.fn(), post: jest.fn() },
  notificationClient: { get: jest.fn(), put: jest.fn(), delete: jest.fn() },
  battleClient: { get: jest.fn(), post: jest.fn() },
}));

const ROOM_STUB = {
  _id: 'room-1', name: 'Movie Night', inviteCode: 'ABC123',
  ownerId: 'user-1', videoUrl: 'https://video.mp4',
  videoTitle: 'Inception', videoPlatform: 'direct',
  isPrivate: false, maxMembers: 10, members: [],
};

beforeEach(() => jest.clearAllMocks());

describe('watchPartyApi.createRoom', () => {
  it('creates room with video data', async () => {
    mockPost.mockResolvedValueOnce({ data: { data: ROOM_STUB, success: true } });
    const result = await watchPartyApi.createRoom({ name: 'Movie Night', videoUrl: 'https://video.mp4' });
    expect(mockPost).toHaveBeenCalledWith('/watch-party/rooms', expect.objectContaining({ videoUrl: 'https://video.mp4' }));
    expect(result._id).toBe('room-1');
  });

  it('creates room with optional cookies for webview-session', async () => {
    mockPost.mockResolvedValueOnce({ data: { data: ROOM_STUB, success: true } });
    await watchPartyApi.createRoom({ cookies: 'session=abc' });
    expect(mockPost).toHaveBeenCalledWith('/watch-party/rooms', expect.objectContaining({ cookies: 'session=abc' }));
  });
});

describe('watchPartyApi.getRooms', () => {
  it('returns rooms array', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [ROOM_STUB], success: true } });
    const result = await watchPartyApi.getRooms();
    expect(mockGet).toHaveBeenCalledWith('/watch-party/rooms');
    expect(result).toHaveLength(1);
    expect(result[0]._id).toBe('room-1');
  });

  it('returns empty array when data is null', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: null, success: true } });
    const result = await watchPartyApi.getRooms();
    expect(result).toEqual([]);
  });
});

describe('watchPartyApi.getRoomById', () => {
  it('fetches room by id', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: ROOM_STUB, success: true } });
    const result = await watchPartyApi.getRoomById('room-1');
    expect(mockGet).toHaveBeenCalledWith('/watch-party/rooms/room-1');
    expect(result._id).toBe('room-1');
  });
});

describe('watchPartyApi.joinByInviteCode', () => {
  it('joins room using invite code', async () => {
    mockPost.mockResolvedValueOnce({ data: { data: ROOM_STUB, success: true } });
    const result = await watchPartyApi.joinByInviteCode('ABC123');
    expect(mockPost).toHaveBeenCalledWith('/watch-party/join/ABC123');
    expect(result.inviteCode).toBe('ABC123');
  });
});

describe('watchPartyApi.leaveRoom', () => {
  it('posts to leave endpoint', async () => {
    mockPost.mockResolvedValueOnce({ data: { success: true } });
    await watchPartyApi.leaveRoom('room-1');
    expect(mockPost).toHaveBeenCalledWith('/watch-party/rooms/room-1/leave');
  });
});

describe('watchPartyApi.closeRoom', () => {
  it('deletes room as owner', async () => {
    mockDelete.mockResolvedValueOnce({ data: { success: true } });
    await watchPartyApi.closeRoom('room-1');
    expect(mockDelete).toHaveBeenCalledWith('/watch-party/rooms/room-1');
  });
});

describe('watchPartyApi.inviteFriend', () => {
  it('sends invite with friendId and inviterName', async () => {
    mockPost.mockResolvedValueOnce({ data: { success: true } });
    await watchPartyApi.inviteFriend('room-1', 'friend-1', 'John');
    expect(mockPost).toHaveBeenCalledWith('/watch-party/rooms/room-1/invite', {
      friendId: 'friend-1', inviterName: 'John',
    });
  });

  it('works without inviterName', async () => {
    mockPost.mockResolvedValueOnce({ data: { success: true } });
    await watchPartyApi.inviteFriend('room-1', 'friend-1');
    expect(mockPost).toHaveBeenCalledWith('/watch-party/rooms/room-1/invite', {
      friendId: 'friend-1', inviterName: undefined,
    });
  });
});
