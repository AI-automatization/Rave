// WeWatch — Virtual Browser byte-level capture (categories B & C from the extraction flow)
//
// Categories A (extension/content-type/magic-bytes on a normal HTTP response) resolve to a real,
// independently-fetchable external URL — nothing to store, the CDN keeps serving it.
//
// Categories B (JS-obfuscated MSE segments, caught via a SourceBuffer.appendBuffer hook) and C
// (binary WebSocket transport instead of per-segment HTTP) are fundamentally different: what we
// intercept is raw, already-deobfuscated BYTES with no URL behind them at all — the only copy of
// this data that will ever exist is the one we hold here, in order, as the owner's browser plays
// through the source in real time. There is no way to fetch "the rest of the movie" later; the
// buffer only grows as fast as our own hidden Chromium session actually plays the content.
//
// MVP tradeoffs, spelled out on purpose:
//   - In-memory only (no disk) — simplest to reason about, capped by MAX_CAPTURE_BYTES per room.
//   - No real seek beyond what's been captured so far — same limitation any live-capture/DVR
//     tool has. Seeking backward within the captured range works fine (plain byte slicing).
//   - The underlying VB browser session must stay ALIVE and playing after the room switches to
//     the normal player — closing it would stop new bytes arriving entirely mid-movie. It only
//     actually closes when the owner stops VB / the room closes / the usual inactivity cleanup.

import { logger } from '@shared/utils/logger';
import { rebaseFmp4Chunk, resetFmp4RebaseState } from './fmp4Rebase.service';

const MAX_CAPTURE_BYTES = 1_500_000_000; // ~1.5GB per room — generous for one movie, bounds memory
export const MIN_SWITCH_BYTES = 512 * 1024; // wait for a small initial buffer before switching the room over — enough for the video element to have something to actually play immediately, not just an init segment

interface CaptureBuffer {
  chunks: Buffer[];
  // offsets[i] = byte offset of chunks[i]'s first byte in the logical stream (i.e. totalBytes as
  // it stood right before that chunk was appended). Parallel array to chunks, same length,
  // monotonically increasing — lets readCaptureRange binary-search straight to the handful of
  // chunks a request actually needs instead of reconstituting the whole buffer every time.
  offsets: number[];
  totalBytes: number;
  done: boolean;
}

const captures = new Map<string, CaptureBuffer>(); // roomId -> capture

export function startCapture(roomId: string): void {
  // A restarted VB session (new URL, same roomId) must not carry over the previous session's
  // per-track tfdt base — otherwise the first chunk of the new capture gets rebased against a
  // stale reference point instead of becoming its own zero.
  resetFmp4RebaseState(roomId);
  captures.set(roomId, { chunks: [], offsets: [], totalBytes: 0, done: false });
}

export function hasCapture(roomId: string): boolean {
  return captures.has(roomId);
}

export function getCaptureBytes(roomId: string): number {
  return captures.get(roomId)?.totalBytes ?? 0;
}

// Returns true once this chunk pushed the room over MIN_SWITCH_BYTES for the FIRST time — the
// caller uses this as the "ok, there's enough to start playback" signal.
export function appendCapture(roomId: string, chunk: Buffer): boolean {
  const c = captures.get(roomId);
  if (!c || c.done) return false;
  const wasBelowThreshold = c.totalBytes < MIN_SWITCH_BYTES;
  const rebased = rebaseFmp4Chunk(roomId, chunk);
  c.offsets.push(c.totalBytes); // this chunk starts where the buffer currently ends
  c.chunks.push(rebased);
  c.totalBytes += rebased.length;
  if (c.totalBytes >= MAX_CAPTURE_BYTES) {
    c.done = true;
    logger.warn('VB capture: hit size cap, stopping further capture', { roomId, totalBytes: c.totalBytes });
  }
  return wasBelowThreshold && c.totalBytes >= MIN_SWITCH_BYTES;
}

// Largest index i such that offsets[i] <= byteOffset — the chunk containing byteOffset, given
// offsets is sorted/monotonic by construction (appendCapture only ever appends).
function findChunkIndex(offsets: number[], byteOffset: number): number {
  let lo = 0;
  let hi = offsets.length - 1;
  let ans = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (offsets[mid] <= byteOffset) { ans = mid; lo = mid + 1; }
    else hi = mid - 1;
  }
  return ans;
}

// Real prod finding 2026-08-12 (multi-agent review, after the same-day fix that let this buffer
// legitimately grow to a full movie instead of freezing after a few seconds): this used to
// Buffer.concat() the ENTIRE accumulated buffer on every single HTTP range request — harmless
// when the buffer topped out at a few hundred KB (the old freeze bug), a genuine per-request
// full-buffer copy (up to MAX_CAPTURE_BYTES, 1.5GB) now that it doesn't. Binary-searching straight
// to the chunks a given [start,end] actually overlaps means a normal few-hundred-KB range request
// only ever copies those chunks, regardless of how large the buffer has grown around them.
export function readCaptureRange(roomId: string, start: number, end: number): { buffer: Buffer; totalBytes: number } | null {
  const c = captures.get(roomId);
  if (!c) return null;
  const totalBytes = c.totalBytes;
  if (c.chunks.length === 0) return { buffer: Buffer.alloc(0), totalBytes };

  const clampedEnd = Math.min(end, totalBytes - 1);
  if (start > clampedEnd) return { buffer: Buffer.alloc(0), totalBytes };

  const startIdx = findChunkIndex(c.offsets, start);
  const endIdx = findChunkIndex(c.offsets, clampedEnd);

  if (startIdx === endIdx) {
    const chunk = c.chunks[startIdx];
    const chunkStart = c.offsets[startIdx];
    return { buffer: chunk.subarray(start - chunkStart, clampedEnd - chunkStart + 1), totalBytes };
  }

  const parts: Buffer[] = [];
  for (let i = startIdx; i <= endIdx; i++) {
    const chunk = c.chunks[i];
    const chunkStart = c.offsets[i];
    const chunkEnd = chunkStart + chunk.length - 1;
    const from = Math.max(start, chunkStart) - chunkStart;
    const to = Math.min(clampedEnd, chunkEnd) - chunkStart;
    parts.push(chunk.subarray(from, to + 1));
  }
  return { buffer: Buffer.concat(parts), totalBytes };
}

export function stopCapture(roomId: string): void {
  const c = captures.get(roomId);
  if (c) c.done = true;
}

export function clearCapture(roomId: string): void {
  captures.delete(roomId);
  resetFmp4RebaseState(roomId);
}
