import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: 'cinesync' });

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

  clearAll: () => {
    storage.delete(KEYS.ACCESS_TOKEN);
    storage.delete(KEYS.REFRESH_TOKEN);
    storage.delete(KEYS.USER_ID);
  },
};
