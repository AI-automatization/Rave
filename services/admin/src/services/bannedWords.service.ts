import { BannedWord, BannedWordCategory } from '../models/bannedWord.model';
import { logger } from '@shared/utils/logger';

export class BannedWordsService {
  async listWords(filters: { category?: string; active?: boolean; page: number; limit: number }) {
    const query: Record<string, unknown> = {};
    if (filters.category) query.category = filters.category;
    if (filters.active !== undefined) query.active = filters.active;

    const total = await BannedWord.countDocuments(query);
    const words = await BannedWord.find(query)
      .sort({ category: 1, word: 1 })
      .skip((filters.page - 1) * filters.limit)
      .limit(filters.limit)
      .lean();

    return { words, total, page: filters.page, limit: filters.limit };
  }

  async addWord(word: string, category: BannedWordCategory = 'profanity') {
    const normalized = word.toLowerCase().trim();
    const existing = await BannedWord.findOne({ word: normalized });
    if (existing) {
      existing.active = true;
      existing.category = category;
      await existing.save();
      return existing;
    }
    return BannedWord.create({ word: normalized, category });
  }

  async addWordsBulk(words: string[], category: BannedWordCategory = 'profanity') {
    const normalized = words.map((w) => w.toLowerCase().trim()).filter(Boolean);
    const ops = normalized.map((word) => ({
      updateOne: {
        filter: { word },
        update: { $set: { word, category, active: true } },
        upsert: true,
      },
    }));
    const result = await BannedWord.bulkWrite(ops);
    logger.info('[BannedWordsService] bulk upsert', { count: normalized.length, upserted: result.upsertedCount });
    return { inserted: result.upsertedCount, matched: result.matchedCount };
  }

  async deleteWord(id: string) {
    return BannedWord.findByIdAndDelete(id);
  }

  async toggleWord(id: string, active: boolean) {
    return BannedWord.findByIdAndUpdate(id, { active }, { new: true });
  }

  async getAllActiveWords(): Promise<string[]> {
    const words = await BannedWord.find({ active: true }).select('word').lean();
    return words.map((w) => w.word);
  }
}
