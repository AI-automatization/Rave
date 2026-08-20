import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { apiResponse } from '@shared/utils/apiResponse';

// This browser reads collections via the raw MongoDB driver (db.collection(name)), not through
// their Mongoose models — Mongoose's `select: false` field hiding (password hashes, reset
// tokens, etc. on whichever schemas happen to live in this service's own DB) never applies
// here. Superadmin-only already, but redact common secret-shaped field names anyway as
// defense-in-depth — this is a generic collection browser with no per-collection schema
// awareness, so it's a name-based heuristic, not a real allowlist.
const SENSITIVE_FIELD_PATTERN = /password|passwordhash|secret|token|otp|apikey|privatekey|refreshtoken/i;

function redactSensitiveFields<T>(doc: T): T {
  if (!doc || typeof doc !== 'object') return doc;
  const out = { ...(doc as Record<string, unknown>) };
  for (const key of Object.keys(out)) {
    if (SENSITIVE_FIELD_PATTERN.test(key)) out[key] = '[redacted]';
  }
  return out as T;
}

// User-supplied search text goes into a MongoDB $regex — escape regex metacharacters so it's
// matched literally (a plain substring search, which is what a "search" box implies) instead
// of being interpreted as a pattern. Closes both a ReDoS vector (attacker-crafted catastrophic
// backtracking) and unintended matches from stray regex syntax in normal search text.
function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export class DatabaseController {
  listCollections = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const db = mongoose.connection.db;
      if (!db) { res.status(503).json(apiResponse.error('Database not connected')); return; }

      const cols = await db.listCollections().toArray();
      const appCols = cols.filter((col) => !this.isSystemCollection(col.name));
      const stats = await Promise.all(
        appCols.map(async (col) => {
          const count = await db.collection(col.name).estimatedDocumentCount().catch(() => 0);
          return { name: col.name, count };
        }),
      );
      stats.sort((a, b) => a.name.localeCompare(b.name));
      res.json(apiResponse.success({ collections: stats }));
    } catch (error) {
      next(error);
    }
  };

  private isSystemCollection(name: string): boolean {
    return /^(system\.|admin\b)/i.test(name);
  }

  listDocuments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const db = mongoose.connection.db;
      if (!db) { res.status(503).json(apiResponse.error('Database not connected')); return; }

      const { name } = req.params;
      if (this.isSystemCollection(name)) {
        res.status(403).json(apiResponse.error('Access to system collections is not allowed'));
        return;
      }
      const page  = Math.max(1, parseInt(req.query.page  as string, 10) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
      const search = ((req.query.search as string) || '').trim();

      let filter: Record<string, unknown> = {};
      if (search) {
        if (/^[a-f\d]{24}$/i.test(search)) {
          filter = { _id: new mongoose.Types.ObjectId(search) };
        } else {
          const rx = { $regex: escapeRegex(search), $options: 'i' };
          filter = { $or: [{ email: rx }, { username: rx }, { name: rx }, { title: rx }, { type: rx }] };
        }
      }

      const col = db.collection(name);
      const skip = (page - 1) * limit;
      const [documents, total] = await Promise.all([
        col.find(filter).sort({ _id: -1 }).skip(skip).limit(limit).toArray(),
        col.countDocuments(filter),
      ]);

      res.json(apiResponse.success({
        documents: documents.map(redactSensitiveFields),
        total,
        page,
        limit,
        pages: Math.ceil(total / limit) || 1,
      }));
    } catch (error) {
      next(error);
    }
  };

  getDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const db = mongoose.connection.db;
      if (!db) { res.status(503).json(apiResponse.error('Database not connected')); return; }

      const { name, id } = req.params;
      if (this.isSystemCollection(name)) {
        res.status(403).json(apiResponse.error('Access to system collections is not allowed'));
        return;
      }
      if (!/^[a-f\d]{24}$/i.test(id)) {
        res.status(400).json(apiResponse.error('Invalid document ID'));
        return;
      }
      const doc = await db.collection(name).findOne({ _id: new mongoose.Types.ObjectId(id) });
      if (!doc) { res.status(404).json(apiResponse.error('Document not found')); return; }

      res.json(apiResponse.success({ document: redactSensitiveFields(doc) }));
    } catch (error) {
      next(error);
    }
  };

  deleteDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const db = mongoose.connection.db;
      if (!db) { res.status(503).json(apiResponse.error('Database not connected')); return; }

      const { name, id } = req.params;
      if (this.isSystemCollection(name)) {
        res.status(403).json(apiResponse.error('Access to system collections is not allowed'));
        return;
      }
      if (!/^[a-f\d]{24}$/i.test(id)) {
        res.status(400).json(apiResponse.error('Invalid document ID'));
        return;
      }
      const result = await db.collection(name).deleteOne({ _id: new mongoose.Types.ObjectId(id) });
      if (result.deletedCount === 0) { res.status(404).json(apiResponse.error('Document not found')); return; }

      res.json(apiResponse.success(null, 'Document deleted'));
    } catch (error) {
      next(error);
    }
  };
}
