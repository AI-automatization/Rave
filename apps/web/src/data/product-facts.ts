/** Public facts used by metadata, structured data and AI-readable copy. */
export const PRODUCT_FACTS = {
  verifiedAt: '2026-08-06',
  platforms: {
    web: { status: 'available', url: 'https://wewatch.uz' },
    ios: { status: 'planned', url: null },
    android: { status: 'planned', url: null },
  },
  pricing: {
    coreWatchPartyIsFree: true,
    pro: {
      status: 'listed',
      monthlyPriceUzs: 29_000,
      // The repository does not prove that checkout is live in production.
      purchaseAvailability: 'unverified',
    },
  },
  room: { maxParticipants: 10, inactiveTimeoutMinutes: 10 },
  sync: { correctionThresholdMs: 500 },
  supportedSources: ['YouTube', 'VK Video', 'Rutube', 'direct MP4'],
} as const;

export const AVAILABLE_OPERATING_SYSTEMS = 'Web';
