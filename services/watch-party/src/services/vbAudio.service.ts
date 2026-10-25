// WeWatch — Virtual Browser audio (2026-10-25).
//
// The VB picture is a CDP JPEG screencast, which has no audio path at all — owners heard nothing
// from YouTube/any site opened in VB (real report 2026-10-25). The Xvfb+PulseAudio live stream
// (vbStream.service.ts) only exists on Linux and no client ever plays it.
//
// This taps the sound inside the page instead: an init script routes every <video>/<audio> the
// page plays through WebAudio into a MediaRecorder (webm/opus, 250ms slices) and hands the bytes
// to Node via a page binding (VB_AUDIO_TAP_SCRIPT + virtualBrowser.service.ts). Here one ffmpeg
// per room re-encodes that to a plain MP3 byte stream, fanned out to every HTTP listener of
// GET /vb-audio/:roomId. MP3 on purpose: frames self-sync, so a listener joining mid-stream needs
// no header, and every client plays it natively (<audio> on web, AVPlayer/ExoPlayer on mobile).
// Works headless and on macOS (local dev) — verified with a sine tone and a real YouTube page.
//
// Known limit: a cross-origin media file served without CORS headers is "tainted" for WebAudio and
// records as silence. Those are exactly the plain-file sources the VB sniffer already hands to the
// room as a direct video (which plays with sound), so the gap is small.
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { Response } from 'express';
import { logger } from '@shared/utils/logger';

interface AudioRoom {
  ffmpeg: ChildProcessWithoutNullStreams;
  listeners: Set<Response>;
  /** Frame whose recorder feeds ffmpeg — a second frame starting its own recorder takes over. */
  frameKey: string;
}

const rooms = new Map<string, AudioRoom>();
const MP3_BITRATE = '128k';
// Each listener gets its own copy of the stream — a stalled one (slow phone) must not grow memory
// without bound; drop it and let the client reconnect.
const MAX_LISTENER_BACKLOG_BYTES = 512 * 1024;

function startEncoder(roomId: string): ChildProcessWithoutNullStreams {
  const ffmpeg = spawn('ffmpeg', [
    '-hide_banner', '-loglevel', 'error',
    '-fflags', 'nobuffer', '-probesize', '32', '-analyzeduration', '0',
    '-f', 'webm', '-i', 'pipe:0',
    '-vn', '-ac', '2', '-ar', '44100', '-c:a', 'libmp3lame', '-b:a', MP3_BITRATE,
    '-flush_packets', '1', '-f', 'mp3', 'pipe:1',
  ]);
  ffmpeg.stdout.on('data', (data: Buffer) => {
    const room = rooms.get(roomId);
    if (!room || room.ffmpeg !== ffmpeg) return;
    for (const res of room.listeners) {
      if (res.writableLength > MAX_LISTENER_BACKLOG_BYTES) {
        room.listeners.delete(res);
        res.end();
        continue;
      }
      res.write(data);
    }
  });
  ffmpeg.stderr.on('data', (d: Buffer) => logger.warn('VB audio: ffmpeg', { roomId, msg: d.toString().slice(0, 200) }));
  ffmpeg.stdin.on('error', () => { /* encoder gone — next chunk restarts it */ });
  ffmpeg.on('error', (e) => logger.error('VB audio: ffmpeg failed to start', { roomId, error: e.message }));
  ffmpeg.on('exit', () => {
    const room = rooms.get(roomId);
    if (room && room.ffmpeg === ffmpeg) room.ffmpeg.removeAllListeners();
  });
  return ffmpeg;
}

/**
 * One MediaRecorder slice from the page. `first` marks a recorder's opening slice (it carries the
 * webm header) — a new recorder, possibly in another frame (players in iframes), replaces the old
 * stream, since ffmpeg can't continue one webm stream with another's bytes.
 */
export function pushAudioChunk(roomId: string, frameKey: string, first: boolean, chunk: Buffer): void {
  let room = rooms.get(roomId);
  if (!room) {
    if (!first) return; // mid-stream slice with no header — wait for a recorder's first slice
    room = { ffmpeg: startEncoder(roomId), listeners: new Set(), frameKey };
    rooms.set(roomId, room);
  } else if (first && (frameKey !== room.frameKey || room.ffmpeg.exitCode !== null)) {
    room.ffmpeg.stdin.end();
    room.ffmpeg.kill('SIGKILL');
    room.ffmpeg = startEncoder(roomId);
    room.frameKey = frameKey;
  } else if (frameKey !== room.frameKey) {
    return; // a second frame's recorder while the first still feeds — ignore it
  }
  if (!room.ffmpeg.stdin.destroyed) room.ffmpeg.stdin.write(chunk);
}

/** GET /vb-audio/:roomId — live MP3 for as long as the session (or the listener) lasts. */
export function addAudioListener(roomId: string, res: Response): void {
  res.writeHead(200, {
    'Content-Type': 'audio/mpeg',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    // helmet() defaults CORP to same-origin, which blocks the web app's cross-origin <audio>
    // (same prod bug as vbCapture.controller.ts, 2026-08-12).
    'Cross-Origin-Resource-Policy': 'cross-origin',
  });
  let room = rooms.get(roomId);
  if (!room) {
    // Listener can arrive before the page plays anything (it opens with VB_STARTED) — park it on
    // a placeholder room so the first slice's encoder already has it.
    room = { ffmpeg: startEncoder(roomId), listeners: new Set(), frameKey: '' };
    rooms.set(roomId, room);
  }
  room.listeners.add(res);
  res.on('close', () => rooms.get(roomId)?.listeners.delete(res));
}

export function stopAudio(roomId: string): void {
  const room = rooms.get(roomId);
  if (!room) return;
  rooms.delete(roomId);
  try { room.ffmpeg.stdin.end(); } catch { /* already closed */ }
  room.ffmpeg.kill('SIGKILL');
  for (const res of room.listeners) res.end();
}

/**
 * Init script for every frame of a VB page. Hooks play() and the 'play' event (autoplay without a
 * play() call), routes each media element into one AudioContext per frame and records that mix.
 * Never throws into the page: a site that already owns the element's WebAudio graph just isn't
 * tapped.
 */
export const VB_AUDIO_TAP_SCRIPT = /* js */ `
(function () {
  if (window.__wewatchAudioTap) return;
  window.__wewatchAudioTap = true;
  var ctx = null, dest = null, rec = null, first = true;
  var hooked = new WeakSet();
  function startRecorder() {
    if (rec || typeof MediaRecorder === 'undefined') return;
    try {
      rec = new MediaRecorder(dest.stream, { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 128000 });
    } catch (e) { rec = null; return; }
    rec.ondataavailable = function (e) {
      if (!e.data || !e.data.size || typeof window.__wewatchAudioChunk !== 'function') return;
      e.data.arrayBuffer().then(function (ab) {
        var bytes = new Uint8Array(ab), s = '';
        for (var i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
        var isFirst = first; first = false;
        window.__wewatchAudioChunk(isFirst, btoa(s));
      });
    };
    rec.start(250);
  }
  function tap(el) {
    if (!el || hooked.has(el)) return;
    hooked.add(el);
    try {
      if (!ctx) { ctx = new AudioContext(); dest = ctx.createMediaStreamDestination(); }
      ctx.createMediaElementSource(el).connect(dest);
      if (ctx.state === 'suspended') ctx.resume();
      startRecorder();
    } catch (e) { /* already wired into another graph */ }
  }
  var origPlay = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () { tap(this); return origPlay.apply(this, arguments); };
  document.addEventListener('play', function (e) { tap(e.target); }, true);
})();
`;
