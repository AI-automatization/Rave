import type { IconType } from 'react-icons';
import { FaEnvelope, FaInstagram, FaTelegram, FaXTwitter } from 'react-icons/fa6';

/**
 * WeWatch's own channels — the single source for the footer, `Organization.sameAs`
 * and the contact pages.
 *
 * The brand name is shared with unrelated companies (a US projector maker, a Southeast
 * Asian streaming platform, several apps), so a brand search only surfaces our profiles
 * when the site, the schema and `llms.txt` name exactly the same accounts. That is
 * enforced by `official social profiles are one consistent set` in seo-geo-aeo.spec.ts;
 * `public/llms.txt` is the one copy the test cannot import, so update it alongside.
 */
export const SOCIAL_PROFILES = {
  instagram: 'https://instagram.com/wewatch.tezcode',
  x: 'https://x.com/wewatch_uz',
  telegram: 'https://t.me/wewatchh',
} as const;

export const SOCIAL_PROFILE_URLS = Object.values(SOCIAL_PROFILES);

export const SUPPORT_EMAIL = 'support@wewatch.uz';

/** Support is a person, not a channel — it is a contact, never an `Organization.sameAs` entry. */
export const SUPPORT_TELEGRAM = 'https://t.me/wewatch_support';

export interface BrandContact {
  name: string;
  icon: IconType;
  label: string;
  href: string;
  color: string;
}

/** Contact rows on /contact and /company, in the order they are offered. */
export const BRAND_CONTACTS: BrandContact[] = [
  { name: 'Email', icon: FaEnvelope, label: SUPPORT_EMAIL, href: `mailto:${SUPPORT_EMAIL}`, color: '#7B72F8' },
  { name: 'Telegram', icon: FaTelegram, label: '@wewatch_support', href: SUPPORT_TELEGRAM, color: '#22d3ee' },
  { name: 'Telegram канал', icon: FaTelegram, label: '@wewatchh', href: SOCIAL_PROFILES.telegram, color: '#22d3ee' },
  { name: 'Instagram', icon: FaInstagram, label: '@wewatch.tezcode', href: SOCIAL_PROFILES.instagram, color: '#a855f7' },
  { name: 'X', icon: FaXTwitter, label: '@wewatch_uz', href: SOCIAL_PROFILES.x, color: '#e2e8f0' },
];
