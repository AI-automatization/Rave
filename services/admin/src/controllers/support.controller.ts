import { Request, Response, NextFunction } from 'express';
import { SupportService } from '../services/support.service';
import { apiResponse, buildPaginationMeta } from '@shared/utils/apiResponse';

export class SupportController {
  constructor(private service: SupportService) {}

  // POST /support/conversations — open or reuse conversation for user
  getOrCreate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId, issueRef } = req.body as { userId: string; issueRef?: string };
      if (!userId) { res.status(400).json(apiResponse.error('userId required')); return; }
      const conv = await this.service.getOrCreateConversation(userId, issueRef);
      res.json(apiResponse.success(conv));
    } catch (err) { next(err); }
  };

  // GET /support/conversations
  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
      const status = (req.query.status as string) || 'all';
      const { conversations, total } = await this.service.listConversations({ status, page, limit });
      res.json({ ...apiResponse.success(conversations), meta: buildPaginationMeta(total, page, limit) });
    } catch (err) { next(err); }
  };

  // GET /support/conversations/:id
  getOne = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const conv = await this.service.getConversation(req.params.id);
      if (!conv) { res.status(404).json(apiResponse.error('Not found')); return; }
      res.json(apiResponse.success(conv));
    } catch (err) { next(err); }
  };

  // GET /support/conversations/:id/messages
  listMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
      const { messages, total } = await this.service.listMessages(req.params.id, page, limit);
      res.json({ ...apiResponse.success(messages), meta: buildPaginationMeta(total, page, limit) });
    } catch (err) { next(err); }
  };

  // POST /support/conversations/:id/messages
  sendMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { text, senderRole } = req.body as { text: string; senderRole?: 'user' | 'admin' };
      if (!text?.trim()) { res.status(400).json(apiResponse.error('text required')); return; }
      const role: 'user' | 'admin' = senderRole === 'user' ? 'user' : 'admin';
      const adminId = (req as Request & { user?: { id: string } }).user?.id ?? 'admin';
      const msg = await this.service.addMessage(req.params.id, adminId, role, text.trim());
      res.status(201).json(apiResponse.success(msg));
    } catch (err) { next(err); }
  };

  // PATCH /support/conversations/:id/close
  close = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const conv = await this.service.closeConversation(req.params.id);
      if (!conv) { res.status(404).json(apiResponse.error('Not found')); return; }
      res.json(apiResponse.success(conv));
    } catch (err) { next(err); }
  };

  // GET /support/open-count
  openCount = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const count = await this.service.openCount();
      res.json(apiResponse.success({ count }));
    } catch (err) { next(err); }
  };

  // GET /internal/support/user/:userId — mobile: get user's conversations
  getUserConversations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const convs = await this.service.getUserConversations(req.params.userId);
      res.json(apiResponse.success(convs));
    } catch (err) { next(err); }
  };

  // POST /internal/support/user/:userId/message — mobile: user sends message
  userSendMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { text, conversationId } = req.body as { text: string; conversationId?: string };
      if (!text?.trim()) { res.status(400).json(apiResponse.error('text required')); return; }

      let convId = conversationId;
      if (!convId) {
        const conv = await this.service.getOrCreateConversation(req.params.userId);
        convId = String(conv._id);
      }
      const msg = await this.service.addMessage(convId, req.params.userId, 'user', text.trim());
      res.status(201).json(apiResponse.success(msg));
    } catch (err) { next(err); }
  };
}
