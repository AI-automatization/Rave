import { apiClient } from '@/lib/api-client';

export interface PlanInfo {
  plan: 'free' | 'pro';
  status: string;
  currentPeriodEnd: string | null;
}

// PAYME | CLICK — matches services/payment (docs/INTEGRATION.md). UZUM isn't onboarded on
// the billing side yet, so it isn't offered here.
export type BillingProvider = 'PAYME' | 'CLICK';

export const paymentApi = {
  getPlan: () =>
    apiClient<PlanInfo>('/api/payment/plan'),

  startCheckout: (provider: BillingProvider) =>
    apiClient<{ checkoutUrl: string; paymentId: string }>('/api/payment/checkout', {
      method: 'POST',
      body: { provider },
    }),
};
