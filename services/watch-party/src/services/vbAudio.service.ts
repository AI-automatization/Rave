// WeWatch — Virtual Browser audio (2026-10-25).
//
// The VB picture is a CDP JPEG screencast, which has no audio path at all — owners heard nothing
// from YouTube/any site opened in VB (real report 2026-10-25). The Xvfb+PulseAudio live stream
// (vbStream.service.ts) only exists on Linux and no client ever plays it.
//
// This taps the sound inside the page instead: an init script mirrors every <video>/<audio> the
// page plays (captureStream — the element keeps its own output, so a site's own WebAudio graph
// and the Xvfb/PulseAudio mode are untouched) through WebAudio into a MediaRecorder (webm/opus, 250ms slices) and hands the bytes
// to Node via a page binding (VB_AUDIO_TAP_SCRIPT + virtualBrowser.service.ts). Here one ffmpeg
// per room re-encodes that to a plain MP3 byte stream, fanned out to every HTTP listener of
// GET /vb-audio/:roomId. MP3 on purpose: frames self-sync, so a listener joining mid-stream needs
// no header, and every client plays it natively (<audio> on web, AVPlayer/ExoPlayer on mobile).
// Works headless and on macOS (local dev) — verified with a sine tone and a real YouTube page.
//
// Known limit: a cross-origin media file served without CORS headers is "tainted" for WebAudio and
// records as silence. Those are exactly the plain-file sources the VB sniffer already hands to the
// room as a direct video (which plays with sound), so the gap is small.
import { spawn, ChildProcess } from 'child_process';
import { Response } from 'express';
import { logger } from '@shared/utils/logger';

interface AudioRoom {
  ffmpeg: ChildProcess;
  /** Fed from the PulseAudio monitor (Linux stream mode) — page-tap slices are ignored then. */
  pulse: boolean;
  listeners: Set<Response>;
  /** Frame whose recorder feeds ffmpeg — a second frame starting its own recorder takes over. */
  frameKey: string;
  /** Encoder (re)starts in the current window — the page controls `first`, so it's capped. */
  restarts: number;
  restartWindowStart: number;
}

const rooms = new Map<string, AudioRoom>();
const MP3_BITRATE = '128k';
// Each listener gets its own copy of the stream — a stalled one (slow phone) must not grow memory
// without bound; drop it and let the client reconnect.
const MAX_LISTENER_BACKLOG_BYTES = 512 * 1024;
// A 250ms opus slice at 128 kbit/s is ~4 KB; anything far bigger is a page abusing the binding.
export const MAX_AUDIO_CHUNK_BASE64_LEN = 256 * 1024;
const MAX_RESTARTS_PER_WINDOW = 20;
const RESTART_WINDOW_MS = 60_000;

const MP3_OUT_ARGS = ['-vn', '-ac', '2', '-ar', '44100', '-c:a', 'libmp3lame', '-b:a', MP3_BITRATE, '-flush_packets', '1', '-f', 'mp3', 'pipe:1'];

// Page tap: webm/opus slices arrive on stdin. Pulse: ffmpeg reads the sink monitor itself.
function startEncoder(roomId: string, pulse?: { source: string; runtimeDir: string }): ChildProcess {
  const input = pulse
    ? ['-f', 'pulse', '-i', pulse.source]
    : ['-protocol_whitelist', 'pipe', '-fflags', 'nobuffer', '-probesize', '32', '-analyzeduration', '0', '-f', 'webm', '-i', 'pipe:0'];
  const ffmpeg = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', ...input, ...MP3_OUT_ARGS], {
    stdio: [pulse ? 'ignore' : 'pipe', 'pipe', 'pipe'],
    // Without XDG_RUNTIME_DIR ffmpeg can't find the PulseAudio daemon (see vbStream.service.ts).
    env: pulse ? { ...process.env, XDG_RUNTIME_DIR: pulse.runtimeDir } : process.env,
  });
  ffmpeg.stdout?.on('data', (data: Buffer) => {
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
  ffmpeg.stderr?.on('data', (d: Buffer) => logger.warn('VB audio: ffmpeg', { roomId, msg: d.toString().slice(0, 200) }));
  ffmpeg.stdin?.on('error', () => { /* encoder gone — next chunk restarts it */ });
  ffmpeg.on('error', (e) => logger.error('VB audio: ffmpeg failed to start', { roomId, error: e.message }));
  ffmpeg.on('exit', () => {
    const room = rooms.get(roomId);
    if (room && room.ffmpeg === ffmpeg) room.ffmpeg.removeAllListeners();
  });
  return ffmpeg;
}

function newRoom(roomId: string, frameKey: string): AudioRoom {
  return { ffmpeg: startEncoder(roomId), pulse: false, listeners: new Set(), frameKey, restarts: 0, restartWindowStart: Date.now() };
}

/**
 * One MediaRecorder slice from the page. `first` marks a recorder's opening slice (it carries the
 * webm header) — every new recorder (another frame's player, or the same frame after a navigation)
 * replaces the old stream, since ffmpeg can't continue one webm stream with another's header.
 */
export function pushAudioChunk(roomId: string, frameKey: string, first: boolean, chunk: Buffer): void {
  let room = rooms.get(roomId);
  if (room?.pulse) return; // the sink monitor already carries this sound (and cross-origin media too)
  if (!room) {
    if (!first) return; // mid-stream slice with no header — wait for a recorder's first slice
    room = newRoom(roomId, frameKey);
    rooms.set(roomId, room);
  } else if (first) {
    if (room.frameKey === '') {
      room.frameKey = frameKey; // placeholder encoder a listener opened — nothing fed it yet
    } else {
      const now = Date.now();
      if (now - room.restartWindowStart > RESTART_WINDOW_MS) { room.restarts = 0; room.restartWindowStart = now; }
      if (++room.restarts > MAX_RESTARTS_PER_WINDOW) return;
      room.ffmpeg.stdin?.end();
      room.ffmpeg.kill('SIGKILL');
      room.ffmpeg = startEncoder(roomId);
      room.frameKey = frameKey;
    }
  } else if (frameKey !== room.frameKey) {
    return; // a second frame's recorder while the first still feeds — ignore it
  }
  const stdin = room.ffmpeg.stdin;
  if (stdin && !stdin.destroyed) stdin.write(chunk);
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
    room = newRoom(roomId, '');
    rooms.set(roomId, room);
  }
  room.listeners.add(res);
  res.on('close', () => rooms.get(roomId)?.listeners.delete(res));
}

/**
 * Linux stream mode (VB_STREAM_ENABLED): feed the room's MP3 from the session's PulseAudio monitor
 * instead of the in-page tap. The tap can't record cross-origin media without CORS (Chrome throws
 * "Cannot capture from element with cross-origin data" — confirmed locally 2026-10-25 on
 * asilmedia.org → fayllar.com), so most movie sites were silent; the sink hears everything Chrome
 * plays. Listeners already parked on a placeholder room keep their connection.
 */
export function useSystemAudio(roomId: string, monitor: { source: string; runtimeDir: string }): void {
  const room = rooms.get(roomId);
  if (room) {
    if (room.pulse) return;
    try { room.ffmpeg.stdin?.end(); } catch { /* already closed */ }
    room.ffmpeg.kill('SIGKILL');
    room.ffmpeg = startEncoder(roomId, monitor);
    room.pulse = true;
    return;
  }
  rooms.set(roomId, {
    ffmpeg: startEncoder(roomId, monitor), pulse: true, listeners: new Set(), frameKey: 'pulse', restarts: 0, restartWindowStart: Date.now(),
  });
  logger.info('VB audio: using PulseAudio monitor', { roomId, source: monitor.source });
}

export function stopAudio(roomId: string): void {
  const room = rooms.get(roomId);
  if (!room) return;
  rooms.delete(roomId);
  try { room.ffmpeg.stdin?.end(); } catch { /* already closed */ }
  room.ffmpeg.kill('SIGKILL');
  for (const res of room.listeners) res.end();
}

/**
 * Init script for every frame of a VB page. Hooks play() and the 'play' event (autoplay without a
 * play() call) and mirrors each media element's audio tracks (captureStream) into one recorder per
 * frame. Never throws into the page and never reroutes the element's own output.
 */
export const VB_AUDIO_TAP_SCRIPT = /* js */ `
(function () {
  if (window.__wewatchAudioTap) return;
  window.__wewatchAudioTap = true;
  var ctx = null, dest = null, rec = null, first = true, sendQueue = Promise.resolve();
  var hooked = new WeakSet(), wired = new WeakSet();
  function startRecorder() {
    if (rec || typeof MediaRecorder === 'undefined') return;
    try {
      rec = new MediaRecorder(dest.stream, { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 128000 });
    } catch (e) { rec = null; return; }
    rec.ondataavailable = function (e) {
      if (!e.data || !e.data.size || typeof window.__wewatchAudioChunk !== 'function') return;
      // Flag and order fixed here, synchronously — arrayBuffer() promises may resolve out of order.
      var isFirst = first, blob = e.data;
      first = false;
      sendQueue = sendQueue.then(function () { return blob.arrayBuffer(); }).then(function (ab) {
        var bytes = new Uint8Array(ab), s = '';
        for (var i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
        window.__wewatchAudioChunk(isFirst, btoa(s));
      }).catch(function () {});
    };
    rec.start(250);
  }
  function wire(track) {
    if (track.kind !== 'audio' || wired.has(track)) return;
    wired.add(track);
    try {
      ctx.createMediaStreamSource(new MediaStream([track])).connect(dest);
      startRecorder();
    } catch (e) { /* tainted or closed track */ }
  }
  function tap(el) {
    if (!el || hooked.has(el)) return;
    hooked.add(el);
    try {
      var capture = el.captureStream || el.mozCaptureStream;
      if (!capture) return;
      var stream = capture.call(el);
      if (!ctx) { ctx = new AudioContext(); dest = ctx.createMediaStreamDestination(); }
      if (ctx.state === 'suspended') ctx.resume();
      stream.getAudioTracks().forEach(wire);
      // Tracks show up after metadata loads and are replaced on every src change.
      stream.addEventListener('addtrack', function (e) { wire(e.track); });
    } catch (e) { /* cross-origin media without CORS can't be captured */ }
  }
  // Cross-origin files: load media in CORS mode so captureStream() is allowed — the matching
  // response headers are added by virtualBrowser.service.ts (enableMediaCors). If the element
  // still fails, drop the flag and reload once: the picture must never break for the sound.
  var corsSet = new WeakSet(), corsUndone = new WeakSet();
  function markCors(el) {
    if (!el || el.hasAttribute('crossorigin') || corsUndone.has(el)) return false;
    try { el.crossOrigin = 'use-credentials'; corsSet.add(el); return true; } catch (e) { return false; }
  }
  document.addEventListener('error', function (e) {
    var el = e.target;
    if (!(el instanceof HTMLMediaElement) || !corsSet.has(el) || corsUndone.has(el)) return;
    corsUndone.add(el);
    var wasPlaying = !el.paused || el.autoplay, src = el.currentSrc || el.getAttribute('src');
    el.removeAttribute('crossorigin');
    try { if (src && !el.querySelector('source')) el.src = src; el.load(); if (wasPlaying) el.play().catch(function () {}); } catch (err) { /* ignore */ }
  }, true);
  var srcDesc = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'src');
  if (srcDesc && srcDesc.set) {
    Object.defineProperty(HTMLMediaElement.prototype, 'src', {
      configurable: true, enumerable: srcDesc.enumerable, get: srcDesc.get,
      set: function (v) { markCors(this); srcDesc.set.call(this, v); },
    });
  }
  var origSetAttr = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function (name, value) {
    if (this instanceof HTMLMediaElement && String(name).toLowerCase() === 'src') markCors(this);
    return origSetAttr.apply(this, arguments);
  };
  // Parser-inserted <video src> / <source> — catch it before the load starts.
  new MutationObserver(function (list) {
    list.forEach(function (m) {
      m.addedNodes.forEach(function (n) {
        if (n.nodeType !== 1) return;
        var els = n instanceof HTMLMediaElement ? [n] : (n.querySelectorAll ? n.querySelectorAll('video,audio') : []);
        for (var i = 0; i < els.length; i++) {
          var el = els[i];
          if (markCors(el) && el.readyState === 0 && (el.getAttribute('src') || el.querySelector('source'))) {
            try { el.load(); } catch (e) { /* ignore */ }
          }
        }
      });
    });
  }).observe(document.documentElement || document, { childList: true, subtree: true });
  var origPlay = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () { tap(this); return origPlay.apply(this, arguments); };
  document.addEventListener('play', function (e) { tap(e.target); }, true);
})();
`;
