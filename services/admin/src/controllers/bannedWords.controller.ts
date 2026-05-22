import { Request, Response, NextFunction } from 'express';
import { BannedWordsService } from '../services/bannedWords.service';
import { BannedWordCategory } from '../models/bannedWord.model';
import { apiResponse } from '@shared/utils/apiResponse';

const svc = new BannedWordsService();

export class BannedWordsController {
  listWords = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(200, parseInt(req.query.limit as string) || 50);
      const category = req.query.category as string | undefined;
      const active = req.query.active !== undefined ? req.query.active === 'true' : undefined;
      const result = await svc.listWords({ category, active, page, limit });
      res.json(apiResponse.success(result));
    } catch (err) { next(err); }
  };

  addWord = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { word, category } = req.body as { word: string; category?: BannedWordCategory };
      if (!word?.trim()) { res.status(400).json({ success: false, message: 'word is required' }); return; }
      const result = await svc.addWord(word, category);
      res.status(201).json(apiResponse.success(result));
    } catch (err) { next(err); }
  };

  addWordsBulk = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { words, category } = req.body as { words: string[]; category?: BannedWordCategory };
      if (!Array.isArray(words) || !words.length) { res.status(400).json({ success: false, message: 'words array is required' }); return; }
      const result = await svc.addWordsBulk(words, category);
      res.json(apiResponse.success(result));
    } catch (err) { next(err); }
  };

  deleteWord = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await svc.deleteWord(req.params.id);
      res.json(apiResponse.success(null as unknown, 'Deleted'));
    } catch (err) { next(err); }
  };

  toggleWord = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const active = req.body.active === true;
      const result = await svc.toggleWord(req.params.id, active);
      res.json(apiResponse.success(result));
    } catch (err) { next(err); }
  };

  // Internal endpoint — called by other services (no auth required, protected by x-internal-secret)
  getAllActiveWords = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const words = await svc.getAllActiveWords();
      res.json(apiResponse.success({ words }));
    } catch (err) { next(err); }
  };
}
