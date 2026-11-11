import { describe, expect, it } from 'vitest';
import { hostOf, isAdHost, isYouTubeHost, shouldBlockAd } from '../src/main/adblock';

describe('isAdHost', () => {
  it.each(['doubleclick.net', 'ads.doubleclick.net', 'a.b.googlesyndication.com', 'storage.dsp-ui.uz', 'an.yandex.ru', 'yabs.yandex.ru'])(
    'blocks %s', (h) => { expect(isAdHost(h)).toBe(true); },
  );
  it.each([
    '', 'example.com', 'youtube.com', 'doubleclick.net.evil.com', 'evil-doubleclick.net', 'notdoubleclick.net',
    'yandex.ru', 'static.rtbcdn.ru', 'pic.rtbcdn.ru', 'localhost', '127.0.0.1',
  ])('does not block %s', (h) => { expect(isAdHost(h)).toBe(false); });
});

describe('isYouTubeHost', () => {
  it('matches YouTube hosts only', () => {
    expect(isYouTubeHost('www.youtube.com')).toBe(true);
    expect(isYouTubeHost('youtu.be')).toBe(true);
    expect(isYouTubeHost('www.youtube-nocookie.com')).toBe(true);
    expect(isYouTubeHost('youtube.com.evil.example')).toBe(false);
    expect(isYouTubeHost('notyoutube.com')).toBe(false);
  });
});

describe('shouldBlockAd', () => {
  it('blocks an ad request from a film site', () => {
    expect(shouldBlockAd('https://ads.doubleclick.net/pixel', 'https://hdrezka.example/film/1')).toBe(true);
  });
  it('lets a normal CDN request through', () => {
    expect(shouldBlockAd('https://cdn.example.com/seg1.ts', 'https://hdrezka.example/film/1')).toBe(false);
  });
  it('keeps YouTube pages ad-intact', () => {
    expect(shouldBlockAd('https://ads.doubleclick.net/pixel', 'https://www.youtube.com/watch?v=1')).toBe(false);
  });
  it("blocks uzmovi's own pre-roll (the site serves it itself, so no filter list knows it)", () => {
    const page = 'https://uzmovi.net/tarjima-kinolarri/9150-film.html';
    expect(shouldBlockAd('https://story.uzmovi.net/ads/videos/2026/10/abc.mp4', page)).toBe(true);
    expect(shouldBlockAd('https://uzmovi.net/ads/video/event', page)).toBe(true);
    expect(shouldBlockAd('https://uzmovi.net/js/video-ad-manager.js?v=1793397337', page)).toBe(true);
  });
  it("leaves the rest of uzmovi alone (player, film stream, look-alike paths and hosts)", () => {
    const page = 'https://uzmovi.net/tarjima-kinolarri/9150-film.html';
    expect(shouldBlockAd('https://uzmovi.net/js/videojs/video.min.js?v=1.27.0', page)).toBe(false);
    expect(shouldBlockAd('https://uzmovi.net/js/videojs/videoplugin.js?v=1', page)).toBe(false);
    expect(shouldBlockAd('https://srv613.uzdown.space/abc/def.mpd', page)).toBe(false);
    expect(shouldBlockAd('https://uzmovi.net/adsense-guide.html', page)).toBe(false);
    expect(shouldBlockAd('https://uzmovi.net/tarjima/ads/film.html', page)).toBe(false);
    expect(shouldBlockAd('https://notuzmovi.net/ads/x.mp4', page)).toBe(false);
    expect(shouldBlockAd('https://uzmovi.net.evil.com/ads/x.mp4', page)).toBe(false);
  });
  it('handles garbage safely', () => {
    expect(shouldBlockAd('not a url', 'also not')).toBe(false);
    expect(hostOf('not a url')).toBe('');
  });
});
