import { create } from 'zustand';
import type { IMovie, IWatchHistory } from '@types/index';

interface MoviesState {
  trending: IMovie[];
  topRated: IMovie[];
  continueWatching: IWatchHistory[];

  setTrending: (movies: IMovie[]) => void;
  setTopRated: (movies: IMovie[]) => void;
  setContinueWatching: (history: IWatchHistory[]) => void;
  updateWatchProgress: (movieId: string, currentTime: number, progress: number) => void;
}

export const useMoviesStore = create<MoviesState>()((set) => ({
  trending: [],
  topRated: [],
  continueWatching: [],

  setTrending: (trending) => set({ trending }),
  setTopRated: (topRated) => set({ topRated }),
  setContinueWatching: (continueWatching) => set({ continueWatching }),

  updateWatchProgress: (movieId, currentTime, progress) =>
    set((state) => ({
      continueWatching: state.continueWatching.map((item) =>
        item.movieId === movieId ? { ...item, currentTime, progress } : item,
      ),
    })),
}));
