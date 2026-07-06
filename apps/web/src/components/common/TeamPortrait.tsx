'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FaStar } from 'react-icons/fa';
import { initials, AVATAR_COLORS } from '@/data/tezcode';

interface TeamPortraitProps {
  name: string;
  role: string;
  photo?: string;
  index?: number;
  star?: boolean;
}

/**
 * Большая портретная плитка участника команды.
 * Есть фото — показываем его во всю плитку.
 * Нет фото / ошибка — крупные градиентные инициалы (тот же размер).
 */
export function TeamPortrait({ name, role, photo, index = 0, star = false }: TeamPortraitProps) {
  const [broken, setBroken] = useState(false);
  const c1 = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const c2 = AVATAR_COLORS[(index + 3) % AVATAR_COLORS.length];

  const showPhoto = photo && !broken;

  return (
    <div className="group relative rounded-[28px] overflow-hidden aspect-[4/5] border border-white/10 bg-[#0D0D14]">
      {showPhoto ? (
        <Image
          src={photo}
          alt={name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
          onError={() => setBroken(true)}
          className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]"
        />
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]"
          style={{ background: `linear-gradient(150deg, ${c1}, ${c2})` }}
          aria-hidden="true"
        >
          {/* мягкий световой блик */}
          <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.28) 0%, transparent 55%)' }} />
          <span className="relative font-display font-bold text-white/95 leading-none" style={{ fontSize: 'clamp(4rem, 12vw, 7rem)', textShadow: '0 8px 40px rgba(0,0,0,0.35)' }}>
            {initials(name)}
          </span>
        </div>
      )}

      {/* нижний градиент для читаемости текста */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(5,5,10,0.96) 0%, rgba(5,5,10,0.55) 32%, rgba(5,5,10,0.05) 55%, transparent 75%)' }}
        aria-hidden="true"
      />

      {/* цветная линия сверху при ховере */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `linear-gradient(90deg, transparent, ${c1}, transparent)` }}
        aria-hidden="true"
      />

      {/* имя + роль */}
      <div className="absolute inset-x-0 bottom-0 p-6">
        <div className="flex items-center gap-2 mb-1.5">
          <h3 className="text-white font-semibold text-xl md:text-2xl leading-tight">{name}</h3>
          {star && <FaStar size={13} className="text-[#f59e0b] flex-shrink-0" aria-hidden="true" />}
        </div>
        <p className="text-[#c4bffc] text-[11px] font-semibold uppercase tracking-[0.14em]">{role}</p>
      </div>

      {/* тонкая рамка + свечение при ховере */}
      <div className="absolute inset-0 rounded-[28px] ring-1 ring-inset ring-white/[0.06] group-hover:ring-[#7B72F8]/45 transition-all duration-500 pointer-events-none" />
    </div>
  );
}
