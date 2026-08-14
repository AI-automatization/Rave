// WeWatch — derives an exact MSE codec string (e.g. "avc1.640028,mp4a.40.2") from a raw fMP4 init
// segment (ftyp+moov, no moof — see fmp4Rebase.service.ts for the same box-parsing pattern this
// mirrors). MediaSource.addSourceBuffer() requires an EXACT codec string, not just "video/mp4" —
// get it wrong and the browser throws NotSupportedError, so this has to read it off the real
// bytes rather than guess. Client-side MSE playback for VB capture (categories B/C) needs this;
// plain <video src="..."> playback (the path used until now) never did, since the browser's own
// native demuxer works out the codec itself from a normal progressive/range-based fetch — MSE is
// the one mode that requires the caller to already know the answer up front.
//
// Only H.264 (avc1/avc3) video + AAC (mp4a) audio are confidently decoded — by far the most common
// combination for the source sites VB captures from. Anything else (HEVC, VP9, AV1, or a track this
// parser can't make sense of) returns null for that track; the caller's contract is: a null overall
// result means "don't attempt MSE, fall back to plain <video src>" — never worse than today's
// behavior, just not improved for that rarer case.

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
      if (pos + 16 > end) break;
      size = Number(buf.readBigUInt64BE(pos + 8));
      headerSize = 16;
    } else if (size === 0) {
      size = end - pos;
    }
    if (size < headerSize || pos + size > end) break;
    boxes.push({ type, contentStart: pos + headerSize, contentEnd: pos + size });
    pos += size;
  }
  return boxes;
}

function findBox(boxes: BoxRange[], type: string): BoxRange | undefined {
  return boxes.find((b) => b.type === type);
}

// avc1/avc3 sample entry: VisualSampleEntry fixed fields (78 bytes), then child boxes (avcC etc).
// avcC (AVCConfigurationBox) content: configurationVersion(1) + AVCProfileIndication(1) +
// profile_compatibility(1) + AVCLevelIndication(1) + ... — exactly the PP/CC/LL the "avc1.PPCCLL"
// codec string needs, per ISO/IEC 14496-15.
function sniffAvc(buf: Buffer, sampleEntry: BoxRange): string | null {
  const VISUAL_SAMPLE_ENTRY_FIXED_BYTES = 78;
  const childStart = sampleEntry.contentStart + VISUAL_SAMPLE_ENTRY_FIXED_BYTES;
  if (childStart >= sampleEntry.contentEnd) return null;
  const children = readBoxes(buf, childStart, sampleEntry.contentEnd);
  const avcC = findBox(children, 'avcC');
  if (!avcC || avcC.contentEnd - avcC.contentStart < 4) return null;
  const profile = buf.readUInt8(avcC.contentStart + 1);
  const compat = buf.readUInt8(avcC.contentStart + 2);
  const level = buf.readUInt8(avcC.contentStart + 3);
  const hex = (n: number) => n.toString(16).padStart(2, '0');
  return `avc1.${hex(profile)}${hex(compat)}${hex(level)}`;
}

// mp4a sample entry: AudioSampleEntry fixed fields (28 bytes) then child boxes (esds etc). Full
// ESDS DecoderSpecificInfo parsing (to read the real MPEG-4 Audio Object Type) needs to walk a
// chain of variable-length-encoded descriptor tags — real, but not worth it here: AAC-LC (object
// type 2) is the overwhelming majority of what these source sites actually serve, and getting the
// object type wrong just means MediaSource.isTypeSupported() correctly rejects it (caller falls
// back to plain <video src>, no worse than not attempting MSE at all) rather than silently
// mis-decoding anything.
function sniffMp4a(buf: Buffer, sampleEntry: BoxRange): string | null {
  const AUDIO_SAMPLE_ENTRY_FIXED_BYTES = 28;
  const childStart = sampleEntry.contentStart + AUDIO_SAMPLE_ENTRY_FIXED_BYTES;
  if (childStart >= sampleEntry.contentEnd) return null;
  const children = readBoxes(buf, childStart, sampleEntry.contentEnd);
  if (!findBox(children, 'esds')) return null;
  return 'mp4a.40.2';
}

function sniffTrackCodec(buf: Buffer, trak: BoxRange): string | null {
  const trakChildren = readBoxes(buf, trak.contentStart, trak.contentEnd);
  const mdia = findBox(trakChildren, 'mdia');
  if (!mdia) return null;
  const mdiaChildren = readBoxes(buf, mdia.contentStart, mdia.contentEnd);
  const minf = findBox(mdiaChildren, 'minf');
  if (!minf) return null;
  const minfChildren = readBoxes(buf, minf.contentStart, minf.contentEnd);
  const stbl = findBox(minfChildren, 'stbl');
  if (!stbl) return null;
  const stblChildren = readBoxes(buf, stbl.contentStart, stbl.contentEnd);
  const stsd = findBox(stblChildren, 'stsd');
  if (!stsd || stsd.contentEnd - stsd.contentStart < 8) return null;
  // stsd content: version+flags(4) + entry_count(4), then the sample entries themselves.
  const entriesStart = stsd.contentStart + 8;
  const entries = readBoxes(buf, entriesStart, stsd.contentEnd);
  for (const entry of entries) {
    if (entry.type === 'avc1' || entry.type === 'avc3') return sniffAvc(buf, entry);
    if (entry.type === 'mp4a') return sniffMp4a(buf, entry);
  }
  return null;
}

/** True if this chunk contains a top-level moof box — i.e. it's a media fragment, not (or not
 * only) part of the init segment. Mirrors fmp4Rebase.service.ts's own identical check. */
export function hasMoofBox(chunk: Buffer): boolean {
  try {
    return readBoxes(chunk, 0, chunk.length).some((b) => b.type === 'moof');
  } catch {
    return false;
  }
}

/**
 * Returns a full MSE codecs string (e.g. `avc1.640028,mp4a.40.2`) if every track in the init
 * segment could be confidently identified, or null if any track uses a codec this doesn't
 * recognize (HEVC/VP9/AV1/etc.) or the box structure doesn't parse as expected. Never throws —
 * a malformed/unexpected init segment just means "don't attempt MSE", same as an unrecognized
 * codec.
 */
export function sniffMp4Codecs(initSegment: Buffer): string | null {
  try {
    const topBoxes = readBoxes(initSegment, 0, initSegment.length);
    const moov = findBox(topBoxes, 'moov');
    if (!moov) return null;
    const moovChildren = readBoxes(initSegment, moov.contentStart, moov.contentEnd);
    const traks = moovChildren.filter((b) => b.type === 'trak');
    if (traks.length === 0) return null;

    const codecs: string[] = [];
    for (const trak of traks) {
      const codec = sniffTrackCodec(initSegment, trak);
      if (!codec) return null; // one unrecognized track means the whole init segment isn't usable
      codecs.push(codec);
    }
    return codecs.join(',');
  } catch {
    return null;
  }
}
