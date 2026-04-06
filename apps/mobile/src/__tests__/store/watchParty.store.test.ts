// CineSync Mobile — watchParty.store unit tests
import { useWatchPartyStore, selectIsWatchPartyOpen } from '../../store/watchParty.store';

const ROOM_STUB = {
  _id: 'room-1', name: 'Movie Night', inviteCode: 'ABC123',
  ownerId: 'user-1', videoUrl: 'https://video.mp4',
  videoTitle: 'Inception', videoPlatform: 'direct',
  isPrivate: false, maxMembers: 10, members: [],
};

const SYNC_STUB = {
  isPlaying: true, currentTime: 120, serverTimestamp: Date.now(),
};

const MSG_STUB = {
  id: 'msg-1', userId: 'user-1', username: 'testuser',
  avatar: null, text: 'Hello!', timestamp: Date.now(),
};

beforeEach(() => {
  useWatchPartyStore.getState().clearParty();
  useWatchPartyStore.getState().setWatchPartyOpen(false);
});

describe('setRoom / room state', () => {
  it('sets room correctly', () => {
    useWatchPartyStore.getState().setRoom(ROOM_STUB as never);
    expect(useWatchPartyStore.getState().room?._id).toBe('room-1');
  });

  it('clears room with null', () => {
    useWatchPartyStore.getState().setRoom(ROOM_STUB as never);
    useWatchPartyStore.getState().setRoom(null);
    expect(useWatchPartyStore.getState().room).toBeNull();
  });
});

describe('setSyncState', () => {
  it('updates sync state', () => {
    useWatchPartyStore.getState().setSyncState(SYNC_STUB);
    const state = useWatchPartyStore.getState();
    expect(state.syncState?.isPlaying).toBe(true);
    expect(state.syncState?.currentTime).toBe(120);
  });
});

describe('addMessage', () => {
  it('adds a message to empty list', () => {
    useWatchPartyStore.getState().addMessage(MSG_STUB);
    expect(useWatchPartyStore.getState().messages).toHaveLength(1);
    expect(useWatchPartyStore.getState().messages[0].text).toBe('Hello!');
  });

  it('keeps max 100 messages (slices old ones)', () => {
    const store = useWatchPartyStore.getState();
    for (let i = 0; i < 105; i++) {
      store.addMessage({ ...MSG_STUB, id: `msg-${i}`, text: `msg ${i}` });
    }
    // slice(-99) means after 105 additions we should have 100
    expect(useWatchPartyStore.getState().messages.length).toBeLessThanOrEqual(100);
  });
});

describe('setActiveMembers', () => {
  it('replaces member list', () => {
    useWatchPartyStore.getState().setActiveMembers(['user-1', 'user-2']);
    expect(useWatchPartyStore.getState().activeMembers).toEqual(['user-1', 'user-2']);
  });
});

describe('addMember', () => {
  it('adds new member', () => {
    useWatchPartyStore.getState().setActiveMembers(['user-1']);
    useWatchPartyStore.getState().addMember('user-2');
    expect(useWatchPartyStore.getState().activeMembers).toContain('user-2');
  });

  it('does not add duplicate member', () => {
    useWatchPartyStore.getState().setActiveMembers(['user-1']);
    useWatchPartyStore.getState().addMember('user-1');
    expect(useWatchPartyStore.getState().activeMembers).toHaveLength(1);
  });
});

describe('removeMember', () => {
  it('removes existing member', () => {
    useWatchPartyStore.getState().setActiveMembers(['user-1', 'user-2']);
    useWatchPartyStore.getState().removeMember('user-1');
    expect(useWatchPartyStore.getState().activeMembers).toEqual(['user-2']);
  });

  it('does nothing for non-existent member', () => {
    useWatchPartyStore.getState().setActiveMembers(['user-1']);
    useWatchPartyStore.getState().removeMember('user-99');
    expect(useWatchPartyStore.getState().activeMembers).toHaveLength(1);
  });
});

describe('clearParty', () => {
  it('resets all party state', () => {
    useWatchPartyStore.getState().setRoom(ROOM_STUB as never);
    useWatchPartyStore.getState().setSyncState(SYNC_STUB);
    useWatchPartyStore.getState().addMessage(MSG_STUB);
    useWatchPartyStore.getState().setActiveMembers(['user-1']);
    useWatchPartyStore.getState().clearParty();
    const s = useWatchPartyStore.getState();
    expect(s.room).toBeNull();
    expect(s.syncState).toBeNull();
    expect(s.messages).toHaveLength(0);
    expect(s.activeMembers).toHaveLength(0);
  });
});

describe('setWatchPartyOpen', () => {
  it('marks watch party as open', () => {
    useWatchPartyStore.getState().setWatchPartyOpen(true);
    expect(useWatchPartyStore.getState().isWatchPartyOpen).toBe(true);
  });

  it('marks watch party as closed', () => {
    useWatchPartyStore.getState().setWatchPartyOpen(true);
    useWatchPartyStore.getState().setWatchPartyOpen(false);
    expect(useWatchPartyStore.getState().isWatchPartyOpen).toBe(false);
  });
});

describe('selectIsWatchPartyOpen selector', () => {
  it('returns false by default', () => {
    const state = useWatchPartyStore.getState();
    expect(selectIsWatchPartyOpen(state)).toBe(false);
  });
});

describe('updateRoomMedia', () => {
  it('updates room video metadata', () => {
    useWatchPartyStore.getState().setRoom(ROOM_STUB as never);
    useWatchPartyStore.getState().updateRoomMedia({ videoTitle: 'New Movie', videoUrl: 'https://new.mp4' });
    expect(useWatchPartyStore.getState().room?.videoTitle).toBe('New Movie');
    expect(useWatchPartyStore.getState().room?.videoUrl).toBe('https://new.mp4');
  });

  it('does nothing if room is null', () => {
    useWatchPartyStore.getState().setRoom(null);
    useWatchPartyStore.getState().updateRoomMedia({ videoTitle: 'Test' });
    expect(useWatchPartyStore.getState().room).toBeNull();
  });
});
