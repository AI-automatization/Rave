---
title: WeWatch SEO/GEO/AEO — отчёт этапа 4
status: completed-local
date: 2026-08-06
scope: AEO, GEO, structured data, factual governance
---

# Этап 4 — AEO/GEO/schema quality

## Результат

Этап завершён локально. Все 24 редакционные страницы (18 гайдов и 6 use-case) теперь получают `Article`, `BreadcrumbList`, видимый авторский блок и даты из одного реестра. FAQ/HowTo проверяются против raw HTML на каждом sitemap URL. RU/UZ/EN страницы «Как это работает» используют один factual-компонент синхронизации.

## Что показал аудит

- существовало 23 локальных определения `Article`; английский YouTube how-to не имел `Article`;
- у гайдов и use-case не было единого `BreadcrumbList`;
- `headline`, `dateModified`, `mainEntityOfPage` и `@id` применялись непоследовательно;
- author schema была невидима пользователю;
- синхронизация копировалась вручную в трёх языках;
- UZ кино-гайд публиковал HowTo и FAQ, отличавшиеся от страницы;
- EN YouTube HowTo имел 5 schema-шагов против 4 видимых;
- две EN статьи публиковали FAQ только в JSON-LD.

## Реализация

- `src/data/articles.ts`: реестр 24 editorial URL с H1, locale, publish/modify dates;
- `ArticleMetadata.tsx`: единый Article + BreadcrumbList factory, image, canonical, stable Organization `@id`, видимый author/date block;
- `guides.ts`: добавлены обязательные `headline` и `datePublished`;
- удалены 23 legacy Article-дубля; остался один source factory;
- `SynchronizationFacts.tsx`: единый RU/UZ/EN блок с 500 ms threshold, NTP-style offset, scheduled commands, лимитом 10 участников и 10-minute inactivity timeout;
- создан `docs/seo/factual-sheet.md` с разрешёнными/запрещёнными claims и evidence paths;
- UZ кино и EN YouTube используют один массив для UI и HowTo schema;
- UZ кино и две EN статьи используют один массив для UI и FAQ schema;
- EN FAQ теперь присутствует в raw HTML через `VisibleFaqs`.

## Проверки

- production build: **102/102**;
- SEO/GEO/AEO Playwright: **18/18**;
- all-sitemap HTTP/canonical/lang/H1/schema-visible gate: **64/64 URL**;
- editorial Article/Breadcrumb/byline: **24/24 URL**;
- crawler visibility: **45/45**;
- `git diff --check`: успешно;
- source audit: `Article` и editorial `BreadcrumbList` генерируются только в `ArticleMetadata.tsx`.

## Ограничения

- deploy не выполнялся; production rich-results validation остаётся внешним шагом;
- standalone `tsc` сохраняет 5 прежних конфликтов React 18/19 type copies;
- lint не стартует из-за отсутствующего транзитивного `zod-validation-error/v4` в текущем `node_modules`;
- повторный legacy public/locale/redirect suite дважды завис в Playwright без итогового отчёта; orphan test processes остановлены. Его ключевые SEO-контракты при этом покрыты и прошли в новом 18/18 suite;
- Pro checkout и store listings по-прежнему не подтверждены.

## Следующий этап

Этап 5 — performance и accessibility baseline:

1. Lighthouse mobile/desktop по RU/UZ/EN template pages.
2. LCP, INP, CLS, JS и image baseline без выдуманных production CrUX данных.
3. Keyboard, focus, contrast, alt и image dimensions audit.
4. Исправлять только подтверждённые проблемы и записать before/after.
