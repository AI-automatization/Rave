import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FaGithub, FaLinkedinIn, FaTelegram, FaArrowRightLong, FaLocationDot } from 'react-icons/fa6';
import { TEAM, getMember, TEZCODE_TEAM_URL } from '../team-data';

export function generateStaticParams() {
  return TEAM.map((m) => ({ slug: m.slug }));
}

type PersonPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PersonPageProps): Promise<Metadata> {
  const { slug } = await params;
  const m = getMember(slug);
  if (!m) return {};
  const url = `https://wewatch.uz/ru/team/${m.slug}`;
  return {
    // No manual "| WeWatch" — the root layout's title template already appends it.
    title: `${m.name} / ${m.nameAlt} — ${m.role}`,
    description: `${m.name} (${m.nameAlt}) — ${m.role} в tezcode. ${m.tagline}`,
    keywords: [m.name, m.nameAlt, m.role, 'WeWatch', 'tezcode', ...m.knowsAbout],
    alternates: { canonical: url },
    openGraph: {
      title: `${m.name} — ${m.role}`,
      description: m.tagline,
      url,
      type: 'profile',
      images: [{ url: m.photo, width: 800, height: 800, alt: m.name }],
    },
    robots: { index: true, follow: true },
  };
}

function socialIcon(href: string) {
  if (href.includes('github')) return { Icon: FaGithub, label: 'GitHub' };
  if (href.includes('linkedin')) return { Icon: FaLinkedinIn, label: 'LinkedIn' };
  if (href.includes('t.me') || href.includes('telegram')) return { Icon: FaTelegram, label: 'Telegram' };
  return { Icon: FaArrowRightLong, label: href.replace(/^https?:\/\/(www\.)?/, '').split('/')[0] };
}

export default async function PersonPage({ params }: PersonPageProps) {
  const { slug } = await params;
  const m = getMember(slug);
  if (!m) notFound();

  const others = TEAM.filter((p) => p.slug !== m.slug);
  const url = `https://wewatch.uz/ru/team/${m.slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person', name: m.name, alternateName: m.nameAlt, jobTitle: m.role,
        description: m.tagline, url, image: `https://wewatch.uz${m.photo}`,
        homeLocation: { '@type': 'Place', name: m.location }, knowsAbout: m.knowsAbout,
        ...(m.sameAs.length ? { sameAs: m.sameAs } : {}),
        worksFor: { '@type': 'Organization', name: 'tezcode', url: 'https://tezcode.dev',
          subOrganization: { '@type': 'Organization', name: 'WeWatch', url: 'https://wewatch.uz' } },
      },
      {
        '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'WeWatch', item: 'https://wewatch.uz' },
          { '@type': 'ListItem', position: 2, name: 'Команда', item: 'https://wewatch.uz/ru/team' },
          { '@type': 'ListItem', position: 3, name: m.name, item: url },
        ],
      },
    ],
  };

  const glass = 'rounded-2xl border border-zinc-800/60 bg-[linear-gradient(145deg,rgba(17,17,24,0.96),rgba(13,13,22,0.99))]';

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="relative flex-1 bg-page text-white overflow-hidden">
        {/* mesh ambient */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full blur-[160px]"
            style={{ background: 'radial-gradient(ellipse, rgba(123,114,248,0.16) 0%, rgba(168,85,247,0.06) 50%, transparent 72%)' }} />
        </div>

        <div className="page-hero relative max-w-5xl mx-auto px-4 py-12 md:py-16">
          <nav className="text-sm text-zinc-500 mb-10">
            <Link href="/ru" className="hover:text-white transition-colors">WeWatch</Link>
            <span className="mx-2 text-zinc-700">/</span>
            <Link href="/ru/team" className="hover:text-white transition-colors">Команда</Link>
            <span className="mx-2 text-zinc-700">/</span>
            <span className="text-zinc-300">{m.name}</span>
          </nav>

          {/* HERO */}
          <div className="grid md:grid-cols-[320px_1fr] gap-8 md:gap-12 items-center mb-20">
            <div className="relative mx-auto md:mx-0 w-full max-w-[320px]">
              <div className="absolute -inset-3 -z-10 rounded-[28px] bg-gradient-to-br from-[#7B72F8]/40 to-[#a855f7]/10 blur-2xl" />
              <div className="rounded-[24px] p-[1.5px] bg-gradient-to-br from-[#7B72F8]/70 via-white/10 to-transparent">
                <div className="aspect-square w-full rounded-[22px] bg-zinc-900 bg-cover bg-center"
                  style={{ backgroundImage: `url(${m.photo})` }} />
              </div>
            </div>

            <div>
              <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-[#a99cff] uppercase mb-5 border border-[#7B72F8]/30 bg-[#7B72F8]/10 rounded-full px-3.5 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7B72F8]" /> {m.role}
              </span>
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.02] mb-3">{m.name}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-zinc-500 mb-6">
                <span>{m.nameAlt}</span>
                <span className="inline-flex items-center gap-1.5"><FaLocationDot className="text-[#7B72F8]" size={12} /> {m.location}</span>
              </div>
              <p className="text-xl md:text-2xl text-zinc-200 leading-snug mb-7 max-w-xl">{m.tagline}</p>

              <div className="flex flex-wrap gap-2 mb-7">
                {m.knowsAbout.slice(0, 7).map((k) => (
                  <span key={k} className="text-sm text-zinc-300 bg-white/[0.04] border border-white/10 px-3 py-1.5 rounded-lg">{k}</span>
                ))}
              </div>

              {m.sameAs.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {m.sameAs.map((s) => {
                    const { Icon, label } = socialIcon(s);
                    return (
                      <a key={s} href={s} target="_blank" rel="noopener"
                        className="inline-flex items-center gap-2 text-sm font-medium text-zinc-200 hover:text-white bg-white/[0.04] hover:bg-[#7B72F8]/15 border border-white/10 hover:border-[#7B72F8]/50 px-4 py-2.5 rounded-xl transition-colors">
                        <Icon size={16} /> {label}
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* WHO IS */}
          <section className="mb-20 grid md:grid-cols-[220px_1fr] gap-6">
            <h2 className="text-sm font-semibold tracking-widest text-zinc-500 uppercase pt-1">Кто такой<br />{m.name}</h2>
            <div className="space-y-4 max-w-2xl border-l border-zinc-800 pl-6">
              {m.bio.map((p, i) => (
                <p key={i} className="text-lg text-zinc-300 leading-relaxed">{p}</p>
              ))}
            </div>
          </section>

          {/* FOCUS */}
          <section className="mb-20">
            <h2 className="text-sm font-semibold tracking-widest text-zinc-500 uppercase mb-6">Направления</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {m.focus.map((f, i) => (
                <div key={f.title} className={`${glass} p-6 relative overflow-hidden transition-all duration-300 hover:border-[#7B72F8]/50 hover:-translate-y-1`}>
                  <div className="absolute top-0 left-0 right-0 h-px opacity-40" style={{ background: 'linear-gradient(90deg, transparent, rgba(123,114,248,0.5), transparent)' }} />
                  <div className="text-3xl font-bold mb-4 bg-gradient-to-br from-[#7B72F8] to-[#a855f7] bg-clip-text text-transparent">0{i + 1}</div>
                  <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* TEZCODE */}
          <section className={`${glass} mb-20 p-8 md:p-10 relative overflow-hidden`}>
            <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full blur-[100px] bg-[#7B72F8]/20" aria-hidden />
            <div className="relative">
              <span className="text-xs font-semibold tracking-widest text-[#a99cff] uppercase">AI Software Factory · Ташкент</span>
              <h2 className="text-2xl md:text-3xl font-bold mt-2 mb-3">Часть команды tezcode</h2>
              <p className="text-zinc-400 leading-relaxed mb-7 max-w-2xl">
                {m.name} работает в <Link href="/ru/tezcode" className="text-[#a99cff] hover:text-white underline underline-offset-2">tezcode</Link> — AI-first студии разработки, создавшей WeWatch и другие продукты.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/ru/tezcode" className="inline-flex items-center gap-2 bg-[#7B72F8] hover:bg-[#6a63e8] text-white font-semibold px-5 py-2.5 rounded-xl transition-colors">О tezcode</Link>
                <a href={TEZCODE_TEAM_URL} target="_blank" rel="noopener" className="inline-flex items-center gap-2 border border-white/15 hover:border-[#7B72F8] text-zinc-200 px-5 py-2.5 rounded-xl transition-colors">Вся команда на tezcode.dev <FaArrowRightLong size={13} /></a>
              </div>
            </div>
          </section>

          {/* OTHER TEAM */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-semibold tracking-widest text-zinc-500 uppercase">Команда WeWatch</h2>
              <Link href="/ru/team" className="text-sm text-zinc-400 hover:text-white transition-colors">Все →</Link>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {others.map((p) => (
                <Link key={p.slug} href={`/ru/team/${p.slug}`}
                  className={`${glass} group overflow-hidden transition-all duration-300 hover:border-[#7B72F8]/50 hover:-translate-y-1`}>
                  <div className="aspect-square bg-zinc-900 bg-cover bg-center" style={{ backgroundImage: `url(${p.photo})` }} />
                  <div className="p-3">
                    <h3 className="text-sm font-semibold text-white group-hover:text-[#a99cff] transition-colors leading-tight truncate">{p.name}</h3>
                    <p className="text-xs text-zinc-500 mt-0.5 truncate">{p.role}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
