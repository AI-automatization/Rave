import { adminClient } from './client';

export type ReportReason = 'prohibited_content' | 'spam' | 'violence' | 'harassment' | 'copyright' | 'other';

export const reportApi = {
  reportRoom: async (roomId: string, reason: ReportReason, comment?: string): Promise<void> => {
    await adminClient.post(`/internal/moderation/rooms/${roomId}/report`, { reason, comment });
  },

  reportUser: async (userId: string, reason: ReportReason, comment?: string): Promise<void> => {
    await adminClient.post(`/internal/moderation/users/${userId}/report`, { reason, comment });
  },
};
