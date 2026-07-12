import { Request, Response, NextFunction } from 'express';
import { DMService } from '../services/dm.service';
import { apiResponse } from '@shared/utils/apiResponse';
import { AuthenticatedRequest } from '@shared/types';

export class DMController {
  constructor(private dmService: DMService) {}

  getHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId: myId } = (req as AuthenticatedRequest).user;
      const { userId } = req.params;
      const before = req.query['before'] as string | undefined;
      const messages = await this.dmService.getHistory(myId, userId, before);
      res.json(apiResponse.success(messages));
    } catch (err) {
      next(err);
    }
  };

  sendMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId: myId } = (req as AuthenticatedRequest).user;
      const { userId } = req.params;
      const { text, replyToId } = req.body as { text: string; replyToId?: string };
      const message = await this.dmService.sendMessage(myId, userId, text, { replyToId });
      res.status(201).json(apiResponse.success(message));
    } catch (err) {
      next(err);
    }
  };

  forwardMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId: myId } = (req as AuthenticatedRequest).user;
      const { userId } = req.params;
      const { messageId } = req.body as { messageId: string };
      const message = await this.dmService.forwardMessage(myId, userId, messageId);
      res.status(201).json(apiResponse.success(message));
    } catch (err) {
      next(err);
    }
  };

  markRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId: myId } = (req as AuthenticatedRequest).user;
      const { userId } = req.params;
      await this.dmService.markRead(myId, userId);
      res.json(apiResponse.success(null));
    } catch (err) {
      next(err);
    }
  };

  getConversations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId: myId } = (req as AuthenticatedRequest).user;
      const conversations = await this.dmService.getConversations(myId);
      res.json(apiResponse.success(conversations));
    } catch (err) {
      next(err);
    }
  };
}
