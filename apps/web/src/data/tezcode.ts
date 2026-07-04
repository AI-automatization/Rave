import type { IconType } from 'react-icons';
import {
  FaRobot, FaStore, FaHeartbeat, FaUsersCog, FaChartLine,
  FaPlay, FaCube, FaBolt, FaEnvelope, FaTelegram, FaInstagram, FaLinkedin,
} from 'react-icons/fa';

// ── Факты с tezcode.dev (AI Software Factory, Ташкент) ──────────────────────
// Тексты (описания, роли, био) вынесены в messages/*.json — здесь только
// нелокализуемые данные: имена, иконки, цвета, ссылки, фото.

export const TEZCODE_URL = 'https://www.tezcode.dev/';

export interface Product {
  key: string; // ключ перевода: products.desc.<key>
  name: string;
  icon: IconType;
  color: string;
  highlight?: boolean;
  soon?: boolean;
  url?: string;   // внешний сайт продукта (новая вкладка)
  href?: string;  // внутренняя ссылка (напр. WeWatch → главная)
}

export const PRODUCTS: Product[] = [
  { key: 'aiOffice', name: 'AI Office', icon: FaRobot, color: '#7B72F8' },
  { key: 'raos', name: 'RAOS', icon: FaStore, color: '#22d3ee', url: 'https://raos.uz/' },
  { key: 'coreMed', name: 'CoreMed', icon: FaHeartbeat, color: '#4ade80', url: 'https://coremed.uz/' },
  { key: 'workControl', name: 'WorkControl', icon: FaUsersCog, color: '#a855f7' },
  { key: 'aiTrade', name: 'AI-Trade', icon: FaChartLine, color: '#f59e0b' },
  { key: 'weWatch', name: 'WeWatch', icon: FaPlay, color: '#7B72F8', highlight: true, href: '/' },
  { key: 'ventra', name: 'Ventra', icon: FaBolt, color: '#f43f5e', soon: true },
  { key: 'savdoBuilder', name: 'Savdo-Builder', icon: FaCube, color: '#38bdf8', soon: true },
];

export interface Member {
  key: string; // ключ перевода: company.role<Key> / company.bio<Key>
  name: string;
  tag?: 'lead' | 'wewatch';
  photo?: string;
}
export const TEAM: Member[] = [
  {
    key: 'Founder',
    name: 'Bekzod Mirzaaliyev',
    tag: 'lead',
    photo: "/team/begzod_mirzaliyev.png",
  },
  {
    key: 'Coo',
    name: 'Abdulaziz Yormatov',
    tag: 'lead',
    photo: '/team/abdulaziz_yormatov.png',
  },
  {
    key: 'Wewatch',
    name: 'Emirhan Ertan',
    tag: 'wewatch',
    photo: '/team/ertan_emirhan.jpg',
  },
];

export const TECH = [
  'Next.js', 'React', 'TypeScript', 'Python', 'FastAPI', 'Node.js',
  'PostgreSQL', 'Redis', 'Tailwind', 'OpenAI', 'Anthropic', 'Docker', 'Railway', 'Stripe', 'Vercel',
];

export interface Contact {
  name: string;
  icon: IconType;
  label: string;
  href: string;
  color: string;
}

export const CONTACT_EMAIL = 'tezcode@tezcode.dev';

export const CONTACTS: Contact[] = [
  { name: 'Email', icon: FaEnvelope, label: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}`, color: '#7B72F8' },
  { name: 'Telegram', icon: FaTelegram, label: '@webdevelopertk', href: 'https://t.me/webdevelopertk', color: '#22d3ee' },
  { name: 'Instagram', icon: FaInstagram, label: '@tezcode_dev', href: 'https://instagram.com/tezcode_dev', color: '#a855f7' },
  { name: 'LinkedIn', icon: FaLinkedin, label: 'tezcode.dev', href: TEZCODE_URL, color: '#38bdf8' },
];

// Палитра для аватаров-инициалов (когда фото нет)
export const AVATAR_COLORS = ['#7B72F8', '#a855f7', '#22d3ee', '#4ade80', '#f59e0b', '#f43f5e', '#38bdf8'];

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}
