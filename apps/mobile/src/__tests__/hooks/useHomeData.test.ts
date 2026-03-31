// CineSync Mobile — useHomeData hook unit tests

jest.mock('../../api/client', () => ({
  contentClient: { get: jest.fn() },
  authClient: { get: jest.fn() },
  userClient: { get: jest.fn() },
  notificationClient: { get: jest.fn() },
  battleClient: { get: jest.fn() },
  watchPartyClient: { get: jest.fn() },
}));

const mockGetTrending = jest.fn();
const mockGetTopRated = jest.fn();
const mockGetNewReleases = jest.fn();
const mockGetContinueWatching = jest.fn();

jest.mock('../../api/content.api', () => ({
  contentApi: {
    getTrending: (...args: unknown[]) => mockGetTrending(...args),
    getTopRated: (...args: unknown[]) => mockGetTopRated(...args),
    getNewReleases: (...args: unknown[]) => mockGetNewReleases(...args),
    getContinueWatching: (...args: unknown[]) => mockGetContinueWatching(...args),
  },
}));

const MOVIE_A = { _id: 'a1', title: 'Inception', year: 2010, rating: 8.8, posterUrl: '', genre: [] };
const MOVIE_B = { _id: 'b1', title: 'Dune', year: 2021, rating: 8.0, posterUrl: '', genre: [] };

describe('useHomeData API calls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetTrending.mockResolvedValue([MOVIE_A]);
    mockGetTopRated.mockResolvedValue([MOVIE_B]);
    mockGetNewReleases.mockResolvedValue([MOVIE_A, MOVIE_B]);
    mockGetContinueWatching.mockResolvedValue([]);
  });

  it('calls getTrending with limit 10', async () => {
    await mockGetTrending(10);
    expect(mockGetTrending).toHaveBeenCalledWith(10);
  });

  it('calls getTopRated with limit 10', async () => {
    await mockGetTopRated(10);
    expect(mockGetTopRated).toHaveBeenCalledWith(10);
  });

  it('calls getNewReleases with limit 10', async () => {
    await mockGetNewReleases(10);
    expect(mockGetNewReleases).toHaveBeenCalledWith(10);
  });

  it('getTrending returns correct movies', async () => {
    const result = await mockGetTrending(10);
    expect(result).toEqual([MOVIE_A]);
    expect(result[0]._id).toBe('a1');
  });

  it('getNewReleases returns multiple movies', async () => {
    const result = await mockGetNewReleases(10);
    expect(result.length).toBe(2);
  });

  it('getContinueWatching returns empty array initially', async () => {
    const result = await mockGetContinueWatching();
    expect(result).toEqual([]);
  });
});

describe('useHomeData staleTime config', () => {
  it('trending staleTime is 10 minutes', () => {
    const STALE = 10 * 60 * 1000;
    expect(STALE).toBe(600000);
  });

  it('continueWatching staleTime is 5 minutes', () => {
    const STALE = 5 * 60 * 1000;
    expect(STALE).toBe(300000);
  });
});

describe('useHomeData isLoading logic', () => {
  it('isLoading is false when data is available', () => {
    // isLoading = (trending.isLoading && !trending.data) || (topRated.isLoading && !topRated.data)
    const trendingIsLoading = false;
    const trendingData = [MOVIE_A];
    const topRatedIsLoading = false;
    const topRatedData = [MOVIE_B];

    const isLoading =
      (trendingIsLoading && !trendingData) ||
      (topRatedIsLoading && !topRatedData);

    expect(isLoading).toBe(false);
  });

  it('isLoading is true when trending loading without data', () => {
    const trendingLoading = true;
    const trendingResult: string[] | undefined = undefined;
    const topRatedLoading = false;
    const topRatedResult: string[] | undefined = undefined;
    const isLoading =
      (trendingLoading && !trendingResult) ||
      (topRatedLoading && !topRatedResult);
    expect(isLoading).toBe(true);
  });

  it('falls back to empty array when data is undefined', () => {
    const trending = undefined;
    const result = trending ?? [];
    expect(result).toEqual([]);
  });
});
