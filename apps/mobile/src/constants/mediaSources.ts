/// CineSync Mobile — Media Source Definitions
// Список источников медиа для Source Picker (аналог Rave)

export type MediaSupportLevel =
  | 'full'            // WebView + media detection работает
  | 'drm'             // DRM защита — только fallback сообщение
  | 'webview-session' // E65-5: страница сама является плеером (Cinerama, Megogo)
  | 'internal';       // Внутренняя функция приложения (Coming soon)

export interface MediaSource {
  id: string;
  label: string;
  sublabel?: string;
  iconName: string; // Ionicons 5 name
  brandColor: string;
  defaultUrl: string;
  support: MediaSupportLevel;
  drmMessage?: string;
}

export const MEDIA_SOURCES: MediaSource[] = [
  {
    id: 'instagram',
    label: 'Instagram',
    iconName: 'logo-instagram',
    brandColor: '#E1306C',
    defaultUrl: 'https://www.instagram.com/reels',
    support: 'full',
  },
  {
    id: 'youtube',
    label: 'YouTube',
    iconName: 'logo-youtube',
    brandColor: '#FF0000',
    defaultUrl: 'https://m.youtube.com',
    support: 'full',
  },
  {
    id: 'vk',
    label: 'VK Видео',
    iconName: 'play-circle-outline',
    brandColor: '#0077FF',
    defaultUrl: 'https://vk.com/video',
    support: 'full',
  },
  {
    id: 'rutube',
    label: 'Rutube',
    iconName: 'play-circle',
    brandColor: '#00B4FF',
    defaultUrl: 'https://rutube.ru',
    support: 'full',
  },
  {
    id: 'cinerama',
    label: 'Cinerama',
    iconName: 'film-outline',
    brandColor: '#E8432D',
    defaultUrl: 'https://cinerama.uz',
    support: 'webview-session',
  },
  {
    id: 'twitch',
    label: 'twitch',
    iconName: 'logo-twitch',
    brandColor: '#9146FF',
    defaultUrl: 'https://m.twitch.tv',
    support: 'full',
  },
  {
    id: 'youtube-live',
    label: 'Live',
    sublabel: 'YouTube Live',
    iconName: 'radio-outline',
    brandColor: '#FF0000',
    defaultUrl: 'https://m.youtube.com/live',
    support: 'full',
  },
  {
    id: 'drive',
    label: 'Drive',
    iconName: 'cloud-outline',
    brandColor: '#4285F4',
    defaultUrl: 'https://drive.google.com',
    support: 'full',
  },
  {
    id: 'web',
    label: 'Web',
    iconName: 'globe-outline',
    brandColor: '#FFFFFF',
    defaultUrl: 'https://www.google.com',
    support: 'full',
  },
  {
    id: 'cinesync-dj',
    label: 'CineSync DJ',
    iconName: 'musical-notes-outline',
    brandColor: '#E50914',
    defaultUrl: '',
    support: 'internal',
  },
];
