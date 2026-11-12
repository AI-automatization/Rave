'use client';

import { useEffect, useState } from 'react';
import { User } from 'lucide-react';

interface Props {
  src: string;
  alt?: string;
  className?: string;
}

/**
 * User avatar <img> that never shows the browser's broken-image icon. Old avatars were saved as
 * `/uploads/...` files on a container disk that every deploy wipes (before PR #273 moved uploads to
 * Cloudinary), so many stored URLs are dead now — on error this swaps in a neutral person icon
 * that fills the same box. `no-referrer`: Google profile photos (lh3.googleusercontent.com)
 * intermittently refuse hot-linked requests that carry a Referer.
 */
export function AvatarImg({ src, alt = '', className = '' }: Props) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  if (failed) {
    return (
      <span
        role={alt ? 'img' : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
        className={`${className} flex items-center justify-center bg-violet-600/80 text-white/90`}
      >
        <User className="h-3/5 w-3/5" strokeWidth={2.2} />
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- user-uploaded avatar URL from any host
    <img src={src} alt={alt} referrerPolicy="no-referrer" onError={() => setFailed(true)} className={className} />
  );
}
