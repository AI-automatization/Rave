'use client';

import { useEffect, useRef, useState } from 'react';
import { Film, Heart, Music, MessageCircle, Star, Play, type LucideIcon } from 'lucide-react';

// Deterministic doodle-icon background behind the message list — port of mobile's
// ChatWallpaper.tsx. Same formulas (no Math.random — stable across re-renders), but sized off
// this component's own container via ResizeObserver instead of mobile's Dimensions.get('window')
// — the web chat panel isn't full-screen, and computing from the container avoids any
// `window`/SSR access entirely (size starts null, icons only render post-mount).
const CELL = 78;
const ICONS: LucideIcon[] = [Film, Heart, Music, MessageCircle, Star, Play];

interface CellIcon {
  key: string;
  Icon: LucideIcon;
  x: number;
  y: number;
  rotation: number;
  size: number;
}

function buildIcons(width: number, height: number): CellIcon[] {
  const cols = Math.ceil(width / CELL) + 1;
  const rows = Math.ceil(height / CELL) + 1;
  const icons: CellIcon[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const seed = (row * 7 + col * 13) % 6;
      const jitterX = ((row * 31 + col * 17) % 20) - 10;
      const jitterY = ((row * 11 + col * 23) % 20) - 10;
      const rotation = ((row * 19 + col * 5) % 40) - 20;
      const rowOffset = row % 2 === 1 ? CELL / 2 : 0;
      const size = 22 + ((row + col) % 3) * 4;
      icons.push({
        key: `${row}-${col}`,
        Icon: ICONS[seed],
        x: col * CELL + rowOffset + jitterX,
        y: row * CELL + jitterY,
        rotation,
        size,
      });
    }
  }
  return icons;
}

export function ChatWallpaper() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setSize({ width: el.clientWidth, height: el.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const icons = size ? buildIcons(size.width, size.height) : [];

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {icons.map(({ key, Icon, x, y, rotation, size: iconSize }) => (
        <Icon
          key={key}
          size={iconSize}
          style={{
            position: 'absolute',
            left: x,
            top: y,
            transform: `rotate(${rotation}deg)`,
            // Aksent tokendan olingan juda past opacity — fon naqshi mazmunni
            // to'smasligi kerak (ilgari qo'lda yozilgan rgba(123,114,248,.09))
            color: 'color-mix(in srgb, var(--ww-accent) 9%, transparent)',
          }}
        />
      ))}
    </div>
  );
}
