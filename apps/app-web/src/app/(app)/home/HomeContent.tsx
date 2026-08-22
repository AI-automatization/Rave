'use client';

import { useState } from 'react';
import { Plus, LogIn, WifiOff, RefreshCw } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

import { useTranslations } from 'next-intl';
import { useRooms } from '@/hooks/use-rooms';
import { useFriends } from '@/hooks/use-friends';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { RoomCard } from '@/components/rooms/RoomCard';
import { CreateRoomDialog } from '@/components/rooms/CreateRoomDialog';
import { JoinRoomDialog } from '@/components/rooms/JoinRoomDialog';
import { StatTiles } from '@/components/home/StatTiles';
import { FriendsRail } from '@/components/home/FriendsRail';
import { LiveSpotlight } from '@/components/home/LiveSpotlight';
import { StartHero } from '@/components/home/StartHero';
import { ContinueWatchingRail } from '@/components/home/ContinueWatchingRail';
import { Button } from '@/components/ui/button';
import { trackClick } from '@/lib/analytics';
import type { IWatchPartyRoom } from '@/types';

/** Bo'lim sarlavhasi — barcha ro'yxatlar uchun bir xil shakl */
function SectionHeader({
  label,
  count,
  live = false,
}: {
  label: string;
  count?: number;
  live?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      {live && <span className="ww-live-dot" aria-hidden="true" />}
      <h2 className="text-[13px] font-semibold text-[var(--ww-text-2)]">{label}</h2>
      {count !== undefined && (
        <span className="rounded-full bg-[var(--ww-surface-2)] px-2 py-0.5 text-[11px] font-medium text-[var(--ww-text-3)]">
          {count}
        </span>
      )}
    </div>
  );
}

/**
 * Vaqtga qarab salomlashish. Server va client turli vaqt mintaqasida bo'lishi
 * mumkin, lekin bu komponent 'use client' — hisob brauzerda, foydalanuvchining
 * o'z soatida bajariladi.
 */
function greetingKey(): 'greetingMorning' | 'greetingDay' | 'greetingEvening' {
  const h = new Date().getHours();
  if (h < 12) return 'greetingMorning';
  if (h < 18) return 'greetingDay';
  return 'greetingEvening';
}

export function HomeContent() {
  const t = useTranslations('home');
  const shouldReduceMotion = useReducedMotion();
  const { data: rooms, isLoading, isError } = useRooms();
  const { data: friends } = useFriends();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const user = useAuthStore((s) => s.user);

  const { data: recentRooms } = useQuery<IWatchPartyRoom[]>({
    queryKey: ['rooms-recent'],
    queryFn: async () => {
      const res = await fetch('/api/rooms/recent', { credentials: 'include' });
      if (!res.ok) return [];
      const data = (await res.json()) as { data?: IWatchPartyRoom[] };
      return Array.isArray(data.data) ? data.data : [];
    },
    staleTime: 30_000,
  });

  const activeRooms = rooms?.filter((r) => String(r.status) === 'active') ?? [];
  const idleRooms = rooms?.filter((r) => String(r.status) !== 'active') ?? [];
  const hasRooms = !isLoading && !isError && rooms && rooms.length > 0;
  const onlineCount = friends?.filter((f) => f.isOnline).length ?? 0;

  // Eng ko'p odam yig'ilgan jonli xona — spotlight'ga. Qolganlari to'rda.
  const spotlight = activeRooms.length
    ? [...activeRooms].sort((a, b) => (b.members?.length ?? 0) - (a.members?.length ?? 0))[0]
    : null;
  const otherActive = spotlight ? activeRooms.filter((r) => r._id !== spotlight._id) : [];

  const fadeIn = (i: number) => ({
    initial: { opacity: 0, y: shouldReduceMotion ? 0 : 6 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: shouldReduceMotion ? 0 : 0.24,
      ease: 'easeOut' as const,
      delay: shouldReduceMotion ? 0 : Math.min(i * 0.04, 0.24),
    },
  });

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8">
      {/* ── Salomlashish + tezkor amallar ── */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          {/* 22px edi — sahifaning eng yuqori sarlavhasi statistika
              plitalaridagi raqamlardan kichik bo'lib qolgandi */}
          <h1 className="truncate text-[28px] font-semibold tracking-[-0.025em] text-[var(--ww-text)] sm:text-[34px]">
            {user?.username ? t(greetingKey(), { name: user.username }) : t('greetingGuest')}
          </h1>
          {/* Ijtimoiy signal — "kim hozir bor" bosh ekranning asosiy savoli */}
          <p className="mt-1 flex items-center gap-2 text-[13px] text-[var(--ww-text-3)]">
            {onlineCount > 0 ? (
              <>
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 rounded-full bg-[var(--ww-online)]"
                />
                {t('friendsOnline', { count: onlineCount })}
              </>
            ) : (
              t('noFriendsOnline')
            )}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="subtle"
            size="default"
            onClick={() => {
              trackClick('home:open_join_dialog');
              setJoinOpen(true);
            }}
            className="h-10 px-4"
          >
            <LogIn size={15} aria-hidden="true" />
            {t('join')}
          </Button>
          <Button
            variant="accent"
            size="default"
            onClick={() => {
              trackClick('home:open_create_dialog');
              setCreateOpen(true);
            }}
            className="h-10 px-4 font-semibold"
          >
            <Plus size={15} aria-hidden="true" />
            {t('create')}
          </Button>
        </div>
      </header>

      {/* ── Langar bloki ──
          Bu joy HECH QACHON bo'sh qolmaydi: jonli xona bo'lsa — spotlight,
          bo'lmasa — boshlash bloki. Ilgari jonli xona yo'q bo'lsa sahifa
          langarsiz qolib, kulrang qutilar ro'yxatiga aylanardi. Yuklanish
          paytida ikkalasi ham chiqmaydi — skelet o'zi joyni egallaydi. */}
      {!isLoading && !isError && (
        <motion.div {...fadeIn(0)}>
          {spotlight ? (
            <LiveSpotlight room={spotlight} />
          ) : (
            <StartHero
              onCreate={() => {
                trackClick('home:start_hero_create');
                setCreateOpen(true);
              }}
              onJoin={() => {
                trackClick('home:start_hero_join');
                setJoinOpen(true);
              }}
            />
          )}
        </motion.div>
      )}

      {/* ── Continue watching — Pro perk, komponent o'zi bo'sh bo'lsa hech narsa render qilmaydi ── */}
      <motion.div {...fadeIn(1)}>
        <ContinueWatchingRail />
      </motion.div>

      {/* ── Geymifikatsiya plitalari ── */}
      <motion.div {...fadeIn(2)}>
        <StatTiles />
      </motion.div>

      {/* ── Do'stlar qatori ── */}
      <motion.div {...fadeIn(2)}>
        <FriendsRail />
      </motion.div>

      {/* ── Yuklanish — haqiqiy to'r shaklidagi skelet (layout sakramaydi) ── */}
      {isLoading && (
        <div
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          aria-busy="true"
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="ww-card overflow-hidden">
              <div className="skeleton aspect-video" />
              <div className="flex flex-col gap-2 px-3 py-2.5">
                <div className="skeleton h-3 w-3/4 rounded" />
                <div className="skeleton h-2.5 w-1/3 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Xato ── */}
      {isError && !isLoading && (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <WifiOff size={24} className="text-[var(--ww-text-4)]" aria-hidden="true" />
          <div>
            <p className="text-[14px] font-medium text-[var(--ww-text)]">{t('errorTitle')}</p>
            <p className="mt-1 text-[13px] text-[var(--ww-text-3)]">{t('errorDesc')}</p>
          </div>
          <Button
            variant="subtle"
            onClick={() => {
              trackClick('home:retry');
              qc.invalidateQueries({ queryKey: ['rooms'] });
            }}
            className="h-10 px-4"
          >
            <RefreshCw size={14} aria-hidden="true" />
            {t('retry')}
          </Button>
        </div>
      )}

      {/* Bo'sh holat uchun alohida blok endi yo'q — `StartHero` langar
          joyida uni to'liq qoplaydi va sahifa bo'sh ko'rinmaydi. */}

      {/* ── Qolgan jonli xonalar ── */}
      {otherActive.length > 0 && (
        <section className="flex flex-col gap-4">
          <SectionHeader label={t('liveNow')} count={otherActive.length} live />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {otherActive.map((room, i) => (
              <motion.div key={room._id} {...fadeIn(i)}>
                <RoomCard room={room} />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ── So'nggi xonalar ── */}
      {recentRooms && recentRooms.length > 0 && (
        <section className="flex flex-col gap-4">
          <SectionHeader label={t('recentRooms')} />
          <div className="scrollbar-hide -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
            {recentRooms.map((room) => (
              <div key={room._id} className="w-56 shrink-0">
                <RoomCard room={room} compact />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Barcha xonalar ── */}
      {hasRooms && idleRooms.length > 0 && (
        <section className="flex flex-col gap-4">
          <SectionHeader label={t('allRooms')} count={idleRooms.length} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {idleRooms.map((room, i) => (
              <motion.div key={room._id} {...fadeIn(i)}>
                <RoomCard room={room} />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      <CreateRoomDialog open={createOpen} onOpenChange={setCreateOpen} />
      <JoinRoomDialog open={joinOpen} onOpenChange={setJoinOpen} />
    </div>
  );
}
