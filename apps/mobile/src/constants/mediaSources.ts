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
    id: 'facebook',
    label: 'Facebook',
    iconName: 'logo-facebook',
    brandColor: '#1877F2',
    defaultUrl: 'https://www.facebook.com/watch',
    support: 'full',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    iconName: 'logo-instagram',
    brandColor: '#E1306C',
    defaultUrl: 'https://www.instagram.com/reels',
    support: 'full',
  },
  {
    id: 'reddit',
    label: 'Reddit',
    iconName: 'logo-reddit',
    brandColor: '#FF4500',
    defaultUrl: 'https://www.reddit.com/r/videos',
    support: 'full',
  },
  {
    id: 'streamable',
    label: 'Streamable',
    iconName: 'play-circle-outline',
    brandColor: '#1DBBFF',
    defaultUrl: 'https://streamable.com',
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
    id: 'x',
    label: 'X',
    iconName: 'logo-twitter',
    brandColor: '#FFFFFF',
    defaultUrl: 'https://x.com',
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
    id: 'megogo',
    label: 'Megogo',
    iconName: 'play-circle-outline',
    brandColor: '#FF6600',
    defaultUrl: 'https://megogo.net',
    support: 'webview-session',
  },
  {
    id: 'netflix',
    label: 'Netflix',
    iconName: 'film-outline',
    brandColor: '#E50914',
    defaultUrl: 'https://www.netflix.com',
    support: 'drm',
    drmMessage:
      'Netflix использует DRM-защиту. Встроенный плеер не может воспроизводить защищённый контент. Используйте официальное приложение Netflix.',
  },
  {
    id: 'prime',
    label: 'prime',
    iconName: 'star-outline',
    brandColor: '#00A8E1',
    defaultUrl: 'https://www.primevideo.com',
    support: 'drm',
    drmMessage:
      'Amazon Prime Video использует DRM-защиту. Используйте официальное приложение Prime Video.',
  },
  {
    id: 'crunchyroll',
    label: 'Crunchyroll',
    iconName: 'pizza-outline',
    brandColor: '#FF6500',
    defaultUrl: 'https://www.crunchyroll.com',
    support: 'drm',
    drmMessage:
      'Большинство контента Crunchyroll защищено DRM. Попробуйте бесплатные серии через источник "Web".',
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
    id: 'playlist',
    label: 'Playlist',
    iconName: 'list-outline',
    brandColor: '#6C63FF',
    defaultUrl: '',
    support: 'internal',
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
    id: 'photos',
    label: 'Photos',
    iconName: 'images-outline',
    brandColor: '#34A853',
    defaultUrl: '',
    support: 'internal',
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
  {
    id: 'karaoke',
    label: 'Karaoke',
    iconName: 'mic-outline',
    brandColor: '#FF6B9D',
    defaultUrl: '',
    support: 'internal',
  },
  {
    id: 'likes',
    label: 'Likes',
    iconName: 'heart-outline',
    brandColor: '#FF6B9D',
    defaultUrl: '',
    support: 'internal',
  },
  {
    id: 'history',
    label: 'History',
    iconName: 'time-outline',
    brandColor: '#9CA3AF',
    defaultUrl: '',
    support: 'internal',
  },
];
