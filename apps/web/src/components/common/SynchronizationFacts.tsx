import { PRODUCT_FACTS } from '@/data/product-facts';
import type { GuideLocale } from '@/data/guides';

const COPY = {
  ru: {
    title: 'Как работает синхронизация WeWatch',
    intro: 'WeWatch не обещает нулевую задержку. Система компенсирует разную скорость сети с помощью общей серверной шкалы времени и автоматически исправляет заметное расхождение.',
    scheduledTitle: 'Общая метка времени',
    scheduled: 'Команды play, pause и seek планируются на одну будущую серверную метку, а не выполняются в момент получения каждым устройством.',
    clockTitle: 'Сверка часов',
    clock: 'Клиент измеряет смещение своих часов относительно сервера через ping/echo по WebSocket по принципу NTP.',
    correctionTitle: 'Автокоррекция',
    correction: (ms: number) => `Периодический heartbeat сравнивает позицию клиента с позицией комнаты и исправляет расхождение свыше ${ms} мс.`,
    caveat: (ms: number) => `${ms} мс — порог коррекции, а не гарантия сетевой задержки или постоянного рассинхрона менее ${ms} мс. Буферизация, реклама и ограничения источника остаются возможны.`,
    participants: 'До участников в комнате',
    inactivity: 'Минут без активности до закрытия комнаты',
  },
  uz: {
    title: 'WeWatch sinxronizatsiyasi qanday ishlaydi',
    intro: "WeWatch nol kechikishni va'da qilmaydi. Tizim umumiy server vaqti orqali turli tarmoq tezligini qoplaydi va sezilarli siljishni avtomatik tuzatadi.",
    scheduledTitle: 'Umumiy vaqt belgisi',
    scheduled: "Play, pause va seek buyruqlari har bir qurilmaga kelishi bilan emas, bitta kelajak server vaqt belgisida bajarilishi uchun rejalashtiriladi.",
    clockTitle: 'Soatlarni solishtirish',
    clock: "Klient o'z soatining serverdan farqini WebSocket ping/echo orqali NTP uslubida o'lchaydi.",
    correctionTitle: 'Avtomatik tuzatish',
    correction: (ms: number) => `Davriy heartbeat klient pozitsiyasini xona pozitsiyasi bilan solishtiradi va ${ms} ms dan katta farqni tuzatadi.`,
    caveat: (ms: number) => `${ms} ms — tuzatish chegarasi; bu tarmoq kechikishi yoki siljish doim ${ms} ms dan kam bo'lishi kafolati emas. Buferlanish, reklama va manba cheklovlari yuz berishi mumkin.`,
    participants: 'Xonadagi maksimal ishtirokchi',
    inactivity: "Faollik bo'lmasa xona yopiladigan daqiqa",
  },
  en: {
    title: 'How WeWatch synchronization works',
    intro: 'WeWatch does not promise zero latency. It compensates for different network speeds with a shared server timeline and automatically corrects material playback drift.',
    scheduledTitle: 'Shared timestamp',
    scheduled: 'Play, pause and seek commands are scheduled for one future server timestamp instead of executing as soon as each device receives them.',
    clockTitle: 'Clock alignment',
    clock: 'Each client measures its clock offset from the server NTP-style through a WebSocket ping/echo exchange.',
    correctionTitle: 'Automatic correction',
    correction: (ms: number) => `A periodic heartbeat compares the client position with the room position and corrects drift beyond ${ms} ms.`,
    caveat: (ms: number) => `${ms} ms is the correction threshold, not a guarantee of network latency or permanent drift below ${ms} ms. Buffering, ads and source restrictions can still occur.`,
    participants: 'Maximum room participants',
    inactivity: 'Inactive minutes before room closure',
  },
} as const;

export function SynchronizationFacts({ locale }: { locale: GuideLocale }) {
  const copy = COPY[locale];
  const threshold = PRODUCT_FACTS.sync.correctionThresholdMs;

  return (
    <section
      id="synchronization-facts"
      data-synchronization-facts
      data-correction-threshold-ms={threshold}
      data-max-participants={PRODUCT_FACTS.room.maxParticipants}
      data-inactive-timeout-minutes={PRODUCT_FACTS.room.inactiveTimeoutMinutes}
      className="mb-14 rounded-2xl border border-zinc-800/60 bg-[#0E0E14] p-6 sm:p-8"
    >
      <h2 className="text-2xl font-bold mb-4">{copy.title}</h2>
      <p className="text-zinc-400 leading-relaxed mb-6">{copy.intro}</p>
      <dl className="grid gap-4 sm:grid-cols-3 mb-6">
        {[
          [copy.scheduledTitle, copy.scheduled],
          [copy.clockTitle, copy.clock],
          [copy.correctionTitle, copy.correction(threshold)],
        ].map(([term, detail]) => (
          <div key={term} className="rounded-xl border border-zinc-800 bg-black/15 p-4">
            <dt className="font-semibold text-white mb-2">{term}</dt>
            <dd className="text-sm text-zinc-400 leading-relaxed">{detail}</dd>
          </div>
        ))}
      </dl>
      <p data-sync-caveat className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-4 text-sm text-amber-200/80 leading-relaxed mb-6">
        {copy.caveat(threshold)}
      </p>
      <dl className="grid gap-3 sm:grid-cols-2 text-sm">
        <div className="flex items-center justify-between gap-4 rounded-lg bg-white/[0.03] px-4 py-3">
          <dt className="text-zinc-400">{copy.participants}</dt>
          <dd className="font-semibold text-white">{PRODUCT_FACTS.room.maxParticipants}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 rounded-lg bg-white/[0.03] px-4 py-3">
          <dt className="text-zinc-400">{copy.inactivity}</dt>
          <dd className="font-semibold text-white">{PRODUCT_FACTS.room.inactiveTimeoutMinutes}</dd>
        </div>
      </dl>
    </section>
  );
}
