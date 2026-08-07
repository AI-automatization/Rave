# WeWatch SEO/GEO/AEO — отчёт этапа 5

Дата: 2026-08-06; performance follow-up: 2026-08-07
Статус: локальный performance-remediation завершён; production CWV остаётся открытым до field data

## Что сделано

- Сняты 12 Lighthouse baseline-отчётов: 6 URL × mobile/desktop.
- Измерены Performance, Accessibility, Best Practices, SEO, FCP, LCP, TBT, CLS и transfer size.
- Проверены JS, third-party и image audits.
- Зафиксировано ограничение: Lighthouse navigation не измеряет production INP; для него нужен RUM/CrUX.
- Исправлены все подтверждённые accessibility failures.
- Добавлен Playwright regression suite на имена контролов, alt/размер изображений и keyboard focus.
- Выполнены повторные Lighthouse, build, SEO и crawler проверки.

## Изменения в коде

- `LandingNav.tsx`: локализованное accessible name для close button, декоративная иконка скрыта от accessibility tree.
- `LandingContent.tsx`:
  - hero H1 больше не скрывается до client animation — сокращён LCP render delay;
  - statistics block переведён с некорректного `dl` на корректный list;
  - удалены конфликтующие `aria-label` у CTA и demo steps;
  - повышен контраст marquee/demo labels;
  - screen tabs получили реальный 32×32 px touch target.
- `Footer.tsx`, `GuideChrome.tsx`, `ArticleMetadata.tsx`, отдельные EN/UZ шаблоны: контраст текста и CTA приведён к проходному уровню.
- `globals.css`: сохранён общий focus-visible ring; для solid violet CTA введён доступный более тёмный оттенок; editorial breadcrumbs сделаны светлее.
- `messages/{ru,uz,en}.json`: добавлено локализованное имя закрытия меню.
- `performance-accessibility.spec.ts`: 18 автоматических проверок на шести шаблонах.

## Результат

### Закрыто

- Accessibility mobile/desktop: **100/100 на 12/12 отчётах**.
- Best Practices: **100/100 на 12/12**.
- SEO: **100/100 на 12/12**.
- Failed binary Lighthouse audits: **0**.
- Playwright accessibility regression: **18/18 PASS**.
- CLS: **0**.
- RU home mobile LCP: **7.7 s → 3.9 s** в чистом контрольном прогоне.

### Первичный остаток до performance-remediation

- RU home mobile Performance: **53**, целевой зелёный диапазон не достигнут.
- RU home mobile TBT в финальном clean run: **2910 ms**.
- Landing остаётся монолитным client component с тяжёлой hydration/animation cost.
- Production INP, p75 LCP/CLS и реальный TTFB неизвестны до deploy и накопления field data.

### Performance-remediation 2026-08-07

- Framer Motion удалён из landing runtime; декоративные motion-props сохраняют статическую разметку через лёгкий adapter.
- Бесконечные JavaScript-анимации, random star generation, interval globe и requestAnimationFrame counter остановлены.
- Newsletter, FAQ и waitlist выделены в небольшие client islands.
- Глобальный React Query/Devtools provider убран с публичного root; locale provider получает только текущий набор переводов.
- Analytics переведён на `lazyOnload`, font payload ограничен нужными subset.
- Ниже-fold section получили `content-visibility: auto`; дорогой полноэкранный SVG turbulence удалён.
- Проверен server-only landing experiment. Он увеличил raw HTML/RSC примерно до 430 KiB и ухудшил main-thread parsing, поэтому не оставлен. Финальная client boundary сохраняет crawlable raw HTML примерно 238–239 KiB.

Три последовательных RU home mobile Lighthouse run в одном контролируемом Chrome-профиле:

| Run | Performance | LCP | TBT | CLS | A11y/BP/SEO |
|---:|---:|---:|---:|---:|---:|
| 1 | 75 | 3.714 s | 587 ms | 0 | 100/100/100 |
| 2 | 90 | 3.459 s | 145 ms | 0 | 100/100/100 |
| 3 | 90 | 3.443 s | 126 ms | 0 | 100/100/100 |
| **Median** | **90** | **3.459 s** | **145 ms** | **0** | **100/100/100** |

От исходного RU mobile baseline: Performance **50 → 90**, LCP **7.7 → 3.459 s**. TBT первого post-fix control **2910 → 145 ms**. LCP всё ещё выше полевой цели 2.5 s, поэтому production CWV нельзя объявлять закрытым. Разброс первого run показывает, почему фиксируется вся серия, а не только лучший score.

## Проверки

- `npm run build --workspace=web`: **PASS, 102/102 pages**.
- `npx playwright test apps/web/tests/performance-accessibility.spec.ts --project=web-chromium --workers=1`: **18/18 PASS**.
- `npm run test:seo`: **18/18 PASS**.
- `npm run check:crawlers --workspace=web -- http://localhost:3000`: **45/45 PASS**; landing raw HTML сохраняет 6199–7319 видимых символов.
- Lighthouse regression budget: **PASS**; first-party script 307.2 KiB, third-party script 165.7 KiB, total transfer 763.2 KiB.
- `git diff --check`: **PASS**.

Известный baseline проекта не изменён: standalone `tsc` имеет старые React type conflicts, lint заблокирован отсутствующим `zod-validation-error/v4`. Эти проблемы не созданы этапом 5.

## Решение по этапу

Этап 5 локально завершён: baseline, accessibility и обязательный performance-remediation выполнены и защищены regression budget. Это не означает, что Core Web Vitals production уже пройдены: LCP lab median выше 2.5 s, а p75 INP/LCP/CLS появятся только из RUM/CrUX после deploy.

Следующий этап — measurement/CI/post-deploy. Локальные measurement/CI материалы подготовлены; внешняя часть требует deploy и доступа владельца к GSC/Bing/Яндекс.
