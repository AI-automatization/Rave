export type FaqItem = { q: string; a: string };

export function VisibleFaqs({ title, items }: { title: string; items: readonly FaqItem[] }) {
  return (
    <section className="mb-12" data-visible-faq>
      <h2 className="text-2xl font-bold text-white mb-5">{title}</h2>
      <div className="space-y-3">
        {items.map(({ q, a }) => (
          <details key={q} className="group rounded-xl border border-zinc-800 bg-[#0E0E14] px-5 py-4">
            <summary className="cursor-pointer list-none font-medium text-white">{q}</summary>
            <p className="mt-3 text-sm leading-7 text-zinc-400">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
