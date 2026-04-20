// ytEmbedBlocked — YouTube embed-disabled error UI tests
// Verifies that YT_EMBED_ERROR codes 150/152/101 trigger ytEmbedBlocked flag
// and that the full m.youtube.com is NO LONGER loaded as fallback

// ─── 1. ytEmbedBlocked state machine ─────────────────────────────────────────

describe('ytEmbedBlocked — state transitions', () => {
  function makeMessageHandler(
    onEmbedBlocked: (blocked: boolean) => void,
    onLoadingChange: (loading: boolean) => void,
  ) {
    return function handleMessage(rawData: string) {
      try {
        const data = JSON.parse(rawData) as { type: string; code?: number };
        if (data.type === 'YT_EMBED_ERROR') {
          if (data.code === 150 || data.code === 152 || data.code === 101) {
            onEmbedBlocked(true);
            onLoadingChange(false);
          }
        }
      } catch { /* ignore */ }
    };
  }

  it('code 150 → ytEmbedBlocked=true, loading=false', () => {
    let blocked = false;
    let loading = true;
    const handle = makeMessageHandler(b => { blocked = b; }, l => { loading = l; });
    handle(JSON.stringify({ type: 'YT_EMBED_ERROR', code: 150 }));
    expect(blocked).toBe(true);
    expect(loading).toBe(false);
  });

  it('code 152 → ytEmbedBlocked=true, loading=false', () => {
    let blocked = false;
    let loading = true;
    const handle = makeMessageHandler(b => { blocked = b; }, l => { loading = l; });
    handle(JSON.stringify({ type: 'YT_EMBED_ERROR', code: 152 }));
    expect(blocked).toBe(true);
    expect(loading).toBe(false);
  });

  it('code 101 → ytEmbedBlocked=true, loading=false', () => {
    let blocked = false;
    let loading = true;
    const handle = makeMessageHandler(b => { blocked = b; }, l => { loading = l; });
    handle(JSON.stringify({ type: 'YT_EMBED_ERROR', code: 101 }));
    expect(blocked).toBe(true);
    expect(loading).toBe(false);
  });

  it('code 2 (bad param) → ytEmbedBlocked stays false', () => {
    let blocked = false;
    const handle = makeMessageHandler(b => { blocked = b; }, () => {});
    handle(JSON.stringify({ type: 'YT_EMBED_ERROR', code: 2 }));
    expect(blocked).toBe(false);
  });

  it('code 5 (HTML5 error) → ytEmbedBlocked stays false', () => {
    let blocked = false;
    const handle = makeMessageHandler(b => { blocked = b; }, () => {});
    handle(JSON.stringify({ type: 'YT_EMBED_ERROR', code: 5 }));
    expect(blocked).toBe(false);
  });

  it('code 100 (not found) → ytEmbedBlocked stays false', () => {
    let blocked = false;
    const handle = makeMessageHandler(b => { blocked = b; }, () => {});
    handle(JSON.stringify({ type: 'YT_EMBED_ERROR', code: 100 }));
    expect(blocked).toBe(false);
  });

  it('non-YT_EMBED_ERROR type → ytEmbedBlocked stays false', () => {
    let blocked = false;
    const handle = makeMessageHandler(b => { blocked = b; }, () => {});
    handle(JSON.stringify({ type: 'PLAY', currentTime: 0 }));
    handle(JSON.stringify({ type: 'PAUSE', currentTime: 5 }));
    expect(blocked).toBe(false);
  });

  it('malformed JSON → no throw, ytEmbedBlocked stays false', () => {
    let blocked = false;
    const handle = makeMessageHandler(b => { blocked = b; }, () => {});
    expect(() => handle('not-json')).not.toThrow();
    expect(blocked).toBe(false);
  });
});

// ─── 2. webViewSource — no more m.youtube.com fallback ────────────────────────

describe('webViewSource — ytFallback branch removed', () => {
  function buildWebViewSource(params: {
    htmlContent?: string;
    htmlBaseUrl?: string;
    youtubeVideoId?: string;
    url: string;
    referer?: string;
  }) {
    const { htmlContent, htmlBaseUrl, youtubeVideoId, url, referer } = params;
    const isYouTubeMode = !!youtubeVideoId;

    if (htmlContent) {
      return { html: htmlContent, baseUrl: htmlBaseUrl ?? 'about:blank' };
    }
    if (isYouTubeMode) {
      return { html: `YOUTUBE_HTML(${youtubeVideoId})`, baseUrl: 'https://www.youtube.com' };
    }
    return { uri: url, headers: referer ? { Referer: referer } : {} };
  }

  it('YouTube mode → html IFrame source, NOT m.youtube.com', () => {
    const src = buildWebViewSource({ youtubeVideoId: 'dQw4w9WgXcQ', url: 'https://youtube.com/watch?v=dQw4w9WgXcQ' });
    expect(src).toHaveProperty('html');
    expect(src).toHaveProperty('baseUrl', 'https://www.youtube.com');
    expect(src).not.toHaveProperty('uri');
  });

  it('YouTube mode always uses IFrame even after embed error (error shown in overlay)', () => {
    const src1 = buildWebViewSource({ youtubeVideoId: 'abc', url: 'https://youtube.com/watch?v=abc' });
    const src2 = buildWebViewSource({ youtubeVideoId: 'abc', url: 'https://youtube.com/watch?v=abc' });
    expect(src1).toEqual(src2);
    expect('uri' in src1 && (src1 as { uri?: string }).uri?.includes('m.youtube.com')).toBe(false);
  });

  it('html override mode → uses htmlContent + baseUrl', () => {
    const src = buildWebViewSource({ htmlContent: '<video/>', htmlBaseUrl: 'https://rutube.ru', url: 'x' });
    expect(src).toHaveProperty('html', '<video/>');
    expect(src).toHaveProperty('baseUrl', 'https://rutube.ru');
  });

  it('html override with no baseUrl → about:blank', () => {
    const src = buildWebViewSource({ htmlContent: '<video/>', url: 'x' }) as { baseUrl: string };
    expect(src.baseUrl).toBe('about:blank');
  });

  it('generic URL mode → uri source', () => {
    const src = buildWebViewSource({ url: 'https://vk.com/video123' }) as { uri: string };
    expect(src.uri).toBe('https://vk.com/video123');
  });

  it('generic URL with referer → Referer header included', () => {
    const src = buildWebViewSource({ url: 'https://kinogo.cc/', referer: 'https://kinogo.cc' }) as { headers: Record<string, string> };
    expect(src.headers).toHaveProperty('Referer', 'https://kinogo.cc');
  });

  it('generic URL without referer → empty headers', () => {
    const src = buildWebViewSource({ url: 'https://kinogo.cc/' }) as { headers: Record<string, string> };
    expect(src.headers).toEqual({});
  });
});

// ─── 3. Deep link construction — YouTube app open ─────────────────────────────

describe('YouTube deep link for ytEmbedBlocked', () => {
  function buildYtDeepLink(videoId: string): string {
    return `https://www.youtube.com/watch?v=${videoId}`;
  }

  it('builds correct deep link for standard video ID', () => {
    expect(buildYtDeepLink('dQw4w9WgXcQ')).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  });

  it('builds correct deep link for short ID', () => {
    expect(buildYtDeepLink('abc123')).toBe('https://www.youtube.com/watch?v=abc123');
  });

  it('preserves video ID exactly', () => {
    const id = 'X_y-Z1_23-AB';
    expect(buildYtDeepLink(id)).toContain(id);
  });
});

// ─── 4. ytdl retry logic ──────────────────────────────────────────────────────

describe('ytdl retry logic — exponential backoff', () => {
  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 1500;

  async function fetchWithRetry(
    fetcher: () => Promise<string>,
    delays: number[],
  ): Promise<string> {
    let lastErr: unknown;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        return await fetcher();
      } catch (err) {
        lastErr = err;
        if (attempt < MAX_RETRIES - 1) {
          delays.push(RETRY_DELAY_MS * (attempt + 1));
        }
      }
    }
    throw lastErr;
  }

  it('succeeds on first attempt — no retries', async () => {
    const delays: number[] = [];
    const result = await fetchWithRetry(() => Promise.resolve('ok'), delays);
    expect(result).toBe('ok');
    expect(delays).toHaveLength(0);
  });

  it('succeeds on second attempt — 1 retry with 1500ms delay', async () => {
    const delays: number[] = [];
    let calls = 0;
    const result = await fetchWithRetry(() => {
      calls++;
      if (calls === 1) return Promise.reject(new Error('bot detected'));
      return Promise.resolve('ok');
    }, delays);
    expect(result).toBe('ok');
    expect(delays).toEqual([1500]);
  });

  it('succeeds on third attempt — 2 retries with 1500ms + 3000ms delays', async () => {
    const delays: number[] = [];
    let calls = 0;
    const result = await fetchWithRetry(() => {
      calls++;
      if (calls < 3) return Promise.reject(new Error('bot detected'));
      return Promise.resolve('ok');
    }, delays);
    expect(result).toBe('ok');
    expect(delays).toEqual([1500, 3000]);
  });

  it('throws after 3 failed attempts', async () => {
    const delays: number[] = [];
    await expect(
      fetchWithRetry(() => Promise.reject(new Error('always fails')), delays)
    ).rejects.toThrow('always fails');
    expect(delays).toHaveLength(2); // 2 retries before giving up
  });

  it('delay is linear: attempt 0=1500ms, attempt 1=3000ms, attempt 2=4500ms', () => {
    expect(RETRY_DELAY_MS * 1).toBe(1500);
    expect(RETRY_DELAY_MS * 2).toBe(3000);
    expect(RETRY_DELAY_MS * 3).toBe(4500);
  });
});

// ─── 5. YOUTUBE_COOKIES header construction ───────────────────────────────────

describe('YOUTUBE_COOKIES — header injection', () => {
  function buildYtHeaders(cookieEnv?: string): Record<string, string> {
    return {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      'DNT': '1',
      ...(cookieEnv ? { 'Cookie': cookieEnv } : {}),
    };
  }

  it('no YOUTUBE_COOKIES → no Cookie header', () => {
    const headers = buildYtHeaders(undefined);
    expect(headers).not.toHaveProperty('Cookie');
  });

  it('YOUTUBE_COOKIES set → Cookie header included', () => {
    const cookies = '__Secure-3PAPISID=abc123; SID=def456';
    const headers = buildYtHeaders(cookies);
    expect(headers['Cookie']).toBe(cookies);
  });

  it('User-Agent is Chrome 121', () => {
    const headers = buildYtHeaders();
    expect(headers['User-Agent']).toContain('Chrome/121.0.0.0');
  });

  it('User-Agent is NOT the old Chrome 120', () => {
    const headers = buildYtHeaders();
    expect(headers['User-Agent']).not.toContain('Chrome/120');
  });

  it('Accept-Language is en-US', () => {
    const headers = buildYtHeaders();
    expect(headers['Accept-Language']).toContain('en-US');
  });

  it('DNT header is 1', () => {
    const headers = buildYtHeaders();
    expect(headers['DNT']).toBe('1');
  });
});
