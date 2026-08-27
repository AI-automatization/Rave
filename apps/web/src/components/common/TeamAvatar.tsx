import { AVATAR_COLORS, initials } from '@/data/tezcode';

/**
 * Square avatar for the /ru/team hub and the person pages.
 *
 * Both surfaces used to paint `background-image: url(member.photo)` directly, so a
 * member without a headshot rendered as an empty dark square. `photo` is optional in
 * TeamMember, so this falls back to gradient initials — the same fallback
 * TeamPortrait already uses on the company page, kept visually consistent.
 *
 * Server component on purpose: TeamPortrait needs `useState` for next/image's
 * onError, but here a missing file is known at build time from the data itself.
 */
export function TeamAvatar({
  name,
  photo,
  index = 0,
  rounded = '',
  className = '',
}: {
  name: string;
  photo?: string;
  /** Picks the gradient pair so adjacent cards don't repeat a colour. */
  index?: number;
  rounded?: string;
  className?: string;
}) {
  if (photo) {
    return (
      <div
        className={`aspect-square bg-zinc-900 bg-cover bg-center ${rounded} ${className}`}
        style={{ backgroundImage: `url(${photo})` }}
        role="img"
        aria-label={name}
      />
    );
  }

  const from = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const to = AVATAR_COLORS[(index + 3) % AVATAR_COLORS.length];

  return (
    <div
      className={`aspect-square relative flex items-center justify-center overflow-hidden ${rounded} ${className}`}
      style={{ background: `linear-gradient(150deg, ${from}, ${to})` }}
      role="img"
      aria-label={name}
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: 'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.28) 0%, transparent 55%)' }}
      />
      <span
        aria-hidden
        className="relative font-bold text-white/95 leading-none"
        style={{ fontSize: 'clamp(1.75rem, 22%, 5rem)', textShadow: '0 8px 40px rgba(0,0,0,0.35)' }}
      >
        {initials(name)}
      </span>
    </div>
  );
}
