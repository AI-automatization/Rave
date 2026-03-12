import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import ytdl from '@distube/ytdl-core';
import { ytdlService } from '../services/ytdl.service';
import { logger } from '@shared/utils/logger';

const getPublicKey = () => (process.env.JWT_PUBLIC_KEY ?? '').replace(/\\n/g, '\n');

function verifyQueryToken(token?: string): boolean {
  if (!token) return false;
  try {
    jwt.verify(token, getPublicKey(), { algorithms: ['RS256'] });
    return true;
  } catch {
    return false;
  }
}

export const ytdlController = {
  /** GET /youtube/stream?url=<yt-url>&token=<jwt>
   *  Streams the YouTube video through a proxy — handles range requests (seeking).
   *  Token is in query param because <video> elements can't set headers.
   */
  async stream(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { url, token } = req.query as { url?: string; token?: string };

    if (!url) {
      res.status(400).json({ success: false, message: 'url required' });
      return;
    }

    if (!verifyQueryToken(token)) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    try {
      const { info, format, isLive } = await ytdlService.getCachedInfo(url);

      // Live stream: HLS m3u8 ni to'g'ridan redirect qilish
      // (infinite stream ni proxy qilish mumkin emas — range/contentLength yo'q)
      if (isLive) {
        res.redirect(302, format.url);
        return;
      }

      const contentLength = parseInt(format.contentLength ?? '0', 10);
      const mimeType = format.mimeType ?? 'video/mp4';

      const rangeHeader = req.headers.range;

      let startByte = 0;
      let endByte = contentLength > 0 ? contentLength - 1 : 0;

      if (rangeHeader && contentLength) {
        const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
        if (match) {
          startByte = parseInt(match[1], 10);
          endByte = match[2] ? parseInt(match[2], 10) : contentLength - 1;
        }
      }

      const chunkSize = contentLength > 0 ? endByte - startByte + 1 : 0;

      const responseHeaders: Record<string, string | number> = {
        'Content-Type': mimeType,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-cache',
      };

      if (contentLength > 0 && rangeHeader) {
        responseHeaders['Content-Range'] = `bytes ${startByte}-${endByte}/${contentLength}`;
        responseHeaders['Content-Length'] = chunkSize;
        res.writeHead(206, responseHeaders);
      } else {
        if (contentLength > 0) responseHeaders['Content-Length'] = contentLength;
        res.writeHead(200, responseHeaders);
      }

      const ytStream = ytdl.downloadFromInfo(info, {
        format,
        range: contentLength > 0 ? { start: startByte, end: endByte } : undefined,
      });

      ytStream.pipe(res);

      req.on('close', () => {
        ytStream.destroy();
      });

      ytStream.on('error', (err) => {
        logger.error('ytdl stream error', { error: (err as Error).message, url });
        if (!res.writableEnded) res.destroy();
      });
    } catch (err) {
      logger.error('YouTube stream proxy failed', { error: (err as Error).message, url });
      if (!res.headersSent) next(err);
    }
  },

  /** GET /youtube/stream-url?url=<yt-url> — returns metadata only (not the stream) */
  async getStreamUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { url } = req.query as { url?: string };
      if (!url) {
        res.status(400).json({ success: false, message: 'url query param is required' });
        return;
      }
      const info = await ytdlService.getStreamInfo(url);
      res.json({ success: true, data: info });
    } catch (err) {
      logger.error('Failed to resolve YouTube stream URL', { error: (err as Error).message });
      next(err);
    }
  },
};
