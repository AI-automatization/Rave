// CineSync Mobile — mediaDetector utility tests
import { normalizeDetectedMedia, normalizeBlobMedia } from '../../utils/mediaDetector';
import { isPlaceholderVideoUrl } from '../../utils/webViewScripts';

jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }));

describe('isPlaceholderVideoUrl', () => {
  it('detects /blank.mp4', () => expect(isPlaceholderVideoUrl('https://cdn.com/blank.mp4')).toBe(true));
  it('detects /blank.webm', () => expect(isPlaceholderVideoUrl('https://cdn.com/blank.webm')).toBe(true));
  it('detects CDN template pattern /templates/123/456/', () =>
    expect(isPlaceholderVideoUrl('https://cdn.com/templates/123/456/video.mp4')).toBe(true));
  it('returns false for real video', () => expect(isPlaceholderVideoUrl('https://cdn.com/movie.mp4')).toBe(false));
  it('returns false for empty string', () => expect(isPlaceholderVideoUrl('')).toBe(false));
  it('detects blank.mp4 with query params', () =>
    expect(isPlaceholderVideoUrl('https://cdn.com/blank.mp4?t=123')).toBe(true));
});

describe('normalizeDetectedMedia', () => {
  it('normalizes direct mp4 payload', () => {
    const payload = {
      type: 'MEDIA_DETECTED' as const,
      platform: 'direct' as const,
      videoUrl: 'https://video.mp4',
      pageTitle: 'Test Video',
      pageUrl: 'https://site.com',
    };
    const result = normalizeDetectedMedia(payload);
    expect(result.videoUrl).toBe('https://video.mp4');
    expect(result.videoTitle).toBe('Test Video');
    expect(result.videoPlatform).toBe('direct');
    expect(result.videoReferer).toBe('https://site.com');
    expect(result.mode).toBe('extracted');
  });

  it('uses "Video" as fallback title when pageTitle is empty', () => {
    const payload = {
      type: 'MEDIA_DETECTED' as const,
      platform: 'direct' as const,
      videoUrl: 'https://cdn.com/clip.mp4',
      pageTitle: '',
    };
    const result = normalizeDetectedMedia(payload);
    expect(result.videoTitle).toBe('Video');
  });

  it('detects youtube platform', () => {
    const payload = {
      type: 'MEDIA_DETECTED' as const,
      platform: 'youtube' as const,
      videoUrl: 'https://youtube.com/watch?v=abc',
      pageTitle: 'YouTube Video',
    };
    const result = normalizeDetectedMedia(payload);
    expect(result.videoPlatform).toBe('youtube');
  });

  it('defaults mode to extracted when not specified', () => {
    const payload = {
      type: 'MEDIA_DETECTED' as const,
      platform: 'direct' as const,
      videoUrl: 'https://cdn.com/v.mp4',
      pageTitle: 'My Video',
    };
    expect(normalizeDetectedMedia(payload).mode).toBe('extracted');
  });
});

describe('normalizeBlobMedia', () => {
  it('normalizes BLOB_VIDEO_FOUND payload', () => {
    const payload = {
      type: 'BLOB_VIDEO_FOUND' as const,
      pageUrl: 'https://site.com/player',
      pageTitle: 'Stream Video',
    };
    const result = normalizeBlobMedia(payload);
    expect(result.videoUrl).toBe('https://site.com/player');
    expect(result.videoTitle).toBe('Stream Video');
    expect(result.mode).toBe('webview-session');
    expect(result.videoPlatform).toBe('webview');
  });

  it('uses "Video" as fallback title', () => {
    const payload = { type: 'BLOB_VIDEO_FOUND' as const, pageUrl: 'https://site.com', pageTitle: '' };
    expect(normalizeBlobMedia(payload).videoTitle).toBe('Video');
  });
});

describe('detectVideoPlatform logic', () => {
  const detectPlatform = (url: string): string => {
    if (!url) return 'direct';
    if (/\.(mp4|m3u8|webm|ogg|mov)(\?.*)?$/i.test(url)) return 'direct';
    if (/(?:youtube\.com|youtu\.be)/i.test(url)) return 'youtube';
    return 'webview';
  };
  it('mp4 → direct', () => expect(detectPlatform('https://cdn.com/v.mp4')).toBe('direct'));
  it('m3u8 → direct', () => expect(detectPlatform('https://cdn.com/v.m3u8')).toBe('direct'));
  it('youtube → youtube', () => expect(detectPlatform('https://youtube.com/watch?v=abc')).toBe('youtube'));
  it('other site → webview', () => expect(detectPlatform('https://uzmovi.tv/film')).toBe('webview'));
  it('empty → direct', () => expect(detectPlatform('')).toBe('direct'));
});
