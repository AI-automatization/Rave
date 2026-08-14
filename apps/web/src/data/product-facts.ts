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
      // Owner decision 2026-08-10: the plan is planned, but its price is not settled yet
      // (pending a call between Bekzod, Emirhan and Saidazim), so no figure is published.
      // Verified in code the same day: no payment provider exists in services/ or apps/,
      // and the `?plan=pro` parameter is read nowhere — the plan cannot be bought.
      status: 'planned',
      monthlyPriceUzs: null,
      purchaseAvailability: 'unavailable',
    },
  },
  room: { maxParticipants: 10, inactiveTimeoutMinutes: 10 },
  sync: { correctionThresholdMs: 500 },
  supportedSources: ['YouTube', 'VK Video', 'Rutube', 'direct MP4'],
} as const;

export const AVAILABLE_OPERATING_SYSTEMS = 'Web';
