// CineSync Mobile — Content API
import { contentClient } from './client';
import { ApiResponse, IMovie, ContentGenre, PaginationMeta, IWatchProgress } from '@app-types/index';

export interface VideoExtractResult {
  title: string;
  videoUrl: string;
  poster: string;
  platform: 'youtube' | 'vimeo' | 'tiktok' | 'dailymotion' | 'rutube' | 'facebook' | 'instagram' | 'twitch' | 'vk' | 'streamable' | 'reddit' | 'twitter' | 'generic' | 'unknown';
  type: 'mp4' | 'hls';
  duration?: number;
  isLive?: boolean;
  useProxy?: boolean;
}

export interface YtStreamInfo {
  url: string;
  title: string;
  duration: number;
  thumbnail: string;
  mimeType: string;
  contentLength: number;
  isLive: boolean;
}

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

  async getNewReleases(limit = 10): Promise<IMovie[]> {
    const res = await contentClient.get<ApiResponse<IMovie[]>>('/content/movies', {
      params: { sort: 'newest', limit },
    });
    return res.data.data ?? [];
  },

  async getMovies(params?: {
    page?: number;
    limit?: number;
    genre?: ContentGenre;
    search?: string;
    year?: number;
    sort?: 'rating' | 'year' | 'title';
  }): Promise<MoviesResponse> {
    const res = await contentClient.get<ApiResponse<IMovie[]>>('/content/movies', { params });
    return {
      movies: res.data.data ?? [],
      meta: res.data.meta ?? { page: 1, limit: 10, total: 0, totalPages: 0 },
    };
  },

  async getMovieById(movieId: string): Promise<IMovie> {
    const res = await contentClient.get<ApiResponse<IMovie>>(`/content/movies/${movieId}`);
    return res.data.data!;
  },

  async search(query: string, page = 1, limit = 20): Promise<MoviesResponse> {
    const res = await contentClient.get<ApiResponse<IMovie[]>>('/content/search', {
      params: { q: query, page, limit },
    });
    return {
      movies: res.data.data ?? [],
      meta: res.data.meta ?? { page: 1, limit: 20, total: 0, totalPages: 0 },
    };
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

  async rateMovie(movieId: string, score: number, review?: string): Promise<{ isNew: boolean }> {
    const res = await contentClient.post(`/content/movies/${movieId}/rate`, { score, review });
    return { isNew: res.status === 201 };
  },

  async getMovieRatings(movieId: string, page = 1): Promise<{
    ratings: Array<{ userId: string; username: string; score: number; review?: string; createdAt: string }>;
    meta: PaginationMeta;
  }> {
    const res = await contentClient.get<ApiResponse<{
      ratings: Array<{ userId: string; username: string; score: number; review?: string; createdAt: string }>;
      meta: PaginationMeta;
    }>>(`/content/movies/${movieId}/ratings`, { params: { page } });
    return res.data.data ?? { ratings: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } };
  },

  async deleteMyRating(movieId: string): Promise<void> {
    await contentClient.delete(`/content/movies/${movieId}/rate`);
  },

  async extractVideo(url: string): Promise<VideoExtractResult> {
    const res = await contentClient.post<ApiResponse<VideoExtractResult>>('/content/extract', { url });
    if (!res.data.success || !res.data.data) throw new Error(res.data.message ?? 'Extraction failed');
    return res.data.data;
  },

  async getYouTubeStreamInfo(youtubeUrl: string): Promise<YtStreamInfo> {
    const res = await contentClient.get<ApiResponse<YtStreamInfo>>('/youtube/stream-url', {
      params: { url: youtubeUrl },
    });
    return res.data.data!;
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

  async getWatchHistory(page = 1): Promise<{
    history: Array<{
      movieId: string;
      title: string;
      poster?: string;
      progress: number;
      watchedAt: string;
      completed: boolean;
    }>;
    meta: PaginationMeta;
  }> {
    const res = await contentClient.get<ApiResponse<{
      history: Array<{
        movieId: string;
        title: string;
        poster?: string;
        progress: number;
        watchedAt: string;
        completed: boolean;
      }>;
      meta: PaginationMeta;
    }>>('/content/history', { params: { page } });
    return res.data.data ?? { history: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  },

  async addFavorite(movieId: string): Promise<void> {
    await contentClient.post(`/content/movies/${movieId}/favorite`);
  },

  async removeFavorite(movieId: string): Promise<void> {
    await contentClient.delete(`/content/movies/${movieId}/favorite`);
  },

  async getFavorites(): Promise<IMovie[]> {
    const res = await contentClient.get<ApiResponse<IMovie[]>>('/content/favorites');
    return res.data.data ?? [];
  },
};
