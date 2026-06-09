import Link from 'next/link';

/** Exact brand purple from Figma (#6231EF) */
export const BRAND_PURPLE = '#6231EF';

interface WeWatchLogoProps {
  variant?: 'horizontal' | 'stacked' | 'icon-only';
  iconSize?: number;
  href?: string;
  className?: string;
}

/**
 * Original Figma SVG — Group 1.svg — placed as-is, no manual recreation.
 * viewBox 935×611 (natural W aspect ratio). Size prop sets height; width is proportional.
 */
export function WIcon({ size = 36 }: { size?: number }) {
  const w = Math.round(size * 935 / 611);

  return (
    <svg
      width={w}
      height={size}
      viewBox="0 0 935 611"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <filter id="wf0" x="389" y="35.2109" width="334.159" height="520.808"
          filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feMorphology radius="2" operator="dilate" in="SourceAlpha" result="effect1_dropShadow"/>
          <feOffset dy="4"/>
          <feGaussianBlur stdDeviation="2"/>
          <feComposite in2="hardAlpha" operator="out"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/>
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/>
        </filter>
        <filter id="wf1" x="532.289" y="7.16522" width="402.621" height="575.872"
          filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feMorphology radius="1" operator="dilate" in="SourceAlpha" result="effect1_dropShadow"/>
          <feOffset dx="3" dy="3"/>
          <feGaussianBlur stdDeviation="15"/>
          <feComposite in2="hardAlpha" operator="out"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 0"/>
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/>
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/>
        </filter>
        <filter id="wf2" x="0" y="0" width="424.159" height="610.808"
          filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feMorphology radius="1" operator="dilate" in="SourceAlpha" result="effect1_dropShadow"/>
          <feOffset dx="2" dy="10"/>
          <feGaussianBlur stdDeviation="25"/>
          <feComposite in2="hardAlpha" operator="out"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/>
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/>
        </filter>
      </defs>

      {/* Rect 1 — back layer (no filter) */}
      <rect x="581.327" y="79.9094" width="558.054" height="157.697" rx="78.8487"
        transform="rotate(117.182 581.327 79.9094)" fill="#6735F4"/>

      {/* Rect 2 — with drop shadow */}
      <g filter="url(#wf0)">
        <rect x="513.195" y="11.0813" width="544.84" height="159.065" rx="78.8487"
          transform="rotate(65.0336 513.195 11.0813)" fill="#6735F4"/>
      </g>

      {/* Rect 3 — with drop shadow (right outer leg) */}
      <g filter="url(#wf1)">
        <rect x="928.205" y="79.9094" width="558.054" height="157.697" rx="78.8487"
          transform="rotate(117.182 928.205 79.9094)" fill="#6231EF"/>
      </g>

      {/* Rect 4 — with drop shadow (left outer leg) */}
      <g filter="url(#wf2)">
        <rect x="167.195" y="14.8703" width="544.84" height="159.065" rx="78.8487"
          transform="rotate(65.0336 167.195 14.8703)" fill="#6231EF"/>
      </g>
    </svg>
  );
}

export function WeWatchLogo({
  variant = 'horizontal',
  iconSize = 36,
  href = '/',
  className = '',
}: WeWatchLogoProps) {
  let inner: React.ReactNode;

  if (variant === 'icon-only') {
    inner = <WIcon size={iconSize} />;
  } else if (variant === 'stacked') {
    inner = (
      <div className="flex flex-col items-center gap-2">
        <WIcon size={iconSize} />
        <span className="font-extrabold text-xl tracking-tight text-white">
          We<span style={{ color: BRAND_PURPLE }}>Watch</span>
        </span>
      </div>
    );
  } else {
    inner = (
      <div className="inline-flex items-center gap-2">
        <WIcon size={iconSize} />
        <span className="font-extrabold text-xl tracking-tight text-white">
          We<span style={{ color: BRAND_PURPLE }}>Watch</span>
        </span>
      </div>
    );
  }

  return (
    <Link href={href} className={`group ${className}`} aria-label="WeWatch">
      {inner}
    </Link>
  );
}
