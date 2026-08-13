'use client';

/**
 * Eng faol jonli xona — bosh sahifaning asosiy chaqirig'i.
 *
 * Nega alohida katta blok: oldingi tartibda barcha xonalar bir xil o'lchamdagi
 * kartalar to'ridа edi, ya'ni "hozir 3 kishi film ko'rmoqda, qo'shil" degan
 * eng qimmatli signal qolganlari orasida yo'qolib ketardi. Bu yerda u
 * yagona va katta.
 *
 * Ma'lumot `useRooms()` dan keladi — yangi so'rov qo'shilmaydi.
 */

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Play, Users } from 'lucide-react';
import { avatarColor } from '@/lib/utils';
import type { IWatchPartyRoom } from '@/types';

const MAX_AVATARS = 4;

export function LiveSpotlight({ room }: { room: IWatchPartyRoom }) {
  const t = useTranslations('home');
  const members = room.members ?? [];
  const count = members.length;

  return (
    <Link
      href={`/room/${room._id}`}
      /* 220px past edi — poster ko'rinmay, blok bo'sh qora to'rtburchakka
         o'xshardi. Bosh sahifadagi yagona "kinematik" element shu, u
         balandlikni oqlaydi. */
      className="group relative isolate flex min-h-[300px] flex-col justify-end overflow-hidden rounded-[var(--ww-r-xl)] border border-[var(--ww-line)] p-5 transition-colors hover:border-[var(--ww-line-hover)] sm:min-h-[380px] sm:p-7"
    >
      {/* Fon: video posteri. Yo'q bo'lsa — violet gradient, bo'sh qora emas */}
      {room.videoThumbnail ? (
        <img
          src={room.videoThumbnail}
          alt=""
          className="absolute inset-0 -z-10 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      ) : (
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(ellipse 80% 70% at 30% 20%, rgba(124,58,237,0.30) 0%, transparent 60%), linear-gradient(135deg,#1A1030 0%,#0B0918 100%)',
          }}
        />
      )}

      {/* Matn o'qilishi uchun — posterning yorqinligi oldindan noma'lum */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-t from-[rgba(5,5,10,0.94)] via-[rgba(5,5,10,0.62)] to-[rgba(5,5,10,0.30)]"
      />

      {/* LIVE nishoni */}
      <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full border border-[rgba(255,59,78,0.35)] bg-[var(--ww-live-soft)] px-3 py-1.5 backdrop-blur-md sm:left-6 sm:top-6">
        <span className="ww-live-dot" aria-hidden="true" />
        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--ww-live)]">
          {t('spotlightLabel')}
        </span>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-balance text-[26px] font-semibold leading-[1.1] tracking-[-0.02em] text-white sm:text-[38px]">
            {room.name ?? room.videoTitle ?? t('room')}
          </h2>
          {room.videoTitle && room.name && (
            <p className="mt-1.5 truncate text-[14px] text-white/55">{room.videoTitle}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {count > 0 && (
              <div className="flex -space-x-2.5">
                {members.slice(0, MAX_AVATARS).map((m, i) => {
                  // members elementlari populate qilinmagan bo'lishi mumkin —
                  // string ID ham, obyekt ham kelishi mumkin
                  const raw = m as unknown as { _id?: string; username?: string; avatar?: string } | string;
                  const id = typeof raw === 'string' ? raw : raw?._id ?? String(i);
                  const name = typeof raw === 'string' ? undefined : raw?.username;
                  const avatar = typeof raw === 'string' ? undefined : raw?.avatar;
                  const color = avatarColor(id);
                  return (
                    <span
                      key={id}
                      className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 border-[rgba(5,5,10,0.9)] text-[12px] font-semibold"
                      style={{ background: `${color}45`, color: '#fff' }}
                    >
                      {avatar ? (
                        <img src={avatar} alt="" className="h-full w-full object-cover" />
                      ) : (
                        (name?.[0]?.toUpperCase() ?? '·')
                      )}
                    </span>
                  );
                })}
              </div>
            )}
            <span className="flex items-center gap-1.5 text-[13px] text-white/70">
              <Users size={13} aria-hidden="true" />
              {t('watchingNow', { count })}
            </span>
          </div>

          <span className="ww-btn-accent inline-flex items-center gap-2 rounded-[var(--ww-r-md)] px-5 py-2.5 text-[14px] font-semibold text-white">
            <Play size={15} aria-hidden="true" fill="currentColor" />
            {t('joinLive')}
          </span>
        </div>
      </div>
    </Link>
  );
}
