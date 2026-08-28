// WeWatch — serves the live HLS stream of a Virtual Browser session (see vbStream.service.ts).
//
// Same shape and trust model as faststartProxy.controller.ts: every file served here was written
// by THIS server's own ffmpeg into its own local directory, so there's no SSRF/signature machinery
// to do — only path validation, since the roomId and file name both arrive from the URL.
//
// Public/no-auth on purpose, matching vb-capture and vb-media-proxy: a roomId is an unguessable
// Mongo ObjectId, and the whole point of an HLS stream is that a CDN (Bunny) can fetch and fan it
// out server-to-server without carrying user credentials.
import path from 'node:path';
import fs from 'node:fs';
import { Request, Response } from 'express';
import { getStreamDir } from '../services/vbStream.service';

const ROOM_ID_PATTERN = /^[0-9a-f]{24}$/i;
// index.m3u8 or segN.ts — exactly what ffmpeg's hls muxer is configured to emit, nothing else.
const FILE_PATTERN = /^(index\.m3u8|seg\d+\.ts)$/;

export const createVbStreamController = () => ({
  async serve(req: Request, res: Response): Promise<void> {
    const { roomId, file } = req.params;
    if (!ROOM_ID_PATTERN.test(roomId) || !FILE_PATTERN.test(file)) {
      res.status(400).json({ success: false, message: 'Invalid stream path' });
      return;
    }

    const dir = getStreamDir(roomId);
    if (!dir) {
      res.status(404).json({ success: false, message: 'No live stream for this room' });
      return;
    }

    const filePath = path.join(dir, file);
    // Belt-and-suspenders against traversal even though FILE_PATTERN already rules it out.
    if (!path.resolve(filePath).startsWith(path.resolve(dir) + path.sep)) {
      res.status(400).json({ success: false, message: 'Invalid stream path' });
      return;
    }
    if (!fs.existsSync(filePath)) {
      // Normal during the first ~2s of a session (ffmpeg hasn't flushed a segment yet) and for a
      // segment that has already rolled out of the sliding window — players retry on 404.
      res.status(404).json({ success: false, message: 'Segment not available' });
      return;
    }

    if (file.endsWith('.m3u8')) {
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      // The playlist is rewritten every segment — caching it is what makes a live stream freeze.
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    } else {
      res.setHeader('Content-Type', 'video/mp2t');
      // Segments are immutable once written; a short cache is what lets a CDN absorb the fan-out.
      res.setHeader('Cache-Control', 'public, max-age=60');
    }

    res.sendFile(filePath, (err) => {
      if (err && !res.headersSent) res.status(404).end();
    });
  },
});
