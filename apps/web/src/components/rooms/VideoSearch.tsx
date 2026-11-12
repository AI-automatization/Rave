'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { contentApi } from '@/lib/api/content.api';
import type { IExternalVideo } from '@/types';
import { trackClick } from '@/lib/analytics';

interface Props {
  onSelect: (video: IExternalVideo) => void;
}

export function VideoSearch({ onSelect }: Props) {
  const t = useTranslations('room');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<IExternalVideo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await contentApi.search(query);
        setResults(res.data?.results ?? []);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium text-slate-400">{t('searchLabel')}</label>
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="w-full h-10 bg-[#13121F] border border-[#2A2840] rounded-xl pl-9 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-all"
        />
        {isLoading && (
          <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-500" />
        )}
      </div>

      {results.length > 0 && (
        <div className="max-h-48 overflow-y-auto flex flex-col gap-1 scrollbar-hide">
          {results.map((video) => (
            <button
              key={video._id}
              type="button"
              onClick={() => { trackClick('video_search:select'); onSelect(video); setQuery(''); setResults([]); }}
              className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/[0.05] transition-colors text-left"
            >
              {video.thumbnail && (
                <img src={video.thumbnail} alt="" className="w-14 h-9 rounded object-cover shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white truncate">{video.title}</p>
                <p className="text-[10px] text-slate-500">{video.platform}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
