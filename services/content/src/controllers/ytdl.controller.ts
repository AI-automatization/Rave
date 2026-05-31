import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import ytdl from '@distube/ytdl-core';
import { ytdlService } from '../services/ytdl.service';
import { getYtDlpStreamInfo } from '../services/ytdlpStream.service';
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

/** Pipe a remote URL (googlevideo.com) to the response, forwarding Range header */
async function pipeRemoteStream(
  remoteUrl: string,
  mimeType: string,
  contentLength: number,
  req: Request,
  res: Response,
): Promise<void> {
  const rangeHeader = req.headers.range;
  const headers: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (compatible; CineSync/1.0)',
  };
  if (rangeHeader) headers['Range'] = rangeHeader;

  const upstream = await fetch(remoteUrl, { headers });

  // Strip codec params for ExoPlayer compatibility (same as primary path above).
  const safeMime = mimeType.split(';')[0].trim() || 'video/mp4';
  const responseHeaders: Record<string, string | number> = {
    'Content-Type': safeMime,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'no-cache',
  };

  const upstreamRange = upstream.headers.get('Content-Range');
  const upstreamLen = upstream.headers.get('Content-Length');

  if (upstreamRange) responseHeaders['Content-Range'] = upstreamRange;
  if (upstreamLen) responseHeaders['Content-Length'] = parseInt(upstreamLen, 10);
  else if (contentLength > 0) responseHeaders['Content-Length'] = contentLength;

  res.writeHead(upstream.status === 206 ? 206 : 200, responseHeaders);

  if (!upstream.body) { res.end(); return; }

  const reader = upstream.body.getReader();
  req.on('close', () => { reader.cancel().catch(() => {}); });

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const canContinue = res.write(value);
    if (!canContinue) await new Promise<void>(r => res.once('drain', r));
  }
  res.end();
}

export const ytdlController = {
  /** GET /youtube/stream?url=<yt-url>&token=<jwt>
   *  T-S074: ytdl-core primary → yt-dlp fallback (server-side pipe, range support)
   */
  async stream(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { url, token } = req.query as { url?: string; token?: string };

    if (!url) { res.status(400).json({ success: false, message: 'url required' }); return; }
    if (!verifyQueryToken(token)) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    // ── Primary: ytdl-core ────────────────────────────────────────────────────
    try {
      const { info, format, isLive } = await ytdlService.getCachedInfo(url);

      if (isLive) { res.redirect(302, format.url); return; }

      const contentLength = parseInt(format.contentLength ?? '0', 10);
      // Strip codec params — ExoPlayer on Android 14+ rejects Content-Type values
      // like 'video/mp4; codecs="avc1.640028, mp4a.40.2"' for progressive streams.
      // Plain 'video/mp4' or 'video/webm' is universally accepted by all clients.
      const rawMime = format.mimeType ?? 'video/mp4';
      const mimeType = rawMime.split(';')[0].trim() || 'video/mp4';
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
      } else if (rangeHeader && !contentLength) {
        // ExoPlayer sends Range even when Content-Length is unknown — respond 206
        // with Transfer-Encoding: chunked so ExoPlayer treats it as seekable.
        responseHeaders['Content-Range'] = `bytes ${startByte}-*/*`;
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
      req.on('close', () => { ytStream.destroy(); });
      ytStream.on('error', (err) => {
        logger.error('ytdl stream error', { error: (err as Error).message, url });
        if (!res.writableEnded) res.destroy();
      });
      return;
    } catch (ytdlErr) {
      logger.warn('ytdl-core stream failed, trying yt-dlp fallback', {
        error: (ytdlErr as Error).message, url,
      });
    }

    // ── Fallback: yt-dlp pipe ─────────────────────────────────────────────────
    try {
      const info = await getYtDlpStreamInfo(url);

      if (info.isLive) { res.redirect(302, info.url); return; }

      await pipeRemoteStream(info.url, info.mimeType, info.contentLength, req, res);
    } catch (ytdlpErr) {
      logger.error('yt-dlp stream fallback also failed', {
        error: (ytdlpErr as Error).message, url,
      });
      if (!res.headersSent) next(ytdlpErr);
    }
  },

  /** GET /youtube/stream-url?url=<yt-url> — returns metadata only */
  async getStreamUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { url } = req.query as { url?: string };
      if (!url) { res.status(400).json({ success: false, message: 'url query param is required' }); return; }
      const info = await ytdlService.getStreamInfo(url);
      res.json({ success: true, data: info });
    } catch (err) {
      logger.error('Failed to resolve YouTube stream URL', { error: (err as Error).message });
      next(err);
    }
  },
};
