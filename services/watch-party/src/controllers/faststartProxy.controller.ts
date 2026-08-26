// WeWatch — serves a faststart-remuxed cache file (see faststartRemux.service.ts)
//
// Separate small file rather than adding to vbMediaProxy.controller.ts (already large) — this
// route only ever serves a file THIS server already wrote to its own local cache after
// validating/remuxing it, so it doesn't need any of that controller's SSRF/signature machinery.
// The file name itself is a sha256 hash this service generated — nothing attacker-controlled
// reaches the filesystem path.
import path from 'node:path';
import fs from 'node:fs';
import { Request, Response } from 'express';
import { logger } from '@shared/utils/logger';
import { CACHE_DIR, getFaststartFilePath } from '../services/faststartRemux.service';

const FILENAME_PATTERN = /^[0-9a-f]{32}\.mp4$/;

export const createFaststartProxyController = () => ({
  async stream(req: Request, res: Response): Promise<void> {
    const fileName = req.params.fileName;
    if (!FILENAME_PATTERN.test(fileName)) {
      res.status(400).json({ success: false, message: 'Invalid file name' });
      return;
    }
    const filePath = getFaststartFilePath(fileName);
    // Belt-and-suspenders against path traversal even though FILENAME_PATTERN above already
    // rules it out — resolved path must stay inside CACHE_DIR.
    if (!path.resolve(filePath).startsWith(path.resolve(CACHE_DIR) + path.sep)) {
      res.status(400).json({ success: false, message: 'Invalid file name' });
      return;
    }
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ success: false, message: 'Not found — remux may have expired, re-select the source' });
      return;
    }
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=3600, immutable');
    // res.sendFile handles Range requests (206/Content-Range) natively — no manual range math
    // needed here, unlike vbMediaProxy's passthrough which has to translate/cap a Range header
    // for an *upstream* request.
    res.sendFile(filePath, (err) => {
      if (err && !res.headersSent) {
        logger.warn('Faststart file serve failed', { fileName, error: err.message });
      }
    });
  },
});
