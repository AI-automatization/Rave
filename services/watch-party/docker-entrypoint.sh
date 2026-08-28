#!/bin/sh
# WeWatch watch-party entrypoint.
#
# Exists only because the VB live A/V stream (vbStream.service.ts) needs a PulseAudio daemon
# already running before the Node process can create per-session sinks with `pactl`. Everything
# here is skipped unless VB_STREAM_ENABLED=1, so the default container behaviour is byte-for-byte
# what it was before: exec node directly.
set -e

if [ "$VB_STREAM_ENABLED" = "1" ]; then
  # Xvfb sockets live here; the per-session displays vbStream.service.ts spawns need the directory
  # to exist and be writable by the app user.
  mkdir -p /tmp/.X11-unix
  chmod 1777 /tmp/.X11-unix 2>/dev/null || true
  mkdir -p "${VB_STREAM_DIR:-/tmp/vb-stream}"

  # XDG_RUNTIME_DIR is what decides where PulseAudio puts its native socket, and therefore where
  # every client looks for it. Proven necessary by a live container test (2026-08-28): with it
  # unset, `pulseaudio --start` and `pactl` still worked (they agree on a fallback), but Chromium
  # never found the daemon — its sink stayed SUSPENDED with zero sink-inputs and the captured
  # audio track was pure silence. Exporting one explicit value here, before the daemon starts,
  # makes the daemon, pactl and the Chromium processes Node later spawns (they inherit this env)
  # all agree on the same socket path. With it set, the same test showed Chromium connected
  # (sink RUNNING) and the captured audio measured mean -3.9 dB / max -0.1 dB — real sound.
  export XDG_RUNTIME_DIR="${XDG_RUNTIME_DIR:-/tmp/pulse-run}"
  mkdir -p "$XDG_RUNTIME_DIR"
  chmod 700 "$XDG_RUNTIME_DIR"

  # --exit-idle-time=-1 stops the daemon shutting itself down between sessions (the default idle
  # timeout would tear it down whenever no room is streaming, and the next `pactl load-module`
  # would then fail).
  pulseaudio --start --exit-idle-time=-1 --disallow-exit 2>/dev/null || \
    echo "[entrypoint] WARNING: pulseaudio failed to start — VB streams will be video-only"
fi

exec node dist/server.js
