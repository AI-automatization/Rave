// Single source of truth for formatting a video position/duration (in SECONDS — matches
// HTMLVideoElement.duration/currentTime, what VideoPlayer.tsx and VideoCandidatePicker.tsx both
// already work in). Was previously three separate copy-pasted `m:ss`-only formatters (two in
// VideoPlayer.tsx, one in VideoCandidatePicker.tsx) that never rolled over to hours — a 3-hour
// movie showed "180:00" instead of "3:00:00". Mirrors apps/mobile/src/utils/videoPlayer.ts's
// fmtTime logic (that one already handles hours correctly), just seconds instead of milliseconds.
export function formatDuration(totalSeconds: number): string {
  if (!isFinite(totalSeconds) || totalSeconds < 0) return '0:00';
  const total = Math.floor(totalSeconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
