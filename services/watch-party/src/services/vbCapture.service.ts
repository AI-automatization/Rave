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
//
// Dual-track capture (2026-08-14): the ORIGINAL mechanism above (still fully intact below,
// `captures` map) writes EVERY intercepted chunk — video AND audio, from however many
// SourceBuffers/WebSockets the source page uses — into ONE combined, interleaved buffer. That's
// fine for a source using a single muxed video+audio stream, but garbage (two independent MP4
// byte streams shuffled together) for a source using SEPARATE video/audio SourceBuffers, which is
// common for real fMP4 players (dash.js/shaka/hls.js-style). Safari's demuxer is lenient enough to
// salvage playable output from that mess anyway; Chrome's isn't (confirmed live 2026-08-14 —
// codec-sniffing the combined buffer found only an isolated audio init segment, no video track).
//
// `trackCaptures` below is a SEPARATE, PARALLEL structure: virtualBrowser.service.ts's injected
// script now ALSO tags each chunk with which SourceBuffer (by mime type: 'video' or 'audio') it
// came from, in addition to feeding the untouched combined buffer above. Two independent,
// correctly-separated per-track buffers give the client real per-track codec strings and two
// clean byte streams it can feed into two real MediaSource SourceBuffers — the only way MSE
// actually supports multi-track playback. Category C (raw WebSocket transport) has no per-track
// signal available (no SourceBuffer/addSourceBuffer call to observe) and is NOT tagged — those
// captures only ever populate the combined buffer, exactly as before this existed.
//
// Deliberately additive, not a replacement: the combined buffer keeps receiving 100% of what it
// always did, so every existing consumer (Safari, mobile, the plain /vb-capture/:roomId endpoint)
// is completely unaffected. Trade-off: chunks that ARE track-tagged get stored twice (once in the
// combined buffer, once in their track buffer) — roughly doubles memory for a tagged capture.
// Acceptable for now; not worth the risk of touching the already-working combined path to save it.

import { logger } from '@shared/utils/logger';
import { rebaseFmp4Chunk, resetFmp4RebaseState } from './fmp4Rebase.service';
import { sniffMp4Codecs, hasMoofBox } from './mp4CodecSniff.service';

const MAX_CAPTURE_BYTES = 1_500_000_000; // ~1.5GB per room — generous for one movie, bounds memory
export const MIN_SWITCH_BYTES = 512 * 1024; // wait for a small initial buffer before switching the room over — enough for the video element to have something to actually play immediately, not just an init segment

export type CaptureTrack = 'video' | 'audio';
const CAPTURE_TRACKS: readonly CaptureTrack[] = ['video', 'audio'];

interface CaptureBuffer {
  chunks: Buffer[];
  // offsets[i] = byte offset of chunks[i]'s first byte in the logical stream (i.e. totalBytes as
  // it stood right before that chunk was appended). Parallel array to chunks, same length,
  // monotonically increasing — lets readCaptureRange binary-search straight to the handful of
  // chunks a request actually needs instead of reconstituting the whole buffer every time.
  offsets: number[];
  totalBytes: number;
  done: boolean;
  // Exact MSE codec string (e.g. "avc1.640028,mp4a.40.2") once confidently sniffed from the init
  // segment, null if not yet known OR this source's codec isn't one mp4CodecSniff.service.ts
  // recognizes — the client falls back to plain <video src> in that case, same as before this
  // existed.
  codecs: string | null;
  codecsSniffed: boolean;
  // Chunks (WebSocket frames, arbitrary byte boundaries — NOT aligned to MP4 box boundaries)
  // accumulate here until a moof-bearing chunk arrives, matching fmp4Rebase.service.ts's own
  // "hasMoof means no longer the init segment" check. A single frame is not guaranteed to contain
  // the complete ftyp+moov — sniffing off just the first chunk would truncate mid-box on any site
  // whose player splits the init segment across multiple frames, permanently (and wrongly) giving
  // up on MSE for that room. Concatenated and re-sniffed on every pre-moof chunk instead; cleared
  // the moment sniffing succeeds or a moof arrives, so this never grows past one init segment's
  // worth of bytes (tens of KB, not a real memory concern next to MAX_CAPTURE_BYTES).
  pendingInitChunks: Buffer[];
}

function freshCaptureBuffer(): CaptureBuffer {
  return { chunks: [], offsets: [], totalBytes: 0, done: false, codecs: null, codecsSniffed: false, pendingInitChunks: [] };
}

// Shared by the combined buffer and each per-track buffer — same rebase/sniff/store logic either
// way, the only difference is WHICH CaptureBuffer instance and WHICH fmp4Rebase state key (so
// tfdt-rebasing for the isolated video-only buffer never shares state with the combined buffer's
// own rebasing of the same underlying bytes) get used.
function appendToBuffer(c: CaptureBuffer, rebaseKey: string, chunk: Buffer, roomId: string, logLabel: string): boolean {
  if (c.done) return false;
  const wasBelowThreshold = c.totalBytes < MIN_SWITCH_BYTES;
  const rebased = rebaseFmp4Chunk(rebaseKey, chunk);
  if (!c.codecsSniffed) {
    c.pendingInitChunks.push(rebased);
    const candidate = Buffer.concat(c.pendingInitChunks);
    c.codecs = sniffMp4Codecs(candidate);
    if (c.codecs || hasMoofBox(rebased)) {
      c.codecsSniffed = true;
      c.pendingInitChunks = [];
      logger.info(`VB capture: codec sniff result (${logLabel})`, { roomId, codecs: c.codecs });
    }
  }
  c.offsets.push(c.totalBytes);
  c.chunks.push(rebased);
  c.totalBytes += rebased.length;
  if (c.totalBytes >= MAX_CAPTURE_BYTES) {
    c.done = true;
    logger.warn(`VB capture: hit size cap, stopping further capture (${logLabel})`, { roomId, totalBytes: c.totalBytes });
  }
  return wasBelowThreshold && c.totalBytes >= MIN_SWITCH_BYTES;
}

// Largest index i such that offsets[i] <= byteOffset — the chunk containing byteOffset, given
// offsets is sorted/monotonic by construction (appendToBuffer only ever appends).
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
function readRange(c: CaptureBuffer, start: number, end: number): { buffer: Buffer; totalBytes: number } {
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

// ── Combined buffer (original mechanism, unchanged behavior) ────────────────────────────────

const captures = new Map<string, CaptureBuffer>(); // roomId -> capture

export function startCapture(roomId: string): void {
  // A restarted VB session (new URL, same roomId) must not carry over the previous session's
  // per-track tfdt base — otherwise the first chunk of the new capture gets rebased against a
  // stale reference point instead of becoming its own zero.
  resetFmp4RebaseState(roomId);
  captures.set(roomId, freshCaptureBuffer());
  trackCaptures.delete(roomId);
  for (const track of CAPTURE_TRACKS) resetFmp4RebaseState(trackRebaseKey(roomId, track));
}

export function hasCapture(roomId: string): boolean {
  return captures.has(roomId);
}

export function getCaptureBytes(roomId: string): number {
  return captures.get(roomId)?.totalBytes ?? 0;
}

// null while not yet known (no chunk received) OR the codec genuinely isn't recognized — callers
// can't tell those two apart from this alone, but both mean the same thing to them: "don't offer
// MSE playback yet/at all", so the distinction doesn't matter at this API boundary.
export function getCaptureCodecs(roomId: string): string | null {
  return captures.get(roomId)?.codecs ?? null;
}

// Returns true once this chunk pushed the room over MIN_SWITCH_BYTES for the FIRST time — the
// caller uses this as the "ok, there's enough to start playback" signal.
export function appendCapture(roomId: string, chunk: Buffer): boolean {
  const c = captures.get(roomId);
  if (!c) return false;
  return appendToBuffer(c, roomId, chunk, roomId, 'combined');
}

export function readCaptureRange(roomId: string, start: number, end: number): { buffer: Buffer; totalBytes: number } | null {
  const c = captures.get(roomId);
  if (!c) return null;
  return readRange(c, start, end);
}

export function stopCapture(roomId: string): void {
  const c = captures.get(roomId);
  if (c) c.done = true;
  const tracks = trackCaptures.get(roomId);
  if (tracks) for (const track of CAPTURE_TRACKS) { const tc = tracks[track]; if (tc) tc.done = true; }
}

export function clearCapture(roomId: string): void {
  captures.delete(roomId);
  resetFmp4RebaseState(roomId);
  trackCaptures.delete(roomId);
  for (const track of CAPTURE_TRACKS) resetFmp4RebaseState(trackRebaseKey(roomId, track));
}

// ── Per-track buffers (dual-track capture, additive) ─────────────────────────────────────────

function trackRebaseKey(roomId: string, track: CaptureTrack): string {
  return `${roomId}:track:${track}`;
}

const trackCaptures = new Map<string, Partial<Record<CaptureTrack, CaptureBuffer>>>();

// Returns true the first time the VIDEO track specifically crosses MIN_SWITCH_BYTES — audio tracks
// are typically tiny/fast relative to video for the same wall-clock window, so gating readiness on
// video alone (rather than requiring both) matches how the combined buffer already signals
// readiness off raw byte count, without needing to reason about audio/video byte-rate ratios.
export function appendCaptureTrack(roomId: string, track: CaptureTrack, chunk: Buffer): boolean {
  let tracks = trackCaptures.get(roomId);
  if (!tracks) { tracks = {}; trackCaptures.set(roomId, tracks); }
  let c = tracks[track];
  if (!c) { c = freshCaptureBuffer(); tracks[track] = c; }
  const crossed = appendToBuffer(c, trackRebaseKey(roomId, track), chunk, roomId, `track:${track}`);
  return track === 'video' && crossed;
}

export function hasCaptureTrack(roomId: string, track: CaptureTrack): boolean {
  return !!trackCaptures.get(roomId)?.[track];
}

// Tracks that have received at least one chunk so far — the client uses this (via the
// X-Vb-Tracks response header) to decide whether per-track dual-SourceBuffer MSE is even worth
// attempting, vs. an audio-only or not-yet-populated capture where it isn't.
export function getAvailableCaptureTracks(roomId: string): CaptureTrack[] {
  const tracks = trackCaptures.get(roomId);
  if (!tracks) return [];
  return CAPTURE_TRACKS.filter((t) => !!tracks[t]);
}

export function getTrackCaptureBytes(roomId: string, track: CaptureTrack): number {
  return trackCaptures.get(roomId)?.[track]?.totalBytes ?? 0;
}

export function getTrackCaptureCodecs(roomId: string, track: CaptureTrack): string | null {
  return trackCaptures.get(roomId)?.[track]?.codecs ?? null;
}

export function readTrackCaptureRange(roomId: string, track: CaptureTrack, start: number, end: number): { buffer: Buffer; totalBytes: number } | null {
  const c = trackCaptures.get(roomId)?.[track];
  if (!c) return null;
  return readRange(c, start, end);
}
