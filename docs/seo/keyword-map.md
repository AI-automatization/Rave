---
title: "WeWatch — keyword map и контроль каннибализации"
status: stage-3-local
created: 2026-08-06
updated: 2026-08-06
scope: "64 indexable sitemap URLs"
owner: pending
---

# WeWatch — keyword map и контроль каннибализации

## Назначение

Этот документ назначает каждому индексируемому canonical URL одну основную поисковую задачу. Карта построена по текущему sitemap, фактическим title/H1, содержанию страниц и внутренним ссылкам. Новые URL на этом этапе не создаются.

Важно: это карта intent, а не отчёт по частотности. Без выгрузки Google Search Console, Яндекс Вебмастера и отдельного keyword research здесь не указываются выдуманные показы, позиции или search volume.

## Правила карты

1. Один primary intent принадлежит одному canonical URL внутри языка.
2. Переводы могут владеть эквивалентным intent на другом языке только при реальной эквивалентности содержания.
3. Secondary terms расширяют тему, но не превращают соседнюю страницу в дубль.
4. Hreflang связывает эквивалентные документы, а не просто похожие ключевые слова.
5. Redirect/merge принимается только после анализа GSC/Яндекс за достаточный период; без данных потенциальные дубли сначала разводятся по intent.
6. Entity, legal и navigational страницы сохраняются в sitemap, но не конкурируют с acquisition-контентом.

## RU: acquisition и product intent

| Canonical URL | Primary intent | Роль и граница страницы | Решение |
|---|---|---|---|
| `/ru` | WeWatch / смотреть видео вместе | Брендовая продуктовая главная, обзор сервиса | Keep |
| `/ru/guides` | гайды совместного просмотра | Hub, распределяет вес по специализированным гайдам | Keep |
| `/ru/guides/smotret-vmeste-onlayn` | смотреть вместе онлайн | Универсальная инструкция без привязки к типу видео | Keep, generic owner |
| `/ru/guides/smotret-youtube-vmeste` | смотреть YouTube вместе | Только YouTube workflow | Keep |
| `/ru/guides/smotret-anime-vmeste` | смотреть аниме вместе | Anime use intent через подтверждённые источники | Keep |
| `/ru/guides/smotret-serial-vmeste` | смотреть сериал с другом | Один сериал, последовательный просмотр эпизодов и марафон вдвоём | Keep, rewritten |
| `/ru/guides/smotret-serialy-vmeste-besplatno` | смотреть сериалы вместе бесплатно | Групповой бесплатный сериальный клуб | Keep provisionally, rewritten |
| `/ru/guides/kino-s-drugom-onlayn` | смотреть кино с другом онлайн | Дружеский сценарий просмотра одного фильма | Keep |
| `/ru/guides/smotret-film-vdvoem` | смотреть фильм вдвоём | Ровно два участника и два устройства | Keep provisionally |
| `/ru/guides/smotret-vk-video-vmeste` | смотреть VK Видео вместе | Только VK Видео workflow | Keep |
| `/ru/guides/smotret-rutube-vmeste` | смотреть Rutube вместе | Только Rutube workflow | Keep |
| `/ru/guides/watch-party-besplatno` | бесплатный watch party | Категорийный intent: что доступно бесплатно и как начать | Keep, competitor claims removed |
| `/ru/how-it-works` | как работает WeWatch | Продуктовая инструкция в четыре шага | Keep |
| `/ru/features` | функции WeWatch | Feature inventory: Watch Party, Battle Mode, chat и достижения | Keep |
| `/ru/pricing` | цены WeWatch | Free/Pro и ограничения тарифов | Keep |
| `/ru/about` | что такое WeWatch | Описание продукта и его назначения | Keep |
| `/ru/faq` | вопросы о WeWatch | Короткие ответы о платформе, источниках, аккаунте и sync | Keep |
| `/ru/use-cases/dalnie-otnosheniya` | смотреть фильмы вместе на расстоянии | Отношения в разлуке; эмоциональный сценарий пары | Keep |
| `/ru/use-cases/svidanie-online` | свидание онлайн с фильмом | Идея и сценарий онлайн-свидания, не технический гайд | Keep |

## UZ: acquisition и product intent

| Canonical URL | Primary intent | Роль и граница страницы | Решение |
|---|---|---|---|
| `/uz` | WeWatch / do'stlar bilan video ko'rish | Uzbek product homepage | Keep |
| `/uz/guides` | birgalikda tomosha qilish gaydlari | Uzbek guide hub | Keep |
| `/uz/guides/birgalikda-tomosha-qilish` | birgalikda onlayn tomosha qilish | Universal setup guide | Keep |
| `/uz/guides/youtube-birgalikda` | YouTube birgalikda ko'rish | YouTube workflow | Keep |
| `/uz/guides/anime-birgalikda` | anime birgalikda ko'rish | Anime scenario | Keep |
| `/uz/guides/serial-birgalikda` | serial birgalikda ko'rish | Series scenario | Keep |
| `/uz/guides/kino-birgalikda` | do'stlar bilan onlayn kino ko'rish | Movie-with-friends scenario | Keep |
| `/uz/how-it-works` | WeWatch qanday ishlaydi | Four-step product workflow | Keep |
| `/uz/features` | WeWatch imkoniyatlari | Feature inventory | Keep |
| `/uz/pricing` | WeWatch narxlari | Free/Pro pricing intent | Keep |
| `/uz/about` | WeWatch haqida | Product/entity explanation | Keep |
| `/uz/faq` | WeWatch savollari | Product questions and answers | Keep |
| `/uz/use-cases/masofadagi-juftlik` | masofadan turib birga kino ko'rish | Long-distance couples | Keep |
| `/uz/use-cases/onlayn-uchrashuv` | onlayn uchrashuv kino kechasi | Online date scenario | Keep |

## EN: acquisition и product intent

| Canonical URL | Primary intent | Роль и граница страницы | Решение |
|---|---|---|---|
| `/en` | WeWatch / watch videos together | English product homepage | Keep |
| `/en/guides` | watch together guides | English guide hub | Keep |
| `/en/guides/watch-youtube-together` | watch YouTube together | YouTube workflow | Keep |
| `/en/guides/what-is-watch-party` | what is a watch party | Informational definition and mechanics | Keep, standalone locale |
| `/en/guides/watch-movies-with-friends` | watch movies with friends online | General movie-with-friends guide | Keep |
| `/en/how-it-works` | how WeWatch works | Four-step product workflow | Keep |
| `/en/features` | WeWatch features | Feature inventory | Keep |
| `/en/pricing` | WeWatch pricing | Free/Pro pricing intent | Keep |
| `/en/about` | about WeWatch | Product/entity explanation | Keep |
| `/en/faq` | WeWatch FAQ | Product questions and answers | Keep |
| `/en/use-cases/long-distance` | watch movies together long distance | Couples apart | Keep |
| `/en/use-cases/online-date` | online movie date | Online date scenario | Keep |

## Entity и navigational URL

| Canonical URL | Primary intent | Тип |
|---|---|---|
| `/ru/products` | продукты tezcode.dev | Entity/product portfolio RU |
| `/uz/products` | tezcode.dev mahsulotlari | Entity/product portfolio UZ |
| `/en/products` | tezcode.dev products | Entity/product portfolio EN |
| `/ru/company` | компания tezcode.dev / создатель WeWatch | Organization RU |
| `/uz/company` | tezcode.dev kompaniyasi | Organization UZ |
| `/en/company` | company behind WeWatch | Organization EN |
| `/ru/contact` | контакты WeWatch и tezcode.dev | Contact RU |
| `/uz/contact` | WeWatch aloqa | Contact UZ |
| `/en/contact` | contact WeWatch | Contact EN |
| `/ru/tezcode` | tezcode создатель WeWatch | Entity bridge |
| `/ru/team` | команда WeWatch | Team hub |
| `/ru/team/bekzod-mirzaliyev` | Bekzod Mirzaliyev tezcode | Person entity |
| `/ru/team/ertan-emirhan` | Ertan Emirhan WeWatch | Person entity |
| `/ru/team/saidazim-buriboyev` | Saidazim Buriboyev WeWatch | Person entity |
| `/ru/team/abdulaziz-yormatov` | Abdulaziz Yormatov tezcode | Person entity |

## Legal и account-support URL

| Canonical URL | Primary intent | Тип |
|---|---|---|
| `/privacy-policy` | WeWatch privacy policy | Legal |
| `/terms` | WeWatch terms of service | Legal |
| `/dmca` | WeWatch DMCA policy | Legal |
| `/delete-account` | delete WeWatch account | Account support |

## Каннибализация: критический разбор

### RU movie/watch-together cluster

| Страницы | Пересечение | Решение сейчас | Что проверять после deploy |
|---|---|---|---|
| `/ru` ↔ `/ru/guides/smotret-vmeste-onlayn` | Обе используют «смотреть вместе онлайн» | Главная владеет brand/product intent; гайд — пошаговой generic-инструкцией | Queries и landing pages в GSC |
| `smotret-vmeste-onlayn` ↔ `kino-s-drugom-onlayn` | Generic просмотр и фильм с другом | Generic page не оптимизируется под кино; movie page владеет friend/movie intent | Impressions по «смотреть вместе» и «кино с другом» |
| `kino-s-drugom-onlayn` ↔ `smotret-film-vdvoem` | «с другом» и «вдвоём» близки | Первая — дружеский сценарий; вторая — two-person/two-device exact intent | Если один URL стабильно забирает оба кластера, подготовить merge/301 |
| `smotret-film-vdvoem` ↔ `dalnie-otnosheniya` | Оба говорят о расстоянии | Гайд отвечает «как смотреть вдвоём»; use-case — отношения в разлуке | Query modifiers «вдвоём» против «на расстоянии» |
| `dalnie-otnosheniya` ↔ `svidanie-online` | Пары, романтика, кино | Первая — постоянная разлука; вторая — идея конкретного свидания | CTR и query mix |

Решение: URL сохраняются. Redirect без query/click/backlink history был бы преждевременным и мог бы уничтожить отдельный intent.

### RU series cluster

| URL | Владеет intent | Что изменено |
|---|---|---|
| `/ru/guides/smotret-serial-vmeste` | Смотреть один сериал с другом; эпизоды и марафон | Title, description, keywords, intro и internal anchor сужены до one-series/friend intent |
| `/ru/guides/smotret-serialy-vmeste-besplatno` | Бесплатный групповой сериальный клуб | Title/H1/description/keywords и copy переведены на group/club/free intent |

Обе страницы сохраняются условно. После 60–90 дней production-данных сравнить queries, impressions, clicks и backlinks. При сильном пересечении оставить победителя, перенести уникальные блоки и сделать 301.

### Неверные hreflang-связи

- RU `/watch-party-besplatno` и EN `/what-is-watch-party` не являются эквивалентными переводами: первая коммерчески ориентирована на free solution, вторая объясняет термин. Связь удалена из `GUIDE_GROUPS`.
- RU `/smotret-serialy-vmeste-besplatno` не является отдельным переводом UZ `/serial-birgalikda`; ручной hreflang удалён. UZ-страница остаётся эквивалентом основной RU `/smotret-serial-vmeste`.

## Реализованные safeguards

- `GUIDES` содержит обязательный `primaryIntent` для каждого guide URL.
- Playwright проверяет уникальность `primaryIntent` внутри каждой locale.
- All-sitemap gate проверяет уникальные title и H1 внутри locale.
- Gate запрещает title вида `| WeWatch | WeWatch`.
- Use-case title больше не содержит ручной бренд перед автоматическим title template.
- Неподтверждённая сравнительная таблица конкурентов удалена со страницы бесплатного Watch Party.

## Следующие внешние данные

После deploy нужно выгрузить для каждого URL минимум 60–90 дней:

- query;
- landing page;
- impressions;
- clicks;
- CTR;
- average position;
- country/device;
- backlinks и referring domains.

До этих данных нельзя достоверно объявлять merge, создавать новые landing pages или назначать search volume.
