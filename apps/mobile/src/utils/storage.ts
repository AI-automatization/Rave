// WeWatch Mobile — Secure Token Storage (expo-secure-store)
import * as SecureStore from 'expo-secure-store';

const KEYS = {
  ACCESS_TOKEN: 'wewatch_access_token',
  REFRESH_TOKEN: 'wewatch_refresh_token',
  USER_ID: 'wewatch_user_id',
} as const;

async function set(key: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value);
}

async function get(key: string): Promise<string | null> {
  return SecureStore.getItemAsync(key);
}

async function remove(key: string): Promise<void> {
  await SecureStore.deleteItemAsync(key);
}

// Per-user privacy policy acceptance flag.
// Keyed by userId so deleting an account and re-registering always re-prompts.
// Bump the version suffix in privacyPolicy.ts to re-prompt all users on policy updates.
export const privacyPolicyStorage = {
  async isAccepted(userId: string): Promise<boolean> {
    const val = await get(`wewatch_privacy_v2_${userId}`);
    return val === '1';
  },
  async markAccepted(userId: string): Promise<void> {
    await set(`wewatch_privacy_v2_${userId}`, '1');
  },
};

// Per-user flag: was profile setup screen already shown?
export const profileSetupStorage = {
  async isDone(userId: string): Promise<boolean> {
    const val = await get(`wewatch_profile_setup_done_${userId}`);
    return val === '1';
  },
  async markDone(userId: string): Promise<void> {
    await set(`wewatch_profile_setup_done_${userId}`, '1');
  },
};

// Locally stored blocked user IDs — persisted per-device across sessions.
// Backed by SecureStore JSON list. Used to comply with Apple rule 1.2 (block abusive users).
export const blockedUsersStorage = {
  async getAll(): Promise<string[]> {
    try {
      const raw = await get('wewatch_blocked_users_v1');
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  },

  async add(userId: string): Promise<void> {
    const current = await blockedUsersStorage.getAll();
    if (!current.includes(userId)) {
      await set('wewatch_blocked_users_v1', JSON.stringify([...current, userId]));
    }
  },

  async isBlocked(userId: string): Promise<boolean> {
    const list = await blockedUsersStorage.getAll();
    return list.includes(userId);
  },
};

// Per-user flag: was the "bind your email" profile banner dismissed?
// Keyed by userId so it re-appears for a different account on the same device.
export const bindEmailBannerStorage = {
  async isDismissed(userId: string): Promise<boolean> {
    const val = await get(`wewatch_bind_email_banner_dismissed_${userId}`);
    return val === '1';
  },
  async dismiss(userId: string): Promise<void> {
    await set(`wewatch_bind_email_banner_dismissed_${userId}`, '1');
  },
};

export const activeRoomStorage = {
  async save(roomId: string, videoReferer?: string): Promise<void> {
    await set('wewatch_active_room_v1', JSON.stringify({ roomId, videoReferer: videoReferer ?? null, savedAt: Date.now() }));
  },
  async get(): Promise<{ roomId: string; videoReferer?: string; savedAt?: number } | null> {
    try {
      const raw = await get('wewatch_active_room_v1');
      return raw ? (JSON.parse(raw) as { roomId: string; videoReferer?: string; savedAt?: number }) : null;
    } catch {
      return null;
    }
  },
  async clear(): Promise<void> {
    await remove('wewatch_active_room_v1');
  },
};

export const tokenStorage = {
  async saveTokens(accessToken: string, refreshToken: string, userId: string): Promise<void> {
    await Promise.all([
      set(KEYS.ACCESS_TOKEN, accessToken),
      set(KEYS.REFRESH_TOKEN, refreshToken),
      set(KEYS.USER_ID, userId),
    ]);
  },

  async getAccessToken(): Promise<string | null> {
    return get(KEYS.ACCESS_TOKEN);
  },

  async getRefreshToken(): Promise<string | null> {
    return get(KEYS.REFRESH_TOKEN);
  },

  async getUserId(): Promise<string | null> {
    return get(KEYS.USER_ID);
  },

  async getAll(): Promise<{ accessToken: string | null; refreshToken: string | null; userId: string | null }> {
    const [accessToken, refreshToken, userId] = await Promise.all([
      get(KEYS.ACCESS_TOKEN),
      get(KEYS.REFRESH_TOKEN),
      get(KEYS.USER_ID),
    ]);
    return { accessToken, refreshToken, userId };
  },

  async clear(): Promise<void> {
    await Promise.all([
      remove(KEYS.ACCESS_TOKEN),
      remove(KEYS.REFRESH_TOKEN),
      remove(KEYS.USER_ID),
    ]);
  },
};

// Remembers where the user was reading in a DM chat (the top-most visible list item
// at the moment they left), so reopening the chat restores that position instead of
// always jumping to the newest message (Telegram-style "continue reading").
export const dmScrollPositionStorage = {
  async save(peerId: string, itemId: string): Promise<void> {
    await set(`wewatch_dm_scroll_${peerId}`, itemId);
  },
  async get(peerId: string): Promise<string | null> {
    return get(`wewatch_dm_scroll_${peerId}`);
  },
  async clear(peerId: string): Promise<void> {
    await remove(`wewatch_dm_scroll_${peerId}`);
  },
};
