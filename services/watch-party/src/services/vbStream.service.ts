// WeWatch — live A/V stream out of a Virtual Browser session (2026-08-28, Saidazim).
//
// Why this exists: VB's existing screencast (virtualBrowser.service.ts, CDP Page.startScreencast)
// is JPEG frames at ~10fps with NO AUDIO AT ALL — Page.startScreencast has no audio path, by
// design. That's fine as an owner-only "pick the right video" control view, but it can never be
// the thing people actually watch a movie through: no sound, and at 1280x720/q55 a single frame is
// ~70KB, so even 10fps is ~5.6 Mbit/s PER VIEWER fanned out over Socket.io (60fps would be ~34
// Mbit/s each — a 2h movie for a room of 5 would be ~150GB of Railway egress for one session).
//
// The only way to actually stream a browser session is to capture it as real video+audio and
// encode it:
//   - Chrome runs HEADFUL on a per-session Xvfb virtual display (headless Chrome produces no
//     X surface to grab and no audio stream to route).
//   - Audio goes to a per-session PulseAudio null-sink, whose .monitor source is capturable.
//   - ffmpeg grabs that display (x11grab) + that sink monitor (pulse), encodes H.264/AAC, and
//     writes HLS segments.
// At 720p30/2.5Mbit/s that's ~312 KB/s WITH audio — roughly 13x less than the current
// audio-less 10fps JPEG path, and the fan-out to viewers becomes a CDN's job (plain HLS files)
// instead of Socket.io's.
//
// Sync comes free: a live HLS stream is the same stream for everyone, so there's no play/pause/
// seek sync protocol to write for this mode at all — viewers just sit at the live edge.
//
// SAFETY: everything here is behind VB_STREAM_ENABLED (default OFF). With the flag unset this
// module never spawns anything and startStream() returns null, so the existing JPEG-screencast
// behaviour is completely unchanged — which is what local dev (macOS, no Xvfb/PulseAudio) and
// production both get until the flag is deliberately turned on.
import { spawn, ChildProcess, execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { logger } from '@shared/utils/logger';

const execFileAsync = promisify(execFile);

export const VB_STREAM_ENABLED = process.env.VB_STREAM_ENABLED === '1';

// Matches VB_VIEWPORT in virtualBrowser.service.ts — Xvfb's screen has to be the same size as the
// browser viewport or x11grab captures letterboxing/cropping instead of the page.
const STREAM_WIDTH = 1280;
const STREAM_HEIGHT = 720;
// Source movies are 24fps; 30 is already above that. 60 would double encode CPU for frames that
// don't exist in the source material.
const STREAM_FPS = 30;
const VIDEO_BITRATE = '2500k';
const AUDIO_BITRATE = '128k';

// HLS tuning: 2s segments, 4-segment sliding window (~8s of buffer). Shorter segments cut latency
// but multiply request count; this is the usual "live but not interactive" tradeoff, which is the
// right one here because the owner's INTERACTIVE control path stays on the low-latency JPEG
// screencast — only passive watching goes through HLS.
const HLS_SEGMENT_SEC = 2;
const HLS_LIST_SIZE = 4;

const HLS_ROOT = process.env.VB_STREAM_DIR || '/tmp/vb-stream';

// X display numbers are a global, process-wide namespace — two sessions on the same display would
// capture each other's browser. Allocated per room, released on stop.
const DISPLAY_BASE = 99;
const usedDisplays = new Set<number>();

function allocateDisplay(): number {
  for (let n = DISPLAY_BASE; n < DISPLAY_BASE + 100; n++) {
    if (!usedDisplays.has(n)) { usedDisplays.add(n); return n; }
  }
  throw new Error('vb_stream_no_display_available');
}

// Where PulseAudio put its native socket — every client (Chromium included) resolves the daemon
// through this. docker-entrypoint.sh exports the same value before starting the daemon; the
// fallback here only matters for a process started outside that entrypoint. Live container test
// 2026-08-28: with Chromium launched WITHOUT this, its sink stayed SUSPENDED (zero sink-inputs)
// and the captured audio was silence; with it, the sink went RUNNING and audio measured
// mean -3.9 dB. It is the single thing that makes browser audio reach the encoder.
const PULSE_RUNTIME_DIR = process.env.XDG_RUNTIME_DIR || '/tmp/pulse-run';

export interface VbStreamHandle {
  /** X display for Chrome to render into, e.g. ":99" — pass as DISPLAY in the browser's env. */
  display: string;
  /** PulseAudio sink for Chrome's audio, e.g. "vb_<roomId>" — pass as PULSE_SINK. */
  sinkName: string;
  /** Must be passed to Chrome as XDG_RUNTIME_DIR or it will not find the PulseAudio daemon. */
  runtimeDir: string;
  /** Public-facing playlist path, served by the HLS route (watchParty.routes.ts). */
  playlistPath: string;
}

interface StreamSession extends VbStreamHandle {
  displayNum: number;
  xvfb: ChildProcess;
  ffmpeg: ChildProcess | null;
  hlsDir: string;
  pulseModuleId: string | null;
}

const streams = new Map<string, StreamSession>();

function waitForFile(filePath: string, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const tick = () => {
      if (fs.existsSync(filePath)) return resolve(true);
      if (Date.now() - startedAt > timeoutMs) return resolve(false);
      setTimeout(tick, 200);
    };
    tick();
  });
}

/**
 * Bring up the per-session Xvfb display and PulseAudio sink. Returns the handle the caller needs
 * to launch Chrome INTO this session (DISPLAY + PULSE_SINK env). ffmpeg is deliberately NOT
 * started here — see startEncoder() — because encoding a black screen while the browser is still
 * launching just burns CPU and pads the HLS window with dead segments.
 *
 * Returns null (never throws) whenever streaming is off or unavailable, so every caller can treat
 * "no stream" as the normal, fully-supported case rather than an error path.
 */
export async function startStream(roomId: string): Promise<VbStreamHandle | null> {
  if (!VB_STREAM_ENABLED) return null;
  if (streams.has(roomId)) return streams.get(roomId)!;

  let displayNum: number | null = null;
  try {
    displayNum = allocateDisplay();
    const display = `:${displayNum}`;
    const sinkName = `vb_${roomId.replace(/[^a-zA-Z0-9_]/g, '')}`;
    const hlsDir = path.join(HLS_ROOT, roomId);
    fs.mkdirSync(hlsDir, { recursive: true });

    const xvfb = spawn('Xvfb', [
      display,
      '-screen', '0', `${STREAM_WIDTH}x${STREAM_HEIGHT}x24`,
      '-nolisten', 'tcp',
    ], { stdio: 'ignore' });
    xvfb.on('error', (e) => logger.error('VB stream: Xvfb failed to spawn', { roomId, error: e.message }));

    // Xvfb writes its socket once it's actually accepting connections — launching Chrome before
    // that races into "cannot open display".
    const xvfbReady = await waitForFile(`/tmp/.X11-unix/X${displayNum}`, 5000);
    if (!xvfbReady) {
      xvfb.kill('SIGKILL');
      throw new Error('xvfb_did_not_start');
    }

    // Per-session null sink so concurrent rooms don't capture each other's audio. Its .monitor
    // source is what ffmpeg reads below.
    let pulseModuleId: string | null = null;
    try {
      const { stdout } = await execFileAsync('pactl', [
        'load-module', 'module-null-sink',
        `sink_name=${sinkName}`,
        `sink_properties=device.description=${sinkName}`,
      ]);
      pulseModuleId = stdout.trim();
    } catch (e) {
      // Video-only is a degraded but real result — better than failing the whole session.
      logger.warn('VB stream: could not create PulseAudio sink, stream will be video-only', { roomId, error: (e as Error).message });
    }

    const session: StreamSession = {
      display, sinkName, displayNum, xvfb, ffmpeg: null, hlsDir, pulseModuleId,
      runtimeDir: PULSE_RUNTIME_DIR,
      playlistPath: `/api/v1/watch-party/vb-stream/${roomId}/index.m3u8`,
    };
    streams.set(roomId, session);
    logger.info('VB stream: display and audio sink ready', { roomId, display, sinkName, audio: !!pulseModuleId });
    return session;
  } catch (e) {
    if (displayNum !== null) usedDisplays.delete(displayNum);
    logger.error('VB stream: failed to start', { roomId, error: (e as Error).message });
    return null;
  }
}

/**
 * Start encoding once the browser has actually painted something. Separate from startStream() so
 * the caller can launch Chrome in between — see the black-screen note there.
 */
export function startEncoder(roomId: string): void {
  const session = streams.get(roomId);
  if (!session || session.ffmpeg) return;

  const args = [
    '-loglevel', 'error',
    // Video: grab the session's own X display.
    '-f', 'x11grab', '-framerate', String(STREAM_FPS),
    '-video_size', `${STREAM_WIDTH}x${STREAM_HEIGHT}`,
    '-i', session.display,
  ];

  if (session.pulseModuleId) {
    args.push('-f', 'pulse', '-i', `${session.sinkName}.monitor`);
  }

  args.push(
    '-c:v', 'libx264',
    // veryfast/zerolatency: this is a live capture, not an archive encode — spending CPU on
    // compression efficiency here directly costs concurrent-session capacity.
    '-preset', 'veryfast', '-tune', 'zerolatency',
    '-b:v', VIDEO_BITRATE, '-maxrate', VIDEO_BITRATE, '-bufsize', '5000k',
    '-pix_fmt', 'yuv420p',
    // Keyframe every segment, so every HLS segment is independently decodable and players can
    // join at any segment boundary.
    '-g', String(STREAM_FPS * HLS_SEGMENT_SEC), '-keyint_min', String(STREAM_FPS * HLS_SEGMENT_SEC),
    '-sc_threshold', '0',
  );

  if (session.pulseModuleId) {
    args.push('-c:a', 'aac', '-b:a', AUDIO_BITRATE, '-ar', '44100', '-ac', '2');
  }

  args.push(
    '-f', 'hls',
    '-hls_time', String(HLS_SEGMENT_SEC),
    '-hls_list_size', String(HLS_LIST_SIZE),
    // delete_segments keeps the directory from growing unbounded over a 2h movie; append_list +
    // omit_endlist keep it a live playlist rather than a VOD one that signals "finished".
    '-hls_flags', 'delete_segments+append_list+omit_endlist',
    '-hls_segment_filename', path.join(session.hlsDir, 'seg%d.ts'),
    path.join(session.hlsDir, 'index.m3u8'),
  );

  const ffmpeg = spawn('ffmpeg', args, { stdio: ['ignore', 'ignore', 'pipe'] });
  ffmpeg.stderr?.on('data', (chunk: Buffer) => {
    logger.warn('VB stream: ffmpeg', { roomId, output: chunk.toString().slice(0, 500) });
  });
  ffmpeg.on('exit', (code, signal) => {
    logger.info('VB stream: ffmpeg exited', { roomId, code, signal });
    const s = streams.get(roomId);
    if (s) s.ffmpeg = null;
  });

  session.ffmpeg = ffmpeg;
  logger.info('VB stream: encoder started', { roomId, audio: !!session.pulseModuleId });
}

/** True once ffmpeg has actually produced a playable playlist — until then there's nothing to send. */
export function isStreamReady(roomId: string): boolean {
  const session = streams.get(roomId);
  if (!session) return false;
  return fs.existsSync(path.join(session.hlsDir, 'index.m3u8'));
}

export function getStreamDir(roomId: string): string | null {
  return streams.get(roomId)?.hlsDir ?? null;
}

export async function stopStream(roomId: string): Promise<void> {
  const session = streams.get(roomId);
  if (!session) return;
  streams.delete(roomId);
  usedDisplays.delete(session.displayNum);

  session.ffmpeg?.kill('SIGKILL');
  session.xvfb.kill('SIGKILL');

  if (session.pulseModuleId) {
    await execFileAsync('pactl', ['unload-module', session.pulseModuleId]).catch((e) => {
      logger.warn('VB stream: failed to unload PulseAudio sink', { roomId, error: (e as Error).message });
    });
  }

  fs.rm(session.hlsDir, { recursive: true, force: true }, (e) => {
    if (e) logger.warn('VB stream: failed to clean HLS dir', { roomId, error: e.message });
  });

  logger.info('VB stream: stopped', { roomId });
}
