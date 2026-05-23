interface WeWatchLogoProps {
  /** Mark only (no wordmark), sized to fit in a 28×28 icon slot */
  variant?: 'mark' | 'full';
  className?: string;
}

/** WeWatch W mark — inline SVG, no external dependency */
export function WeWatchLogo({ variant = 'mark', className }: WeWatchLogoProps) {
  if (variant === 'mark') {
    return (
      <svg
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="WeWatch"
      >
        <defs>
          <linearGradient id="wG-mark" x1="10" y1="8" x2="70" y2="72" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#A78BFA" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
        <path d="M 62,16 L 46,58 L 40,40 L 28,16" stroke="#7C3AED" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 18,16 L 34,58 L 40,40 L 52,16" stroke="url(#wG-mark)" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 296 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="WeWatch"
    >
      <defs>
        <linearGradient id="wG-full" x1="8" y1="7" x2="68" y2="73" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
        <filter id="sd-full" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#7C3AED" floodOpacity="0.45" />
        </filter>
      </defs>
      <path d="M 79,14 L 56,65 L 45,37 L 30,14" stroke="#7C3AED" strokeWidth="16.5" strokeLinecap="round" strokeLinejoin="round" transform="translate(0,3)" />
      <path d="M 11,14 L 35,65 L 45,37 L 60,14" stroke="url(#wG-full)" strokeWidth="16.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#sd-full)" transform="translate(0,3)" />
      <text x="103" y="52" fontFamily="Inter, DM Sans, sans-serif" fontSize="38" letterSpacing="-0.5" fill="white">
        <tspan fontWeight="300" fill="rgba(255,255,255,0.60)">we</tspan>
        <tspan fontWeight="800">Watch</tspan>
      </text>
    </svg>
  );
}
