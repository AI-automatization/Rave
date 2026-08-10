# WeWatch SEO/GEO/AEO — отчёт этапа 6

Дата: 2026-08-07  
Статус: локальные measurement/CI/distribution задачи завершены; deploy и webmaster submissions ожидают внешнего доступа

## Выполнено локально

- Создан `measurement-plan.md`: источники данных, dimensions, event contract, production baseline, alert rules и 30/60/90 reviews.
- Создан `distribution-plan.md`: порядок production validation, GSC, Bing, Яндекс, IndexNow, owned и earned distribution.
- Добавлен отдельный GitHub Actions workflow `seo-quality.yml`.
- Web SEO gate подключён к production workflow и блокирует deploy web-изменений при regression.
- Добавлен Lighthouse budget на category scores, LCP, TBT, CLS, first/third-party script и total transfer.

## CI gate

При изменении web-приложения CI выполняет:

1. production build;
2. SEO/structured-data Playwright suite;
3. accessibility Playwright suite;
4. raw HTML visibility для GPTBot, ClaudeBot, PerplexityBot, Googlebot и browser UA;
5. mobile Lighthouse RU home;
6. regression budget validation.

Текущие anti-regression budgets:

| Метрика | Gate |
|---|---:|
| Performance | >= 60 |
| Accessibility / BP / SEO | 100 / 100 / 100 |
| LCP | <= 4500 ms |
| TBT | <= 1500 ms |
| CLS | <= 0.05 |
| First-party script | <= 350 KiB |
| Third-party script | <= 190 KiB |
| Total transfer | <= 850 KiB |

Это floor против регрессии, а не production CWV target. Полевые цели остаются LCP <= 2.5 s, INP <= 200 ms, CLS <= 0.1 по p75.

## Локальная проверка

- Build: **102/102 PASS**.
- SEO/GEO/AEO Playwright: **18/18 PASS**.
- Accessibility Playwright: **18/18 PASS**.
- Crawler visibility: **45/45 PASS**.
- Lighthouse final median: Performance **90**, LCP **3459 ms**, TBT **145 ms**, CLS **0**.
- Lighthouse budget: **PASS**.
- `git diff --check`: **PASS**.

## Внешний остаток

Намеренно не выполнялось без production deploy и account-owner доступа:

- deploy текущего commit;
- production crawler 45/45 и проверка deploy SHA;
- GSC Domain property/sitemap/URL Inspection;
- Bing Webmaster Tools sitemap/IndexNow Insights;
- Яндекс Вебмастер sitemap/переобход;
- IndexNow submit изменённых canonical URL;
- production baseline и 30/60/90 review.

До deploy production crawler остаётся на старой версии: **40/45**, пять failures — один URL `/uz/guides` для пяти user-agent. Локальная версия этого URL проходит **5/5** с 1753 видимыми символами.

## Следующее действие владельца

Опубликовать подготовленный commit через существующий production workflow. После успешного SEO gate выполнить пункты external distribution plan в указанном порядке и записать evidence/date в tracking register.
