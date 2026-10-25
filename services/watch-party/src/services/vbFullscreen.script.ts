// Movie sites show their player as a small box inside the page (header, ads, comments around it),
// so the VB screencast showed the film letterboxed in page clutter. This init script (every frame
// of a VB page, see virtualBrowser.service.ts) blows the playing movie's player up to the whole
// viewport with CSS. The Fullscreen API can't be used: it needs a user gesture the VB page
// rarely has, and CSS works the same in any frame.
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
  var current = null, box = null, exited = new WeakSet(), childFrame = null;

  function ensureStyle() {
    if (document.getElementById('__wewatch_full_style')) return;
    var s = document.createElement('style');
    s.id = '__wewatch_full_style';
    s.textContent =
      '[' + ATTR + ']{position:fixed!important;left:0!important;top:0!important;right:0!important;bottom:0!important;' +
      'width:100vw!important;height:100vh!important;max-width:none!important;max-height:none!important;min-width:0!important;' +
      'min-height:0!important;margin:0!important;padding:0!important;border:0!important;transform:none!important;' +
      'z-index:2147483647!important;background:#000!important;}' +
      'video[' + ATTR + '],[' + ATTR + '] video{width:100%!important;height:100%!important;max-width:none!important;' +
      'max-height:none!important;object-fit:contain!important;}' +
      // Ancestors: a transform/filter/contain makes position:fixed relative to them, and their own
      // z-index would keep the player under the site header — neutralize while maximized.
      '[' + ANC + ']{transform:none!important;filter:none!important;perspective:none!important;contain:none!important;' +
      'will-change:auto!important;z-index:auto!important;overflow:visible!important;}' +
      'html[' + ANC + '],html[' + ANC + '] body{overflow:hidden!important;}';
    (document.head || document.documentElement).appendChild(s);
  }

  // The site's player box (video + its controls overlay): climb while the parent is about the
  // video's size, so the site's own play/pause/seek controls come along.
  function playerBox(video) {
    var vr = video.getBoundingClientRect(), node = video;
    while (node.parentElement && node.parentElement !== document.body && node.parentElement !== document.documentElement) {
      var r = node.parentElement.getBoundingClientRect();
      if (r.width > vr.width * 1.15 || r.height > vr.height * 1.4 || r.width < vr.width * 0.9) break;
      node = node.parentElement;
    }
    return node;
  }

  function apply(el) {
    ensureStyle();
    el.setAttribute(ATTR, '');
    for (var a = el.parentElement; a; a = a.parentElement) a.setAttribute(ANC, '');
    if (window.parent !== window) {
      try { window.parent.postMessage({ type: MSG, on: true }, '*'); } catch (e) { /* detached */ }
    }
  }

  function clear() {
    var marked = document.querySelectorAll('[' + ATTR + '],[' + ANC + ']');
    for (var i = 0; i < marked.length; i++) { marked[i].removeAttribute(ATTR); marked[i].removeAttribute(ANC); }
    current = null; box = null; childFrame = null;
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
    box = playerBox(v);
    apply(box);
  }

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
