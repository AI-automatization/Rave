// VB capture (categories B/C) hands us raw fMP4 fragments straight from the source site's own
// player — its moof/traf/tfdt boxes carry that player's own baseMediaDecodeTime, which is an
// ABSOLUTE value (often wall-clock-derived) rather than starting from zero. Feeding that straight
// to our own <video>/hls.js client makes it infer a multi-hour duration from the raw numbers
// (real prod case 2026-08-06, uzmovi.net: 795-minute duration reported on a ~2hr movie). Fix:
// rewrite each track's tfdt baseMediaDecodeTime in place, per room+trackId, relative to the FIRST
// value seen for that track — same box size throughout, no reflow needed, just an integer
// overwrite.

import { logger } from '@shared/utils/logger';

// roomId -> trackId -> the first-seen baseMediaDecodeTime for that track, used as the zero point
// for every subsequent chunk. bigint because tfdt v1 is a 64-bit field.
const baseByRoomTrack = new Map<string, Map<number, bigint>>();

export function resetFmp4RebaseState(roomId: string): void {
  baseByRoomTrack.delete(roomId);
}

interface BoxRange {
  type: string;
  contentStart: number;
  contentEnd: number;
}

function readBoxes(buf: Buffer, start: number, end: number): BoxRange[] {
  const boxes: BoxRange[] = [];
  let pos = start;
  while (pos + 8 <= end) {
    let size = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    let headerSize = 8;
    if (size === 1) {
      if (pos + 16 > end) break; // truncated extended-size header
      // 64-bit size field — real fMP4 fragments are always far smaller than 2^53, Number() is safe.
      size = Number(buf.readBigUInt64BE(pos + 8));
      headerSize = 16;
    } else if (size === 0) {
      size = end - pos; // box extends to the end of this chunk
    }
    if (size < headerSize || pos + size > end) break; // malformed/truncated — stop, don't throw
    boxes.push({ type, contentStart: pos + headerSize, contentEnd: pos + size });
    pos += size;
  }
  return boxes;
}

function rebaseTraf(buf: Buffer, contentStart: number, contentEnd: number, trackBase: Map<number, bigint>): void {
  const children = readBoxes(buf, contentStart, contentEnd);
  let trackId: number | null = null;
  for (const c of children) {
    if (c.type === 'tfhd' && c.contentEnd - c.contentStart >= 8) {
      // tfhd content: version+flags (4 bytes), then track_ID (uint32) — the only field we need.
      trackId = buf.readUInt32BE(c.contentStart + 4);
    }
  }
  if (trackId === null) return; // can't key a base without a track id — leave tfdt untouched

  for (const c of children) {
    if (c.type !== 'tfdt') continue;
    const version = buf.readUInt8(c.contentStart);
    const valueOffset = c.contentStart + 4;
    if (version === 1) {
      if (c.contentEnd - valueOffset < 8) continue;
      const raw = buf.readBigUInt64BE(valueOffset);
      let base = trackBase.get(trackId);
      if (base === undefined) {
        base = raw;
        trackBase.set(trackId, base);
      }
      buf.writeBigUInt64BE(raw >= base ? raw - base : 0n, valueOffset);
    } else {
      if (c.contentEnd - valueOffset < 4) continue;
      const raw = BigInt(buf.readUInt32BE(valueOffset));
      let base = trackBase.get(trackId);
      if (base === undefined) {
        base = raw;
        trackBase.set(trackId, base);
      }
      buf.writeUInt32BE(Number(raw >= base ? raw - base : 0n), valueOffset);
    }
  }
}

// Mutates `chunk` in place (same box sizes throughout — a pure integer overwrite, no reflow) and
// returns it for convenience. Safe to call on non-fMP4 or malformed chunks: readBoxes stops at
// the first inconsistency instead of throwing, so worst case this is a no-op and capture behaves
// exactly as it did before this fix (wrong duration, but playback itself unaffected).
export function rebaseFmp4Chunk(roomId: string, chunk: Buffer): Buffer {
  try {
    const topBoxes = readBoxes(chunk, 0, chunk.length);
    const hasMoof = topBoxes.some((b) => b.type === 'moof');
    if (!hasMoof) return chunk; // init segment (ftyp/moov) or non-fMP4 bytes — nothing to rebase

    let trackBase = baseByRoomTrack.get(roomId);
    if (!trackBase) {
      trackBase = new Map();
      baseByRoomTrack.set(roomId, trackBase);
    }

    for (const box of topBoxes) {
      if (box.type !== 'moof') continue;
      const children = readBoxes(chunk, box.contentStart, box.contentEnd);
      for (const c of children) {
        if (c.type === 'traf') rebaseTraf(chunk, c.contentStart, c.contentEnd, trackBase);
      }
    }
  } catch (err) {
    // Never let a parsing edge case break capture — worst case duration is wrong again, not that
    // playback stops entirely.
    logger.warn('VB capture: fMP4 rebase failed, passing chunk through unmodified', {
      roomId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
  return chunk;
}
