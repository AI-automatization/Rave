'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

export function FAQAccordion() {
  const t = useTranslations('landing');
  const items = t.raw('faqItems') as { q: string; a: string }[];
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-2">
      {items.map(({ q, a }, index) => (
        <div key={q}>
          <button
            type="button"
            onClick={() => setOpen(open === index ? null : index)}
            className="flex w-full items-center justify-between gap-4 rounded-2xl border border-zinc-800/60 bg-zinc-900/60 px-6 py-4 text-left transition-colors hover:border-[#7B72F8]/40"
            aria-expanded={open === index}
            aria-controls={`homepage-faq-answer-${index}`}
          >
            <span className="text-sm font-medium leading-snug text-white">{q}</span>
            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-zinc-400 transition-transform ${open === index ? 'rotate-45 border-[#7B72F8] text-[#7B72F8]' : 'border-zinc-700'}`} aria-hidden="true">+</span>
          </button>
          <div id={`homepage-faq-answer-${index}`} className={`grid overflow-hidden transition-[grid-template-rows,opacity] ${open === index ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`} aria-hidden={open !== index}>
            <div className="min-h-0 overflow-hidden"><p className="px-6 pb-5 pt-3 text-sm leading-relaxed text-zinc-400">{a}</p></div>
          </div>
        </div>
      ))}
    </div>
  );
}
