import type { Metadata } from 'next';
import Link from 'next/link';
import { FaPlay, FaUsers, FaTrophy, FaStar, FaChevronDown, FaChevronRight } from 'react-icons/fa';
import { GiCrossedSwords } from 'react-icons/gi';
import { LandingNav } from '@/components/common/LandingNav';
import { Footer } from '@/components/common/Footer';

export const metadata: Metadata = {
  title: "CineSync — Do'stlar bilan birga film ko'ring",
  description:
    "Ijtimoiy onlayn kinoteatr platformasi. Do'stlar bilan sinxron film ko'rish, battle va achievement tizimi.",
  openGraph: {
    title: "CineSync — Do'stlar bilan birga film ko'ring",
    description: "Ijtimoiy onlayn kinoteatr platformasi.",
    images: [{ url: '/og-home.jpg', width: 1200, height: 630 }],
  },
};

const FEATURES = [
  {
    icon: FaPlay,
    title: 'Watch Party',
    desc: "Do'stlar bilan bir vaqtda, sinxron holda film ko'ring. Har kim o'z ekranida, ammo birgalikda.",
  },
  {
    icon: GiCrossedSwords,
    title: 'Battle',
    desc: "Raqibingiz bilan 3, 5 yoki 7 kunlik film ko'rish bahsiga kiring. G'olib points oladi.",
  },
  {
    icon: FaTrophy,
    title: 'Yutuqlar',
    desc: "Film ko'rish odatlaringiz uchun badge va achievement oling. Maxfiy yutuqlarni kashf eting.",
  },
  {
    icon: FaUsers,
    title: "Do'stlar",
    desc: "Onlayn do'stlaringizni ko'ring, film tavsiya qiling, birga Watch Party oching.",
  },
];

const STEPS = [
  { num: '01', title: "Ro'yxatdan o'ting", desc: 'Bepul hisob yarating.' },
  { num: '02', title: "Do'st qo'shing", desc: "Do'stlaringizni topib, ularni taklif qiling." },
  { num: '03', title: 'Watch Party oching', desc: 'Film tanlang va Watch Party boshlang.' },
  { num: '04', title: "Birga tomosha qiling", desc: 'Chat, emoji va sinxron player bilan enjoy qiling.' },
];

const TESTIMONIALS = [
  { name: 'Aziz T.',   text: "Do'stlarim bilan Watch Party qilamiz, go'yo bir kinoteatrda o'tirgandek.", stars: 5 },
  { name: 'Malika S.', text: "Battle feature eng qiziqarli — kim ko'proq film ko'radi? 😄",             stars: 5 },
  { name: 'Jasur K.',  text: "Achievement tizimi meni ko'proq film ko'rishga undayapti.",                stars: 4 },
];

const PLANS = [
  {
    name: 'Bepul',
    price: '0',
    period: null,
    features: ['Watch Party (4 kishi)', '3 ta faol battle', 'Asosiy yutuqlar', 'HD video'],
    cta: 'Boshlash',
    href: '/register',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: "29,000",
    period: "so'm/oy",
    features: ["Watch Party (10 kishi)", "Cheksiz battle", "Barcha yutuqlar", "4K video", "Reklama yo'q"],
    cta: 'Pro boshlash',
    href: '/register?plan=pro',
    highlighted: true,
  },
];

const FAQS = [
  { q: 'CineSync bepulmi?',                                a: "Ha, asosiy funksiyalar bepul. Pro plan qo'shimcha imkoniyatlar beradi." },
  { q: 'Watch Party da necha kishi ishtirok eta oladi?',   a: 'Bepul planda 4 ta, Pro planda 10 ta kishi.' },
  { q: 'Qanday qurilmalarda ishlaydi?',                    a: 'Web browser, iOS va Android ilovalari mavjud.' },
  { q: 'Battle qanday ishlaydi?',                          a: "3, 5 yoki 7 kunlik musobaqa. Kim ko'proq film ko'rsa, g'olib bo'ladi." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-base-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'CineSync',
            url: 'https://cinesync.uz',
            description: "Ijtimoiy onlayn kinoteatr platformasi",
          }),
        }}
      />

      <LandingNav />
      <main className="flex-1">

        {/* Hero */}
        <section className="min-h-[90vh] flex flex-col items-center justify-center text-center px-4 py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
          <div className="relative max-w-4xl mx-auto">
            <div className="badge badge-primary badge-outline mb-6 px-4 py-3 text-sm gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Beta versiyasi — Bepul kirish
            </div>
            <h1 className="text-5xl md:text-7xl font-display leading-tight mb-6">
              DO&apos;STLAR BILAN<br />
              <span className="text-primary">BIRGA KO&apos;RING</span>
            </h1>
            <p className="text-base-content/60 text-lg md:text-xl max-w-2xl mx-auto mb-10">
              Ijtimoiy onlayn kinoteatr — Watch Party, Battle, Achievement. Endi film ko&apos;rish yolg&apos;iz emas.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/register" className="btn btn-primary btn-lg gap-2">
                <FaPlay size={23} className="fill-current" />
                Boshlash — Bepul
              </Link>
              <Link href="/features" className="btn btn-outline btn-lg gap-2">
                Batafsil
                <FaChevronRight size={18} />
              </Link>
            </div>
            <div className="mt-16 grid grid-cols-3 gap-6 max-w-md mx-auto">
              {[{ val: '10K+', label: 'Foydalanuvchi' }, { val: '50K+', label: 'Filmlar' }, { val: '100K+', label: 'Watch Party' }].map(({ val, label }) => (
                <div key={label} className="text-center">
                  <p className="text-2xl font-display text-primary">{val}</p>
                  <p className="text-xs text-base-content/50">{label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <FaChevronDown size={28} className="text-base-content/30" />
          </div>
        </section>

        {/* Features */}
        <section className="py-20 px-4 bg-base-200">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-4xl font-display mb-3">NIMA BERAMIZ?</h2>
              <p className="text-base-content/50">Film ko&apos;rishni ijtimoiy tajribaga aylantiramiz</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="card bg-base-100 hover:shadow-lg transition-shadow">
                  <div className="card-body gap-3 items-start">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <Icon size={28} className="text-primary" />
                    </div>
                    <h3 className="font-display text-lg">{title.toUpperCase()}</h3>
                    <p className="text-base-content/60 text-sm">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-4xl font-display mb-3">QANDAY ISHLAYDI?</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {STEPS.map(({ num, title, desc }) => (
                <div key={num} className="flex gap-4 items-start">
                  <span className="text-4xl font-display text-primary/30 leading-none">{num}</span>
                  <div>
                    <h3 className="font-medium mb-1">{title}</h3>
                    <p className="text-base-content/60 text-sm">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 px-4 bg-base-200">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-4xl font-display mb-3">FOYDALANUVCHILAR</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {TESTIMONIALS.map(({ name, text, stars }) => (
                <div key={name} className="card bg-base-100">
                  <div className="card-body gap-3">
                    <div className="flex gap-1">
                      {Array.from({ length: stars }).map((_, i) => (
                        <FaStar key={i} size={18} className="fill-accent text-accent" />
                      ))}
                    </div>
                    <p className="text-sm text-base-content/70">&quot;{text}&quot;</p>
                    <p className="text-sm font-medium">{name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-4xl font-display mb-3">NARXLAR</h2>
              <p className="text-base-content/50">Asosiy funksiyalar bepul</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              {PLANS.map(({ name, price, period, features, cta, href, highlighted }) => (
                <div key={name} className={`card ${highlighted ? 'bg-primary text-primary-content' : 'bg-base-200'}`}>
                  <div className="card-body gap-4">
                    <div>
                      <h3 className="font-display text-2xl">{name.toUpperCase()}</h3>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-3xl font-display">{price}</span>
                        {period && <span className="text-sm opacity-70">{period}</span>}
                      </div>
                    </div>
                    <ul className="space-y-2">
                      {features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm">
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs shrink-0 ${highlighted ? 'bg-primary-content text-primary' : 'bg-success text-success-content'}`}>✓</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link href={href} className={`btn btn-block mt-2 ${highlighted ? 'bg-primary-content text-primary hover:opacity-90' : 'btn-primary'}`}>
                      {cta}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 px-4 bg-base-200">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-4xl font-display mb-3">SAVOL VA JAVOBLAR</h2>
            </div>
            <div className="space-y-3">
              {FAQS.map(({ q, a }) => (
                <div key={q} className="collapse collapse-arrow bg-base-100">
                  <input type="checkbox" />
                  <div className="collapse-title font-medium text-sm">{q}</div>
                  <div className="collapse-content">
                    <p className="text-sm text-base-content/70 pt-1">{a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-display mb-6">TAYYOR EMISSIZ?</h2>
            <p className="text-base-content/50 mb-8">Hoziroq bepul ro&apos;yxatdan o&apos;ting</p>
            <Link href="/register" className="btn btn-primary btn-lg">Boshlash — Bepul</Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
