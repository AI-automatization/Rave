import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Narxlar',
  description: "CineSync narx rejalari — Bepul va Pro. Asosiy funksiyalar hammaga bepul.",
};

const PLANS = [
  {
    name: 'Bepul',
    price: '0',
    period: null,
    desc: 'Asosiy funksiyalar bepul',
    features: [
      { label: 'Watch Party', val: '4 kishi' },
      { label: 'Faol battle', val: '3 ta' },
      { label: 'Achievement', val: 'Asosiy (15)' },
      { label: 'Video sifati', val: 'HD (720p)' },
      { label: 'Reklama', val: 'Mavjud' },
      { label: 'Qidiruv', val: "✓" },
      { label: "Do'stlar", val: 'Cheksiz' },
      { label: 'Saqlash tarixi', val: "30 kun" },
    ],
    cta: 'Bepul boshlash',
    href: '/register',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '29,000',
    period: "so'm/oy",
    desc: 'Professional kinochilar uchun',
    features: [
      { label: 'Watch Party', val: '10 kishi' },
      { label: 'Faol battle', val: "Cheksiz" },
      { label: 'Achievement', val: 'Barchasi (25+)' },
      { label: 'Video sifati', val: '4K (2160p)' },
      { label: 'Reklama', val: "Yo'q" },
      { label: 'Qidiruv', val: '✓ (tezlashtirilgan)' },
      { label: "Do'stlar", val: 'Cheksiz' },
      { label: 'Saqlash tarixi', val: 'Cheksiz' },
    ],
    cta: 'Pro boshlash',
    href: '/register?plan=pro',
    highlighted: true,
  },
];

export default function PricingPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-20">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-display mb-4">NARXLAR</h1>
        <p className="text-base-content/50">Hech qanday yashirin to&apos;lov yo&apos;q</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
        {PLANS.map(({ name, price, period, desc, features, cta, href, highlighted }) => (
          <div
            key={name}
            className={`card ${highlighted ? 'bg-primary text-primary-content ring-2 ring-primary ring-offset-2 ring-offset-base-100' : 'bg-base-200'}`}
          >
            <div className="card-body gap-5">
              <div>
                {highlighted && (
                  <div className="badge bg-primary-content text-primary badge-sm mb-3">
                    Tavsiya etiladi
                  </div>
                )}
                <h2 className="font-display text-3xl">{name.toUpperCase()}</h2>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-4xl font-display">{price}</span>
                  {period ? (
                    <span className={`text-sm ${highlighted ? 'opacity-70' : 'text-base-content/60'}`}>
                      {period}
                    </span>
                  ) : (
                    <span className={`text-sm ${highlighted ? 'opacity-70' : 'text-base-content/60'}`}>
                      doim
                    </span>
                  )}
                </div>
                <p className={`text-sm mt-1 ${highlighted ? 'opacity-70' : 'text-base-content/60'}`}>{desc}</p>
              </div>

              <div className="divider my-0" />

              <ul className="space-y-3">
                {features.map(({ label, val }) => (
                  <li key={label} className="flex items-center justify-between text-sm">
                    <span className={highlighted ? 'opacity-80' : 'text-base-content/70'}>{label}</span>
                    <span className="font-medium">{val}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={href}
                className={`btn btn-block ${
                  highlighted
                    ? 'bg-primary-content text-primary hover:opacity-90 border-0'
                    : 'btn-primary'
                }`}
              >
                {cta}
              </Link>
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-sm text-base-content/40 mt-10">
        * Barcha narxlar UZS da. Pro obuna istalgan vaqt bekor qilinishi mumkin.
      </p>
    </div>
  );
}
