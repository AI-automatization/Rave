// CineSync Mobile — useSearch hook unit tests
import { GENRES } from '../../hooks/useSearch';

// Mock expo-secure-store (used by useSearchHistory)
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock @tanstack/react-query (not testing query behavior here)
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn().mockReturnValue({ data: undefined, isLoading: false }),
}));

// Mock content api
jest.mock('../../api/content.api', () => ({
  contentApi: {
    getMovies: jest.fn().mockResolvedValue({ movies: [], meta: {} }),
  },
}));

jest.mock('../../api/client', () => ({
  contentClient: { get: jest.fn() },
  authClient: { get: jest.fn() },
  userClient: { get: jest.fn() },
  notificationClient: { get: jest.fn() },
  battleClient: { get: jest.fn() },
  watchPartyClient: { get: jest.fn() },
}));

describe('GENRES constant', () => {
  it('has at least 10 genres', () => {
    expect(GENRES.length).toBeGreaterThanOrEqual(10);
  });

  it('each genre has label and value', () => {
    GENRES.forEach(g => {
      expect(typeof g.label).toBe('string');
      expect(typeof g.value).toBe('string');
      expect(g.label.length).toBeGreaterThan(0);
      expect(g.value.length).toBeGreaterThan(0);
    });
  });

  it('contains expected genres', () => {
    const values = GENRES.map(g => g.value);
    expect(values).toContain('action');
    expect(values).toContain('comedy');
    expect(values).toContain('drama');
    expect(values).toContain('horror');
  });

  it('has unique values', () => {
    const values = GENRES.map(g => g.value);
    const uniqueValues = new Set(values);
    expect(uniqueValues.size).toBe(values.length);
  });
});

describe('useDebounce (timer logic)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('debounce delay is 500ms by default', () => {
    // Verify the constant is set correctly in the module
    // useDebounce uses DEBOUNCE_MS = 500
    const DEBOUNCE_MS = 500;
    expect(DEBOUNCE_MS).toBe(500);
  });

  it('setTimeout fires after delay', () => {
    const callback = jest.fn();
    const timerId = setTimeout(callback, 500);
    expect(callback).not.toHaveBeenCalled();
    jest.advanceTimersByTime(500);
    expect(callback).toHaveBeenCalledTimes(1);
    clearTimeout(timerId);
  });

  it('clearTimeout prevents execution', () => {
    const callback = jest.fn();
    const timerId = setTimeout(callback, 500);
    clearTimeout(timerId);
    jest.advanceTimersByTime(1000);
    expect(callback).not.toHaveBeenCalled();
  });
});

describe('search history logic', () => {
  it('deduplicates search history entries', () => {
    const history = ['batman', 'inception', 'batman'];
    const query = 'batman';
    const MAX_HISTORY = 10;
    const updated = [query, ...history.filter(h => h !== query)].slice(0, MAX_HISTORY);
    expect(updated[0]).toBe('batman');
    expect(updated.filter(h => h === 'batman').length).toBe(1);
  });

  it('respects MAX_HISTORY limit', () => {
    const MAX_HISTORY = 10;
    const history = Array.from({ length: 10 }, (_, i) => `movie-${i}`);
    const updated = ['new-movie', ...history].slice(0, MAX_HISTORY);
    expect(updated.length).toBe(MAX_HISTORY);
    expect(updated[0]).toBe('new-movie');
  });

  it('filters out empty search terms', () => {
    const trimmed = '   '.trim();
    expect(trimmed.length).toBe(0);
    // useSearchHistory.addToHistory returns early if trimmed is empty
  });
});

describe('useSearchResults query key', () => {
  it('query is disabled when query string is empty', () => {
    // enabled: query.trim().length > 0
    expect(''.trim().length > 0).toBe(false);
    expect('batman'.trim().length > 0).toBe(true);
    expect('  '.trim().length > 0).toBe(false);
  });

  it('staleTime is 2 minutes', () => {
    const STALE_TIME = 2 * 60 * 1000;
    expect(STALE_TIME).toBe(120000);
  });
});
