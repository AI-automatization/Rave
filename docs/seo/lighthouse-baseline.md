# WeWatch — Lighthouse baseline этапа 5

Дата: 2026-08-06  
Инструмент: `lighthouse@12.8.2`, Chrome 150, локальная production-сборка (`next build` + `next start`)  
Категории: Performance, Accessibility, Best Practices, SEO

## Покрытие

Проверены шесть репрезентативных URL в mobile и desktop режимах:

- `/ru`, `/uz`, `/en` — общий landing template;
- `/ru/guides/smotret-vmeste-onlayn` — русский editorial template;
- `/uz/how-it-works` — узбекский answer/how-to template;
- `/en/guides/watch-youtube-together` — английский editorial template.

Всего: 12 Lighthouse-отчётов до изменений и 12 повторных отчётов после первой серии исправлений. JSON хранится во временном каталоге рабочей машины, а воспроизводимые итоги — в этом документе.

## Baseline до изменений

| Отчёт | Perf | A11y | BP | SEO | FCP | LCP | TBT | CLS | Вес |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| RU home mobile | 50 | 89 | 100 | 100 | 3.3 s | 7.7 s | 650 ms | 0 | 803 KiB |
| UZ home mobile | 50 | 89 | 100 | 100 | 3.1 s | 7.8 s | 700 ms | 0 | 800 KiB |
| EN home mobile | 64 | 89 | 100 | 100 | 1.2 s | 5.7 s | 540 ms | 0 | 798 KiB |
| RU guide mobile | 87 | 96 | 100 | 100 | 1.2 s | 3.7 s | 200 ms | 0 | 665 KiB |
| UZ how-to mobile | 86 | 96 | 100 | 100 | 1.1 s | 3.5 s | 250 ms | 0 | 662 KiB |
| EN guide mobile | 84 | 95 | 100 | 100 | 1.2 s | 3.7 s | 270 ms | 0 | 675 KiB |
| RU home desktop | 95 | 94 | 100 | 100 | 0.4 s | 1.4 s | 30 ms | 0 | 803 KiB |
| UZ home desktop | 97 | 94 | 100 | 100 | 0.3 s | 1.3 s | 0 ms | 0 | 799 KiB |
| EN home desktop | 96 | 94 | 100 | 100 | 0.3 s | 1.4 s | 10 ms | 0 | 798 KiB |
| RU guide desktop | 100 | 96 | 100 | 100 | 0.3 s | 0.8 s | 0 ms | 0 | 665 KiB |
| UZ how-to desktop | 100 | 96 | 100 | 100 | 0.3 s | 0.7 s | 0 ms | 0 | 662 KiB |
| EN guide desktop | 100 | 95 | 100 | 100 | 0.3 s | 0.7 s | 0 ms | 0 | 675 KiB |

## Подтверждённые причины

### Accessibility

Lighthouse нашёл системные ошибки:

- `color-contrast` на всех шести шаблонах;
- кнопка закрытия mobile menu без accessible name;
- `label-content-name-mismatch` у hero CTA и demo step buttons;
- некорректная семантика `dl` в landing statistics;
- touch targets 10×10 px у demo screen tabs.

`image-alt` и `unsized-images` не проваливались. Дополнительная Playwright-проверка подтвердила alt, зарезервированное отображаемое место, имена интерактивных элементов и видимый keyboard focus.

### Performance

Для RU home mobile baseline:

- 70 запросов;
- около 524 KiB JavaScript;
- около 204 KiB third-party transfer;
- Google Analytics — примерно 160–170 KiB transfer;
- Lighthouse оценивал потенциально неиспользуемый JS примерно в 91 KiB;
- LCP-элемент — hero `h1`;
- 94% LCP приходилось на render delay;
- `LandingContent.tsx` содержит много client-side Framer Motion логики и 24 `repeat: Infinity` анимации.

## Что можно и нельзя утверждать про Core Web Vitals

- CLS в лабораторных navigation runs: `0` на всех 12 baseline-отчётах.
- LCP и TBT измерены Lighthouse и пригодны для сравнения одного стенда.
- TBT — только лабораторный proxy, а не INP.
- INP нельзя достоверно получить из одиночного Lighthouse navigation run. Для INP нужен production RUM/CrUX после deploy; придумывать значение нельзя.
- Локальный TTFB — около 10 ms в финальном контрольном запуске и не представляет production network/edge TTFB.

## Контроль после исправлений

Во всех шести mobile и шести desktop шаблонах:

- Accessibility: **100/100**;
- Best Practices: **100/100**;
- SEO: **100/100**;
- failed binary audits: **0**;
- CLS: **0**.

Чистый финальный RU home mobile control после остановки лишних headless-процессов:

| Метрика | До | После | Вывод |
|---|---:|---:|---|
| Performance | 50 | 53 | небольшой рост, цель не достигнута |
| Accessibility | 89 | 100 | исправлено |
| LCP | 7.7 s | 3.9 s | render delay hero сокращён, но до 2.5 s ещё далеко |
| TBT | 650 ms | 2910 ms | красная зона; этап нельзя считать performance-remediation complete |
| CLS | 0 | 0 | без регрессии |
| Transfer | 803 KiB | 858 KiB | нужен отдельный budget/remediation |

TBT в повторных сериях заметно колебался. Первый изолированный эксперимент с `lazyOnload` ухудшил один измеряемый TBT и был временно откатан. В performance follow-up `lazyOnload` повторно введён вместе с удалением тяжёлого animation runtime и provider cost; решение принято по серии из трёх runs, а не по одиночному score.

## Обязательный следующий performance-пакет

1. Разделить `LandingContent.tsx` на server shell и небольшие client islands.
2. Остановить или lazy-mount бесконечные below-the-fold Framer Motion анимации; оставлять активными только видимые блоки.
3. Убрать гидрацию статических footer/content sections.
4. Ввести CI budget для JS, third-party bytes и Lighthouse regression.
5. После deploy собирать p75 LCP/INP/CLS через RUM/CrUX минимум 28 дней.

## Performance follow-up — 2026-08-07

Обязательный пакет выполнен локально. Landing больше не загружает Framer Motion runtime и не держит бесконечные JS-анимации; публичный root не загружает React Query/Devtools; интерактивные newsletter/FAQ/waitlist вынесены в отдельные islands; below-fold layout/paint отложен через `content-visibility`.

Server-only эксперимент не принят: crawlable HTML сохранился, но RSC/HTML вырос примерно до 430 KiB и main-thread parsing ухудшился. Финальный вариант оставляет компактную client boundary и raw HTML около 238–239 KiB при полном crawlable тексте.

Контролируемая серия из трёх RU home mobile runs:

| Метрика | Baseline | Первичный post-fix | Final median |
|---|---:|---:|---:|
| Performance | 50 | 53 | **90** |
| Accessibility | 89 | 100 | **100** |
| LCP | 7.7 s | 3.9 s | **3.459 s** |
| TBT | 650 ms | 2910 ms | **145 ms** |
| CLS | 0 | 0 | **0** |
| First-party script | не выделено | не выделено | **307.2 KiB** |
| Third-party script | 204+ KiB total third-party | не выделено | **165.7 KiB script** |
| Total transfer | 803 KiB | 858 KiB | **763.2 KiB** |

Performance заметно улучшен, но lab LCP ещё не достиг 2.5 s. CI budget фиксирует текущий уровень как anti-regression floor; он не заменяет более строгие production p75 цели.
