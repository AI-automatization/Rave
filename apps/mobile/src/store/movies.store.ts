// CineSync Mobile — Movies Store (Zustand)
import { create } from 'zustand';
import { IMovie } from '@app-types/index';

interface MoviesState {
  trending: IMovie[];
  topRated: IMovie[];
  continueWatching: Array<IMovie & { progress: number }>;
  currentMovie: IMovie | null;

  setTrending: (movies: IMovie[]) => void;
  setTopRated: (movies: IMovie[]) => void;
  setContinueWatching: (movies: Array<IMovie & { progress: number }>) => void;
  setCurrentMovie: (movie: IMovie | null) => void;
}

export const useMoviesStore = create<MoviesState>((set) => ({
  trending: [],
  topRated: [],
  continueWatching: [],
  currentMovie: null,

  setTrending: (movies) => set({ trending: movies }),
  setTopRated: (movies) => set({ topRated: movies }),
  setContinueWatching: (movies) => set({ continueWatching: movies }),
  setCurrentMovie: (movie) => set({ currentMovie: movie }),
}));
