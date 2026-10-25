// Movie sites show their player as a small box inside the page (header, ads, comments around it),
// so the VB screencast showed the film letterboxed in page clutter. This init script (every frame
// of a VB page, see virtualBrowser.service.ts) blows the playing movie's player up to the whole
// viewport with CSS: the player box keeps its own pixel size and is scaled (transform) to fit, so
// the site's own play button / control bar stay laid out exactly as the site's JS placed them
// (resizing the box instead left them off-center and off-screen — live test 2026-10-26). The Fullscreen API can't be used: it needs a user gesture the VB page
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
    var fixed = 'position:fixed!important;margin:0!important;max-width:none!important;max-height:none!important;' +
      'min-width:0!important;min-height:0!important;z-index:2147483647!important;';
    s.textContent =
      // Player box in this document: frozen at its own size, scaled to fit, centered.
      '[' + ATTR + '="scale"]{' + fixed + 'left:var(--ww-x)!important;top:var(--ww-y)!important;right:auto!important;' +
      'bottom:auto!important;width:var(--ww-w)!important;height:var(--ww-h)!important;' +
      'transform:scale(var(--ww-k))!important;transform-origin:0 0!important;}' +
      // An iframe holding the player: really resized, so the frame's own page lays out for it.
      '[' + ATTR + '="fill"]{' + fixed + 'left:0!important;top:0!important;width:100vw!important;height:100vh!important;' +
      'transform:none!important;border:0!important;}' +
      '#__wewatch_full_bg{position:fixed;left:0;top:0;width:100vw;height:100vh;background:#000;z-index:2147483646;}' +
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

  // Size of the box before it was taken out of the page — the scale is always worked out from it.
  var boxW = 0, boxH = 0;

  function fit(el) {
    var vw = window.innerWidth, vh = window.innerHeight;
    var k = Math.min(vw / boxW, vh / boxH);
    el.style.setProperty('--ww-k', String(k));
    el.style.setProperty('--ww-w', boxW + 'px');
    el.style.setProperty('--ww-h', boxH + 'px');
    el.style.setProperty('--ww-x', Math.round((vw - boxW * k) / 2) + 'px');
    el.style.setProperty('--ww-y', Math.round((vh - boxH * k) / 2) + 'px');
  }

  function apply(el, mode) {
    ensureStyle();
    if (mode === 'scale') {
      var r = el.getBoundingClientRect();
      boxW = Math.max(1, r.width); boxH = Math.max(1, r.height);
      fit(el);
    }
    el.setAttribute(ATTR, mode);
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
    for (var i = 0; i < marked.length; i++) {
      marked[i].removeAttribute(ATTR);
      marked[i].removeAttribute(ANC);
      ['--ww-k', '--ww-w', '--ww-h', '--ww-x', '--ww-y'].forEach(function (v) { marked[i].style.removeProperty(v); });
    }
    var bg = document.getElementById('__wewatch_full_bg');
    if (bg) bg.remove();
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
    apply(box, 'scale');
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
  // An iframe player's window grows when the parent frame maximizes the iframe — refit.
  window.addEventListener('resize', function () { if (box) fit(box); });

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
        apply(frames[i], 'fill');
      } else if (childFrame === frames[i]) {
        clear();
      }
      return;
    }
  });
})();
`;
