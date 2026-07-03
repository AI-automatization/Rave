// WeWatch Mobile — useWatchPartyCreate hook
import { useState, useEffect, useRef, useCallback } from 'react';

import { watchPartyApi } from '@api/watchParty.api';
import { userApi } from '@api/user.api';
import { useVideoExtraction } from '@hooks/useVideoExtraction';
import { isDomainBlocked } from '@constants/blockedDomains';
import { extractDomain } from '@utils/videoPlayer';
import { useT } from '@i18n/index';
import type { IUserPublic } from '@app-types/index';
import { appAlert } from '@components/common/AppAlert';

const MAX_MEMBERS_OPTIONS = [2, 4, 6, 8, 10] as const;

interface UseWatchPartyCreateReturn {
  roomName: string;
  setRoomName: (v: string) => void;
  isPrivate: boolean;
  setIsPrivate: (v: boolean) => void;
  maxMembers: number;
  setMaxMembers: (v: number) => void;
  loading: boolean;
  maxMembersOptions: readonly number[];

  videoUrl: string;
  setVideoUrl: (v: string) => void;
  urlError: string | null;

  isExtracting: boolean;
  extractResult: ReturnType<typeof useVideoExtraction>['result'];
  fallbackMode: boolean;
  resetExtract: () => void;

  friends: IUserPublic[];
  selectedFriendIds: string[];
  selectedFriends: IUserPublic[];
  toggleFriend: (id: string) => void;

  handleCreate: (onSuccess: (roomId: string) => void) => Promise<void>;
}

export function useWatchPartyCreate(): UseWatchPartyCreateReturn {
  const { t } = useT();
  const [roomName, setRoomName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [maxMembers, setMaxMembers] = useState(4);
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const extractTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    isExtracting,
    result: extractResult,
    fallbackMode,
    extract,
    reset: resetExtract,
  } = useVideoExtraction();

  const [friends, setFriends] = useState<IUserPublic[]>([]);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);

  useEffect(() => {
    userApi.getFriends().then(setFriends).catch(() => {});
  }, []);

  // URL extraction debounce
  useEffect(() => {
    if (extractTimer.current) clearTimeout(extractTimer.current);
    resetExtract();
    const trimmed = videoUrl.trim();
    if (!trimmed || !/^https?:\/\/.+/i.test(trimmed)) return;
    extractTimer.current = setTimeout(() => {
      extract(trimmed);
    }, 800);
    return () => {
      if (extractTimer.current) clearTimeout(extractTimer.current);
    };
  }, [videoUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleVideoUrlChange = useCallback((value: string) => {
    setVideoUrl(value);
    const domain = extractDomain(value.trim());
    if (domain && isDomainBlocked(value.trim())) {
      setUrlError(t('watchParty', 'domainBlockedPlatform'));
    } else {
      setUrlError(null);
    }
  }, []);

  const toggleFriend = useCallback((id: string) => {
    setSelectedFriendIds(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id],
    );
  }, []);

  const selectedFriends = friends.filter(f => selectedFriendIds.includes(f._id));

  const handleCreate = async (onSuccess: (roomId: string) => void) => {
    if (!roomName.trim()) {
      appAlert(t('common', 'error'), t('watchParty', 'errorRoomName'));
      return;
    }
    if (!videoUrl.trim()) {
      appAlert(t('common', 'error'), t('watchParty', 'errorUrl'));
      return;
    }
    if (isDomainBlocked(videoUrl.trim())) {
      appAlert(t('common', 'error'), t('watchParty', 'domainBlockedPlatform'));
      return;
    }

    setLoading(true);
    try {
      const room = await watchPartyApi.createRoom({
        name: roomName.trim(),
        isPrivate,
        maxMembers,
        videoUrl: videoUrl.trim(),
      });
      onSuccess(room._id);
    } catch (err: unknown) {
      let msg = t('watchParty', 'errorCreate');
      if (err && typeof err === 'object' && 'response' in err) {
        const resp = (err as { response?: { data?: { message?: string; code?: string }; status?: number } }).response;
        if (resp?.data?.code === 'USER_RESTRICTED') {
          msg = t('blocked', 'userRestricted');
        } else if (resp?.data?.message) {
          msg = resp.data.message;
        } else if (resp?.status === 401) {
          msg = t('watchParty', 'sessionExpired');
        } else if (resp?.status === 403) {
          msg = t('watchParty', 'forbidden');
        }
      }
      appAlert(t('common', 'error'), msg);
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
    videoUrl,
    setVideoUrl: handleVideoUrlChange,
    urlError,
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
