// WeWatch Mobile — YouTube IFrame API HTML page builder
// source={{ html }} rejimi — URI orqali cross-origin restriction yo'q
// window._csVideo proxy: play/pause/seekTo ref metodlari uchun

export function buildYouTubeHtml(videoId: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: #000; overflow: hidden; }
    #yt { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="yt"></div>
  <script src="https://www.youtube.com/iframe_api" async onerror="onIframeApiScriptError()"></script>
  <script>
    var ytPlayer = null;
    var progressTimer = null;
    // Command queue: if sync commands arrive before IFrame API is ready
    var pendingSeek = null;
    var pendingPlay = null; // null=no cmd, true=play, false=pause
    var apiReadyFired = false;

    function rn(obj) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(obj));
      }
    }

    // The RN-side LOAD_TIMEOUT_MS (useWebViewPlayer.ts) only fires an error if NOT ONE
    // message arrived within 12s — but a viewer stuck here previously got silence forever
    // with no visible feedback (permanent black screen, no spinner, no retry button) whenever
    // the iframe_api script failed outright (blocked network/DNS) or loaded but never called
    // onYouTubeIframeAPIReady. Surface both cases explicitly instead of relying on total silence.
    function onIframeApiScriptError() {
      if (apiReadyFired) return;
      rn({ type: 'YT_EMBED_ERROR', code: -1 });
    }
    var apiLoadTimeout = setTimeout(onIframeApiScriptError, 8000);

    // Declare _csVideo GLOBALLY so injectWithRetry can find it even before IFrame ready
    window._csVideo = {
      get currentTime() { return ytPlayer ? ytPlayer.getCurrentTime() : (pendingSeek || 0); },
      set currentTime(t) {
        pendingSeek = t;
        if (ytPlayer) { ytPlayer.seekTo(t, true); }
        rn({ type: 'SEEK', currentTime: t });
      },
      play: function() {
        pendingPlay = true;
        if (ytPlayer) ytPlayer.playVideo();
      },
      pause: function() {
        pendingPlay = false;
        if (ytPlayer) ytPlayer.pauseVideo();
      },
      get paused() {
        if (!ytPlayer) return pendingPlay !== true;
        try { return ytPlayer.getPlayerState() !== YT.PlayerState.PLAYING; } catch(e) { return true; }
      }
    };

    function onYouTubeIframeAPIReady() {
      apiReadyFired = true;
      clearTimeout(apiLoadTimeout);
      ytPlayer = new YT.Player('yt', {
        videoId: '${videoId}',
        playerVars: {
          autoplay: 1,
          playsinline: 1,
          controls: 1,
          rel: 0,
          modestbranding: 1,
          iv_load_policy: 3
        },
        events: {
          onReady: function(e) {
            // Apply queued commands from before player was ready
            if (pendingSeek !== null) {
              e.target.seekTo(pendingSeek, true);
              pendingSeek = null;
            }
            if (pendingPlay === true) {
              e.target.playVideo();
            } else if (pendingPlay === false) {
              e.target.pauseVideo();
            }
            // No default autoplay — sync command controls playback.
            // Android WebView blocks autoplay without user gesture; letting
            // the owner's first VIDEO_SYNC/PLAY event trigger play() instead
            // avoids the silent failure where playVideo() is called but ignored.
            pendingPlay = null;

            rn({ type: 'VIDEO_FOUND' });
            // 500ms interval so heartbeat drift correction has fresh position data.
            // Was 2000ms — caused up to 2s position staleness in getPositionMs().
            progressTimer = setInterval(function() {
              if (ytPlayer && ytPlayer.getPlayerState() === YT.PlayerState.PLAYING) {
                rn({ type: 'PROGRESS', currentTime: ytPlayer.getCurrentTime(), duration: ytPlayer.getDuration() || 0 });
              }
            }, 500);
          },
          onStateChange: function(e) {
            var ct = ytPlayer ? ytPlayer.getCurrentTime() : 0;
            if (e.data === YT.PlayerState.PLAYING) {
              rn({ type: 'BUFFERING', isBuffering: false });
              rn({ type: 'PLAY', currentTime: ct });
            } else if (e.data === YT.PlayerState.PAUSED) {
              rn({ type: 'PAUSE', currentTime: ct });
            } else if (e.data === YT.PlayerState.BUFFERING) {
              rn({ type: 'BUFFERING', isBuffering: true });
            }
          },
          onError: function(e) {
            rn({ type: 'YT_EMBED_ERROR', code: e.data });
          }
        }
      });
    }
  </script>
</body>
</html>`;
}
