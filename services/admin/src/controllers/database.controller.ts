import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { apiResponse } from '@shared/utils/apiResponse';

export class DatabaseController {
  listCollections = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const db = mongoose.connection.db;
      if (!db) { res.status(503).json(apiResponse.error('Database not connected')); return; }

      const cols = await db.listCollections().toArray();
      const stats = await Promise.all(
        cols.map(async (col) => {
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

  listDocuments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const db = mongoose.connection.db;
      if (!db) { res.status(503).json(apiResponse.error('Database not connected')); return; }

      const { name } = req.params;
      const page  = Math.max(1, parseInt(req.query.page  as string, 10) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
      const search = ((req.query.search as string) || '').trim();

      let filter: Record<string, unknown> = {};
      if (search) {
        if (/^[a-f\d]{24}$/i.test(search)) {
          filter = { _id: new mongoose.Types.ObjectId(search) };
        } else {
          const rx = { $regex: search, $options: 'i' };
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
        documents,
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
      if (!/^[a-f\d]{24}$/i.test(id)) {
        res.status(400).json(apiResponse.error('Invalid document ID'));
        return;
      }
      const doc = await db.collection(name).findOne({ _id: new mongoose.Types.ObjectId(id) });
      if (!doc) { res.status(404).json(apiResponse.error('Document not found')); return; }

      res.json(apiResponse.success({ document: doc }));
    } catch (error) {
      next(error);
    }
  };

  deleteDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const db = mongoose.connection.db;
      if (!db) { res.status(503).json(apiResponse.error('Database not connected')); return; }

      const { name, id } = req.params;
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
