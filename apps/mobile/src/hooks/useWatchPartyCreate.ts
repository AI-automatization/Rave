// CineSync Mobile — useWatchPartyCreate hook
// Extracted from WatchPartyCreateScreen for SRP compliance
import { useState, useEffect, useRef, useCallback } from 'react';
import { Alert } from 'react-native';
import { watchPartyApi } from '@api/watchParty.api';
import { contentApi } from '@api/content.api';
import { userApi } from '@api/user.api';
import { useVideoExtraction } from '@hooks/useVideoExtraction';
import type { IMovie, IUserPublic } from '@app-types/index';

const MAX_MEMBERS_OPTIONS = [2, 4, 6, 8, 10] as const;

interface UseWatchPartyCreateReturn {
  // Form
  roomName: string;
  setRoomName: (v: string) => void;
  isPrivate: boolean;
  setIsPrivate: (v: boolean) => void;
  maxMembers: number;
  setMaxMembers: (v: number) => void;
  loading: boolean;
  maxMembersOptions: readonly number[];

  // Film selection
  filmMode: 'catalog' | 'url';
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  searchResults: IMovie[];
  searching: boolean;
  selectedMovie: IMovie | null;
  videoUrl: string;
  setVideoUrl: (v: string) => void;

  // Film mode actions
  switchToCatalog: () => void;
  switchToUrl: () => void;
  selectMovie: (movie: IMovie) => void;
  clearSelectedMovie: () => void;

  // Extraction
  isExtracting: boolean;
  extractResult: ReturnType<typeof useVideoExtraction>['result'];
  fallbackMode: boolean;
  resetExtract: () => void;

  // Friends
  friends: IUserPublic[];
  selectedFriendIds: string[];
  selectedFriends: IUserPublic[];
  toggleFriend: (id: string) => void;

  // Actions
  handleCreate: (onSuccess: (roomId: string) => void) => Promise<void>;
}

export function useWatchPartyCreate(): UseWatchPartyCreateReturn {
  // Form state
  const [roomName, setRoomName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [maxMembers, setMaxMembers] = useState(4);
  const [loading, setLoading] = useState(false);

  // Film selection state
  const [filmMode, setFilmMode] = useState<'catalog' | 'url'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<IMovie[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<IMovie | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const extractTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Video extraction
  const {
    isExtracting,
    result: extractResult,
    fallbackMode,
    extract,
    reset: resetExtract,
  } = useVideoExtraction();

  // Friends state
  const [friends, setFriends] = useState<IUserPublic[]>([]);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);

  // Fetch friends on mount
  useEffect(() => {
    userApi.getFriends().then(setFriends).catch(() => {});
  }, []);

  // Search debounce (400ms)
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const result = await contentApi.search(searchQuery.trim());
        setSearchResults(result.movies.slice(0, 5));
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [searchQuery]);

  // URL extraction debounce (800ms)
  useEffect(() => {
    if (extractTimer.current) clearTimeout(extractTimer.current);
    resetExtract();
    const trimmed = videoUrl.trim();
    if (!trimmed || filmMode !== 'url') return;
    if (!/^https?:\/\/.+/i.test(trimmed)) return;
    extractTimer.current = setTimeout(() => {
      extract(trimmed);
    }, 800);
    return () => {
      if (extractTimer.current) clearTimeout(extractTimer.current);
    };
  }, [videoUrl, filmMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const switchToCatalog = useCallback(() => {
    setFilmMode('catalog');
    setVideoUrl('');
    resetExtract();
  }, [resetExtract]);

  const switchToUrl = useCallback(() => {
    setFilmMode('url');
    setSelectedMovie(null);
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  const selectMovie = useCallback((movie: IMovie) => {
    setSelectedMovie(movie);
    setSearchResults([]);
    setSearchQuery('');
  }, []);

  const clearSelectedMovie = useCallback(() => {
    setSelectedMovie(null);
    setSearchQuery('');
  }, []);

  const toggleFriend = useCallback((id: string) => {
    setSelectedFriendIds(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id],
    );
  }, []);

  const selectedFriends = friends.filter(f => selectedFriendIds.includes(f._id));

  const handleCreate = async (onSuccess: (roomId: string) => void) => {
    if (!roomName.trim()) {
      Alert.alert('Xato', 'Xona nomi kiriting');
      return;
    }

    if (filmMode === 'catalog' && !selectedMovie) {
      Alert.alert('Xato', 'Katalogdan film tanlang yoki URL rejimiga o\'ting');
      return;
    }
    if (filmMode === 'url' && !videoUrl.trim()) {
      Alert.alert('Xato', 'Video URL kiriting');
      return;
    }

    setLoading(true);
    try {
      const payload: Parameters<typeof watchPartyApi.createRoom>[0] = {
        name: roomName.trim(),
        isPrivate,
        maxMembers,
      };
      if (filmMode === 'catalog' && selectedMovie) {
        payload.movieId = selectedMovie._id;
        if (!selectedMovie.videoUrl) {
          Alert.alert(
            'Video mavjud emas',
            'Bu filmda video fayl hali yuklanmagan. URL orqali kiriting yoki boshqa film tanlang.',
          );
          setLoading(false);
          return;
        }
        payload.videoUrl = selectedMovie.videoUrl;
      } else if (filmMode === 'url' && videoUrl.trim()) {
        payload.videoUrl = extractResult?.videoUrl ?? videoUrl.trim();
      }
      const room = await watchPartyApi.createRoom(payload);
      onSuccess(room._id);
    } catch (err: unknown) {
      let msg = 'Xona yaratib bo\'lmadi. Qayta urinib ko\'ring.';
      if (err && typeof err === 'object' && 'response' in err) {
        const resp = (err as { response?: { data?: { message?: string }; status?: number } }).response;
        if (resp?.data?.message) msg = resp.data.message;
        else if (resp?.status === 401) msg = 'Sessiya tugagan. Qayta kiring.';
        else if (resp?.status === 403) msg = 'Ruxsat berilmagan.';
      }
      Alert.alert('Xato', msg);
    } finally {
      setLoading(false);
    }
  };

  return {
    roomName,
    setRoomName,
    isPrivate,
    setIsPrivate,
    maxMembers,
    setMaxMembers,
    loading,
    maxMembersOptions: MAX_MEMBERS_OPTIONS,

    filmMode,
    searchQuery,
    setSearchQuery,
    searchResults,
    searching,
    selectedMovie,
    videoUrl,
    setVideoUrl,

    switchToCatalog,
    switchToUrl,
    selectMovie,
    clearSelectedMovie,

    isExtracting,
    extractResult,
    fallbackMode,
    resetExtract,

    friends,
    selectedFriendIds,
    selectedFriends,
    toggleFriend,

    handleCreate,
  };
}
