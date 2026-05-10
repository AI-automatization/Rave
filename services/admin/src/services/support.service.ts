import { Types } from 'mongoose';
import { SupportConversation } from '../models/supportConversation.model';
import { SupportMessage } from '../models/supportMessage.model';
import { sendInternalNotification } from '@shared/utils/serviceClient';
import { logger } from '@shared/utils/logger';
import { emitSupportMessage, emitSupportClosed } from '../socket/supportSocket';

export class SupportService {
  async getOrCreateConversation(userId: string, issueRef?: string) {
    let conv = await SupportConversation.findOne({ userId, status: 'open' });
    if (!conv) {
      conv = await SupportConversation.create({
        userId,
        issueRef: issueRef ? new Types.ObjectId(issueRef) : undefined,
      });
    }
    return conv;
  }

  async listConversations(filters: { status?: string; page: number; limit: number }) {
    const query: Record<string, unknown> = {};
    if (filters.status && filters.status !== 'all') query.status = filters.status;

    const total = await SupportConversation.countDocuments(query);
    const conversations = await SupportConversation.find(query)
      .sort({ lastMessageAt: -1 })
      .skip((filters.page - 1) * filters.limit)
      .limit(filters.limit);

    return { conversations, total };
  }

  async getConversation(id: string) {
    return SupportConversation.findById(id);
  }

  async listMessages(conversationId: string, page: number, limit: number) {
    const query = { conversationId: new Types.ObjectId(conversationId) };
    const total = await SupportMessage.countDocuments(query);
    const messages = await SupportMessage.find(query)
      .sort({ createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit);
    return { messages, total };
  }

  async addMessage(conversationId: string, senderId: string, senderRole: 'user' | 'admin', text: string) {
    const msg = await SupportMessage.create({ conversationId: new Types.ObjectId(conversationId), senderId, senderRole, text });

    emitSupportMessage(conversationId, msg);

    await SupportConversation.findByIdAndUpdate(conversationId, { lastMessageAt: new Date() });

    if (senderRole === 'admin') {
      const conv = await SupportConversation.findById(conversationId).lean();
      if (conv) {
        try {
          await sendInternalNotification({
            userId: conv.userId,
            type: 'support_reply',
            title: 'Поддержка',
            body: text.length > 80 ? text.slice(0, 77) + '…' : text,
            data: { conversationId, type: 'support_reply' },
          });
        } catch (err) {
          logger.warn('[SupportService] push notify failed', { err });
        }
      }
    }

    return msg;
  }

  async closeConversation(id: string) {
    const conv = await SupportConversation.findByIdAndUpdate(id, { status: 'closed' }, { new: true });
    if (conv) emitSupportClosed(id);
    return conv;
  }

  async rateConversation(convId: string, userId: string, score: number, comment?: string) {
    const conv = await SupportConversation.findById(convId);
    if (!conv) throw new Error('Not found');
    if (conv.userId !== userId) throw new Error('Forbidden');
    if (conv.status !== 'closed') throw new Error('Conversation is not closed');
    if (conv.rating?.score) throw new Error('Already rated');
    return SupportConversation.findByIdAndUpdate(
      convId,
      { rating: { score, comment: comment ?? null, ratedAt: new Date() } },
      { new: true },
    );
  }

  async getUserConversations(userId: string) {
    return SupportConversation.find({ userId }).sort({ lastMessageAt: -1 });
  }

  async openCount() {
    return SupportConversation.countDocuments({ status: 'open' });
  }
}
