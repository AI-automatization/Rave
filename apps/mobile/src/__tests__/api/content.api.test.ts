// CineSync Mobile — content.api unit tests
import { contentApi } from '../../api/content.api';

// Mock the HTTP client
const mockGet = jest.fn();
const mockPost = jest.fn();
const mockDelete = jest.fn();

jest.mock('../../api/client', () => ({
  contentClient: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
  },
  authClient: { get: jest.fn(), post: jest.fn() },
  userClient: { get: jest.fn(), post: jest.fn(), put: jest.fn(), patch: jest.fn() },
  notificationClient: { get: jest.fn(), put: jest.fn(), delete: jest.fn() },
  battleClient: { get: jest.fn(), post: jest.fn() },
  watchPartyClient: { get: jest.fn(), post: jest.fn() },
}));

const MOVIE_STUB = {
  _id: 'movie-1',
  title: 'Inception',
  year: 2010,
  rating: 8.8,
  posterUrl: 'https://example.com/poster.jpg',
  genre: ['sci-fi'],
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('contentApi.getTrending', () => {
  it('returns movies array on success', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [MOVIE_STUB], success: true } });
    const result = await contentApi.getTrending(5);
    expect(mockGet).toHaveBeenCalledWith('/content/trending', { params: { limit: 5 } });
    expect(result).toEqual([MOVIE_STUB]);
  });

  it('returns empty array when data is null', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: null, success: true } });
    const result = await contentApi.getTrending();
    expect(result).toEqual([]);
  });
});

describe('contentApi.getTopRated', () => {
  it('calls correct endpoint with limit', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [MOVIE_STUB], success: true } });
    await contentApi.getTopRated(10);
    expect(mockGet).toHaveBeenCalledWith('/content/top-rated', { params: { limit: 10 } });
  });
});

describe('contentApi.getMovies', () => {
  it('returns movies + meta on success', async () => {
    const meta = { page: 1, limit: 20, total: 100, totalPages: 5 };
    mockGet.mockResolvedValueOnce({ data: { data: [MOVIE_STUB], meta, success: true } });
    const result = await contentApi.getMovies({ page: 1, genre: 'action' });
    expect(result.movies).toEqual([MOVIE_STUB]);
    expect(result.meta).toEqual(meta);
  });

  it('returns default meta when missing', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [], success: true } });
    const result = await contentApi.getMovies();
    expect(result.meta).toEqual({ page: 1, limit: 10, total: 0, totalPages: 0 });
  });
});

describe('contentApi.search', () => {
  it('calls search endpoint with query params', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [MOVIE_STUB], success: true } });
    await contentApi.search('batman', 2, 10);
    expect(mockGet).toHaveBeenCalledWith('/content/search', {
      params: { q: 'batman', page: 2, limit: 10 },
    });
  });
});

describe('contentApi.addFavorite / removeFavorite', () => {
  it('posts to favorite endpoint', async () => {
    mockPost.mockResolvedValueOnce({ data: { success: true } });
    await contentApi.addFavorite('movie-1');
    expect(mockPost).toHaveBeenCalledWith('/content/movies/movie-1/favorite');
  });

  it('deletes from favorite endpoint', async () => {
    mockDelete.mockResolvedValueOnce({ data: { success: true } });
    await contentApi.removeFavorite('movie-1');
    expect(mockDelete).toHaveBeenCalledWith('/content/movies/movie-1/favorite');
  });
});

describe('contentApi.extractVideo', () => {
  it('returns extract result on success', async () => {
    const extractResult = { title: 'Test', videoUrl: 'https://v.mp4', poster: '', platform: 'generic', type: 'mp4' };
    mockPost.mockResolvedValueOnce({ data: { success: true, data: extractResult } });
    const result = await contentApi.extractVideo('https://test.com/video');
    expect(mockPost).toHaveBeenCalledWith('/content/extract', { url: 'https://test.com/video' });
    expect(result).toEqual(extractResult);
  });

  it('throws when success=false', async () => {
    mockPost.mockResolvedValueOnce({ data: { success: false, message: 'Extraction failed' } });
    await expect(contentApi.extractVideo('https://bad.url')).rejects.toThrow('Extraction failed');
  });
});

describe('contentApi.getWatchProgress', () => {
  it('returns null on error (graceful degradation)', async () => {
    mockGet.mockRejectedValueOnce(new Error('404'));
    const result = await contentApi.getWatchProgress('movie-1');
    expect(result).toBeNull();
  });
});
