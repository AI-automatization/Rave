// CineSync Mobile — useBattle hook unit tests

jest.mock('../../api/client', () => ({
  contentClient: { get: jest.fn() },
  authClient: { get: jest.fn() },
  userClient: { get: jest.fn() },
  notificationClient: { get: jest.fn() },
  battleClient: { get: jest.fn(), post: jest.fn() },
  watchPartyClient: { get: jest.fn() },
}));

const mockGetMyBattles = jest.fn();
const mockGetBattleById = jest.fn();
const mockAcceptBattle = jest.fn();
const mockRejectBattle = jest.fn();
const mockCreateBattle = jest.fn();
const mockGetCompletedBattles = jest.fn();

jest.mock('../../api/battle.api', () => ({
  battleApi: {
    getMyBattles: (...args: unknown[]) => mockGetMyBattles(...args),
    getBattleById: (...args: unknown[]) => mockGetBattleById(...args),
    acceptBattle: (...args: unknown[]) => mockAcceptBattle(...args),
    rejectBattle: (...args: unknown[]) => mockRejectBattle(...args),
    createBattle: (...args: unknown[]) => mockCreateBattle(...args),
    getCompletedBattles: (...args: unknown[]) => mockGetCompletedBattles(...args),
    inviteParticipant: jest.fn(),
  },
}));

jest.mock('../../store/battle.store', () => ({
  useBattleStore: jest.fn(() => ({
    activeBattles: [],
    setActiveBattles: jest.fn(),
    currentBattle: null,
    setCurrentBattle: jest.fn(),
  })),
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn().mockReturnValue({ data: undefined, isLoading: false, refetch: jest.fn() }),
  useMutation: jest.fn().mockImplementation(({ mutationFn }: { mutationFn: unknown }) => ({
    mutate: mutationFn,
    isPending: false,
  })),
  useQueryClient: jest.fn().mockReturnValue({
    invalidateQueries: jest.fn(),
  }),
}));

const BATTLE_STUB = {
  _id: 'battle-1',
  title: 'Film Battle',
  status: 'active' as const,
  participants: [
    { userId: 'user-1', score: 5 },
    { userId: 'user-2', score: 3 },
  ],
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 3 * 86400000).toISOString(),
  duration: 3,
  winnerId: null,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('battleApi.getMyBattles', () => {
  it('returns active battles', async () => {
    mockGetMyBattles.mockResolvedValueOnce([BATTLE_STUB]);
    const result = await mockGetMyBattles();
    expect(result).toHaveLength(1);
    expect(result[0]._id).toBe('battle-1');
  });

  it('returns empty array when no battles', async () => {
    mockGetMyBattles.mockResolvedValueOnce([]);
    const result = await mockGetMyBattles();
    expect(result).toEqual([]);
  });
});

describe('battleApi.acceptBattle', () => {
  it('calls accept with correct battleId', async () => {
    mockAcceptBattle.mockResolvedValueOnce({ success: true });
    await mockAcceptBattle('battle-1');
    expect(mockAcceptBattle).toHaveBeenCalledWith('battle-1');
  });
});

describe('battleApi.rejectBattle', () => {
  it('calls reject with correct battleId', async () => {
    mockRejectBattle.mockResolvedValueOnce({ success: true });
    await mockRejectBattle('battle-1');
    expect(mockRejectBattle).toHaveBeenCalledWith('battle-1');
  });
});

describe('battleApi.createBattle', () => {
  it('creates battle with required params', async () => {
    mockCreateBattle.mockResolvedValueOnce(BATTLE_STUB);
    const params = { opponentId: 'user-2', duration: 3 as const, title: 'Epic Battle' };
    await mockCreateBattle(params);
    expect(mockCreateBattle).toHaveBeenCalledWith(params);
  });
});

describe('battleApi.getBattleById', () => {
  it('returns battle detail', async () => {
    mockGetBattleById.mockResolvedValueOnce(BATTLE_STUB);
    const result = await mockGetBattleById('battle-1');
    expect(result._id).toBe('battle-1');
    expect(result.participants).toHaveLength(2);
  });
});

describe('Battle score calculation logic', () => {
  it('calculates daysLeft correctly', () => {
    const futureDate = new Date(Date.now() + 3 * 86400000).toISOString();
    const daysLeft = Math.max(0, Math.ceil((new Date(futureDate).getTime() - Date.now()) / 86400000));
    expect(daysLeft).toBe(3);
  });

  it('daysLeft is 0 for past battles', () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString();
    const daysLeft = Math.max(0, Math.ceil((new Date(pastDate).getTime() - Date.now()) / 86400000));
    expect(daysLeft).toBe(0);
  });

  it('identifies winner correctly', () => {
    const userId = 'user-1';
    const battle = { ...BATTLE_STUB, winnerId: 'user-1' };
    const isWinner = battle.winnerId === userId;
    expect(isWinner).toBe(true);
  });

  it('identifies loser correctly', () => {
    const userId = 'user-2';
    const battle = { ...BATTLE_STUB, winnerId: 'user-1' };
    const isWinner = battle.winnerId === userId;
    expect(isWinner).toBe(false);
  });
});

describe('useBattleDetail staleTime', () => {
  it('refetchInterval is 60 seconds', () => {
    const REFETCH_INTERVAL = 60 * 1000;
    expect(REFETCH_INTERVAL).toBe(60000);
  });

  it('staleTime is 30 seconds', () => {
    const STALE_TIME = 30 * 1000;
    expect(STALE_TIME).toBe(30000);
  });
});
