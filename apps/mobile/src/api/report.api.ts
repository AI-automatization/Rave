import { adminClient } from './client';

export type ReportReason = 'prohibited_content' | 'spam' | 'violence' | 'harassment' | 'copyright' | 'other';

export const reportApi = {
  reportRoom: async (roomId: string, reason: ReportReason, comment?: string): Promise<void> => {
    await adminClient.post(`/api/v1/internal/moderation/rooms/${roomId}/report`, { reason, comment });
  },
};
