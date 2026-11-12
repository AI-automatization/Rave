import { NotificationsContent } from './NotificationsContent';

// Static title, default locale (uz) — server component, locale is a client-side cookie, so this
// cannot follow the language switcher. Without it the tab read a bare "WeWatch" on four pages
// (prod audit 2026-08-01); a fixed uz title is still better than no title at all.
export const metadata = {
  title: 'Bildirishnomalar',
};

export default function NotificationsPage() {
  return <NotificationsContent />;
}
