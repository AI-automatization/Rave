import { apiClient } from '@/lib/api-client';

// Mirrors mobile's UserReportReason (apps/mobile/src/api/report.api.ts) — same backend
// contract (services/admin/src/controllers/moderation.controller.ts VALID_USER_REASONS).
export type UserReportReason =
  | 'harassment'
  | 'spam'
  | 'inappropriate_content'
  | 'fake_account'
  | 'hate_speech'
  | 'other';

export const reportApi = {
  reportUser: (userId: string, reason: UserReportReason, comment?: string) =>
    apiClient<void>(`/api/moderation/users/${userId}/report`, {
      method: 'POST',
      body: { reason, comment },
    }),
};
