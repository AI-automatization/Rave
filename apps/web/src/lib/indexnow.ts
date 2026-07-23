/**
 * IndexNow — pushes changed URLs to Bing, Yandex, Seznam and Naver in one call
 * instead of waiting for the next crawl. Google does not participate, so this
 * complements the sitemap rather than replacing it.
 *
 * The key must be served as a plain-text file at `${host}/${key}.txt` containing
 * exactly the key — that file is how the engines verify we own the domain.
 */

const ENDPOINT = 'https://api.indexnow.org/indexnow';

export type IndexNowResult = {
  ok: boolean;
  status: number;
  submitted: number;
  message: string;
};

export async function submitToIndexNow(urls: string[]): Promise<IndexNowResult> {
  const key = process.env.INDEXNOW_KEY;
  if (!key) {
    return { ok: false, status: 0, submitted: 0, message: 'INDEXNOW_KEY is not set' };
  }
  if (urls.length === 0) {
    return { ok: false, status: 0, submitted: 0, message: 'No URLs to submit' };
  }

  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';
  const host = new URL(base).host;

  // IndexNow rejects a batch where any URL belongs to a different host.
  const foreign = urls.filter((u) => new URL(u).host !== host);
  if (foreign.length > 0) {
    return {
      ok: false,
      status: 0,
      submitted: 0,
      message: `URLs from a foreign host: ${foreign.slice(0, 3).join(', ')}`,
    };
  }

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host,
      key,
      keyLocation: `${base}/${key}.txt`,
      urlList: urls,
    }),
  });

  // 200 = accepted, 202 = accepted but key still being validated. Both are success.
  const ok = res.status === 200 || res.status === 202;
  return {
    ok,
    status: res.status,
    submitted: ok ? urls.length : 0,
    message: ok ? 'Accepted' : await res.text().catch(() => 'Request failed'),
  };
}
