import { contentClient } from './client';
import type { ApiResponse, IMovie, IWatchHistory, IRating, ContentGenre } from '@types/index';

export interface MovieListParams {
  page?: number;
  limit?: number;
  genre?: ContentGenre;
  year?: number;
  sort?: string;
}

export const contentApi = {
  getMovies: async (params: MovieListParams = {}) => {
    const { data } = await contentClient.get<ApiResponse<IMovie[]>>('/content/movies', { params });
    return data;
  },

  searchMovies: async (q: string, page = 1, limit = 20) => {
    const { data } = await contentClient.get<ApiResponse<IMovie[]>>('/content/movies/search', {
      params: { q, page, limit },
    });
    return data;
  },

  getMovie: async (id: string) => {
    const { data } = await contentClient.get<ApiResponse<IMovie>>(`/content/movies/${id}`);
    return data;
  },

  saveProgress: async (movieId: string, currentTime: number, progress: number) => {
    await contentClient.post('/content/history', { movieId, currentTime, progress });
  },

  getWatchHistory: async (page = 1, limit = 20) => {
    const { data } = await contentClient.get<ApiResponse<IWatchHistory[]>>('/content/history', {
      params: { page, limit },
    });
    return data;
  },

  rateMovie: async (movieId: string, rating: number, review = '') => {
    const { data } = await contentClient.post<ApiResponse<IRating>>(
      `/content/movies/${movieId}/rate`,
      { rating, review },
    );
    return data;
  },

  getMovieRatings: async (movieId: string, page = 1) => {
    const { data } = await contentClient.get<ApiResponse<IRating[]>>(
      `/content/movies/${movieId}/ratings`,
      { params: { page } },
    );
    return data;
  },

  deleteMyRating: async (movieId: string) => {
    await contentClient.delete(`/content/movies/${movieId}/rate`);
  },
};
