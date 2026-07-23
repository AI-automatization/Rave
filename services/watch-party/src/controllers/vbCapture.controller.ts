// WeWatch — serves the in-memory VB capture buffer (services/vbCapture.service.ts) as a normal
// Range-capable HTTP video resource, so it can go through app-web's existing /api/content/
// proxy-stream pipeline exactly like any external CDN URL — no changes needed on that side.
import { Request, Response } from 'express';
import { readCaptureRange, hasCapture, getCaptureBytes } from '../services/vbCapture.service';

export const vbCaptureController = {
  stream(req: Request, res: Response): void {
    const { roomId } = req.params;

    if (!hasCapture(roomId)) {
      res.status(404).json({ success: false, message: 'No capture for this room' });
      return;
    }

    const totalBytes = getCaptureBytes(roomId);
    if (totalBytes === 0) {
      res.status(503).json({ success: false, message: 'Capture not ready yet' });
      return;
    }

    const range = req.headers.range;
    let start = 0;
    let end = totalBytes - 1;

    if (range) {
      const match = /bytes=(\d*)-(\d*)/.exec(range);
      if (match) {
        if (match[1]) start = parseInt(match[1], 10);
        if (match[2]) end = parseInt(match[2], 10);
      }
    }
    // Clamp to what's actually been captured so far — asking beyond that means "wait for more",
    // which we can't do synchronously here, so just clamp instead of hanging the request.
    end = Math.min(end, totalBytes - 1);
    if (start > end) start = end;

    const result = readCaptureRange(roomId, start, end);
    if (!result) {
      res.status(404).json({ success: false, message: 'No capture for this room' });
      return;
    }

    res.status(range ? 206 : 200);
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Content-Length', String(result.buffer.length));
    if (range) {
      res.setHeader('Content-Range', `bytes ${start}-${end}/${totalBytes}`);
    }
    res.end(result.buffer);
  },
};
