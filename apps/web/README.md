# WeWatch — Web (apps/web)

Next.js 16 (App Router) marketing + legal site served at **https://wewatch.uz**.
The authenticated app (`/room`, `/login`, `/profile` …) lives at `app.wewatch.uz` —
`next.config.mjs` 301-redirects those paths there.

## Development

```bash
cp .env.example .env.local
npm install
npm run dev            # http://localhost:3000
npm run build          # production build
npm run lint           # eslint src
```

## SEO / GEO / AEO

The site is optimized to be readable and citable by AI answer engines (ChatGPT,
Claude, Perplexity, Google AI Overviews), which do **not** execute JavaScript —
every piece of primary content must exist in the server-rendered HTML.

| Artifact | File |
|---|---|
| robots.txt (generated) | `src/app/robots.ts` — do **not** add a static `public/robots.txt`, it would shadow this route |
| sitemap.xml | `src/app/sitemap.ts` — single `ENTRIES` list; add every new indexable page here |
| AI crawler brief | `public/llms.txt` |
| OG image | `src/app/og-image/route.tsx` (Satori — every multi-child `<div>` needs `display:flex`) |

### Crawler visibility check

```bash
npm run check:crawlers                              # against https://wewatch.uz
npm run check:crawlers -- http://localhost:3000     # against a local build
```

Fetches each key route as GPTBot, ClaudeBot, PerplexityBot, Googlebot and a normal
browser, strips markup, and fails if any agent sees fewer than 1000 visible
characters or is missing the route's required keywords.

### IndexNow

IndexNow pushes changed URLs to Bing, Yandex, Seznam and Naver immediately
(Google does not participate — the sitemap still covers it).

Setup:

1. `INDEXNOW_KEY` must equal the filename served from `public/<key>.txt`.
   The committed key is `b7a4e5408d77764d08338835ee8cdd0e`; to rotate it, generate a
   new one (`openssl rand -hex 16`), rename the public file and update the env var.
2. Set `INDEXNOW_SECRET` in the deployment environment — it guards the endpoint.

After a deploy that changed content:

```bash
curl -X POST https://wewatch.uz/api/indexnow \
  -H "x-indexnow-secret: $INDEXNOW_SECRET"
```

Submits every URL from `sitemap.ts`. To submit only specific pages:

```bash
curl -X POST https://wewatch.uz/api/indexnow \
  -H "x-indexnow-secret: $INDEXNOW_SECRET" \
  -H "content-type: application/json" \
  -d '{"urls":["https://wewatch.uz/faq"]}'
```

### Conventions worth knowing

- The root layout sets the title template `%s | WeWatch` — never append `| WeWatch`
  manually in a page's `title`; use `title: { absolute: '…' }` when the title must
  start with the brand.
- Every new page needs `alternates.canonical` and an entry in `sitemap.ts`.
- Guides use `src/components/common/GuideChrome.tsx` (server component, zero client JS).
- Locales: `/` = ru (default), `/uz`, `/en` — separate subtrees, hreflang declared
  per page in `alternates.languages`.
- Factual claims about sync behaviour come from `shared/src/constants/index.ts`
  (`SYNC_DRIFT_WINDOW_MS`, `LIMITS.MAX_WATCH_PARTY_MEMBERS`, `ROOM_INACTIVE_MINUTES`) —
  keep page copy, JSON-LD and `llms.txt` consistent with those values.
