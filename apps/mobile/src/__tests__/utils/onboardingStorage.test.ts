// onboardingStorage — language select + onboarding slides only on the first launch
const mockStore = new Map<string, string>();

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (k: string) => mockStore.get(k) ?? null),
  setItemAsync: jest.fn(async (k: string, v: string) => { mockStore.set(k, v); }),
  deleteItemAsync: jest.fn(async (k: string) => { mockStore.delete(k); }),
}));

import { onboardingStorage } from '../../utils/storage';

describe('onboardingStorage', () => {
  beforeEach(() => mockStore.clear());

  it('fresh install → not seen', async () => {
    await expect(onboardingStorage.isSeen()).resolves.toBe(false);
  });

  it('after markSeen → seen', async () => {
    await onboardingStorage.markSeen();
    await expect(onboardingStorage.isSeen()).resolves.toBe(true);
  });

  it('existing user (language chosen before the flag existed) → seen', async () => {
    mockStore.set('cinesync_lang', 'uz');
    await expect(onboardingStorage.isSeen()).resolves.toBe(true);
  });
});
