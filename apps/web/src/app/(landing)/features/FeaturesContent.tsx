'use client';

import { useTranslations } from 'next-intl';
import { FaPlay, FaUsers, FaTrophy, FaBell, FaStar, FaWifi, FaShieldAlt } from 'react-icons/fa';
import { GiCrossedSwords } from 'react-icons/gi';

const FEATURE_LIST = [
  {
    icon: FaPlay,
    key: 'Watch Party',
    features: [
      'Sinxron video playback (±2s threshold)',
      'Real-vaqt chat',
      'Emoji overlay reaksiyalar',
      "Xona egasi play/pause/seek nazorati",
      "A'zolarni mute va kick qilish",
      'Xona havolasi bilan taklif qilish',
    ],
  },
  {
    icon: GiCrossedSwords,
    key: 'Battle',
    features: [
      '3, 5 yoki 7 kunlik musobaqalar',
      'Real-vaqt leaderboard (Redis)',
      "G'olibga points mukofoti",
      "Film ko'rish hisoblagichi",
      "Daqiqalar bo'yicha statistika",
      'Guruhli battle (kelajakda)',
    ],
  },
  {
    icon: FaTrophy,
    key: 'Achievement',
    features: [
      '25+ noyob yutuq',
      '5 rarity daraja: common → legend',
      'Maxfiy (secret) yutuqlar',
      'Unlock animatsiyasi',
      'Points mukofoti har achievement uchun',
      "Profil sahifada ko'rsatish",
    ],
  },
  {
    icon: FaUsers,
    key: "Do'stlar",
    features: [
      "Do'st qo'shish/qabul qilish",
      'Real-vaqt online status (Heartbeat)',
      "Do'stlar ro'yxati va qidiruv",
      "Profilni ko'rish",
      "Do'st qo'shish uchun points",
      'Blok qilish imkoniyati',
    ],
  },
  {
    icon: FaBell,
    key: 'Bildirishnomalar',
    features: [
      'Push notifications (FCM)',
      'In-app bildirishnomalar',
      'Battle natijasi xabari',
      'Watch Party taklifi',
      'Achievement unlock xabari',
      "Do'st so'rovi",
    ],
  },
  {
    icon: FaStar,
    key: 'Reyting',
    features: [
      'Film reyting (1-10)',
      'Sharhlar yozish',
      'Moderatsiya (operator+)',
      "O'rtacha reyting hisobi",
      "Ko'rish tarixi",
      'Davom etish (progress saving)',
    ],
  },
  {
    icon: FaWifi,
    key: 'HLS Video',
    features: [
      'HLS streaming (m3u8)',
      'Keyboard shortcut (Space/←/→/F/M)',
      "To'liq ekran rejimi",
      'Ovoz balandligi nazorati',
      'Progress bar',
      "Safari native HLS qo'llab-quvvatlash",
    ],
  },
  {
    icon: FaShieldAlt,
    key: 'Xavfsizlik',
    features: [
      'JWT (RS256) autentifikatsiya',
      'bcrypt 12 rounds parol',
      'Rate limiting (Redis)',
      '2FA Email tasdiqlash',
      'Brute force himoya',
      'HTTP security headers (Helmet)',
    ],
  },
];

export function FeaturesContent() {
  const t = useTranslations('featuresPage');

  return (
    <div className="max-w-7xl mx-auto px-4 py-20">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-display mb-4">{t('title')}</h1>
        <p className="text-base-content/50 max-w-xl mx-auto">{t('subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {FEATURE_LIST.map(({ icon: Icon, key, features }) => (
          <div key={key} className="card bg-base-200">
            <div className="card-body gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon size={23} className="text-primary" />
                </div>
                <h2 className="font-display text-lg">{key.toUpperCase()}</h2>
              </div>
              <ul className="space-y-2">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-base-content/70">
                    <span className="text-success mt-0.5 shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
