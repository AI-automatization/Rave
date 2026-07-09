# CLAUDE.md — WeWatch

---

## КОНСТИТУЦИЯ — ПРАВИЛА РАБОТЫ С ИНФОРМАЦИЕЙ

### 1. Сначала поиск
При любом вопросе или задаче — **сначала** использовать инструменты поиска:
- `grep` / `find` по кодовой базе
- `Read` нужных `.md` файлов (Hub, Tasks, контекст зоны)
- `bash .claude/scripts/memory-load.sh quick` при старте сессии
- `bash .claude/scripts/rag.sh q "<тема>"` — семантический recall по Obsidian vault перед нетривиальной задачей (grep = буквально, RAG = по смыслу; RU/UZ/EN, ~1с). Пересбор индекса: `rag.sh index`

Код не пишется и ответ не формируется до прочтения реальных файлов.

### 2. Строго без галлюцинаций — АБСОЛЮТНЫЙ ЗАПРЕТ
```
❌ Придумывать файлы, функции, endpoints, env vars, схему БД
❌ Писать код по памяти — только после Read() реального файла
❌ Утверждать что что-то существует без grep-проверки
❌ Добавлять внешние знания если они противоречат файлам проекта
```
```
✅ Перед изменением: find → Read полностью → проверить импорты → Edit
✅ Перед созданием: убедиться что не существует → читать похожий файл
✅ Если не уверен в существовании — grep сначала, потом отвечать
```

### 3. Честность
Если в файлах проекта нет ответа на вопрос — прямо ответить:
> *"В файлах проекта этого нет"*

Не конструировать ответ из головы. Не угадывать.

### 4. Цитаты — источник обязателен
Для каждого ключевого утверждения указывать файл-источник:
- `[WeWatch-Hub.md]` — архитектурные факты
- `[docs/Tasks.md]` — статус задач
- `[ARCHITECTURE.md]` — стек и паттерны
- `[<zone>/_context.md]` — контекст зоны

---

## ГОЛОСОВЫЕ СООБЩЕНИЯ — ЗАКОН

Когда приходит сообщение с `attachment_file_id` (голосовое/аудио):

```
1. Скачать: mcp__plugin_telegram_telegram__download_attachment(file_id)
2. Транскрибировать: python3 .claude/scripts/transcribe.py <путь_к_файлу>
3. Ответить на содержимое транскрипции как на обычный текст
```

Не спрашивать "что ты сказал?" — всегда транскрибировать и отвечать сразу.

---

## ОТ КЛОДА — НАБЛЮДЕНИЯ ИЗ ПРАКТИКИ

Это добавлено самостоятельно на основе реального опыта работы с кодовой базой.

### Три платформы = один баг в трёх местах
Любое изменение в extraction pipeline (`services/content/`) затрагивает сразу web + Android + iOS.
Перед коммитом всегда проверять: "как это изменение ведёт себя на всех трёх?"
Особенно критично: Socket.io events, API response format, shared/types.

### Embed = потеря синхронизации
`iframe` embed (YouTube, Rutube, VK) не поддаёт seek/rate через JS postMessage надёжно.
Если платформа поддерживает прямое извлечение → **всегда** использовать extraction + HLS-прокси.
Embed — это последний fallback, не первый выбор.

### CDN IP-lock — решается Railway прокси
VK, Rutube, и ряд других CDN привязывают токен к IP extraction.
Мобильное устройство с другим IP получает 403.
Решение уже есть: `/content/hls-proxy` на Railway переписывает сегменты через тот же IP.
Не нужно городить WebView-sniffing — достаточно пустить через прокси.

### `sent = true` в CDN-sniffing — ловушка
`CDN_SNIFF_JS` отправляет только **первый** пойманный URL (`sent = true`).
Если VK показывает pre-roll рекламу — первым приходит рекламный URL, основное видео теряется.
При обновлении скрипта: добавить задержку или фильтр по домену VK CDN перед установкой `sent = true`.

### TypeScript ошибки до работы = фон, не блокер
В проекте есть pre-existing TS ошибки (mobile notifications, LanguageTransition).
При проверке `tsc --noEmit` — сравнивать список ДО и ПОСЛЕ изменений.
Новые ошибки = мои. Старые = фон.

---

## ЯЗЫК — ЗАКОН

**Claude ВСЕГДА отвечает ТОЛЬКО на русском языке.** Любой язык входа → русский выход.
Код, комментарии, технические термины — английский.

---

## ⛔ СТАРТ СЕССИИ — 3 ШАГА (Hub-based, обязательно)

**ЗАПРЕЩЕНО отвечать на задачи пока все 3 шага не выполнены.**

```
ШАГ 1 — git pull origin main
         → Если конфликт — СТОП, сообщить пользователю

ШАГ 2 — Прочитать WeWatch Hub (ЕДИНСТВЕННЫЙ ИСТОЧНИК ПРАВДЫ для архитектуры/зон/правил):
         Read ~/Documents/weWatch-obsidian/WeWatch-Hub.md
         → Содержит: сервисы, зоны, правила, задачи, контакты, скиллы — ВСЁ
         → Плюс bash .claude/scripts/memory-load.sh quick — детальный слой
           (CONSTRAINTS.md/LAST_SESSION.md/ARCHITECTURE.md), Hub'у не противоречит,
           а дополняет его тем же файлам, что перечислены в Hub → PROJECT CONTEXTS

ШАГ 3 — Прочитать docs/Tasks.md
         → Проверить активные задачи, последний T-номер
         → Если есть 🔄 Bajarilmoqda → спросить продолжать или нет
```

**После 3 шагов — показать сводку и ждать команды.**

> Hub не найден? → читать: CONSTRAINTS.md + LAST_SESSION.md + ARCHITECTURE.md (fallback, тот же набор что даёт memory-load.sh)

> **Автоматика (SessionStart-хук, `obsidian-session-start.sh`) читает Hub напрямую** — не отдельный
> `_context.md` файл. Раньше хук молча грузил устаревший `PROJECTS/weWatch/_context.md` (одноимённый,
> но не тот файл, что обновляется по зонам в `ZONES/<zone>/_context.md`) — исправлено 2026-07-09,
> проверено запуском хука. `ZONES/<zone>/_context.md` — зональный контекст (см. Zone System ниже),
> отдельный файл от Hub, коллизии имён больше нет в автоматическом пути.

---

## SUB-AGENT SPAWN — HUB INLINE PATTERN

При любом Agent() вызове — ОБЯЗАТЕЛЬНО передать Hub bundle:

```
== DOMAIN == weWatch
== HUB BUNDLE ==
{~/Documents/weWatch-obsidian/WeWatch-Hub.md — прочитать и вставить INLINE, не file path}
== APPLICABLE RULES ==
No Socket.io rename | No shared/* without lock | Anti-hallucination | Zone check
== TASK ==
{конкретная задача — file:line, что изменить}
```

> Orphan Rule 41: каждый новый файл = 2 шага: создать → СРАЗУ добавить в Hub нужный раздел.

---

## OBSIDIAN ZONE SYSTEM — ЗАКОН

**Каждая платформа/направление = отдельная зона в Obsidian.**

```
Vault: ~/Documents/weWatch-obsidian/ZONES/
  Instagram/        — Reels, slides, content, audio
  WeWatch-Mobile/   — React Native, Expo, mobile features
  WeWatch-Backend/  — services/*, Node.js, MongoDB
  WeWatch-Web/      — apps/web/
  Telegram/         — боты, уведомления, интеграции
  AI-Agents/        — swarm agents, automation
  Skills/           — все skill файлы с зонами
  MCPs/             — MCP инструменты и конфиги
  Plugins/          — плагины и расширения
```

### Автоматическое определение зоны (ОБЯЗАТЕЛЬНО):

Когда пользователь говорит → немедленно загрузить зону:
```
"Instagram...", "Reel...", "slides..."   → bash .claude/scripts/zone-load.sh instagram
"Mobile...", "React Native...", "Expo..."→ bash .claude/scripts/zone-load.sh mobile
"Backend...", "service...", "API..."     → bash .claude/scripts/zone-load.sh backend
"Web...", "Next.js...", "apps/web..."   → bash .claude/scripts/zone-load.sh web
"Telegram...", "bot...", "guruh..."     → bash .claude/scripts/zone-load.sh telegram
"agent...", "swarm...", "automation..." → bash .claude/scripts/zone-load.sh ai-agents
```

### После завершения работы с зоной (ОБЯЗАТЕЛЬНО):
```bash
# Зону обновить — что сделано, что следующее
# Редактировать: ~/Documents/weWatch-obsidian/ZONES/<zone>/_context.md
```

---

## ⛔ ДО СТАРТА КАЖДОЙ ЗАДАЧИ — ЧЕКЛИСТ (ЗАПРЕЩЕНО ПРОПУСКАТЬ)

```
□ 1. git pull origin main (даже если только что делал)
□ 2. docs/Tasks.md → проверить pending[другой] на эту задачу
□ 3. Написать pending[СвоёИмя] → git add docs/Tasks.md → git commit → git push
□ 4. tg-notify.sh claim T-XXX ...
□ 5. obsidian-checkpoint.sh T-XXX 0 "" "первый шаг — файл:строка"
□ 6. Показать пользователю: 📋 T-XXX | 🤖 [model] | 📝 [причина] → получить подтверждение
```

**ЗАПРЕЩЕНО писать код до получения подтверждения от пользователя.**

---

## ПРОЕКТ

WeWatch — соцсеть для совместного просмотра фильмов.

| Сервис | Tech | Port |
|--------|------|------|
| auth | Node.js+Express+MongoDB | 3001 |
| user | Node.js+Express+MongoDB | 3002 |
| content | Node.js+Express+Elasticsearch | 3003 |
| watch-party | Express+Socket.io+Redis | 3004 |
| battle | Express+MongoDB+Redis | 3005 |
| notification | Express+Firebase FCM+Bull | 3007 |
| admin | Express+MongoDB | 3008 |
| mobile | React Native+TypeScript | — |
| admin-ui | React+Vite+Tailwind | 5173 |
| DB | MongoDB Atlas | 27017 |
| Cache | Redis 7 | 6380 |
| Search | Elasticsearch | 9200 |

```
services/auth,user,content,watch-party,battle,notification,admin → Saidazim
apps/mobile → Saidazim + Emirhan | apps/admin-ui → Saidazim
shared/types,utils,constants → ОБЩЕЕ (lock protocol)
```

---

## CLEAN CODE

```
❌ any type          ❌ console.log (использовать logger)   ❌ 400+ строк в файле
❌ Magic numbers     ❌ Nested try/catch                    ❌ Hardcoded secrets
❌ Чужая зона        ❌ shared/* без lock/согласования      ❌ push в main напрямую
```
Дубли → `shared/utils/`. Controller = HTTP, Service = логика, Screen = render.

---

## TASK TRACKING — ЗАКОН

Файлы: `docs/Tasks.md` (открытые) | `docs/Done.md` (архив)

**Формат новой задачи — все поля ОБЯЗАТЕЛЬНЫ:**
```markdown
### T-S057 | P1 | [BACKEND] | Название

- **Mas'ul:** pending[Saidazim]
- **Beruvchi:** Emirhan
- **Yaratilgan:** 2026-04-20 16:00
- **Holat:** ❌ Boshlanmagan
- **Tavsiya model:** sonnet
- **Model sababi:** 2-4 fayl, API endpoint
- **Sabab:** ...
```

**Модели:** opus = сложная архитектура/рефактор | sonnet = фича, 2-5 файлов | haiku = 1 файл, опечатки

**Done.md формат:**
```markdown
### F-XXX | T-S057 | Название
- **Bajaruvchi:** Saidazim (Claude sonnet)  **Bajarilgan:** 2026-04-20 16:00  **Model:** sonnet
- **O'zgarishlar:** файлы  **Xulosa:** что сделано
```

---

## TELEGRAM УВЕДОМЛЕНИЯ — ЗАКОН

**При ЛЮБОМ изменении задач — отправить уведомление. ЗАПРЕЩЕНО молчать.**
```bash
.claude/scripts/tg-notify.sh <action> <task_id> <task_meta> <title> [executor] [details]
# actions: new | claim | done | update | blocked
# T-S*** → Saidazim | T-E*** → Emirhan | T-C*** → оба
```
Примеры:
```bash
.claude/scripts/tg-notify.sh claim T-S057 "P1 | BACKEND" "Название" Saidazim
.claude/scripts/tg-notify.sh done T-S057 "P1 | BACKEND" "Название" Saidazim "3 fayl, tsc: CLEAN"
```

---

## GIT TASK LOCKING — ЗАКОН

**Перед стартом задачи:**
```
1. git pull origin main
2. docs/Tasks.md → проверить pending[другой] → если занято — не трогать
3. Написать pending[СвоёИмя] → git add docs/Tasks.md
4. git commit -m "task: claim T-XXX [Имя]" → git push origin main
5. tg-notify.sh claim ...  →  ТЕПЕРЬ можно работать
```
**После завершения:** Tasks.md удалить → Done.md добавить → git commit+push → tg-notify done

---

## SHARED FILE PROTOCOL

`shared/types/`, `shared/utils/`, `shared/constants/` — уведомить в Telegram, получить подтверждение, затем изменять. Commit: `shared: [что добавлено] ([имя])`.
Multi-Agent: `.claude/locks/shared-{zone}.lock` (TTL 30 мин).

---

## GIT ПРАВИЛА

```
Branch: saidazim/feat-xxx | emirhan/feat-xxx
Commits: feat(auth): ... | fix(watch-party): ... | refactor(content): ...
main → production (protected) | develop → integration
```

---

## ЛОГИРОВАНИЕ

```typescript
import { logger } from '@shared/utils/logger';
logger.info('msg', { userId });  // НЕ console.log
// Mobile: if (__DEV__) console.log  |  Web: if (process.env.NODE_ENV === 'development')
```

---

## SECURITY

```
JWT: 15min RS256 + 30d refresh | bcrypt 12r | Joi/Zod validation все endpoints
mongoose-sanitize | helmet+DOMPurify | CORS whitelist | rate-limit Redis
Brute force: 5 попыток → 15min блок | Socket.io JWT verify
```

---

## MULTI-AGENT ПРОТОКОЛ

Полный протокол: `.claude/agents/` (каждый агент ~100 строк вместо 1100+)

| Агент | Файл | Зона |
|-------|------|------|
| Auth | `.claude/agents/auth-agent.md` | services/auth/ |
| Content | `.claude/agents/content-agent.md` | services/content/ |
| WatchParty | `.claude/agents/watchparty-agent.md` | services/watch-party/ |
| User+Battle+Notif | `.claude/agents/user-battle-notification-agent.md` | services/user,battle,notification/ |
| Admin | `.claude/agents/admin-agent.md` | services/admin/ + apps/admin-ui/ |
| Mobile | `.claude/agents/mobile-agent.md` | apps/mobile/ |
| Web | `.claude/agents/web-agent.md` | apps/web/ |
| QA | `.claude/agents/qa-agent.md` | read-only |

**Dispatch:** прочитай `.claude/agents/{agent}.md` → составь task spec (file:line, что изменить) → `Agent(prompt: [агент-файл] + [task spec])`. НЕ добавлять CLAUDE.md в prompt агента.

**Zone matrix:** Backend Agent — только services/* и admin-ui/ | Mobile — только apps/mobile/ | Web — только apps/web/ | shared — lock protocol | QA — read-only везде.

**QA перед merge:** tsc --noEmit (все сервисы) + jest + Playwright (если web). Fail → merge запрещён.

**Размер задачи:** <30 мин, 1-2 файла → Single Agent | >60 мин, 5+ файлов → Multi-Agent + worktrees | IKKALASI → Backend сначала, потом Mobile/Web.

---

## ⛔ ОПАСНЫЕ ЗОНЫ — АБСОЛЮТНЫЕ ЗАПРЕТЫ

```
❌ MongoDB collection drop        ❌ .env в коммит           ❌ Socket.io event rename (ломает 3 платформы)
❌ Чужая зона без согласования    ❌ shared/* без lock        ❌ API response format change без shared/types
❌ Production DB вручную          ❌ QA skip перед merge      ❌ push в main напрямую
❌ Начать задачу без claim        ❌ Код без memory-load.sh   ❌ Завершить без tg-notify done
```

---

## MEMORY SYSTEM — ЗАКОН

**Vault:** `~/Documents/weWatch-obsidian/PROJECTS/weWatch/`

> Это не отдельный параллельный протокол — `memory-load.sh` детализирует то же, на что Hub
> ссылается в PROJECT CONTEXTS (см. «СТАРТ СЕССИИ — 3 ШАГА» выше). Один старт, два слоя
> глубины (Hub = обзор, эти файлы = детали), не два конкурирующих источника правды.

### ⛔ ЗАПРЕЩЕНО начинать любую задачу без загрузки памяти:
```bash
bash .claude/scripts/memory-load.sh quick   # ОБЯЗАТЕЛЬНО при каждом старте сессии
bash .claude/scripts/memory-load.sh full    # перед сложными задачами (opus-уровень)
bash .claude/scripts/rag.sh q "<тема>"      # семантический recall по vault перед нетривиальной задачей
                                            # (дополняет grep: grep = буквально, RAG = по смыслу)
```

Файлы памяти (в порядке чтения):
```
CONSTRAINTS.md  → абсолютные запреты + anti-hallucination rules
LAST_SESSION.md → где остановились, следующий шаг
_bugs.md        → known bugs (не воспроизводить!)
ARCHITECTURE.md → стек, паттерны, структура сервисов
DECISIONS.md    → почему архитектура именно такая
API.md          → все endpoints + env variables
```

### Обязательный workflow (5 фаз):
```
1. RESEARCH  → .claude/skills/research.md     — изучить перед кодом
2. SUMMARY   → показать понимание задачи + что будет изменено
3. PLAN      → пошаговый план, минимальные изменения
             → перед сложной задачей: agy -p "ревью плана, 3 слабых места" (.claude/skills/antigravity.md)
4. EXECUTE   → только после research, existing patterns
5. MEMORY UPDATE → обновить LAST_SESSION.md + Done.md + tg-notify
             → перед отдачей результата: agy -p "ревью решения, что упустил" (внешнее второе мнение)
```

### 🛰️ ANTIGRAVITY (`agy`) — внешний критик
```
agy -p "<промпт>"   — single-shot второе мнение (Gemini/Claude/GPT-OSS, залогинен)
Прогонять планы и решения через agy перед/после нетривиальной работы.
Критику фильтровать через знание проекта — agy советник, не начальник.
Детали: .claude/skills/antigravity.md | ZONES/MCPs/antigravity-cli.md
```

### Anti-hallucination
См. КОНСТИТУЦИЯ §2 (в начале файла) — то же правило, один канонический текст, не дублировать здесь.

### В конце каждой сессии (ОБЯЗАТЕЛЬНО):
```bash
bash .claude/scripts/update-last-session.sh "T-SXXX" "что делали" "следующий шаг"
```

---

## CHECKPOINT — ЗАКОН

**ЗАПРЕЩЕНО работать над задачей без активного checkpoint.**

```bash
# Старт задачи:
.claude/scripts/obsidian-checkpoint.sh T-XXX 0 "" "первый шаг — файл:строка"
# После каждого изменённого файла:
.claude/scripts/obsidian-checkpoint.sh T-XXX 40 "Файл.tsx готов" "следующий — Header.tsx"
# Завершение:
.claude/scripts/obsidian-checkpoint.sh clear "T-XXX"
```

```
❌ Старт задачи без checkpoint      ❌ 2+ файла без обновления checkpoint
❌ Done.md без checkpoint clear     ❌ Игнорировать in-progress при старте
❌ Игнорировать 🚧 в daily note     ❌ Завершить сессию без update-last-session.sh
```

---

## СКИЛЛЫ — ДЕРЕВО РЕШЕНИЙ

```
Память / контекст:
  • RAG        → bash .claude/scripts/rag.sh q "<тема>"  (семантический поиск по vault — RU/UZ/EN, ~1с; grep дополняет)
  • MEMORY     → .claude/skills/memory.md           (read/write vault, resume session)
  • STATUS     → .claude/skills/status.md           (current project state snapshot)
  • RESEARCH   → .claude/skills/research.md         (explore before code — ОБЯЗАТЕЛЬНО)
  • READ-FIRST → .claude/skills/read-before-write.md (never edit without reading)
  • BUGS       → .claude/skills/bugs.md             (log bugs to vault)
  • CONSTRAINTS→ .claude/skills/constraints.md      (zone check + anti-hallucination)

БАГ/ошибка?         → .claude/skills/root-cause-tracing.md    (5-шаговый трейс ПЕРЕД кодом)
Mode B / >5 файлов? → .claude/skills/subagent-dispatch.md
Идеи / решения?     → .claude/skills/brainstorm.md            (/brainstorm [тема] — 5 фаз)
Новая фича?         → .claude/skills/feature-dev.md           (7 фаз: discovery→arch→impl→review)

Пишу код:
  0. WORKFLOW → .claude/skills/dev-workflow.md           (PRE-CHECK обязателен если ≥3 файла или >20 мин)
  1. SPEC   → .claude/skills/spec-driven-implement.md    (YAML-спек обязателен)
  2. LOOP   → .claude/skills/execute-judge-loop.md       (write→tsc→judge≥7→fix)
  3. REFLECT→ .claude/skills/self-reflection.md          (7 шагов: imports/tsc/zone/forbidden — все ✅)
  4. CRITIC → .claude/skills/critic-agent.md             (3 судьи ≥7/10 → APPROVE)
  4b.AGY   → .claude/skills/antigravity.md               (agy -p "..." — внешнее второе мнение + self-critic, перед/после нетривиальной задачи)
  5. TESTS  → .claude/skills/auto-tests.md
  6. VISUAL → .claude/skills/visual-testing.md           (только если .tsx/.css/StyleSheet)

Frontend UI/UX:
  • DESIGN  → .claude/skills/frontend-design.md          (WeWatch dark glass UI, Bebas Neue, no AI slop)
  • UI/UX   → .claude/skills/ui-ux-pro-max.md            (99 правил, accessibility/touch CRITICAL)
  • TEST    → .claude/skills/webapp-testing.md           (Playwright — скрины, auth flow, локали)

Качество / DevOps:
  • REVIEW  → .claude/skills/code-review.md              (/code-review [PR] — multi-agent, CLAUDE.md+bugs+security)
  • REFACTOR→ .claude/skills/refactor.md                 (dead code, simplify, guard clauses, 400-line limit)
  • SECURITY→ .claude/skills/security-audit.md           (OWASP, secrets scan, JWT/auth, deps)
  • ARCH    → .claude/skills/architecture-review.md      (design review + ADR writing)
  • DEPLOY  → .claude/skills/deploy.md                   (Railway pre-checks → health verify → rollback)

Маркетинг (coreyhaines31/marketingskills, отдельный namespace от dev-скиллов выше — 43 файла всего):
  • Запуск/стратегия: marketing-launch, marketing-pricing, marketing-marketing-ideas
  • Контент: marketing-social, marketing-video, marketing-copywriting, marketing-emails
  • SEO/ASO: marketing-seo-audit, marketing-ai-seo, marketing-aso
  • Платный трафик: marketing-ads, marketing-ad-creative
  • Рост: marketing-analytics, marketing-onboarding, marketing-referrals
  Все файлы: `.claude/skills/marketing-<name>.md` (имя = как выше, без префикса)

ГОТОВО → POST-CHECK (dev-workflow) + checkpoint clear + Done.md + tg-notify + git commit
         + bash .claude/scripts/update-last-session.sh "T-XXX" "что сделано" "следующий шаг"
```

**Пропорциональность — две независимые оси, не путать:**
- **Ось "церемония" (эта режется по размеру):** полный пайплайн (SPEC→LOOP→REFLECT→CRITIC→AGY→TESTS→VISUAL) —
  для ≥3 файлов или >20 мин (тот же порог, что в dev-workflow). Иначе — прямой путь: RESEARCH → EXECUTE → Reply.
  Явные исключения (dev-workflow пропустить): typo/1 символ, docs/Tasks.md, config, messages/*.json.
- **Ось "командный слой" (НЕ режется размером задачи):** git claim (ЧЕКЛИСТ выше), tg-notify, checkpoint —
  обязательны для ЛЮБОГО размера, включая правку в 1 символ. Это защита от конфликта с Emirhan, а не ceremony —
  правка в 1 символ в общем репо всё ещё может столкнуться со вторым разработчиком. "Прямой путь" выше НЕ отменяет
  ни один шаг git-locking/notify/checkpoint — это другая ось, честно медленная независимо от размера задачи.
CLI-скиллы: `/simplify` | `/security-review` | `/review` | `/fewer-permission-prompts` | `/brainstorm`

---

## OBSIDIAN ПАМЯТЬ — ЗАКОН

Vault: `~/Documents/weWatch-obsidian` (env: `OBSIDIAN_VAULT`)

| Когда | Тип |
|-------|-----|
| Архитектурное решение | `decision` |
| Root cause бага | `bug` |
| Нетривиальная идея | `idea` |
| Fix применён | `fix` |

```bash
.claude/scripts/obsidian-note.sh <decision|bug|idea|fix|todo|note> weWatch "<title>" "<body>" [executor]
```

---

## ЧИТАТЬ ДОПОЛНИТЕЛЬНО

| Файл | Кому |
|------|------|
| `CLAUDE_BACKEND.md` | Saidazim |
| `CLAUDE_MOBILE.md` | Emirhan (детали зоны) |
| `CLAUDE_EMIRHAN.md` | Emirhan (Claude конфиг + сессия) |
| `docs/Tasks.md` | Все |
| `docs/Done.md` | Все |

**Настройка Emirhan (один раз):** `bash .claude/scripts/emirhan-setup.sh`

---
*CLAUDE.md | WeWatch | v4.0 | 2026-05-25*
