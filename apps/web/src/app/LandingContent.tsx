'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  FaPlay, FaUsers, FaTrophy, FaFire, FaComment,
  FaChevronRight, FaCheck, FaLink, FaHeart, FaUserFriends,
} from 'react-icons/fa';
import { GiCrossedSwords } from 'react-icons/gi';
import { LandingNav } from '@/components/common/LandingNav';
import { Footer } from '@/components/common/Footer';

const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.25, 0.1, 0.25, 1] } },
};
const stagger: Variants = { visible: { transition: { staggerChildren: 0.09 } } };
const screenVariants: Variants = {
  enter:  { opacity: 0, y: 14 },
  center: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit:   { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

const PLAY_STORE = 'https://play.google.com/store';
const TYPING_URL = 'youtube.com/watch?v=dQw4w9Wgxcw';

const FEATURES = [
  { icon: FaUsers,        color: '#7B72F8', title: 'Watch Party',  desc: 'Istalgan saytdan video URLini joylashtiring — do\'stlaringiz bilan real-vaqt sinxronda ko\'ring. Chat, emoji, reaksiyalar.' },
  { icon: GiCrossedSwords,color: '#FFD700', title: 'Battle',       desc: '3, 5 yoki 7 kunlik video ko\'rish musobaqasi. Kim ko\'proq ko\'radi? G\'olib points va achievement oladi.' },
  { icon: FaTrophy,       color: '#88CCFF', title: 'Yutuqlar',     desc: '25+ noyob achievement. Maxfiy yutuqlarni kashf eting va profilingizni bezating.' },
  { icon: FaUserFriends,  color: '#a855f7', title: 'Do\'stlar',    desc: 'Do\'stlaringiz onlayn ekanini ko\'ring, video tavsiya qiling va birga Watch Party boshlang.' },
];

const DEMO_STEPS = [
  { step: '01', title: 'URL joylashtiring', sub: 'Istalgan saytdan video linki', icon: FaLink  },
  { step: '02', title: 'Do\'stlarni taklif', sub: 'Bir havola bilan bir zumda',  icon: FaUsers },
  { step: '03', title: 'Birga tomosha',      sub: 'Sinxron player + chat',        icon: FaPlay  },
];

const BATTLE_USERS = [
  { rank: 1, name: 'Sardor_90', videos: 48, initials: 'S', color: '#FFD700', bg: 'rgba(255,215,0,0.12)' },
  { rank: 2, name: 'Zulfiya_N', videos: 41, initials: 'Z', color: '#C0C0C0', bg: 'rgba(192,192,192,0.12)' },
  { rank: 3, name: 'Bobur_K',   videos: 37, initials: 'B', color: '#CD7F32', bg: 'rgba(205,127,50,0.12)' },
];

const CHAT_MSGS = [
  { u: 'A', msg: '🔥 Bu sahna juda zo\'r!',          color: '#7B72F8' },
  { u: 'N', msg: '😍 To\'xtating, replay qilaylik!', color: '#a855f7' },
  { u: 'B', msg: '🍿 Men ham shu sahnani!',           color: '#6B63E8' },
];

const HERO_BUBBLES = [
  { top: '25%', left: '8%',  label: 'Sardor',  color: '#7B72F8', delay: 0   },
  { top: '60%', left: '5%',  label: 'Nilufar', color: '#a855f7', delay: 0.5 },
  { top: '20%', right: '8%', label: 'Bobur',   color: '#22d3ee', delay: 1   },
  { top: '65%', right: '6%', label: 'Akbar',   color: '#f43f5e', delay: 1.5 },
] as const;

// ─── Phone screens ────────────────────────────────────────────────────────────

function ScreenHome() {
  return (
    <div className="h-full flex flex-col bg-[#0A0A0F] select-none">
      <div className="flex justify-between items-center px-5 pt-2.5">
        <span className="text-[8px] text-white/50 font-medium">9:41</span>
        <div className="w-4 h-1.5 rounded-sm bg-white/40 border border-white/10" />
      </div>
      <div className="flex items-center justify-between px-4 pt-1.5 pb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-[#7B72F8] flex items-center justify-center shadow-[0_0_8px_rgba(123,114,248,0.6)]">
            <FaPlay size={6} className="text-white ml-0.5" />
          </div>
          <span className="text-[11px] font-bold text-white tracking-wide">CineSync</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[8px] text-green-400">2 ta do&apos;st onlayn</span>
        </div>
      </div>

      <div className="mx-3 rounded-xl bg-[#111118] border border-[#7B72F8]/30 px-3 py-2.5 flex items-center gap-2">
        <FaLink size={9} className="text-[#7B72F8] flex-shrink-0" />
        <motion.span
          className="text-[9px] text-zinc-500 flex-1 truncate font-mono"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2.5 }}
        >
          Video URL ni bu yerga joylashtiring...
        </motion.span>
      </div>

      <div className="flex-1 px-3 pt-3 overflow-hidden">
        <p className="text-[7px] text-zinc-600 uppercase tracking-widest mb-2">Aktiv xonalar</p>
        <div className="space-y-2">
          {[
            { name: 'Sardor + 2', status: 'Ko\'ryapti...', color: '#7B72F8', initials: 'S' },
            { name: 'Nilufar + 1', status: 'Boshlashni kutmoqda', color: '#a855f7', initials: 'N' },
          ].map((room, i) => (
            <motion.div
              key={room.name}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-2.5 rounded-lg bg-[#111118] border border-zinc-800/60 px-3 py-2"
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                style={{ background: `${room.color}30`, border: `1px solid ${room.color}40` }}
              >{room.initials}</div>
              <div className="min-w-0">
                <p className="text-[10px] text-white font-medium truncate">{room.name}</p>
                <p className="text-[8px] text-zinc-500">{room.status}</p>
              </div>
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0 animate-pulse" />
            </motion.div>
          ))}
        </div>
      </div>

      <motion.div
        className="mx-3 mb-5 rounded-xl p-3 flex items-center gap-2.5"
        style={{ background: 'linear-gradient(135deg, #7B72F8, #5B4FD8)' }}
        animate={{ boxShadow: ['0 0 10px rgba(123,114,248,0.35)', '0 0 24px rgba(123,114,248,0.65)', '0 0 10px rgba(123,114,248,0.35)'] }}
        transition={{ repeat: Infinity, duration: 2.5 }}
      >
        <FaUsers size={11} className="text-white flex-shrink-0" />
        <span className="text-white text-[10px] font-semibold">Watch Party yaratish</span>
        <FaChevronRight size={8} className="text-white/60 ml-auto" />
      </motion.div>
    </div>
  );
}

function ScreenRoom() {
  return (
    <div className="h-full flex flex-col bg-[#0A0A0F] select-none">
      <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-zinc-800/50">
        <span className="text-zinc-600 text-xs">←</span>
        <span className="text-[11px] font-semibold text-white">Watch Party</span>
        <div className="ml-auto flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[8px] text-green-400">Tayyor</span>
        </div>
      </div>

      <div
        className="mx-3 mt-3 rounded-xl overflow-hidden border border-[#7B72F8]/20 flex flex-col justify-center gap-2 px-3 py-3"
        style={{ background: 'linear-gradient(135deg, #0d0520, #1a0a2e)' }}
      >
        <div className="flex items-center gap-2">
          <FaLink size={8} className="text-[#7B72F8] flex-shrink-0" />
          <span className="text-[8px] text-zinc-400 font-mono truncate flex-1">youtube.com/watch?v=dQw...</span>
          <div className="w-5 h-5 rounded-full bg-[#7B72F8]/20 flex items-center justify-center border border-[#7B72F8]/40 flex-shrink-0">
            <FaPlay size={5} className="text-[#7B72F8] ml-0.5" />
          </div>
        </div>
        <div className="h-0.5 bg-zinc-800 rounded-full" />
        <div className="h-1 bg-zinc-800/80 rounded-full overflow-hidden">
          <div className="h-full w-0 bg-[#7B72F8]/40 rounded-full" />
        </div>
      </div>

      <div className="px-3 mt-3">
        <p className="text-[7px] text-zinc-600 uppercase tracking-widest mb-2">Ishtirokchilar (3/4)</p>
        <div className="flex gap-2 items-center">
          {(['A', '#7B72F8'], ['N', '#a855f7'], ['B', '#6B63E8']).map(([l, c], i) => (
            <motion.div
              key={String(l)}
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: i * 0.12 + 0.15, type: 'spring', stiffness: 260, damping: 20 }}
              className="flex flex-col items-center gap-1"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-bold text-white border-2"
                style={{ background: `${String(c)}25`, borderColor: String(c) }}
              >{String(l)}</div>
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
            </motion.div>
          ))}
          <div className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-full border border-dashed border-zinc-700 flex items-center justify-center text-zinc-600 text-xs">+</div>
          </div>
        </div>
      </div>

      <div className="mx-3 mt-3 rounded-lg bg-[#111118] border border-zinc-800 px-3 py-2 flex items-center gap-2">
        <span className="text-[8px] text-zinc-500 flex-1 truncate">cinesync.app/join/xK9pQr</span>
        <span className="text-[8px] text-[#7B72F8] font-semibold flex-shrink-0">Nusxa</span>
      </div>

      <motion.div
        className="mx-3 mt-auto mb-5 rounded-xl py-3 flex items-center justify-center gap-2"
        style={{ background: 'linear-gradient(135deg, #7B72F8, #5B4FD8)' }}
        animate={{ scale: [1, 1.018, 1] }}
        transition={{ repeat: Infinity, duration: 1.8 }}
      >
        <FaPlay size={9} className="text-white" />
        <span className="text-white text-[11px] font-bold">Boshlash</span>
      </motion.div>
    </div>
  );
}

function ScreenWatching({ visibleChats }: { visibleChats: number[] }) {
  return (
    <div className="h-full flex flex-col bg-[#0A0A0F] select-none">
      <div
        className="relative flex-shrink-0"
        style={{ height: '44%', background: 'radial-gradient(ellipse at 40% 35%, #2d1060, #0d0520 55%, #060010)' }}
      >
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
          <div className="flex items-center gap-1 bg-black/40 rounded-full px-2 py-0.5">
            <div className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[7px] text-white/70">Sinxron</span>
          </div>
          <div className="flex -space-x-1">
            {['A', 'N', 'B'].map((l, i) => (
              <div key={l}
                className="w-5 h-5 rounded-full border border-[#0A0A0F] flex items-center justify-center text-[7px] font-bold text-white"
                style={{ background: ['#7B72F8', '#a855f7', '#6B63E8'][i] }}
              >{l}</div>
            ))}
          </div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
            <FaPlay size={10} className="text-white ml-0.5" />
          </div>
        </div>
        <div className="absolute bottom-2 left-3 right-3">
          <div className="h-0.5 bg-white/15 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#7B72F8] rounded-full"
              initial={{ width: '28%' }}
              animate={{ width: '60%' }}
              transition={{ duration: 10, ease: 'linear' }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[7px] text-white/40">12:35</span>
            <span className="text-[7px] text-white/40">48:00</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-3 pt-2 pb-1.5 border-b border-zinc-800/50 flex items-center gap-1.5">
          <FaComment size={8} className="text-zinc-600" />
          <span className="text-[8px] text-zinc-500">Real-vaqt chat</span>
          <span className="ml-auto text-[7px] text-zinc-700">3 kishi onlayn</span>
        </div>
        <div className="flex-1 px-3 py-2 space-y-2 overflow-hidden">
          {CHAT_MSGS.map((msg, i) => (
            <AnimatePresence key={i}>
              {visibleChats.includes(i) && (
                <motion.div
                  initial={{ opacity: 0, x: -10, y: 4 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  transition={{ duration: 0.28, ease: 'easeOut' }}
                  className="flex items-start gap-1.5"
                >
                  <div
                    className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[7px] font-bold text-white"
                    style={{ background: msg.color }}
                  >{msg.u}</div>
                  <div className="rounded-lg px-2 py-1 bg-[#111118] border border-zinc-800/60 max-w-[80%]">
                    <span className="text-[9px] text-zinc-300">{msg.msg}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          ))}
        </div>
        <div className="mx-3 mb-4 rounded-lg bg-[#111118] border border-zinc-800 px-3 py-2">
          <span className="text-[8px] text-zinc-600">Xabar yozing...</span>
        </div>
      </div>
    </div>
  );
}

function PhoneMockup({ activeScreen, visibleChats }: { activeScreen: number; visibleChats: number[] }) {
  return (
    <motion.div
      className="relative mx-auto"
      style={{ width: 240 }}
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] as [number,number,number,number] }}
    >
      <div className="absolute -inset-12 bg-[#7B72F8]/15 rounded-full blur-3xl -z-10 pointer-events-none" />
      <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}>
        <div
          className="relative overflow-hidden"
          style={{
            borderRadius: 38,
            border: '2px solid rgba(255,255,255,0.10)',
            background: '#0A0A0F',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.03) inset, 0 50px 100px rgba(0,0,0,0.9), 0 0 60px rgba(123,114,248,0.12)',
            height: 504,
          }}
        >
          <div className="absolute top-3.5 left-1/2 -translate-x-1/2 z-20" style={{ width: 76, height: 10, borderRadius: 6, background: '#000' }} />
          <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: 36 }}>
            <AnimatePresence mode="wait">
              {activeScreen === 0 && (
                <motion.div key="home" className="absolute inset-0" variants={screenVariants} initial="enter" animate="center" exit="exit">
                  <ScreenHome />
                </motion.div>
              )}
              {activeScreen === 1 && (
                <motion.div key="room" className="absolute inset-0" variants={screenVariants} initial="enter" animate="center" exit="exit">
                  <ScreenRoom />
                </motion.div>
              )}
              {activeScreen === 2 && (
                <motion.div key="watching" className="absolute inset-0" variants={screenVariants} initial="enter" animate="center" exit="exit">
                  <ScreenWatching visibleChats={visibleChats} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.035) 0%, transparent 55%)', borderRadius: 36 }}
          />
        </div>
        <div className="absolute right-0 top-36 w-0.5 h-14 rounded-l-sm" style={{ background: 'rgba(255,255,255,0.07)', transform: 'translateX(1px)' }} />
      </motion.div>
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function LandingContent() {
  const [activeScreen, setActiveScreen] = useState(0);
  const [visibleChats, setVisibleChats] = useState<number[]>([]);
  const [urlText, setUrlText] = useState('');

  // URL typing animation
  useEffect(() => {
    let i = 0;
    let forward = true;
    const id = setInterval(() => {
      if (forward) {
        i++;
        setUrlText(TYPING_URL.slice(0, i));
        if (i >= TYPING_URL.length) forward = false;
      } else {
        i--;
        setUrlText(TYPING_URL.slice(0, i));
        if (i <= 0) forward = true;
      }
    }, 80);
    return () => clearInterval(id);
  }, []);

  // Auto-cycle screens
  useEffect(() => {
    const DURATIONS = [3500, 3500, 5000];
    const t = setTimeout(() => {
      setActiveScreen(s => (s + 1) % 3);
      setVisibleChats([]);
    }, DURATIONS[activeScreen]);
    return () => clearTimeout(t);
  }, [activeScreen]);

  // Progressive chat messages
  useEffect(() => {
    if (activeScreen !== 2) return;
    const timers = CHAT_MSGS.map((_, i) =>
      setTimeout(() => setVisibleChats(p => [...p, i]), i * 900 + 700)
    );
    return () => timers.forEach(clearTimeout);
  }, [activeScreen]);

  const switchScreen = (i: number) => { setActiveScreen(i); setVisibleChats([]); };

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0F]">
      <LandingNav />
      <main className="flex-1">

        {/* ── HERO ── */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0A0A0F]">
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] bg-[#7B72F8]/12 rounded-full blur-[160px]" />
            <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-[#a855f7]/6 rounded-full blur-[120px]" />
            <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-[#6B63E8]/8 rounded-full blur-[100px]" />
            <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                  <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
            {HERO_BUBBLES.map((b, i) => (
              <motion.div
                key={i}
                className="absolute hidden md:flex items-center gap-1.5 rounded-full px-3 py-1.5 backdrop-blur-sm"
                style={{
                  top: b.top,
                  ...(('left' in b) ? { left: b.left } : { right: b.right }),
                  background: `${b.color}18`,
                  border: `1px solid ${b.color}35`,
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: [0, 1, 1, 0], scale: [0.8, 1, 1, 0.9], y: [0, -6, -6, 0] }}
                transition={{ delay: b.delay, duration: 4, repeat: Infinity, repeatDelay: 2 }}
              >
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: b.color }} />
                <span className="text-xs text-white/70 font-medium">{b.label}</span>
              </motion.div>
            ))}
            <motion.div
              className="absolute hidden md:flex items-center gap-2 rounded-xl px-4 py-2.5 backdrop-blur-sm"
              style={{ top: '42%', right: '7%', background: 'rgba(123,114,248,0.12)', border: '1px solid rgba(123,114,248,0.3)' }}
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }}
            >
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-white/60">Sinxron</span>
            </motion.div>
            <motion.div
              className="absolute hidden md:flex rounded-xl px-3 py-2 backdrop-blur-sm max-w-[160px]"
              style={{ bottom: '32%', left: '6%', background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.3)' }}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.2 }}
            >
              <span className="text-xs text-white/60">🔥 Bu sahna juda zo&apos;r!</span>
            </motion.div>
          </div>

          <div className="relative z-10 text-center px-4 max-w-4xl mx-auto pt-28 pb-20">
            <motion.div
              initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full border border-[#7B72F8]/40 bg-[#7B72F8]/10 backdrop-blur-sm text-sm text-white/80 shadow-[0_0_28px_rgba(123,114,248,0.25)]"
            >
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              📱 Android — hozir bepul yuklab oling
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.1 }}
              className="text-5xl sm:text-7xl md:text-8xl font-display uppercase leading-none tracking-tight mb-6 text-white"
              style={{ textShadow: '0 0 100px rgba(123,114,248,0.3)' }}
            >
              YAQINLIK —<br />
              <span className="text-[#7B72F8]" style={{ textShadow: '0 0 60px rgba(123,114,248,0.8)' }}>
                SINXRONDA
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }}
              className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              Istalgan saytdan video URLini joylashtiring — do&apos;stlaringiz bilan
              real-vaqt sinxronda ko&apos;ring. Masofa muhim emas, his-tuyg&apos;ular — bitta.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.45 }}
              className="flex gap-4 justify-center flex-wrap"
            >
              <a
                href={PLAY_STORE} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-3 h-14 px-7 rounded-xl bg-[#7B72F8] text-white font-semibold hover:bg-[#6B63E8] hover:shadow-[0_0_60px_rgba(123,114,248,0.8)] transition-all duration-300 active:scale-95 shadow-[0_0_28px_rgba(123,114,248,0.5)]"
              >
                <svg viewBox="0 0 22 24" width="20" height="22" fill="currentColor" aria-hidden="true">
                  <path d="M1.22 0c-.55.3-.93.87-.93 1.55v20.9c0 .68.38 1.25.93 1.55l.1.06L12.36 12 1.32-.06 1.22 0zM15.75 8.67L4.17 1.38l9.7 9.7-1.12.96 2.99 1.72V8.67zM15.75 15.33v-3.1l-2.99 1.73 1.12.95-9.7 9.71 11.57-7.3.01-.99zM4.17 22.62l11.57-7.29v1.1L4.17 22.62z" />
                </svg>
                <div className="text-left leading-tight">
                  <div className="text-[10px] opacity-75">Get it on</div>
                  <div className="text-[15px] font-bold">Google Play</div>
                </div>
              </a>
              <a
                href="#demo"
                className="inline-flex items-center gap-2 h-14 px-7 rounded-xl border border-zinc-700 text-zinc-400 hover:border-[#7B72F8]/60 hover:text-zinc-200 transition-all duration-300 active:scale-95 text-sm"
              >
                Qanday ishlaydi?
                <FaChevronRight size={11} />
              </a>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 7, 0] }} transition={{ repeat: Infinity, duration: 2.2 }}
              className="w-5 h-8 rounded-full border border-zinc-700 flex items-start justify-center pt-1.5"
            >
              <div className="w-1 h-2 rounded-full bg-zinc-600" />
            </motion.div>
          </motion.div>
          <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#0A0A0F] to-transparent pointer-events-none" />
        </section>

        {/* ── URL → BIRGA KO'RING ── */}
        <section className="py-24 px-4 bg-[#0D0D16] relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#7B72F8]/6 rounded-full blur-[100px]" />
          </div>
          <div className="max-w-5xl mx-auto relative z-10">
            <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
              <motion.p variants={fadeUp} className="text-[#7B72F8] text-xs uppercase tracking-widest font-semibold mb-3">Qanday ishlaydi</motion.p>
              <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-display uppercase text-white mb-4">
                URL → BIRGA KO&apos;RING
              </motion.h2>
              <motion.p variants={fadeUp} className="text-zinc-500 text-lg max-w-lg mx-auto">
                Biron saytdan video topsangiz — URLni nusxa oling va Watch Party yarating.
                Hammasini biz hal qilamiz.
              </motion.p>
            </motion.div>

            {/* URL → sync visual */}
            <motion.div
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.6 }}
              className="flex flex-col md:flex-row items-center gap-6 justify-center mb-16"
            >
              <div className="flex-1 max-w-sm w-full">
                <div className="rounded-xl bg-[#111118] border border-[#7B72F8]/40 px-4 py-3.5 flex items-center gap-3 shadow-[0_0_30px_rgba(123,114,248,0.12)]">
                  <FaLink size={14} className="text-[#7B72F8] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-zinc-600 mb-1 uppercase tracking-wider">Video URL</div>
                    <span className="text-sm text-zinc-300 font-mono">
                      {urlText}<span className="animate-pulse text-[#7B72F8]">|</span>
                    </span>
                  </div>
                </div>
                <p className="text-xs text-zinc-600 text-center mt-2">YouTube va boshqa saytlar</p>
              </div>

              <motion.div animate={{ x: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.4 }} className="text-[#7B72F8]">
                <FaChevronRight size={20} />
              </motion.div>

              <div className="flex-1 max-w-sm w-full">
                <div className="rounded-xl bg-[#111118] border border-green-500/30 px-4 py-3.5 shadow-[0_0_30px_rgba(34,197,94,0.08)]">
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-xs text-green-400 font-medium">Sinxron o&apos;ynatilmoqda</span>
                    <span className="ml-auto text-[10px] text-zinc-600">3 kishi</span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-2">
                    <motion.div
                      className="h-full bg-[#7B72F8] rounded-full"
                      animate={{ width: ['25%', '65%'] }}
                      transition={{ repeat: Infinity, duration: 4, ease: 'linear', repeatType: 'reverse' }}
                    />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] text-zinc-600">12:35</span>
                    <span className="text-[10px] text-zinc-600">48:00</span>
                  </div>
                </div>
                <p className="text-xs text-zinc-600 text-center mt-2">Barcha do&apos;stlar bir xil kadrda</p>
              </div>
            </motion.div>

            {/* 3 steps */}
            <motion.div
              variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-3 gap-5"
            >
              {[
                { n: '01', icon: FaLink,   color: '#7B72F8', title: 'URL oling',             desc: 'YouTube yoki boshqa saytdan video toping va URLni nusxa oling.' },
                { n: '02', icon: FaUsers,  color: '#a855f7', title: 'Do\'stlarni taklif qiling', desc: 'Watch Party yarating va havolani do\'stlaringizga yuboring.' },
                { n: '03', icon: FaHeart,  color: '#f43f5e', title: 'Birga his qiling',       desc: 'Real-vaqt sinxron, chat va reaksiyalar bilan birgalikda his qiling.' },
              ].map(({ n, icon: Icon, color, title, desc }) => (
                <motion.div
                  key={n} variants={fadeUp}
                  className="rounded-xl bg-[#0A0A0F] border border-zinc-800/70 p-6 text-center hover:border-zinc-700 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                    <Icon size={20} style={{ color }} />
                  </div>
                  <div className="text-[10px] font-bold mb-2" style={{ color }}>{n}</div>
                  <h3 className="text-white font-semibold mb-2">{title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">{desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── SINXRON + HIS-TUYG'ULAR ── */}
        <section className="py-24 px-4 bg-[#0A0A0F] relative overflow-hidden">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -32 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="bg-[#111118] rounded-2xl border border-zinc-800 p-6 shadow-[0_4px_50px_rgba(123,114,248,0.06)]">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-white font-semibold text-sm">Real-vaqt sinxronizatsiya</span>
                  <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/25 rounded-full px-2.5 py-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[10px] text-green-400 font-medium">Aktiv</span>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    { name: 'Siz',    initials: 'S', color: '#7B72F8', pos: 58 },
                    { name: 'Nilufar', initials: 'N', color: '#a855f7', pos: 58 },
                    { name: 'Bobur',   initials: 'B', color: '#6B63E8', pos: 57 },
                  ].map(({ name, initials, color, pos }, i) => (
                    <div key={name}>
                      <div className="flex items-center gap-3 mb-1.5">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0" style={{ background: `${color}25`, border: `1px solid ${color}50` }}>{initials}</div>
                        <span className="text-sm text-zinc-400">{name}</span>
                        <span className="ml-auto text-xs text-zinc-600">{pos}%</span>
                      </div>
                      <div className="h-1.5 bg-zinc-800/80 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          initial={{ width: 0 }}
                          whileInView={{ width: `${pos + i * 0.3}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.2, delay: i * 0.15, ease: 'easeOut' }}
                          style={{ backgroundColor: color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-xs text-zinc-500">Barcha ishtirokchilar bir xil kadrda — ±0 ms</span>
                </div>
              </div>
              <div className="absolute -inset-6 bg-[#7B72F8]/5 rounded-3xl blur-3xl -z-10" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 32 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.15 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7B72F8]/10 border border-[#7B72F8]/30 text-[#7B72F8] text-xs font-semibold uppercase tracking-widest mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-[#7B72F8]" /> Sinxronizatsiya
              </div>
              <h2 className="text-4xl md:text-5xl font-display uppercase text-white leading-tight mb-6">
                BIR XILDA<br />
                <span className="text-[#7B72F8]">HIS QILING</span>
              </h2>
              <p className="text-zinc-400 text-lg mb-8 leading-relaxed">
                CineSync barcha ishtirokchilarni millisekund darajasida sinxronlaydi.
                Siz kuladigan sahnada do&apos;stingiz ham kuladi.
                Siz yig&apos;laydigan sahnada — u ham.
              </p>
              <div className="space-y-3">
                {[
                  'Millisekund aniqligida sinxron',
                  'Avtomatik lag kompensatsiyasi',
                  'Tomosha paytida real-vaqt chat',
                  'Emoji va his-tuyg\'u reaksiyalari',
                  'Masofa muhim emas',
                ].map(item => (
                  <div key={item} className="flex items-center gap-3 text-sm text-zinc-300">
                    <FaCheck size={11} className="text-[#7B72F8] flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── APP DEMO ── */}
        <section id="demo" className="py-28 px-4 bg-[#0D0D16] relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#7B72F8]/5 rounded-full blur-[120px]" />
          </div>
          <div className="max-w-6xl mx-auto relative z-10">
            <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
              <motion.p variants={fadeUp} className="text-[#7B72F8] text-xs uppercase tracking-widest font-semibold mb-3">Ilova</motion.p>
              <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-display uppercase text-white mb-4">3 QADAM</motion.h2>
              <motion.p variants={fadeUp} className="text-zinc-500 text-lg max-w-lg mx-auto">
                URL joylashtiring → do&apos;stlarni taklif qiling → birga tomosha qiling
              </motion.p>
            </motion.div>

            <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
              <div className="flex lg:flex-col gap-3 order-2 lg:order-1 lg:w-60 w-full overflow-x-auto pb-2 lg:pb-0">
                {DEMO_STEPS.map(({ step, title, sub, icon: Icon }, i) => (
                  <button
                    key={i} onClick={() => switchScreen(i)}
                    className={`flex items-start gap-3 p-4 rounded-xl text-left transition-all duration-300 flex-shrink-0 lg:flex-shrink lg:w-full ${
                      activeScreen === i
                        ? 'bg-[#7B72F8]/12 border border-[#7B72F8]/40 shadow-[0_0_28px_rgba(123,114,248,0.15)]'
                        : 'bg-[#111118]/70 border border-zinc-800/60 hover:border-zinc-700'
                    }`}
                  >
                    <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${activeScreen === i ? 'bg-[#7B72F8] shadow-[0_0_14px_rgba(123,114,248,0.5)]' : 'bg-zinc-800'}`}>
                      <Icon size={12} className={activeScreen === i ? 'text-white' : 'text-zinc-500'} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[10px] font-bold transition-colors ${activeScreen === i ? 'text-[#7B72F8]' : 'text-zinc-600'}`}>{step}</span>
                        <span className={`text-xs font-semibold transition-colors truncate ${activeScreen === i ? 'text-white' : 'text-zinc-400'}`}>{title}</span>
                      </div>
                      <p className="text-[10px] text-zinc-600 leading-relaxed">{sub}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="order-1 lg:order-2 flex-1 flex flex-col items-center gap-8">
                <PhoneMockup activeScreen={activeScreen} visibleChats={visibleChats} />
                <div className="flex gap-2.5">
                  {[0, 1, 2].map(i => (
                    <button key={i} onClick={() => switchScreen(i)}
                      className={`rounded-full transition-all duration-300 ${activeScreen === i ? 'w-7 h-2 bg-[#7B72F8] shadow-[0_0_8px_rgba(123,114,248,0.7)]' : 'w-2 h-2 bg-zinc-700 hover:bg-zinc-500'}`}
                    />
                  ))}
                </div>
              </div>

              <div className="hidden lg:flex lg:flex-col gap-3 lg:w-60 order-3">
                <div className="rounded-xl border border-zinc-800/50 p-4 bg-[#111118]/60">
                  <p className="text-[9px] text-zinc-600 uppercase tracking-widest mb-3">Watch Party imkoniyatlari</p>
                  {['Real-vaqt sinxron oynatish', 'Chat, emoji va reaksiyalar', 'Xona egasi boshqaruvi', 'Taklif havolasi', 'YouTube va boshqa saytlar'].map(f => (
                    <div key={f} className="flex items-center gap-2 py-1">
                      <FaCheck size={8} className="text-[#7B72F8] flex-shrink-0" />
                      <span className="text-[11px] text-zinc-400">{f}</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-[#FFD700]/20 p-4 bg-[#FFD700]/5">
                  <div className="flex items-center gap-2 mb-2">
                    <GiCrossedSwords size={12} className="text-[#FFD700]" />
                    <span className="text-[10px] text-[#FFD700] font-bold uppercase tracking-wide">Battle Mode</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">Kim ko&apos;proq video ko&apos;radi? Raqibingizga challenge yuboring!</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section className="py-20 px-4 bg-[#111118]">
          <div className="max-w-6xl mx-auto">
            <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
              <motion.h2 variants={fadeUp} className="text-4xl font-display uppercase mb-3 text-white">NIMA BERAMIZ?</motion.h2>
              <motion.p variants={fadeUp} className="text-zinc-500">Video ko&apos;rishni ijtimoiy tajribaga aylantiramiz</motion.p>
            </motion.div>
            <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {FEATURES.map(({ icon: Icon, color, title, desc }) => (
                <motion.div key={title} variants={fadeUp} className="group bg-[#0A0A0F] rounded-xl border border-zinc-800/80 hover:border-[#7B72F8]/40 hover:shadow-[0_0_40px_rgba(123,114,248,0.12)] transition-all duration-300 p-6">
                  <div className="p-3 rounded-lg w-fit mb-4 group-hover:scale-110 transition-transform duration-300" style={{ background: `${color}18` }}>
                    <Icon size={22} style={{ color }} />
                  </div>
                  <h3 className="font-display text-base uppercase text-white mb-2">{title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">{desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── BATTLE ── */}
        <section className="py-24 px-4 bg-[#0A0A0F]">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -32 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="bg-[#111118] rounded-2xl border border-zinc-800 p-6 shadow-[0_4px_50px_rgba(255,215,0,0.07)]">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[#FFD700] font-display uppercase text-sm flex items-center gap-2"><GiCrossedSwords size={16} /> Battle Aktiv</span>
                  <span className="px-2.5 py-1 rounded-full bg-[#7B72F8]/10 border border-[#7B72F8]/25 text-[#7B72F8] text-xs font-semibold">5 kun qoldi</span>
                </div>
                <div className="space-y-1">
                  {BATTLE_USERS.map(({ rank, name, videos, initials, color, bg }) => (
                    <div key={rank} className="flex items-center gap-3 py-3 border-b border-zinc-800/60 last:border-0">
                      <span className="font-display text-xl w-8 flex-shrink-0" style={{ color }}>{rank}</span>
                      <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm border" style={{ backgroundColor: bg, color, borderColor: `${color}35` }}>{initials}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium">{name}</p>
                        <p className="text-zinc-500 text-xs">{videos} video ko&apos;rildi</p>
                      </div>
                      <div className="h-1.5 w-24 bg-zinc-800 rounded-full overflow-hidden flex-shrink-0">
                        <motion.div
                          className="h-full rounded-full"
                          initial={{ width: 0 }}
                          whileInView={{ width: `${(videos / 48) * 100}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: rank * 0.15, ease: 'easeOut' }}
                          style={{ backgroundColor: color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 pt-4 border-t border-zinc-800 flex items-center justify-between">
                  <span className="text-zinc-600 text-xs">Sizning o&apos;rningiz</span>
                  <span className="text-zinc-400 text-sm font-medium">#? — Challenge qiling!</span>
                </div>
              </div>
              <div className="absolute -inset-6 bg-[#FFD700]/5 rounded-3xl blur-3xl -z-10" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 32 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.15 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] text-xs font-semibold uppercase tracking-widest mb-6">
                <FaFire size={10} /> Battle Mode
              </div>
              <h2 className="text-4xl md:text-5xl font-display uppercase text-white leading-tight mb-6">
                KIM KO&apos;PROQ<br />
                <span className="text-[#FFD700]">VIDEO KO&apos;RADI?</span>
              </h2>
              <p className="text-zinc-400 text-lg mb-8 leading-relaxed">
                Raqibingizga 3, 5 yoki 7 kunlik challenge yuboring.
                Leaderboard orqali real-vaqtda natijani ko&apos;ring.
                G&apos;olib points va achievement oladi.
              </p>
              <div className="space-y-3">
                {['3 / 5 / 7 kunlik musobaqa', 'Real-vaqt leaderboard', "G'olibga points va achievement", "Do'stlar va notanishlar bilan"].map(item => (
                  <div key={item} className="flex items-center gap-3 text-sm text-zinc-300">
                    <FaCheck size={11} className="text-[#FFD700] flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-28 px-4 text-center bg-[#0A0A0F] relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[450px] bg-[#7B72F8]/18 rounded-full blur-[140px]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[280px] bg-[#6B63E8]/25 rounded-full blur-[90px]" />
          </div>
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="relative z-10 max-w-2xl mx-auto">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#7B72F8]/15 border border-[#7B72F8]/40 text-[#7B72F8] text-xs font-semibold uppercase tracking-widest mb-8 shadow-[0_0_20px_rgba(123,114,248,0.3)]">
              <FaPlay size={8} /> CineSync
            </motion.div>
            <motion.h2
              variants={fadeUp}
              className="text-4xl md:text-6xl font-display uppercase text-white leading-tight mb-6"
              style={{ textShadow: '0 0 80px rgba(123,114,248,0.5)' }}
            >
              HOZIROQ<br />BOSHLANG
            </motion.h2>
            <motion.p variants={fadeUp} className="text-zinc-400 text-lg mb-10 max-w-md mx-auto leading-relaxed">
              Do&apos;stlaringizni taklif qiling va birinchi Watch Party-ni boshlang. Bepul yuklab oling.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href={PLAY_STORE} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-3 h-14 px-10 rounded-xl bg-[#7B72F8] text-white font-bold hover:bg-[#6B63E8] hover:shadow-[0_0_80px_rgba(123,114,248,0.9)] transition-all duration-300 active:scale-95 text-base shadow-[0_0_40px_rgba(123,114,248,0.6)]"
              >
                <svg viewBox="0 0 22 24" width="20" height="22" fill="currentColor" aria-hidden="true">
                  <path d="M1.22 0c-.55.3-.93.87-.93 1.55v20.9c0 .68.38 1.25.93 1.55l.1.06L12.36 12 1.32-.06 1.22 0zM15.75 8.67L4.17 1.38l9.7 9.7-1.12.96 2.99 1.72V8.67zM15.75 15.33v-3.1l-2.99 1.73 1.12.95-9.7 9.71 11.57-7.3.01-.99zM4.17 22.62l11.57-7.29v1.1L4.17 22.62z" />
                </svg>
                Google Play — Bepul
              </a>
              <span className="text-zinc-600 text-sm">iOS versiyasi tez kunda</span>
            </motion.div>
          </motion.div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
