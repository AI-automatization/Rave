// WeWatch Mobile — Payment API
// Read-only: mobile shows subscription status + history, no checkout (see
// services/payment/README.md — Google Play policy forbids an in-app buy button
// outside the regions Google has opened external billing for; Uzbekistan isn't
// one of them until 2027-09-30).
import { paymentClient } from './client';
import { ApiResponse } from '@app-types/index';

export interface PlanStatus {
  plan: 'free' | 'pro';
  status: string;
  currentPeriodEnd: string | null;
}

export interface PaymentHistoryEntry {
  event: string;
  planSlug: string;
  provider: string | null;
  status: string;
  currentPeriodEnd: string | null;
  createdAt: string;
}

export const paymentApi = {
  async getPlan(): Promise<PlanStatus> {
    const { data } = await paymentClient.get<ApiResponse<PlanStatus>>('/payment/plan');
    return data.data!;
  },

  async getHistory(): Promise<PaymentHistoryEntry[]> {
    const { data } = await paymentClient.get<ApiResponse<PaymentHistoryEntry[]>>('/payment/history');
    return data.data ?? [];
  },
};
