// CineSync Mobile — videoPlayer utility tests
import {
  SEEK_SEC, DOUBLE_TAP_MS, CONTROLS_TIMEOUT, YOUTUBE_RE, MOBILE_UA,
  getYouTubeMobileUrl, extractYouTubeVideoId, fmtTime, detectVideoPlatform,
} from '../../utils/videoPlayer';

describe('constants', () => {
  it('SEEK_SEC is 10', () => expect(SEEK_SEC).toBe(10));
  it('DOUBLE_TAP_MS is 300', () => expect(DOUBLE_TAP_MS).toBe(300));
  it('CONTROLS_TIMEOUT is 4000', () => expect(CONTROLS_TIMEOUT).toBe(4000));
  it('YOUTUBE_RE matches youtube.com', () => expect(YOUTUBE_RE.test('https://youtube.com/watch?v=abc')).toBe(true));
  it('YOUTUBE_RE matches youtu.be', () => expect(YOUTUBE_RE.test('https://youtu.be/abc123')).toBe(true));
  it('YOUTUBE_RE does not match other sites', () => expect(YOUTUBE_RE.test('https://vimeo.com/123')).toBe(false));
  it('MOBILE_UA contains Chrome Mobile', () => expect(MOBILE_UA).toContain('Chrome/120'));
});

describe('extractYouTubeVideoId', () => {
  it('extracts from watch URL', () => {
    expect(extractYouTubeVideoId('https://youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });
  it('extracts from youtu.be short URL', () => {
    expect(extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });
  it('extracts from shorts URL', () => {
    expect(extractYouTubeVideoId('https://youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });
  it('extracts from embed URL', () => {
    expect(extractYouTubeVideoId('https://youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });
  it('returns null for non-YouTube URL', () => {
    expect(extractYouTubeVideoId('https://vimeo.com/123')).toBeNull();
  });
  it('returns null for empty string', () => {
    expect(extractYouTubeVideoId('')).toBeNull();
  });
});

describe('getYouTubeMobileUrl', () => {
  it('returns m.youtube.com for watch URL', () => {
    const url = getYouTubeMobileUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(url).toBe('https://m.youtube.com/watch?v=dQw4w9WgXcQ');
  });
  it('handles youtu.be short URL', () => {
    const url = getYouTubeMobileUrl('https://youtu.be/dQw4w9WgXcQ');
    expect(url).toBe('https://m.youtube.com/watch?v=dQw4w9WgXcQ');
  });
  it('replaces www with m for non-matched URL', () => {
    const url = getYouTubeMobileUrl('https://www.youtube.com/channel/abc');
    expect(url).toContain('m.youtube.com');
  });
});

describe('fmtTime', () => {
  it('formats 0ms as 0:00', () => expect(fmtTime(0)).toBe('0:00'));
  it('formats 65000ms as 1:05', () => expect(fmtTime(65000)).toBe('1:05'));
  it('formats 3600000ms (1 hour) as 1:00:00', () => expect(fmtTime(3600000)).toBe('1:00:00'));
  it('formats 3665000ms as 1:01:05', () => expect(fmtTime(3665000)).toBe('1:01:05'));
  it('pads seconds correctly', () => expect(fmtTime(9000)).toBe('0:09'));
});

describe('detectVideoPlatform', () => {
  it('detects mp4 as direct', () => expect(detectVideoPlatform('https://cdn.com/video.mp4')).toBe('direct'));
  it('detects m3u8 as direct', () => expect(detectVideoPlatform('https://cdn.com/stream.m3u8')).toBe('direct'));
  it('detects webm as direct', () => expect(detectVideoPlatform('https://cdn.com/video.webm')).toBe('direct'));
  it('detects YouTube as youtube', () => expect(detectVideoPlatform('https://youtube.com/watch?v=abc')).toBe('youtube'));
  it('detects youtu.be as youtube', () => expect(detectVideoPlatform('https://youtu.be/abc')).toBe('youtube'));
  it('detects other sites as webview', () => expect(detectVideoPlatform('https://kinogo.cc/movie')).toBe('webview'));
  it('detects YouTube proxy stream as direct', () => expect(detectVideoPlatform('https://api.cinesync.com/youtube/stream?url=abc')).toBe('direct'));
  it('returns direct for empty URL', () => expect(detectVideoPlatform('')).toBe('direct'));
});
