'use client';

import { CheckCircle2, Clock, Loader2, Lock, Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { DesktopAlternativeHit, DesktopAlternatives } from '@/hooks/use-desktop-screen-share';

// Desktop app, owner: the film page in the VB said "not available in your region". The app looks for the same film
// elsewhere (desktop-mac src/main/film-search.ts — film sites first, only the whole film / episode, the best three
// opened once to tell whether they play here) and the owner picks one; picking switches the room like "Videoni
// almashtirish". The block itself is never worked around.

const SOURCE_NAMES: Record<string, string> = {
  cinerama: 'Cinerama', uzmovi: 'Uzmovi', asilmedia: 'AsilMedia', youtube: 'YouTube', rutube: 'Rutube', vk: 'VK Video',
  dailymotion: 'Dailymotion', peertube: 'PeerTube', archive: 'Internet Archive',
};

function fmtLength(sec: number | null): string | null {
  if (sec === null || !Number.isFinite(sec) || sec <= 0) return null;
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}` : `${m} min`;
}

function HitRow({ hit, onPick }: { hit: DesktopAlternativeHit; onPick: (url: string) => void }) {
  const t = useTranslations('party');
  const length = fmtLength(hit.durationSec);
  return (
    <li className="flex items-center gap-3 rounded-[var(--ww-r-sm)] border border-[var(--ww-line)] bg-[var(--ww-surface-1)] p-2">
      <div className="h-12 w-20 shrink-0 overflow-hidden rounded bg-black/40">
        {hit.thumbnail && (
          // eslint-disable-next-line @next/next/no-img-element -- third-party posters from many hosts
          <img src={hit.thumbnail} alt="" className="h-full w-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-[var(--ww-text)]" title={hit.title}>{hit.title}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px] text-[var(--ww-text-3)]">
          <span>{SOURCE_NAMES[hit.source] ?? hit.source}</span>
          {hit.year !== null && <span>{hit.year}</span>}
          {length && <span className="flex items-center gap-1"><Clock size={11} aria-hidden="true" />{length}</span>}
          {!hit.lengthKnown && <span>{t('geoAltLengthUnknown')}</span>}
          {hit.available === 'yes' && (
            <span className="flex items-center gap-1 text-[var(--ww-success)]"><CheckCircle2 size={11} aria-hidden="true" />{t('geoAltPlaysHere')}</span>
          )}
          {hit.paid && <span className="flex items-center gap-1"><Lock size={11} aria-hidden="true" />{t('geoAltPaid')}</span>}
          {hit.confidence === 'maybe' && <span>{t('geoAltMaybe')}</span>}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onPick(hit.url)}
        data-testid="geo-alt-pick"
        className="ww-btn-accent h-8 shrink-0 cursor-pointer rounded-[var(--ww-r-sm)] px-3 text-[12px] font-medium"
      >
        {t('geoAltPick')}
      </button>
    </li>
  );
}

export function DesktopGeoAlternatives({
  title, alternatives, onPick, onChangeVideo, onDismiss,
}: {
  /** The blocked page's title (until the search reports the cleaned film name). */
  title: string;
  alternatives: DesktopAlternatives | null;
  onPick: (url: string) => void;
  onChangeVideo: () => void;
  onDismiss: () => void;
}) {
  const t = useTranslations('party');
  const film = alternatives?.film;
  const hits = (alternatives?.hits ?? []).filter((h) => h.available !== 'blocked');
  const searching = !alternatives || alternatives.status === 'searching';
  const checking = alternatives?.status === 'checking';
  const done = alternatives?.status === 'done';
  return (
    <section
      data-testid="geo-alternatives"
      className="rounded-[var(--ww-r-lg)] border border-[var(--ww-line-strong)] bg-[var(--ww-panel-solid)] p-3 text-[var(--ww-text)]"
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-semibold">{t('geoBlockedTitle')}</p>
          <p className="mt-0.5 truncate text-[12px] text-[var(--ww-text-2)]">{film?.title || title}</p>
          {film?.kind === 'series' && film.episode !== null && (
            <p className="mt-0.5 text-[12px] text-[var(--ww-text-2)]">{t('geoAltEpisodeHint', { n: film.episode })}</p>
          )}
        </div>
        <button type="button" onClick={onDismiss} aria-label={t('geoAltClose')} className="cursor-pointer rounded p-1 text-[var(--ww-text-3)] hover:text-[var(--ww-text)]">
          <X size={15} />
        </button>
      </div>

      <div className="mt-2 flex items-center gap-2 text-[12px] text-[var(--ww-text-2)]">
        {(searching || checking) && <Loader2 size={13} className="animate-spin" aria-hidden="true" />}
        {searching && <span>{t('geoAltSearching')}</span>}
        {checking && <span>{t('geoAltChecking')}</span>}
        {done && hits.length > 0 && <span>{t('geoAltFound', { n: hits.length })}</span>}
      </div>

      {hits.length > 0 && (
        <ul className="mt-2 flex max-h-72 flex-col gap-1.5 overflow-y-auto pr-1">
          {hits.map((h) => <HitRow key={h.url} hit={h} onPick={onPick} />)}
        </ul>
      )}

      {done && hits.length === 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[12.5px] text-[var(--ww-text-2)]">
          <span>{t('geoAltNone')}</span>
          <button type="button" onClick={onChangeVideo} className="ww-btn-subtle flex h-8 cursor-pointer items-center gap-1.5 rounded-[var(--ww-r-sm)] px-3 text-[12px] font-medium">
            <Search size={13} aria-hidden="true" />{t('changeVideo')}
          </button>
        </div>
      )}
    </section>
  );
}
