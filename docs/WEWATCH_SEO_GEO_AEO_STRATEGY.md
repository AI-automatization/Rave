---
title: "WeWatch — критический аудит и стратегия SEO / GEO / AEO"
aliases:
  - "WeWatch SEO Audit"
  - "WeWatch GEO AEO Plan"
tags:
  - wewatch
  - seo
  - geo
  - aeo
  - marketing
  - roadmap
status: remediation-phase-4-validated
created: 2026-08-05
updated: 2026-08-06
owner: pending
related:
  - "[[Tasks]]"
  - "[[Done]]"
  - "[[RAVE_ANALIZ]]"
---

# WeWatch — критический аудит и стратегия SEO / GEO / AEO

> [!abstract] Назначение документа
> Это не список случайных SEO-советов и не отчёт «для галочки». Документ сначала критически разбирает уже выполненную работу и текущий план T‑E209, затем формирует новый порядок действий с зависимостями, критериями приёмки, проверками и измеримыми результатами.

> [!warning] Граница аудита
> В этом документе ничего не объявляется исправленным только потому, что код для этого существует. Исправление считается завершённым только после проверки сгенерированного HTML, production HTTP-ответа, sitemap, Search Console/Bing Webmaster Tools и повторного обхода поисковиком.

> [!info] Статус внедрения — 2026-08-05
> Технический проход выполнен в рабочей копии. Исправлены sitemap, UZ hreflang, FAQ/schema и `llms.txt`. После уточнения владельца статус платформ скорректирован: доступен только Web, а приложения iOS и Android находятся в разработке. Build и production-проверки ещё не выполнены: в среде отсутствует `node_modules`, а deploy не входил в этот проход.

## 0. Отчёт о внедрении: проход 1

### Сделано

- `sitemap.ts`: пути маркетинговых страниц теперь хранятся без locale и расширяются через общий `LOCALES/withLocale`; устранены URL вида `/uz/ru/features` и `/en/ru/features`;
- добавлена fail-fast проверка sitemap на дубликаты и двойные locale-prefix;
- удалён ошибочный layout-level hreflang из `uz/layout.tsx`; вложенные страницы больше не наследуют ссылки на locale roots;
- создан `product-facts.ts` с проверенными статусами платформ, лимитом комнаты, timeout и порогом коррекции синхронизации;
- Web помечен доступным; iOS и Android имеют единый статус `planned/in development`;
- удалены App Store/Google Play download-claims и магазинные CTA; основные кнопки теперь открывают веб-версию или показывают статус разработки мобильных приложений;
- FAQ-ответы главной страницы теперь присутствуют в исходном HTML и только визуально сворачиваются;
- JSON-LD FAQ строится из тех же локализованных вопросов и ответов, что видит пользователь;
- противоречивый homepage HowTo удаляется из публикуемого graph; HowTo остаётся задачей специализированной страницы;
- application schema публикует только `operatingSystem: Web`, без `installUrl` мобильного магазина;
- `llms.txt` синхронизирован: Web доступен, обе мобильные версии разрабатываются;
- RU/UZ/EN FAQ, metadata, HowTo, About, Company, use-cases и гайды очищены от заявлений о доступных iOS/Android-приложениях.

### Проверено локально

- RU/UZ/EN JSON-файлы успешно парсятся;
- `git diff --check` не нашёл whitespace-ошибок;
- в опубликованной homepage schema используется единый преобразователь для трёх языков;
- старые claims `Google Play`, `completely/полностью/to'liq free` удалены из центрального homepage FAQ и `llms.txt`.

### Ещё не считается завершённым

- TypeScript/build/lint не запускались из-за отсутствующих зависимостей;
- production HTML, HTTP status, canonical/hreflang и sitemap ещё не проверены после deploy;
- после массовой очистки требуется production crawl, чтобы исключить закешированные или генерируемые claims;
- `<html lang>` для UZ/EN всё ещё корректируется клиентским скриптом, а не приходит правильным в raw HTML;
- реальная доступность покупки Pro требует решения владельца продукта;
- изменения ещё не отправлены в GSC/Bing/IndexNow.

### Следующий проход

1. Установить зависимости и прогнать `build`, `lint`, crawler-check.
2. Добавить CI-проверку, запрещающую claims `App Store`, `Google Play` и «скачать приложение», пока обе мобильные версии имеют статус `planned`.
3. Устранить client-side исправление `<html lang>` архитектурно.
4. Добавить route-manifest и production crawler tests в CI.
5. После deploy проверить sitemap, raw HTML, JSON-LD и hreflang; затем отправить изменённые URL на переобход.

## 0.1. Playwright validation — 2026-08-05

Production-сборка `apps/web` прошла успешно. Добавлен отдельный набор `seo-geo-aeo.spec.ts` и команда `npm run test:seo`.

Результат целевого набора: **10 passed, 1 failed**.

Успешно проверены:

- sitemap содержит уникальные final URL и не содержит двойных locale-prefix;
- все 18 RU/UZ/EN marketing URL присутствуют;
- canonical и reciprocal hreflang корректны на трёх homepage;
- видимый FAQ полностью совпадает с FAQPage JSON-LD;
- FAQ-ответы присутствуют в raw HTML;
- Application schema публикует только Web и не содержит `installUrl`;
- homepage не содержит App Store/Google Play links и claims.

Обнаруженный P0 defect:

- `/uz` и `/en` в raw HTML приходят с `<html lang="ru">`; клиентский script исправляет язык только после загрузки JavaScript. Тест намеренно остаётся красным до архитектурного исправления.

Дополнительные результаты:

- locale/redirect suite: 30/30 проверок прошли;
- public suite: 4 проверки прошли, 2 старых login/register теста timeout — эти URL теперь корректно отвечают `308` на внешний `https://app.wewatch.uz/*`, а тест всё ещё ожидает локальные формы;
- crawler visibility: 40/45 проверок прошли; пять failures относятся к одному URL `/uz/guides` для пяти user-agent — 928 видимых символов при threshold 1000, ключевые слова найдены.

Следующие исправления по результатам проверки:

1. Server-rendered locale-aware `<html lang>`.
2. Расширить `/uz/guides` минимум до 1000 полезных видимых символов.
3. Переписать `public.spec.ts` для проверки 308 redirect `/login` и `/register` на `app.wewatch.uz`.

## 0.2. Исправление дефектов и повторная проверка — 2026-08-06

Все три дефекта из первого Playwright-прохода устранены в рабочей копии:

- RU, UZ и EN получили отдельные server-rendered root layouts. Исходный HTML теперь сразу содержит правильный `<html lang="ru|uz|en">`; клиентский корректирующий script удалён;
- статическая генерация сохранена: production build успешно сгенерировал 102 страницы;
- `/uz/guides` дополнен полезной инструкцией по созданию комнаты, синхронизации, требованиям и статусу платформ. Объём crawlable-текста вырос с 928 до 1753 символов;
- `public.spec.ts` проверяет фактический контракт: `/login` и `/register` отвечают постоянным `308` redirect на `https://app.wewatch.uz`;
- в SEO Playwright-набор добавлена регрессия на минимальный объём UZ guides и формулировку «Android va iOS ilovalari ishlab chiqilmoqda»;
- внешняя аналитика блокируется только внутри SEO-теста, чтобы CI не становился flaky из-за доступности Google Analytics/Yandex Metrica;
- из `next.config.mjs` удалена устаревшая опция `eslint`, которую Next.js 16 больше не принимает.

Повторная локальная проверка production-сборки:

- `npm run build --workspace=web`: **успешно**, 102/102 static pages;
- `npm run test:seo`: **12/12 passed**, без retry и flaky failures;
- `public.spec.ts` + `locale-detection.spec.ts`: **36/36 passed**;
- crawler visibility: **45/45 passed** для GPTBot, ClaudeBot, PerplexityBot, Googlebot и браузера;
- `git diff --check`: выполняется перед завершением прохода.

Оставшийся технический долг, не относящийся к SEO-регрессии: standalone `tsc` обнаруживает конфликт React 18/19 type declarations между `app-web`, `web`, `mobile` и корневым hoisting. Production build намеренно пропускает типизацию согласно существующему `ignoreBuildErrors`. Исправлять это нужно отдельной monorepo-задачей с выравниванием workspace dependency strategy, а не локальными type casts в SEO-компонентах.

Следующий этап после deploy: проверить те же URL на production-хосте, отправить sitemap в GSC/Bing и запросить повторный обход изменённых страниц.

## 0.3. Этап 1 — Technical integrity и полный sitemap gate — 2026-08-06

### Найдено

Дополнительная проверка build-HTML обнаружила, что четыре URL профилей команды, включённые в sitemap, фактически генерировались как Next.js error shell и отвечали HTTP 404:

- `/ru/team/ertan-emirhan`;
- `/ru/team/bekzod-mirzaliyev`;
- `/ru/team/saidazim-buriboyev`;
- `/ru/team/abdulaziz-yormatov`.

Причина: `app/ru/team/[slug]/page.tsx` использовал синхронный `params` старого App Router API. В Next.js 16 `params` является Promise. Обычный production build завершался с кодом 0 и поэтому не считался достаточной проверкой индексируемости.

### Исправлено

- `generateMetadata` и `PersonPage` переведены на единый `PersonPageProps` с `params: Promise<{ slug: string }>`;
- оба обработчика ожидают `params` до вызова `getMember`;
- восстановлены HTTP 200, персональные title/description, self-canonical, `lang=ru`, H1 и Person/Breadcrumb JSON-LD всех четырёх профилей;
- в `seo-geo-aeo.spec.ts` добавлен all-sitemap gate для всех 64 текущих URL;
- каждый sitemap URL теперь проверяется на HTTP 200, HTML content type, отсутствие `__next_error__` и `noindex`, ровно один H1, точный self-canonical и server-rendered locale `lang`.

### Проверено

- production build: **102/102 static pages**, успешно;
- team profile production response: **HTTP 200**;
- SEO/GEO/AEO Playwright: **13/13 passed**;
- all-sitemap indexability: **64/64 URL passed**;
- public + locale Playwright: **36/36 passed**;
- crawler visibility: **45/45 passed**;
- `git diff --check`: успешно.

### Оставшиеся ограничения

- проверки выполнены локально на production build, но ещё не после deploy на `wewatch.uz`;
- web standalone typecheck по-прежнему блокируется существующим конфликтом React 18/19 types в monorepo;
- SEO suite пока не включён в GitHub Actions как обязательный deploy gate;
- предупреждения Sentry deprecated options и `ENVIRONMENT_FALLBACK` вне team profiles требуют отдельной диагностики, хотя проверяемые sitemap URL формируют корректный HTML.

### Следующий этап

Этап 2: полный остаточный sweep product facts и claims по RU/UZ/EN, `llms.txt`, metadata и JSON-LD с добавлением регрессионных тестов. Новые landing URL до keyword map не создавать.

## 0.4. Этап 2 — единый контракт продукта и claims gate — 2026-08-06

### Найдено

После первого исправления статуса платформ в публичном контенте оставался второй слой противоречий:

- homepage и company JSON-LD в исходниках всё ещё объявляли `MobileApplication`, хотя опубликован только Web;
- RU/UZ/EN FAQ, гайды и landing-копирайтинг обещали «встроенный браузер», «любой сайт», Uzmove/Cinerama и другие неподтверждённые источники;
- отдельные страницы утверждали «полностью бесплатно», «без ограничений» или отсутствие платного тарифа, хотя в интерфейсе указан Pro;
- часть текстов описывала скачивание или уже доступное мобильное приложение;
- `llms.txt` одновременно сообщал, что native apps разрабатываются, и приписывал мобильному приложению уже доступный browser feature.

### Исправлено

- тип приложения в RU/UZ/EN homepage и company schema заменён на `SoftwareApplication` с `operatingSystem: Web`;
- удалён временный schema-transform `MobileApplication → SoftwareApplication`: исходный JSON-LD теперь сам содержит корректные факты;
- RU/UZ/EN marketing messages, FAQ, HowTo и гайды приведены к подтверждённым источникам: YouTube, VK Видео, Rutube и прямые MP4-ссылки;
- неподтверждённые claims про «любой сайт», встроенный браузер, Uzmove/Cinerama и download-flow удалены из индексируемого контента;
- абсолютные заявления о бесплатности заменены на проверяемое: основные функции watch party бесплатны; Pro указан отдельно, production checkout требует подтверждения владельца;
- формулировки про iPhone/Android уточнены: сейчас используется веб-версия в браузере, нативные iOS/Android приложения находятся в разработке;
- opening text Privacy Policy и Terms согласован с текущим Web-only статусом; mobile-specific положения обозначены как применимые после релиза;
- `product-facts.ts` повторно верифицирован 2026-08-06;
- all-sitemap Playwright gate расширен запретом `MobileApplication`, App Store/Google Play URL и набора неподтверждённых product claims;
- добавлен отдельный тест консервативного контракта `llms.txt`.

### Проверено

- source sweep по публичному app-контенту и messages: запрещённые claims не найдены;
- RU/UZ/EN messages: JSON parse успешно;
- production build: **102/102 static pages**;
- SEO/GEO/AEO Playwright: **14/14 passed**;
- all-sitemap contract/indexability gate: **64/64 URL passed**;
- public + locale Playwright: **36/36 passed**;
- crawler visibility: **45/45 passed**;
- `git diff --check`: успешно.

### Граница результата

- проверка выполнена на локальной production-сборке; deploy и production re-crawl ещё не выполнены;
- список поддерживаемых источников намеренно консервативен. Добавлять новый источник в SEO-контент можно только после подтверждения владельцем и обновления `product-facts.ts`;
- наличие кода мобильного клиента не означает публикацию в App Store/Google Play;
- SEO/GEO/AEO suite ещё не подключён как обязательный CI gate.

### Следующий этап

Этап 3: создать keyword map по существующим canonical URL, определить primary intent каждой страницы и разобрать каннибализацию RU movie/watch-party cluster. Новые URL до утверждения карты не создавать.

## 0.5. Этап 3 — keyword map и каннибализация — 2026-08-06

### Инвентаризация

- все 64 sitemap URL сопоставлены с фактическими production title, description, H1 и canonical;
- создан `docs/seo/keyword-map.md`: каждому URL назначен один primary intent и роль acquisition/entity/legal;
- карта намеренно не содержит выдуманных search volume и позиций — для этого нужны GSC/Яндекс и отдельное исследование;
- новые landing pages не создавались.

### Найденные пересечения

- RU homepage и generic guide одновременно использовали «смотреть вместе онлайн»;
- пять RU URL пересекались по темам фильм с другом, вдвоём, на расстоянии и онлайн-свидание;
- две RU страницы сериалов претендовали практически на одинаковые singular/plural/free запросы;
- RU free watch party ошибочно считался hreflang-переводом EN informational `what is a watch party`;
- вторая RU series page вручную указывала UZ series page как перевод, хотя тот уже связан с основной RU series page;
- use-case title вручную содержали WeWatch перед автоматическим template и давали итог `| WeWatch | WeWatch`;
- free watch party page содержала недатированную и неподтверждённую таблицу конкурентов.

### Исправлено

- `GUIDES` получил обязательный `primaryIntent`; все 18 guide intent уникальны внутри своей locale;
- RU series pages разведены: одна владеет intent «смотреть сериал с другом / марафон», вторая — «бесплатный групповой сериальный клуб»;
- title, description, keywords, H1/copy и internal anchors series cluster уточнены;
- movie cluster сохранён без преждевременных redirect: каждой странице назначена отдельная граница intent;
- удалены две неэквивалентные hreflang-связи;
- use-case titles очищены от ручного дублирования бренда;
- конкурентная таблица удалена; free watch party page содержит только проверенные факты WeWatch;
- all-sitemap gate расширен уникальностью title/H1 внутри locale и запретом двойного brand suffix;
- добавлены tests уникальности guide intent и запрета false hreflang.

### Проверено

- production build: **102/102 static pages**;
- SEO/GEO/AEO Playwright: **16/16 passed**;
- all-sitemap indexability/title/H1 contract: **64/64 URL passed**;
- public + locale Playwright: **36/36 passed**;
- crawler visibility: **45/45 passed**;
- `git diff --check`: успешно.

### Решение по merge/redirect

Ни один URL не удалён. Без production query/click/backlink history redirect был бы спекулятивным. После deploy нужно собрать 60–90 дней данных GSC/Яндекс. Если `kino-s-drugom` и `smotret-film-vdvoem` либо две series pages продолжают ранжироваться по одному query set, оставить победителя, перенести уникальный контент и выполнить 301.

### Следующий этап

Этап 4: AEO/GEO/schema quality — BreadcrumbList, Article author/dateModified, видимые авторские блоки, factual sheet и проверка schema ↔ visible content.

## 0.6. Этап 4 — AEO/GEO/schema quality — 2026-08-06

Этап завершён локально. Для 18 гайдов и 6 use-case страниц создан единый editorial registry и schema factory. Каждая из 24 страниц имеет ровно один `Article`, один `BreadcrumbList`, stable Organization `@id`, image, canonical/mainEntity, согласованные даты и видимую подпись WeWatch.

Удалены 23 локальных Article-дубля. Английский YouTube how-to получил недостающий Article. Создан единый RU/UZ/EN synchronization block из `product-facts.ts`; 500 мс явно обозначены как порог коррекции, а не latency guarantee. Factual contract записан в `docs/seo/factual-sheet.md`.

Regression gate теперь сравнивает FAQ/HowTo schema с raw видимым HTML на всех sitemap URL. Он обнаружил и помог исправить три реальные группы дефектов: UZ movie HowTo/FAQ drift, EN YouTube 5 schema steps против 4 UI steps и FAQ только в schema у двух EN статей.

Проверено: build **102/102**, SEO Playwright **18/18**, sitemap **64/64**, editorial schema **24/24**, crawler **45/45**, `git diff --check`. Полный отчёт: `docs/seo/stage-4-report.md`.

Следующий этап: performance/accessibility baseline. Deploy, production rich-results check и GSC/Bing/Яндекс остаются внешними действиями.

## 0.7. Этап 5 — Performance/accessibility baseline — 2026-08-06

Сняты 12 воспроизводимых Lighthouse baseline-отчётов: шесть RU/UZ/EN шаблонов в mobile и desktop. Accessibility baseline составлял 89–96, Performance mobile — 50–87, desktop — 95–100. Главная страница была самым тяжёлым шаблоном: mobile LCP 5.7–7.8 s, около 524 KiB JS и 204+ KiB third-party transfer. Lighthouse определил hero H1 как LCP element, причём на RU 94% LCP приходилось на render delay.

По измеренным причинам исправлены contrast, accessible names, label/name mismatch, semantics statistics list и 10×10 px touch targets. Hero H1 больше не ждёт client animation перед первой отрисовкой. После исправлений все 12 повторных отчётов получили Accessibility/Best Practices/SEO **100/100**, failed binary audits **0**, CLS **0**. Playwright accessibility regression: **18/18**.

Performance не объявляется закрытым. Чистый RU home mobile control: Performance **50 → 53**, LCP **7.7 → 3.9 s**, но TBT **650 → 2910 ms**. Основной остаток — монолитный client-side `LandingContent.tsx`, hydration cost и 24 бесконечные Framer Motion анимации. Лабораторный TBT не является INP; настоящий p75 INP появится только из production RUM/CrUX.

Проверено: build **102/102**, accessibility Playwright **18/18**, SEO Playwright **18/18**, crawler visibility **45/45**, `git diff --check`. Полные отчёты: `docs/seo/lighthouse-baseline.md`, `docs/seo/stage-5-report.md`.

Следующий этап: measurement/CI/post-deploy. До production launch обязателен отдельный performance workstream — server/client islands, lazy-mount/stop below-fold animations и JS/third-party budgets.

## 1. Краткий вывод

Текущая общая оценка: **65/100**.

| Направление | Оценка | Вывод |
|---|---:|---|
| Техническое SEO | 64/100 | Архитектура сильная, но sitemap содержит критическую регрессию |
| On-page SEO | 76/100 | Хорошее семантическое покрытие, но есть длинные сниппеты и недоказанные claims |
| International SEO | 55/100 | RU/UZ/EN существуют, однако hreflang и sitemap частично неверны |
| AEO | 70/100 | FAQ и HowTo широко применяются, но разметка не всегда совпадает с видимым содержанием |
| GEO | 63/100 | Есть `llms.txt` и доступ AI-ботам, но факты о продукте расходятся |
| E-E-A-T / доверие | 58/100 | Есть компания и команда, но мало доказательств, источников и внешних сущностей |

Главная проблема — не отсутствие SEO-функций. Наоборот, функций уже много. Главная проблема — **несогласованность источников правды и отсутствие обязательной проверки итогового production-результата**.

Сейчас нельзя масштабировать публикацию новых статей, пока не устранены:

1. неправильные URL в sitemap;
2. ошибочный наследуемый hreflang для UZ;
3. противоречия в цене, доступности Android/iOS и точности синхронизации;
4. расхождения между JSON-LD и видимым текстом;
5. отсутствие надёжного production validation после deploy.

---

# Часть I. Критика текущего состояния и существующего плана

## 2. Что уже построено

В `apps/web` уже существует серьёзная SEO-база:

- 61 файл `page.tsx`;
- metadata и canonical найдены у всех проверенных страниц;
- 47 страниц содержат JSON-LD;
- 23 страницы используют `Article`;
- 10 страниц используют `FAQPage`;
- 6 страниц используют `HowTo`;
- отдельные URL для RU, UZ и EN;
- `robots.ts` с разрешениями для поисковых и AI-ботов;
- `sitemap.ts`;
- `llms.txt`;
- IndexNow API;
- canonical и hreflang helpers;
- постоянные redirect со старых русских URL;
- guide hubs и related links;
- отдельные use-case страницы;
- Search Console verification, GA и Yandex Metrica hooks;
- crawler visibility script.

Это хорошая база. Проблема не в количестве реализованных механизмов, а в их согласованности.

## 3. Критика T‑E209 и текущих этапов

Связанная задача: [[Tasks]] — раздел `T-E209 | GEO/AEO/SEO техническая база`.

### 3.1. PHASE 1 отмечен завершённым слишком рано

В `Tasks.md` записано, что sitemap:

- не содержит дубликатов;
- содержит 64 корректных URL;
- не содержит redirect URL;
- проверен на production.

Однако текущий `sitemap.ts` снова создаёт неправильные пути:

```text
/uz/ru/features
/en/ru/features
/uz/ru/pricing
/en/ru/pricing
...
```

Причина: `LANDING_PAGES` уже хранит пути `/ru/...`, после чего к ним повторно добавляется `/uz` или `/en`.

Следствие:

- 12 несуществующих URL попадают в sitemap;
- 12 настоящих UZ/EN marketing URL отсутствуют;
- полный IndexNow submit отправляет неправильные URL;
- статус «PHASE 1 завершён» больше не соответствует текущему состоянию ветки.

> [!danger] Критический вывод
> Завершённость этапа была привязана к коммиту и ручной проверке, но не защищена автоматическим regression-тестом. Поэтому последующее изменение маршрутов незаметно сломало уже «закрытый» этап.

### 3.2. International SEO реализован в двух конкурирующих слоях

Для RU и EN правильно принято решение не задавать hreflang на уровне layout. Для UZ старый layout-level `alternates.languages` остался.

В результате используются одновременно:

1. page-level `hreflangFor(...)`;
2. наследуемый `alternates` из `uz/layout.tsx`.

Это создаёт конфликт и нарушает архитектурный принцип «одна страница — один источник alternate URLs».

### 3.3. PHASE 2 «rendering» фактически не оформлен как проверяемый этап

Скрипт `check-crawler-visibility.mjs` существует, но:

- часть путей в нём устарела и проходит через redirects;
- запросы выполняются последовательно;
- 45 запросов с timeout 20 секунд могут выполняться до 15 минут;
- нет проверки canonical, hreflang, JSON-LD и `html lang`;
- нет сравнения ответа Browser, Googlebot и AI user-agent на идентичность ключевого текста;
- нет проверки, что FAQ-ответы присутствуют в raw HTML;
- нет обязательного CI gate перед deploy.

Скрипт проверяет «много ли текста», но не проверяет «правильный ли это текст и правильны ли SEO-сигналы».

### 3.4. PHASE 3 «schema» развивался без единого источника фактов

JSON-LD добавлен на многих страницах, но факты копируются вручную:

- доступность Android;
- наличие Google Play;
- бесплатность;
- наличие Pro;
- лимит участников;
- 500 ms drift correction;
- `±2s`;
- поддерживаемые источники;
- время закрытия комнаты.

Из-за этого schema, `llms.txt`, FAQ, pricing и guide content расходятся.

Критика этапа: количество schema стало KPI вместо качества и непротиворечивости schema.

### 3.5. PHASE 4 «content» начался до стабилизации инфраструктуры

Контентная база уже расширена на RU/UZ/EN, но новые страницы не дают ожидаемого эффекта, если:

- они отсутствуют в корректном sitemap;
- hreflang конфликтует;
- Search Console не переобошёл мигрировавшие URL;
- внутренние ссылки ведут на ограниченное число EN-материалов;
- production может обслуживать старую версию.

Новые статьи до исправления P0 увеличат объём диагностики, а не органический эффект.

### 3.6. PHASE 5 «performance» не имеет baseline

Landing page выглядит современно, но практически весь marketing UI работает как client component.

Текущие риски:

- `LandingContent.tsx` — около 132 KB исходного кода;
- Framer Motion используется по всей странице;
- внешние изображения загружаются как CSS background;
- статические marketing sections гидратируются на клиенте;
- отсутствует зафиксированный Lighthouse/CrUX baseline;
- отсутствуют бюджеты JS, LCP, INP и CLS.

Без baseline невозможно доказать, что этап performance что-либо улучшил.

### 3.7. Ручные TODO являются блокирующими, но помечены как второстепенные

В T‑E209 остались:

- настройка `INDEXNOW_SECRET`;
- подтверждение реального Pro-тарифа;
- отправка sitemap в GSC;
- запрос повторной индексации;
- наблюдение за Coverage.

Фактически это не «ручные мелочи», а завершение всей SEO-цепочки. Без них часть реализованного кода не даёт измеримого результата.

### 3.8. Нет владельца продукта для утверждения фактов

SEO-код пытается сам решить бизнес-вопросы:

- продукт полностью бесплатный или freemium;
- Android выпущен или ещё разрабатывается;
- iOS доступен или CTA ещё «скоро»;
- максимальная вместимость комнаты;
- какие сайты официально поддерживаются;
- какие функции относятся к Free и Pro.

Это не технические решения. До ответа product owner нельзя корректно обновить schema и контент.

---

## 4. Главные технические находки

### P0-1. Неправильная генерация sitemap

Файл: `apps/web/src/app/sitemap.ts`.

Проблемный принцип:

```ts
const LANDING_PAGES = [
  { path: '/ru/features', ... },
];

// Затем:
{ path: `/uz${path}` }
{ path: `/en${path}` }
```

Нужен один из двух подходов:

1. хранить только locale-free path `/features` и добавлять локаль helper-функцией;
2. хранить полную группу `{ru, uz, en}` в реестре маршрутов.

Предпочтителен первый подход для одинаковых slug и второй — для переводных slug.

Критерии готовности:

- [ ] sitemap не содержит `/uz/ru/` и `/en/ru/`;
- [ ] все URL sitemap отвечают 200;
- [ ] URL sitemap не перенаправляются;
- [ ] canonical каждого URL равен самому URL;
- [ ] число sitemap URL совпадает с ожидаемым manifest;
- [ ] каждый indexable public route есть в sitemap;
- [ ] API и app routes отсутствуют в sitemap.

### P0-2. Неверный UZ hreflang

Файл: `apps/web/src/app/uz/layout.tsx`.

Нужно удалить layout metadata и оставить hreflang только на страницах через `hreflangFor`.

Критерии готовности:

- [ ] `/uz` содержит self-reference `uz → /uz`;
- [ ] `/uz/faq` содержит `uz → /uz/faq`, а не `/uz`;
- [ ] `ru` ведёт на `/ru/...`, а не на корень;
- [ ] `x-default` совпадает с принятой default-версией;
- [ ] каждая alternate-страница отвечает 200;
- [ ] hreflang взаимный: A ссылается на B, B ссылается на A.

### P0-3. Противоречивые product facts

Обнаруженные конфликты:

| Факт | Вариант A | Вариант B |
|---|---|---|
| Android | «Android скоро» | «Скачайте из Google Play» |
| Цена | Free + Pro 29 000 UZS | «Полностью бесплатно, платного тарифа нет» |
| Синхронизация | UI: `±2s` | технический текст: correction после 500 ms |
| iOS | «Доступно в App Store» | CTA визуально помечен «Скоро» |
| Доступность | `InStock` для MobileApplication | часть платформ ещё не выпущена |
| Качество | «без задержек» | сеть и drift correction подразумевают возможную задержку |

До решения product owner запрещено автоматически выбирать один из вариантов.

Нужен новый источник:

```text
apps/web/src/data/product-facts.ts
```

Он должен содержать только утверждённые факты и использоваться при генерации:

- JSON-LD;
- FAQ;
- homepage claims;
- pricing;
- `llms.txt` или его шаблона;
- comparison pages;
- marketing copy.

### P0-4. Schema не совпадает с видимой страницей

Главная RU содержит больше вопросов в JSON-LD, чем в видимом FAQ. HowTo schema и видимые шаги также различаются.

Правило:

> UI, answer blocks и JSON-LD должны строиться из одного массива данных.

Отдельно нужно заменить условный mount FAQ-ответов на HTML, доступный без JavaScript. Рекомендуемая структура:

```html
<details>
  <summary>Вопрос</summary>
  <p>Прямой ответ...</p>
</details>
```

### P1-1. Raw HTML всегда заявляет русский язык

Root layout отдаёт `<html lang="ru">`, а EN/UZ исправляются JavaScript.

Для AI-клиента без JavaScript это означает:

- `/en` имеет `lang=ru`;
- `/uz` имеет `lang=ru`;
- language classification получает конфликтующий сигнал.

Нужно выбрать серверный способ формирования `lang` либо перестроить locale layout так, чтобы язык был известен во время рендера HTML.

### P1-2. FAQ-ответы отсутствуют в raw HTML главной

Главный accordion рендерит ответ только после клика. Это ослабляет:

- AI crawler visibility;
- answer extraction;
- accessibility;
- соответствие JSON-LD видимому контенту.

Dedicated FAQ pages лучше, но homepage FAQ также должен содержать ответы в HTML.

### P1-3. Неполная Article schema

Проверено 23 Article schema:

- у всех отсутствует отдельное `image`;
- у большинства отсутствует `dateModified`;
- часть не содержит устойчивого `mainEntityOfPage`;
- автор обычно только Organization, без Person/profile.

Нужно создать общий `articleSchema()` helper.

### P1-4. Поисковый индекс выглядит неполным

Spot-check по точным guide/use-case URL преимущественно показывал только главные страницы. Это не является полной статистикой GSC, но является предупреждением.

Нужно подтвердить в Google Search Console:

- Indexed;
- Crawled — currently not indexed;
- Discovered — currently not indexed;
- Duplicate without user-selected canonical;
- Page with redirect;
- Alternate page with proper canonical;
- Soft 404.

### P2-1. Длинные сниппеты

Потенциально обрезаются:

- EN home title: около 70 символов;
- EN home description: около 182;
- EN long-distance description: около 184;
- RU company title: около 74;
- RU company description: около 166.

Это не прямой ranking penalty, но снижает контроль CTR и сообщения в SERP.

### P2-2. OG image не локализован

`/og-image` содержит русский текст для всех RU/UZ/EN страниц.

Нужно:

```text
/og-image?locale=ru
/og-image?locale=uz
/og-image?locale=en
```

или отдельные статические изображения.

### P2-3. Недоказанные claims

В контенте встречаются:

- «единственный полностью бесплатный»;
- «лучший бесплатный вариант»;
- «без задержек»;
- «любой сайт»;
- «4K» без описания ограничений источника и устройства.

Для SEO это риск доверия, для GEO — риск нецитируемости, для legal/brand — риск жалоб.

Следует заменить на проверяемые формулировки или добавить методологию сравнения.

---

# Часть II. Целевая архитектура

## 5. Единые источники правды

### 5.1. Реестр публичных маршрутов

Создать единый route manifest:

```ts
type PublicRoute = {
  id: string;
  locale: 'ru' | 'uz' | 'en';
  path: string;
  canonical: string;
  indexable: boolean;
  lastModified: string;
  translationGroup?: string;
};
```

Из него должны формироваться:

- sitemap;
- hreflang;
- IndexNow URL list;
- crawler test matrix;
- guide hubs;
- internal-link validation.

### 5.2. Реестр продуктовых фактов

```ts
type ProductFacts = {
  platforms: {
    web: 'available' | 'beta' | 'planned';
    ios: 'available' | 'beta' | 'planned';
    android: 'available' | 'beta' | 'planned';
  };
  pricing: {
    model: 'free' | 'freemium' | 'paid';
    proPriceUzs?: number;
  };
  roomCapacity: number;
  driftCorrectionMs: number;
  supportedSources: string[];
  lastVerified: string;
};
```

Каждый факт должен иметь:

- владельца;
- дату проверки;
- источник в коде/production;
- допустимую marketing-формулировку.

### 5.3. Единый schema factory

Создать helpers:

- `organizationSchema()`;
- `softwareApplicationSchema(locale)`;
- `articleSchema(article)`;
- `faqSchema(items)`;
- `breadcrumbSchema(items)`;
- `webPageSchema(page)`.

Все сущности должны ссылаться на стабильные `@id`:

```text
https://wewatch.uz/#organization
https://wewatch.uz/#website
https://wewatch.uz/#application
```

Это уменьшит фрагментацию entity graph.

---

# Часть III. Новый поэтапный план

## Этап 0. Утвердить правду о продукте

**Приоритет:** P0  
**Срок:** до 1 рабочего дня  
**Зависимость:** решение product owner

### Решения, которые нужно получить

- [ ] Android действительно опубликован в Google Play?
- [ ] iOS действительно опубликован в App Store?
- [ ] Каковы официальные store URLs?
- [ ] Существует ли активный Pro за 29 000 UZS?
- [ ] Какие функции входят в Free и Pro?
- [ ] Максимум участников — точно 10?
- [ ] 500 ms — порог correction или обещаемая точность?
- [ ] Что означает UI-метрика `±2s`?
- [ ] Какие источники официально поддерживаются на Web, iOS и Android?
- [ ] Можно ли юридически писать «любой сайт»?

### Результат этапа

- утверждённая таблица Product Facts;
- запрещённые marketing claims;
- список допустимых формулировок на RU/UZ/EN.

### Definition of Done

- [ ] каждый факт имеет owner и source;
- [ ] FAQ, pricing, schema и `llms.txt` больше не противоречат друг другу;
- [ ] неопределённые факты не публикуются как подтверждённые.

## Этап 1. Восстановить индексируемую архитектуру

**Приоритет:** P0  
**Срок:** 1–2 рабочих дня  
**Зависимость:** Этап 0 только для product schema; маршруты можно исправлять параллельно

### Задачи

- [ ] исправить `LANDING_PAGES` в sitemap;
- [ ] удалить metadata из `uz/layout.tsx`;
- [ ] внедрить route manifest;
- [ ] проверить все sitemap URL;
- [ ] проверить redirects старых URL;
- [ ] проверить reciprocal hreflang;
- [ ] проверить canonical final URL;
- [ ] проверить `www → apex`;
- [ ] проверить HTTP и CDN ответы для Googlebot/OAI-SearchBot/ClaudeBot/PerplexityBot;
- [ ] обновить crawler script на `/ru/...` routes;
- [ ] распараллелить проверки с ограничением concurrency;
- [ ] включить validation в CI.

### Автоматические тесты

```text
sitemap URL → HTTP 200
sitemap URL → redirect count 0
canonical → текущий URL
hreflang URL → HTTP 200
hreflang reciprocity → true
robots sitemap URL → текущий sitemap
indexable route in manifest → присутствует в sitemap
non-indexable route → отсутствует в sitemap
```

### После deploy

- [ ] открыть `/robots.txt`;
- [ ] открыть `/sitemap.xml`;
- [ ] проверить `/llms.txt`;
- [ ] проверить key-файл IndexNow;
- [ ] отправить sitemap в GSC;
- [ ] отправить sitemap в Bing Webmaster Tools;
- [ ] вызвать IndexNow только с корректными изменёнными URL;
- [ ] запросить URL Inspection для ключевых страниц.

### Definition of Done

- [ ] 0 URL с 3xx/4xx/5xx в sitemap;
- [ ] 0 конфликтующих canonical;
- [ ] 0 несуществующих hreflang;
- [ ] production и repository генерируют одинаковый route set;
- [ ] CI блокирует повторную регрессию.

## Этап 2. Исправить AEO и structured data

**Приоритет:** P1  
**Срок:** 2–4 рабочих дня  
**Зависимость:** Этап 0

### Задачи

- [ ] UI FAQ и FAQPage строятся из одного массива;
- [ ] ответы присутствуют в raw HTML;
- [ ] HowTo schema совпадает с видимыми шагами;
- [ ] убрать неподтверждённые schema facts;
- [ ] добавить stable `@id`;
- [ ] дедуплицировать root/page MobileApplication и Organization;
- [ ] добавить Article image;
- [ ] добавить `dateModified` только при реальном обновлении;
- [ ] добавить `mainEntityOfPage`;
- [ ] добавить Person author для экспертных статей;
- [ ] проверить JSON-LD parser и Schema Markup Validator;
- [ ] проверить, что schema существует без client interaction.

### Рекомендуемый формат ответа

Каждый AEO-блок:

1. вопрос в H2;
2. прямой ответ 40–60 слов;
3. шаги или таблица;
4. ограничения;
5. ссылка на подробную страницу;
6. дата последней проверки.

### Важно

Google больше не показывает HowTo rich results, а FAQ rich results сильно ограничены. Поэтому цель schema — не «получить красивый сниппет любой ценой», а дать корректную структуру поисковикам и answer engines.

Официальные источники:

- [Google: изменения FAQ и HowTo](https://developers.google.com/search/blog/2023/08/howto-faq-changes)
- [Google: structured data policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies)

### Definition of Done

- [ ] schema соответствует тексту страницы;
- [ ] нет фактов, доступных только в JSON-LD;
- [ ] нет ошибок JSON-LD;
- [ ] один и тот же факт в RU/UZ/EN имеет одинаковое значение;
- [ ] AI text-only request получает ответы, а не только вопросы.

## Этап 3. Укрепить GEO и entity authority

**Приоритет:** P1  
**Срок:** 1–2 недели

### Новые страницы

- [ ] `/ru/technology/synchronization`;
- [ ] `/uz/technology/synchronization`;
- [ ] `/en/technology/synchronization`;
- [ ] compatibility matrix Web/iOS/Android;
- [ ] supported platforms/status page;
- [ ] changelog;
- [ ] editorial policy;
- [ ] methodology страницы сравнений;
- [ ] расширенная About/Company entity page.

### Что должна содержать synchronization page

- определение синхронного просмотра;
- NTP-style clock offset без маркетинговых преувеличений;
- shared future timestamp;
- heartbeat correction;
- значение 500 ms;
- ограничения сети;
- различие между correction threshold и воспринимаемой задержкой;
- дата теста;
- устройства и браузеры;
- ссылка на ответственного инженера или команду.

### Entity graph

Organization должна включать только проверенные данные:

- legal name;
- brand name;
- URL;
- logo;
- founder;
- founding location;
- contactPoint;
- official App Store/Google Play/social links;
- `sameAs`;
- связь с tezcode.

Запрещено добавлять фиктивные:

- rating;
- reviewCount;
- awards;
- пользователей;
- страны;
- store availability.

### `llms.txt`

Сохранить как дополнительный ресурс, но:

- генерировать из Product Facts;
- добавить `last-updated`;
- добавить ссылки на подробные fact pages;
- убрать неподтверждённые availability claims;
- проверить, что URLs отвечают 200;
- не считать `llms.txt` заменой обычного SEO.

Google указывает, что для AI Overviews не нужна специальная AI-разметка; важны обычная индексация, внутренние ссылки, текст, page experience и соответствие schema видимому контенту:

- [Google: AI features and your website](https://developers.google.com/search/docs/appearance/ai-features)

### Definition of Done

- [ ] у каждого ключевого факта есть цитируемая URL-страница;
- [ ] одна сущность WeWatch связана одинаковыми `@id`;
- [ ] `llms.txt`, schema и UI согласованы;
- [ ] comparison claims имеют методологию и дату;
- [ ] страницы доступны без JavaScript.

## Этап 4. Контентные кластеры

**Приоритет:** P1/P2  
**Срок:** постоянно после этапов 0–3

### RU-кластер

| Intent | Страница/идея | Формат |
|---|---|---|
| Смотреть вместе | смотреть видео вместе онлайн | pillar guide |
| YouTube | как смотреть YouTube вместе | how-to |
| Кино | смотреть фильм с другом на расстоянии | use case |
| Сериалы | совместный просмотр сериалов | guide |
| Аниме | смотреть аниме вместе | guide |
| Без расширения | watch party без расширения | comparison/how-to |
| Альтернативы | альтернативы Teleparty/Rave | comparison |
| Устройства | телефон + компьютер одновременно | answer page |

### UZ-кластер

| Intent | Рекомендуемая тема |
|---|---|
| birgalikda ko'rish | Do'stlar bilan videoni bir vaqtda ko'rish |
| kino | Masofadan turib birga kino ko'rish |
| YouTube | YouTube'ni do'st bilan sinxron ko'rish |
| juftlik | Uzoq masofadagi juftliklar uchun kino kechasi |
| qurilmalar | Telefon va kompyuterda bir xonaga kirish |
| bepul | Bepul watch party qanday ishlaydi |

### EN-кластер

| Intent | Рекомендуемая тема |
|---|---|
| watch together | Watch videos together online |
| no extension | Watch party without a browser extension |
| cross-device | Watch together on iPhone, Android and desktop |
| long distance | Movie night for long-distance couples |
| alternatives | Teleparty alternatives for mobile and web |
| platform | Watch YouTube/VK/Rutube together |

### Требования к каждой статье

- [ ] один основной intent;
- [ ] уникальный title и description;
- [ ] один понятный H1;
- [ ] answer-first introduction;
- [ ] реальные ограничения;
- [ ] screenshots или diagrams;
- [ ] автор и дата;
- [ ] `dateModified` при обновлении;
- [ ] 3–5 внутренних ссылок;
- [ ] ссылки из pillar/hub;
- [ ] Article/Breadcrumb schema;
- [ ] translated counterpart только при полноценном переводе;
- [ ] отсутствие машинного калькированного языка;
- [ ] IndexNow после публикации;
- [ ] URL Inspection для приоритетных страниц.

### Что не делать

- не создавать десятки страниц с перестановкой одинаковых ключей;
- не переводить страницу только ради hreflang;
- не писать «лучший» без критериев;
- не публиковать comparison без даты и методики;
- не ставить future date;
- не копировать FAQ между страницами без адаптации к intent;
- не считать keywords metadata инструментом ранжирования.

## Этап 5. Performance и page experience

**Приоритет:** P2  
**Срок:** 1–2 недели

### Сначала baseline

Собрать для `/ru`, `/uz`, `/en`, guide и pricing:

- Lighthouse mobile/desktop;
- LCP;
- INP;
- CLS;
- TTFB;
- total JS;
- hydration cost;
- request count;
- image bytes;
- third-party bytes.

### Технические действия

- [ ] разделить `LandingContent.tsx` на server и client islands;
- [ ] оставить интерактивными только необходимые блоки;
- [ ] lazy-load тяжёлые анимации ниже fold;
- [ ] убрать внешние CSS background images или проксировать/оптимизировать их;
- [ ] использовать `next/image` там, где это изображение контента;
- [ ] задать width/height;
- [ ] проверить reduced motion;
- [ ] не гидратировать статические footer/content sections без причины;
- [ ] локализовать OG generation;
- [ ] установить JS budget в CI.

### Целевые бюджеты

Это рабочие цели, а не обещание текущего результата:

| Метрика | Цель p75 |
|---|---:|
| LCP | ≤ 2.5 s |
| INP | ≤ 200 ms |
| CLS | ≤ 0.1 |
| TTFB | ≤ 800 ms |
| Ошибки sitemap | 0 |
| Broken internal links | 0 |

### Definition of Done

- [ ] baseline сохранён до изменений;
- [ ] после изменений есть повторный замер;
- [ ] улучшение подтверждено цифрами;
- [ ] визуальный дизайн и локализация не сломаны;
- [ ] crawler raw HTML не стал беднее.

## Этап 6. Измерение, индексация и off-page authority

**Приоритет:** P1/P2  
**Срок:** постоянно

### Google Search Console

- [ ] проверить Domain property;
- [ ] отправить sitemap;
- [ ] сохранить baseline indexed pages;
- [ ] проверить Page Indexing;
- [ ] проверить HTTPS;
- [ ] проверить Core Web Vitals;
- [ ] проверить Enhancements;
- [ ] проверить Manual Actions;
- [ ] проверить Security Issues;
- [ ] еженедельно экспортировать queries/pages/countries/devices;
- [ ] отдельно отслеживать RU/UZ/EN directories.

### Bing Webmaster Tools

- [ ] добавить сайт;
- [ ] импортировать из GSC при необходимости;
- [ ] отправить sitemap;
- [ ] проверить IndexNow Insights;
- [ ] проверить Site Scan;
- [ ] проверить URL Inspection.

IndexNow ускоряет обнаружение новых и изменённых URL, но не гарантирует индексацию или позиции:

- [Bing: когда использовать IndexNow](https://blogs.bing.com/webmaster/September-2024/IndexNow-When-and-How-Websites-Should-Notify-Search-Engines)

### KPI на 30/60/90 дней

| Период | KPI |
|---|---|
| 7 дней | 0 sitemap/hreflang/schema validation errors |
| 14 дней | ключевые final URL повторно обнаружены и проверены |
| 30 дней | рост числа индексированных guide/use-case URL |
| 30 дней | impressions отдельно по RU/UZ/EN |
| 60 дней | рост non-brand impressions |
| 60 дней | первые позиции/показы по long-tail AEO queries |
| 90 дней | рост organic registrations и assisted conversions |

Нельзя использовать только traffic. Нужны:

- impressions;
- indexed pages;
- average position по кластеру;
- CTR;
- organic registration;
- waitlist conversion;
- assisted conversion;
- branded vs non-branded traffic;
- referral traffic от AI/search assistants, когда referrer доступен.

---

# Часть IV. Предлагаемый task backlog

## P0 — блокируют дальнейшее SEO-масштабирование

### SEO-001 — Product Facts decision

- [ ] получить решения product owner;
- [ ] создать таблицу фактов;
- [ ] назначить владельца и дату ревизии.

### SEO-002 — Sitemap regression fix

- [ ] исправить locale generation;
- [ ] добавить manifest validation;
- [ ] проверить production sitemap.

### SEO-003 — Remove UZ layout hreflang

- [ ] удалить layout alternates;
- [ ] проверить page-level reciprocity.

### SEO-004 — Facts consistency sweep

- [ ] Android/iOS;
- [ ] Free/Pro;
- [ ] 500 ms/±2s;
- [ ] store availability;
- [ ] supported providers.

### SEO-005 — Production SEO gate

- [ ] sitemap 200-only;
- [ ] canonical self;
- [ ] hreflang reciprocal;
- [ ] raw HTML text;
- [ ] bot parity;
- [ ] CI blocking.

## P1 — улучшают качество индексации и ответов

### SEO-006 — FAQ single source

- [ ] один массив для UI/schema;
- [ ] ответы в raw HTML;
- [ ] `<details>` или эквивалент.

### SEO-007 — Schema factory

- [ ] stable IDs;
- [ ] Article completeness;
- [ ] entity deduplication;
- [ ] tests.

### SEO-008 — Correct server-rendered html lang

- [ ] выбрать архитектурное решение;
- [ ] проверить curl/Googlebot/AI UA.

### SEO-009 — Search Console migration validation

- [ ] проверить `/ → /ru` историю;
- [ ] проверить старые URL;
- [ ] запросить recrawl;
- [ ] 2–4 недели мониторинга.

### SEO-010 — GEO fact pages

- [ ] synchronization;
- [ ] compatibility;
- [ ] status;
- [ ] methodology;
- [ ] changelog.

## P2 — рост CTR, производительности и охвата

### SEO-011 — Titles/descriptions cleanup

- [ ] сократить outliers;
- [ ] сохранить intent и locale.

### SEO-012 — Localized OG images

- [ ] RU;
- [ ] UZ;
- [ ] EN.

### SEO-013 — Landing client bundle reduction

- [ ] baseline;
- [ ] server/client split;
- [ ] повторный замер.

### SEO-014 — Content expansion

- [ ] утвердить keyword map;
- [ ] создать briefing template;
- [ ] публиковать по кластеру, а не одиночными статьями.

### SEO-015 — Off-page entity confirmation

- [ ] официальные store links;
- [ ] company/team profiles;
- [ ] social profiles;
- [ ] независимые упоминания;
- [ ] партнёрские ссылки.

---

# Часть V. Контроль качества

## 6. Чек-лист перед каждым deploy

- [ ] build проходит без `ignoreBuildErrors`-скрытых регрессий;
- [ ] lint проходит;
- [ ] route manifest test проходит;
- [ ] sitemap test проходит;
- [ ] canonical test проходит;
- [ ] hreflang reciprocity test проходит;
- [ ] JSON-LD parse test проходит;
- [ ] FAQ UI/schema equality test проходит;
- [ ] raw HTML crawler test проходит;
- [ ] internal links не содержат 404;
- [ ] redirect map не образует цепочки;
- [ ] RU/UZ/EN screenshots проверены;
- [ ] product facts не изменились без owner approval.

## 7. Чек-лист после deploy

- [ ] `/robots.txt` — 200;
- [ ] `/sitemap.xml` — 200 и только final URL;
- [ ] `/llms.txt` — 200;
- [ ] `/ru`, `/uz`, `/en` — 200;
- [ ] root redirect соответствует принятой политике;
- [ ] www redirect — один permanent hop;
- [ ] canonical production host;
- [ ] correct `lang` в raw HTML;
- [ ] FAQ answers в raw HTML;
- [ ] schema совпадает с visible text;
- [ ] IndexNow accepted;
- [ ] GSC URL Inspection выполнен для изменённых P0 pages;
- [ ] deploy SHA записан в задачу.

## 8. Definition of Done для всей программы

Программа SEO/GEO/AEO считается стабилизированной, когда:

- [ ] sitemap не содержит ошибочных и redirect URL;
- [ ] все indexable public routes представлены один раз;
- [ ] canonical и hreflang согласованы;
- [ ] RU/UZ/EN raw HTML имеет правильный язык;
- [ ] product facts едины;
- [ ] JSON-LD соответствует странице;
- [ ] FAQ answers доступны без JS;
- [ ] IndexNow и GSC реально настроены, а не только реализованы в коде;
- [ ] есть production crawler test;
- [ ] есть Core Web Vitals baseline;
- [ ] Search Console monitoring выполняется минимум 4 недели;
- [ ] новые статьи публикуются только через утверждённый content brief;
- [ ] claims имеют доказательства или нейтральную формулировку;
- [ ] organic conversions измеряются по locale и content cluster.

---

# Часть VI. Рекомендуемый порядок на ближайшие 48 часов

## День 1

1. Product owner отвечает на вопросы Android/iOS/Free/Pro/Sync.
2. Исправляется sitemap regression.
3. Удаляется UZ layout hreflang.
4. Добавляется автоматический sitemap/hreflang test.
5. Проверяется production deploy SHA.

## День 2

1. Синхронизируются `llms.txt`, FAQ, pricing и application schema.
2. FAQ answers возвращаются в raw HTML.
3. Выполняется production crawler validation.
4. Sitemap отправляется в GSC и Bing.
5. Исправленные URL отправляются через IndexNow.
6. В задаче фиксируются baseline и дата следующей проверки.

После этого можно начинать schema factory, GEO fact pages и контентное масштабирование.

---

# 9. Ограничения текущего аудита

- Прямой production Playwright-запрос из среды аудита завершился network timeout.
- Поисковая версия и snippets были доступны, но это не заменяет GSC.
- Локальная `next build` не запустилась, потому что `node_modules` отсутствовали.
- Lighthouse/CrUX цифры поэтому не выдумывались и должны быть сняты отдельным этапом.
- После аудита выполнен первый remediation-проход; его изменения и ограничения зафиксированы в разделе 0.

> [!success] Главный управленческий вывод
> Следующий правильный шаг — не писать ещё больше SEO-контента. Сначала нужно вернуть доверие к инфраструктуре: единые факты, единый route manifest, автоматические проверки и подтверждение production-состояния. После этого уже существующий контентный фундамент сможет нормально индексироваться и участвовать в обычном поиске, AI Overviews и генеративных ответах.
