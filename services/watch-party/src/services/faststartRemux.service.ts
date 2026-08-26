// WeWatch — faststart remux + cache (2026-08-26, Saidazim: "делай ремукс")
//
// The actual fix for the non-faststart CDN sources faststartCheck.service.ts detects: downloads
// the whole source once, runs `ffmpeg -c copy -movflags +faststart` (a pure atom reorder — no
// re-encode, so it's cheap on CPU and lossless), caches the result on local disk, and reuses it
// for every future room that plays the exact same source URL.
//
// Safety, since this shares a container with the Chromium-based Virtual Browser feature:
//   - MAX_SOURCE_BYTES refuses anything bigger outright — better to fail a rare huge file than
//     risk filling the container's disk.
//   - MAX_CONCURRENT_REMUX (in-memory, per-instance — watch-party runs as a single Railway
//     replica, confirmed in railway.toml's numReplicas: 1) bounds how many downloads+ffmpeg runs
//     happen at once, so this can't starve VB sessions or the event loop.
//   - A Redis lock (SET NX) per source-URL hash means two rooms confirming the same movie at the
//     same moment share one remux instead of racing two full downloads.
//   - cleanupStaleCache() (called from server.ts on an interval) deletes cache entries past
//     STATUS_TTL_SEC so this never grows unbounded — Redis's own TTL on the status key expires
//     the metadata at the same time, but the file itself needs an explicit disk sweep.
import crypto from 'node:crypto';
import fs from 'node:fs';
import { Readable } from 'node:stream';
import path from 'node:path';
import { spawn } from 'node:child_process';
import Redis from 'ioredis';
import { logger } from '@shared/utils/logger';
import { REDIS_KEYS } from '@shared/constants';
import { extractUpstreamUrl } from './faststartCheck.service';

export const CACHE_DIR = '/tmp/faststart-cache';
const MAX_SOURCE_BYTES = 2 * 1024 * 1024 * 1024; // 2GB — comfortably covers a 480p/720p movie
// rip; a source bigger than this fails fast (falls back to the honest-error path) rather than
// risking the container's disk.
// Live-tested 2026-08-26 against the actual incident source (fayllar1.ru, 623MB file): a plain
// download alone took over 5 minutes from a home connection and didn't finish — this specific
// CDN is independently known to be degraded right now (same root cause as PR #191's proxy
// timeout). 8 minutes gives a real source with normal throughput room to finish; a source this
// slow will still time out and fall back to the honest-error path (same outcome as before this
// feature, just a longer wait first) — there's no way to make a slow upstream download faster
// from here.
const DOWNLOAD_TIMEOUT_MS = 8 * 60 * 1000; // whole download+remux ceiling
const LOCK_TTL_SEC = 9 * 60; // slightly longer than DOWNLOAD_TIMEOUT_MS so a crashed worker's
// lock still self-clears instead of wedging every future attempt at this source.
const LOCK_POLL_MS = 2_000;
const STATUS_TTL_SEC = 6 * 60 * 60; // 6h — see cleanupStaleCache()
const MAX_CONCURRENT_REMUX = 1;
const CHROME_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

let activeRemuxes = 0;

interface FaststartStatus {
  state: 'ready' | 'failed';
  fileName?: string; // relative to CACHE_DIR
  createdAt: number;
}

function urlHash(url: string): string {
  return crypto.createHash('sha256').update(url).digest('hex').slice(0, 32);
}

function cacheFile(hash: string, suffix: string): string {
  return path.join(CACHE_DIR, `${hash}${suffix}`);
}

async function readStatus(redis: Redis, hash: string): Promise<FaststartStatus | null> {
  const raw = await redis.get(REDIS_KEYS.faststartStatus(hash)).catch(() => null);
  if (!raw) return null;
  try { return JSON.parse(raw) as FaststartStatus; } catch { return null; }
}

async function writeStatus(redis: Redis, hash: string, status: FaststartStatus): Promise<void> {
  await redis.set(REDIS_KEYS.faststartStatus(hash), JSON.stringify(status), 'EX', STATUS_TTL_SEC);
}

async function downloadToFile(url: string, destPath: string): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': CHROME_UA }, signal: controller.signal });
    if (!res.ok || !res.body) throw new Error(`download failed: HTTP ${res.status}`);
    const declaredLength = Number(res.headers.get('content-length') ?? '0');
    if (declaredLength > MAX_SOURCE_BYTES) throw new Error(`source too large (${declaredLength} bytes)`);

    const nodeStream = Readable.fromWeb(res.body as Parameters<typeof Readable.fromWeb>[0]);
    const fileStream = fs.createWriteStream(destPath);
    let written = 0;
    await new Promise<void>((resolve, reject) => {
      nodeStream.on('data', (chunk: Buffer) => {
        written += chunk.length;
        // Some servers don't send Content-Length up front — enforce the cap on the actual bytes
        // received too, not just the declared header.
        if (written > MAX_SOURCE_BYTES) nodeStream.destroy(new Error('source exceeded size cap mid-download'));
      });
      nodeStream.pipe(fileStream);
      nodeStream.on('error', reject);
      fileStream.on('error', reject);
      fileStream.on('finish', resolve);
    });
  } finally {
    clearTimeout(timer);
  }
}

function runFfmpegFaststart(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', ['-y', '-i', inputPath, '-c', 'copy', '-movflags', '+faststart', outputPath]);
    let stderrTail = '';
    proc.stderr.on('data', (d: Buffer) => { stderrTail = (stderrTail + d.toString()).slice(-1000); });
    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited ${code}: ${stderrTail}`));
    });
  });
}

async function cleanup(paths: string[]): Promise<void> {
  await Promise.all(paths.map((p) => fs.promises.unlink(p).catch(() => {})));
}

/** Runs the actual download+remux, holding the caller-acquired lock the whole time. Always
 * writes a final status (ready or failed) so waiters and future callers get a definitive answer
 * instead of polling forever. */
async function doRemux(redis: Redis, hash: string, upstreamUrl: string): Promise<FaststartStatus> {
  const rawPath = cacheFile(hash, '.raw');
  const fixedFileName = `${hash}.mp4`;
  const fixedPath = cacheFile(hash, '.mp4');
  try {
    await fs.promises.mkdir(CACHE_DIR, { recursive: true });
    await downloadToFile(upstreamUrl, rawPath);
    await runFfmpegFaststart(rawPath, fixedPath);
    const status: FaststartStatus = { state: 'ready', fileName: fixedFileName, createdAt: Date.now() };
    await writeStatus(redis, hash, status);
    logger.info('Faststart remux completed', { url: upstreamUrl.slice(0, 120), fileName: fixedFileName });
    return status;
  } catch (e) {
    const status: FaststartStatus = { state: 'failed', createdAt: Date.now() };
    await writeStatus(redis, hash, status);
    await cleanup([fixedPath]);
    logger.warn('Faststart remux failed', { url: upstreamUrl.slice(0, 120), error: (e as Error).message });
    return status;
  } finally {
    await cleanup([rawPath]); // raw download is never needed again once ffmpeg has read it
  }
}

/**
 * Returns the cache-relative file name of a faststart-safe copy of `proxyUrl`'s underlying
 * source (already remuxed, or remuxed just now), or null if it can't be extracted, is too large,
 * or the remux failed. Deduplicates concurrent callers for the same source via a Redis lock —
 * only one of them actually downloads+remuxes, the rest poll the resulting status.
 *
 * Safe to await directly from a socket handler (CHANGE_MEDIA) — no HTTP-level timeout applies
 * there, unlike the player request this is meant to replace.
 */
export async function getFaststartFixedFileName(redis: Redis, proxyUrl: string): Promise<string | null> {
  const upstreamUrl = extractUpstreamUrl(proxyUrl);
  if (!upstreamUrl) return null;
  const hash = urlHash(upstreamUrl);

  const existing = await readStatus(redis, hash);
  if (existing?.state === 'ready' && existing.fileName && fs.existsSync(cacheFile(hash, '.mp4'))) {
    return existing.fileName;
  }
  if (existing?.state === 'failed') return null; // already known broken — don't retry every pick

  if (activeRemuxes >= MAX_CONCURRENT_REMUX) {
    logger.info('Faststart remux deferred — at concurrency cap', { url: upstreamUrl.slice(0, 120) });
    return null; // caller falls back to the honest-error path rather than queuing indefinitely
  }

  const lockKey = REDIS_KEYS.faststartLock(hash);
  const gotLock = await redis.set(lockKey, '1', 'EX', LOCK_TTL_SEC, 'NX');
  if (!gotLock) {
    // Another request is already remuxing this exact source — poll its status instead of
    // starting a second download.
    const deadline = Date.now() + DOWNLOAD_TIMEOUT_MS;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, LOCK_POLL_MS));
      const polled = await readStatus(redis, hash);
      if (polled?.state === 'ready' && polled.fileName && fs.existsSync(cacheFile(hash, '.mp4'))) return polled.fileName;
      if (polled?.state === 'failed') return null;
    }
    return null; // gave up waiting — the other worker is still going, but we can't block forever
  }

  activeRemuxes += 1;
  try {
    const status = await doRemux(redis, hash, upstreamUrl);
    return status.state === 'ready' ? status.fileName ?? null : null;
  } finally {
    activeRemuxes -= 1;
    await redis.del(lockKey).catch(() => {});
  }
}

export function getFaststartFilePath(fileName: string): string {
  return path.join(CACHE_DIR, fileName);
}

/** Deletes cached fixed files older than STATUS_TTL_SEC. Redis's own TTL already expires the
 * status *metadata* on the same schedule; this is the matching disk-side sweep so the actual
 * bytes don't outlive it. Call periodically (server.ts), never from a request path. */
export async function cleanupStaleCache(): Promise<void> {
  let entries: string[];
  try {
    entries = await fs.promises.readdir(CACHE_DIR);
  } catch {
    return; // directory doesn't exist yet — nothing to clean
  }
  const cutoff = Date.now() - STATUS_TTL_SEC * 1000;
  for (const entry of entries) {
    const full = path.join(CACHE_DIR, entry);
    try {
      const stat = await fs.promises.stat(full);
      if (stat.mtimeMs < cutoff) await fs.promises.unlink(full);
    } catch {
      // race with another cleanup pass or the file already being written — skip, not fatal
    }
  }
}
