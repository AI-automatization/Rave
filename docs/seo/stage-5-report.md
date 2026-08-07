# WeWatch SEO/GEO/AEO — отчёт этапа 5

Дата: 2026-08-06  
Статус: baseline и accessibility завершены; performance-remediation остаётся открытым P1

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

### Не закрыто

- RU home mobile Performance: **53**, целевой зелёный диапазон не достигнут.
- RU home mobile TBT в финальном clean run: **2910 ms**.
- Landing остаётся монолитным client component с тяжёлой hydration/animation cost.
- Production INP, p75 LCP/CLS и реальный TTFB неизвестны до deploy и накопления field data.

## Проверки

- `npm run build --workspace=web`: **PASS, 102/102 pages**.
- `npx playwright test apps/web/tests/performance-accessibility.spec.ts --project=web-chromium --workers=1`: **18/18 PASS**.
- `npm run test:seo`: **18/18 PASS**.
- `npm run check:crawlers --workspace=web -- http://127.0.0.1:3100`: **45/45 PASS**.
- `git diff --check`: **PASS**.

Известный baseline проекта не изменён: standalone `tsc` имеет старые React type conflicts, lint заблокирован отсутствующим `zod-validation-error/v4`. Эти проблемы не созданы этапом 5.

## Решение по этапу

Этап 5 как измерительный и accessibility-этап завершён. Нельзя заявлять, что performance полностью исправлен: цифры этого не подтверждают.

Следующий этап — measurement/CI/post-deploy, но перед production launch нужен обязательный performance workstream:

1. server/client island split для landing;
2. lazy-mount/stop below-the-fold infinite animations;
3. JS/third-party budget в CI;
4. повторный clean Lighthouse;
5. после deploy — RUM/CrUX p75 и настоящий INP.

