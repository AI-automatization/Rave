// CineSync Mobile — Content API
import { contentClient } from './client';
import { ApiResponse, IMovie, ContentGenre, PaginationMeta, IWatchProgress } from '@app-types/index';

interface MoviesResponse {
  movies: IMovie[];
  meta: PaginationMeta;
}

export const contentApi = {
  async getTrending(limit = 10): Promise<IMovie[]> {
    const res = await contentClient.get<ApiResponse<IMovie[]>>('/content/trending', {
      params: { limit },
    });
    return res.data.data ?? [];
  },

  async getTopRated(limit = 10): Promise<IMovie[]> {
    const res = await contentClient.get<ApiResponse<IMovie[]>>('/content/top-rated', {
      params: { limit },
    });
    return res.data.data ?? [];
  },

  async getMovies(params?: {
    page?: number;
    limit?: number;
    genre?: ContentGenre;
    search?: string;
  }): Promise<MoviesResponse> {
    const res = await contentClient.get<ApiResponse<MoviesResponse>>('/content/movies', { params });
    return res.data.data ?? { movies: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } };
  },

  async getMovieById(movieId: string): Promise<IMovie> {
    const res = await contentClient.get<ApiResponse<IMovie>>(`/content/movies/${movieId}`);
    return res.data.data!;
  },

  async search(query: string, page = 1, limit = 20): Promise<MoviesResponse> {
    const res = await contentClient.get<ApiResponse<MoviesResponse>>('/content/search', {
      params: { q: query, page, limit },
    });
    return res.data.data ?? { movies: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  },

  async getContinueWatching(): Promise<Array<IMovie & { progress: number }>> {
    const res = await contentClient.get<ApiResponse<Array<IMovie & { progress: number }>>>(
      '/content/continue-watching',
    );
    return res.data.data ?? [];
  },

  async updateProgress(movieId: string, progress: number, duration: number): Promise<void> {
    await contentClient.post(`/content/movies/${movieId}/progress`, { progress, duration });
  },

  async markComplete(movieId: string): Promise<void> {
    await contentClient.post(`/content/movies/${movieId}/complete`);
  },

  async rateMovie(movieId: string, rating: number): Promise<void> {
    await contentClient.post(`/content/movies/${movieId}/rate`, { rating });
  },

  async getWatchProgress(movieId: string): Promise<IWatchProgress | null> {
    try {
      const res = await contentClient.get<ApiResponse<IWatchProgress>>(
        `/content/movies/${movieId}/progress`,
      );
      return res.data.data;
    } catch {
      return null;
    }
  },
};
