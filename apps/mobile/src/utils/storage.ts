import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV({ id: 'cinesync' });

const KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_ID: 'user_id',
} as const;

export const tokenStorage = {
  getAccessToken: () => storage.getString(KEYS.ACCESS_TOKEN) ?? null,
  setAccessToken: (token: string) => storage.set(KEYS.ACCESS_TOKEN, token),

  getRefreshToken: () => storage.getString(KEYS.REFRESH_TOKEN) ?? null,
  setRefreshToken: (token: string) => storage.set(KEYS.REFRESH_TOKEN, token),

  getUserId: () => storage.getString(KEYS.USER_ID) ?? null,
  setUserId: (id: string) => storage.set(KEYS.USER_ID, id),

  setTokens: (accessToken: string, refreshToken: string) => {
    storage.set(KEYS.ACCESS_TOKEN, accessToken);
    storage.set(KEYS.REFRESH_TOKEN, refreshToken);
  },

  clearAll: () => {
    storage.remove(KEYS.ACCESS_TOKEN);
    storage.remove(KEYS.REFRESH_TOKEN);
    storage.remove(KEYS.USER_ID);
  },
};
