# Backlink and mention plan

Written 2026-08-11, updated 2026-08-19. Owner: Yakubov (SEO/GEO/AEO).

## The five RU roundups — now the primary channel

Between writing this plan and this update, competitor profiling turned up something
the directory tiers below don't capture: five Russian media roundups already rank for
our exact intents ("смотреть кино вместе", "смотреть youtube вместе") and list our
direct competitors, not us. One of them — eldorado.ru/blog — outranks our own hub page
for "смотреть кино вместе". Getting into these five moves links and AI-answer citation
at once; nothing in Tier A/B below does that.

| Outlet | Angle | Contact | Sent |
|---|---|---|---|
| media.halvacard.ru | only they lack a direct-MP4-sync service | media.halvacard@sovcombank.ru | 2026-08-18 |
| journal.sovcombank.ru | list has gone stale (Teleparty/Scener need foreign streaming) | feedback form / blog@sovcombank.ru | 2026-08-18 |
| eldorado.ru/blog | every listed competitor needs an app or account | blog@eldorado.ru | 2026-08-18 |
| raiffeisen-media.ru | none of their picks sync VK Video or Rutube | feedback form / rmedia@raiffeisen.ru | 2026-08-18 |
| hi-tech.mail.ru | none of their 10 publish a sync tolerance number | i.ostapenko@corp.mail.ru | 2026-08-18 |

All five pitched 2026-08-18. Checked live 2026-08-19: no reply, no mention yet on any
of the five pages — expected, one day is too early. Re-check in a few days rather than
daily. One typo shipped in the halvacard subject line ("совмесного" instead of
"совместного") — noted, not worth a follow-up over one letter.

Full pitch texts and per-outlet contact verification: Obsidian
`Claude/Projects/WeWatch Roundup Pitches.md` (not duplicated here — that file is the
working copy, this file is the standing plan).

## Why this exists

Measured in Bing Webmaster Tools on 2026-08-11:

| | |
|---|---|
| Referring domains | **1** — `tezcode.dev` only |
| Referring pages | 5 |
| Bing verdict | "Your site lacks inbound links from high-quality domains" (Moderate) |
| Copilot citations, 3 months | **1** |

Nothing else on the site is broken: Bing reports zero page-level errors, the sitemap
is clean, IndexNow works. The gap is that no independent domain vouches for us.

Two consequences, and the second is the one that matters most here:

1. **Indexing.** Google has 60 pages indexed, Bing 26, Yandex 25. Crawlers ration
   attention by how well-referenced a site is.
2. **AI answers.** The 2026-08-10 baseline recorded who gets quoted instead of us in
   English AI answers: Reddit (twice), Watch2Gether, Kosmi, Hyperbeam, PureWow. Only
   one of those is a vendor's own site. Assistants quote aggregators, comparison
   pages and forum threads — being absent from those is why we are absent from the
   answers.

So the goal is not "acquire links". It is **be present where an assistant looks when
someone asks how to watch a video together.** A `nofollow` mention on a site an LLM
reads is worth more to us than a `dofollow` link on a site nobody quotes.

## Rules

- **Never buy links.** Google and Yandex both penalise it, and recovery costs more
  than the links were worth.
- **Never post the same text twice.** Duplicate blurbs across directories read as
  spam to both search engines and reviewers.
- **Never claim what the product does not do.** Every listing below is written from
  `apps/web/src/data/product-facts.ts` and `llms.txt`. Do not add "unlimited",
  "any video site", "free forever" or a Pro price — Pro is `planned` with
  `purchaseAvailability: 'unavailable'`.
- **One account per platform, owned by the company**, not by a personal profile that
  leaves when its owner does.

## Directories and entity links — secondary tier

Measured 2026-08-15 across 4 queries × 3 AI engines: G2, Capterra, SaaSHub, Crunchbase
and Product Hunt produced **zero** AI-answer citations between them. Keep this tier for
what it actually does — link authority and entity confirmation (the org exists, is who
it says it is) — not for AI-answer presence. The RU roundups above are what moves that
number; this tier is the background work that keeps running underneath it.

Effort is one person's time, assuming texts below are copy-pasted.

### Tier A — read by AI assistants

| # | Platform | Why this one | Effort |
|---|---|---|---|
| 1 | **AlternativeTo** | Watch2Gether and Kosmi — the two competitors quoted instead of us — are both listed. This is the single most quoted source type for "alternative to X" questions. | 15 min |
| 2 | **Product Hunt — fix the existing listing** | We launched on 2026-06-17 at `/products/wewatch-3`. Getting listed is done; the copy on it is the problem. See below. | 15 min |
| 3 | **SaaSHub** | Mirrors AlternativeTo's "alternatives" structure; cheap to add once #1 is written. | 10 min |
| 4 | **Slant** ("best watch party apps") | List-format pages rank and get quoted for "best X" queries. | 15 min |

> ### Product Hunt: we are listed, and the listing contradicts the product
>
> Ours is `/products/wewatch-3` — launched 2026-06-17, 7 followers, 2 upvotes. (The
> `/wewatch` slug belongs to an unrelated 2021 Android app on `wewatchapp.xyz`; brand
> queries for "WeWatch" are therefore not ours by default, which is one more reason
> the entity signals in Tier C matter.)
>
> The live description makes four claims the product does not support — three of them
> are the exact strings `seo-geo-aeo.spec.ts` blocks on our own pages:
>
> | Published on Product Hunt | Reality |
> |---|---|
> | "a free watch party app **for iOS & Android**" | `product-facts.ts`: ios/android are `planned`. There is no app. |
> | "Rutube and **any website**" / "Works with **ANY video site**" | Caught by `UNVERIFIED_PRODUCT_CLAIMS`. Sources are YouTube, VK Video, Rutube, direct .mp4. |
> | "**iPhone + Android** + browser in one room" | Browsers on those devices — not native apps. |
> | "**premium plans** for power users" | `purchaseAvailability: 'unavailable'`. No payment provider exists in the codebase. |
>
> This matters more than a typo. The page mentions `wewatch.uz` 33 times, so it is
> precisely the kind of source an assistant reads and quotes about us — and a visitor
> who comes looking for the iOS app finds no app and no explanation. The claims gate
> we enforce in CI stops at our own domain; nothing was watching what we say elsewhere.
>
> Replace with the Medium English text below, which is written from `product-facts.ts`.
> The differences that matter: "browsers on desktop, iPhone and Android" rather than an
> app, a named source list rather than "any website", and "core watch-party features
> are free" rather than premium plans.

### Tier B — Russia and Uzbekistan, our largest reserve

Russia is 1127 impressions at 7.6% CTR against 28.1% in Uzbekistan — the demand is
there and we convert it badly.

| # | Platform | Why this one | Effort |
|---|---|---|---|
| 5 | **vc.ru** | A build story ("how we synchronise playback across devices") — not an ad. Strong domain, indexed by Yandex fast. | 2–3 h to write |
| 6 | **Habr** | The sync mechanism (500 ms drift correction, server clock) is genuinely technical and will survive Habr's audience. Highest-authority RU link available to us for free. | 3–4 h to write |
| 7 | **Product Radar** | Russian-language Product Hunt equivalent. | 15 min |
| 8 | **UZ/RU Telegram tech channels** | Where our Uzbek audience already is; drives real traffic, not just links. We have no channel of our own yet (one is planned), so this means posting in other people's — which needs a pitch, not a press release. | 30 min |

Budget for all of the above: **zero**, confirmed 2026-08-11. Nothing in this plan
requires paying anyone, and no partner announcements are available through Bekzod or
Emirhan either — so reach has to come from being genuinely useful in each venue.

### Tier C — free and mechanical, do first

| # | Platform | Why this one | Effort |
|---|---|---|---|
| 9 | **Instagram bio wording** | `@wewatch.tezcode` already links to `wewatch.uz` (checked 2026-08-11) — the link is done. What is not: the bio reads "Watch party platformasi — **tez kunda**" (coming soon) for a product that is live. Anyone arriving from a directory listing reads "not ready yet" and leaves. | 5 min |
| 10 | **LinkedIn + Crunchbase company profiles** | Entity signals: they tie WeWatch to TEZ KOD LLC, which is what `jsonLdOrg` in the code already asserts. | 30 min |

**Already done — verified 2026-08-11, do not redo:**

- **GitHub repo.** `homepage: https://wewatch.uz` is set and the README links to the
  site three times (checked via the GitHub API).
- **tezcode.dev case page.** `www.tezcode.dev/wewatch` returns 200, mentions the
  domain 19 times and carries two links to `https://wewatch.uz` with
  `rel="noopener noreferrer"` — no `nofollow`, so they pass authority. This is where
  the 5 referring pages Bing counts come from.

Both of these entered this file as work items before being checked, and both turned
out to be finished. Verify before assigning: the cheap-looking task is the one most
likely to already be done.

### Tier D — Reddit, handle with care

Reddit is quoted twice in the English AI answers we lose. But posting a link as a new
account gets removed and can burn the domain. The only workable route is a real
account that participates for a few weeks before ever mentioning WeWatch, answering
questions in r/longdistance, r/movies, r/software where "how do we watch together"
comes up organically. Assign it to a person who already uses Reddit, or skip it.

## Ready-to-paste texts

Every fact below is verified. Pick the length the form asks for.

### English

**Tagline (60 chars)**
```
Watch YouTube, VK Video and Rutube together, in sync
```

**Short (160 chars)**
```
WeWatch is a watch-party platform: open a room, share the link, and YouTube, VK Video
or Rutube stays in sync for everyone. Free, in the browser.
```

**Medium (~400 chars)**
```
WeWatch keeps a video in sync between everyone in a room. One person presses play,
pause or seek — it applies to all participants at the same moment, across browsers on
desktop, iPhone and Android. Supports YouTube, VK Video, Rutube and direct .mp4 links,
with live chat and emoji reactions in every room. Up to 10 participants. Core
watch-party features are free. Native iOS and Android apps are in development.
```

**Long (~800 chars, for Product Hunt / vc.ru intro)**
```
Watching something "together" while apart usually means counting down "3, 2, 1, play"
and drifting apart a minute later — different connections, different buffering.

WeWatch fixes the drift instead of asking people to manage it. Everyone in a room
shares one playback position: play, pause and seek propagate in real time, and a
participant who falls more than half a second behind is pulled back automatically.

Create a room, paste a YouTube, VK Video, Rutube or direct .mp4 link, and send the
invite. Guests join from the link — only the room creator needs an account. Rooms hold
up to 10 people and include live chat and emoji reactions, so the reactions land while
the scene is still on screen.

It runs in the browser on desktop, iPhone and Android; native mobile apps are in
development. Core watch-party features are free.

Built by tezcode in Tashkent, Uzbekistan. Interface in Russian, Uzbek and English.
```

**Tags / categories**
```
watch party, video streaming, social viewing, YouTube, long distance,
entertainment, collaboration
```

### Русский

**Короткое (160 знаков)**
```
WeWatch — совместный просмотр видео: создайте комнату, отправьте ссылку, и YouTube,
VK Видео или Rutube идёт синхронно у всех. Бесплатно, прямо в браузере.
```

**Среднее (~400 знаков)**
```
WeWatch держит видео синхронно у всех участников комнаты: один нажимает паузу или
перематывает — то же самое происходит у остальных в тот же момент. Работает в
браузерах на компьютере, iPhone и Android. Поддерживает YouTube, VK Видео, Rutube и
прямые .mp4-ссылки, в каждой комнате есть чат и эмодзи-реакции. До 10 участников.
Основные функции совместного просмотра бесплатны. Приложения для iOS и Android
находятся в разработке.
```

**Длинное (~800 знаков, для vc.ru / Product Radar)**
```
Смотреть «вместе» на расстоянии обычно означает считать «три, два, один, поехали» — и
через минуту разъехаться на разных таймкодах из-за разной скорости интернета и
буферизации.

WeWatch убирает саму проблему рассинхрона. У всех в комнате одна позиция
воспроизведения: пауза, плей и перемотка применяются ко всем одновременно, а
участник, отставший больше чем на полсекунды, подтягивается автоматически.

Создайте комнату, вставьте ссылку на YouTube, VK Видео, Rutube или прямой .mp4 — и
отправьте приглашение. Гость заходит по ссылке, аккаунт нужен только создателю
комнаты. В комнате до 10 человек, есть чат и эмодзи-реакции: реакция долетает, пока
сцена ещё на экране.

Работает в браузере на компьютере, iPhone и Android; нативные приложения находятся в
разработке. Основные функции бесплатны.

Сделано в tezcode, Ташкент. Интерфейс на русском, узбекском и английском.
```

**Теги**
```
совместный просмотр, watch party, видео, YouTube, отношения на расстоянии,
развлечения
```

## Order of work

1. **Now:** wait on the five RU roundups above — replies and live mentions, checked
   every few days, not daily.
2. **In parallel:** Tier A (#1–4) and Tier C (#9–10) below. All copy-paste.
3. **Next:** one Habr or vc.ru article. This is the only item that needs real writing
   time, and it is also the only one likely to bring a link other people repeat.
4. **Measure at 30 days:** referring domains in Bing, Copilot citations, and pages
   indexed by Bing and Yandex. Baseline to compare against is the table at the top of
   this file.

Do not do all of it at once — a domain that gains twenty listings in one day looks
exactly like a domain buying them.
