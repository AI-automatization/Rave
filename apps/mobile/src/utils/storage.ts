// CineSync Mobile — Secure Token Storage (expo-secure-store)
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

// Global flag: has user accepted the privacy policy?
// Versioned key — bump version in privacyPolicy.ts to re-prompt on policy updates.
export const privacyPolicyStorage = {
  async isAccepted(): Promise<boolean> {
    const val = await get('wewatch_privacy_v1');
    return val === '1';
  },
  async markAccepted(): Promise<void> {
    await set('wewatch_privacy_v1', '1');
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
