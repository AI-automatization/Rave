// Movie sites show their player as a small box inside the page (header, ads, comments around it),
// so the VB screencast showed the film small among page clutter. This init script (every frame of
// a VB page, see virtualBrowser.service.ts) makes the playing movie's <video> element itself fill
// the whole viewport (object-fit: contain — never cropped). The site's own player chrome stays
// underneath: WeWatch draws one control bar of its own instead (VirtualBrowserPlayer.tsx), driven
// through window.__wewatchMovieState / __wewatchMovieControl below (virtualBrowser.service.ts).
// Two earlier tries failed live on 2026-10-26: resizing the site's player box left its play
// button off-center, scaling the box cropped the film — and both showed two sets of controls.
// The Fullscreen API can't be used: it needs a user gesture the VB page rarely has.
//
// Rules: only a real movie (not looping, >= 90s or live, big enough on screen, no videojs ad
// playing) — short pre-rolls and muted background loops stay where they are. A player inside an
// iframe maximizes inside its frame and asks the parent frame (postMessage) to maximize the
// iframe element itself, all the way up to the top page. Escape restores the page layout.
export const VB_FULLSCREEN_SCRIPT = /* js */ `
(function () {
  if (window.__wewatchFullscreen) return;
  window.__wewatchFullscreen = true;
  var ATTR = 'data-wewatch-full', ANC = 'data-wewatch-full-anc', MSG = '__wewatchFull';
  var MIN_DURATION_S = 90, MIN_W = 240, MIN_H = 135, CHECK_MS = 2000;
  var current = null, exited = new WeakSet(), childFrame = null;

  function ensureStyle() {
    if (document.getElementById('__wewatch_full_style')) return;
    var s = document.createElement('style');
    s.id = '__wewatch_full_style';
    s.textContent =
      '[' + ATTR + ']{position:fixed!important;left:0!important;top:0!important;right:auto!important;bottom:auto!important;' +
      'width:100vw!important;height:100vh!important;max-width:none!important;max-height:none!important;' +
      'min-width:0!important;min-height:0!important;margin:0!important;padding:0!important;border:0!important;' +
      'transform:none!important;z-index:2147483647!important;visibility:visible!important;opacity:1!important;}' +
      'video[' + ATTR + ']{object-fit:contain!important;background:#000!important;}' +
      '#__wewatch_full_bg{position:fixed;left:0;top:0;width:100vw;height:100vh;background:#000;z-index:2147483646;}' +
      // Ancestors: a transform/filter/contain makes position:fixed relative to them, and their own
      // z-index would keep the video under the site header — neutralize while maximized.
      '[' + ANC + ']{transform:none!important;filter:none!important;perspective:none!important;contain:none!important;' +
      'will-change:auto!important;z-index:auto!important;overflow:visible!important;}' +
      'html[' + ANC + '],html[' + ANC + '] body{overflow:hidden!important;}';
    (document.head || document.documentElement).appendChild(s);
  }

  function apply(el) {
    ensureStyle();
    el.setAttribute(ATTR, '');
    for (var a = el.parentElement; a; a = a.parentElement) a.setAttribute(ANC, '');
    if (!document.getElementById('__wewatch_full_bg')) {
      var bg = document.createElement('div');
      bg.id = '__wewatch_full_bg';
      (document.body || document.documentElement).appendChild(bg);
    }
    if (window.parent !== window) {
      try { window.parent.postMessage({ type: MSG, on: true }, '*'); } catch (e) { /* detached */ }
    }
  }

  function clear() {
    var marked = document.querySelectorAll('[' + ATTR + '],[' + ANC + ']');
    for (var i = 0; i < marked.length; i++) { marked[i].removeAttribute(ATTR); marked[i].removeAttribute(ANC); }
    var bg = document.getElementById('__wewatch_full_bg');
    if (bg) bg.remove();
    current = null; childFrame = null;
    if (window.parent !== window) {
      try { window.parent.postMessage({ type: MSG, on: false }, '*'); } catch (e) { /* detached */ }
    }
  }

  function isAd() {
    try { return typeof window.__wewatchIsAdPlaying === 'function' && window.__wewatchIsAdPlaying(); } catch (e) { return false; }
  }

  function isMovie(v) {
    if (!(v instanceof HTMLVideoElement) || v.loop || exited.has(v) || isAd()) return false;
    var d = v.duration;
    if (!(d === Infinity || d >= MIN_DURATION_S)) return false;
    var r = v.getBoundingClientRect();
    return r.width >= MIN_W && r.height >= MIN_H;
  }

  function maximize(v) {
    if (current === v) return;
    // Another movie already maximized and still playing — keep it.
    if (current && current.isConnected && !current.paused && !current.ended) return;
    clear();
    current = v;
    apply(v);
  }

  // For the server (virtualBrowser.service.ts): the maximized movie's state, and play/pause/seek
  // on it — WeWatch's own control bar replaces the site's (hidden under the video now).
  window.__wewatchMovieState = function () {
    var v = current;
    if (!v || !v.isConnected) return null;
    return { paused: v.paused, currentTime: v.currentTime, duration: isFinite(v.duration) ? v.duration : null };
  };
  window.__wewatchMovieControl = function (action, time) {
    var v = current;
    if (!v || !v.isConnected) return false;
    if (action === 'play') { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
    else if (action === 'pause') v.pause();
    else if (action === 'seek' && typeof time === 'number' && isFinite(time)) v.currentTime = Math.max(0, time);
    else return false;
    return true;
  };

  document.addEventListener('playing', function (e) {
    try { if (isMovie(e.target)) maximize(e.target); } catch (err) { /* never break playback */ }
  }, true);
  // Duration often arrives after 'playing' on HLS/MSE players.
  document.addEventListener('durationchange', function (e) {
    try { if (!e.target.paused && isMovie(e.target)) maximize(e.target); } catch (err) { /* ignore */ }
  }, true);
  ['ended', 'emptied'].forEach(function (type) {
    document.addEventListener(type, function (e) { if (e.target === current) clear(); }, true);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' || (!current && !childFrame)) return;
    if (current) exited.add(current);
    if (childFrame) { try { childFrame.contentWindow.postMessage({ type: MSG, exit: true }, '*'); } catch (err) { /* gone */ } }
    clear();
  }, true);
  setInterval(function () { if (current && !current.isConnected) clear(); }, CHECK_MS);

  // A child frame maximized its player — maximize that iframe here (and on up to the top page).
  window.addEventListener('message', function (e) {
    var d = e.data;
    if (!d || d.type !== MSG) return;
    if (d.exit) {
      if (current) exited.add(current);
      clear();
      return;
    }
    var frames = document.querySelectorAll('iframe,frame');
    for (var i = 0; i < frames.length; i++) {
      if (frames[i].contentWindow !== e.source) continue;
      if (d.on) {
        if (childFrame === frames[i]) return;
        clear();
        childFrame = frames[i];
        apply(frames[i]);
      } else if (childFrame === frames[i]) {
        clear();
      }
      return;
    }
  });
})();
`;
