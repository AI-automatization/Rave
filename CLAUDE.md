# CLAUDE.md — WeWatch

---

## ЯЗЫК — ЗАКОН

**Claude ВСЕГДА отвечает ТОЛЬКО на русском языке.** Любой язык входа → русский выход.
Код, комментарии, технические термины — английский.

---

## ⛔ СТАРТ СЕССИИ — ВСЕ 7 ШАГОВ ОБЯЗАТЕЛЬНЫ. ПРОПУСК ЛЮБОГО = НАРУШЕНИЕ.

**ЗАПРЕЩЕНО отвечать на задачи пока все 7 шагов не выполнены.**

```
ШАГ 1 — Узнать разработчика: Saidazim (Backend+Admin+Mobile) или Emirhan (Mobile+Web)
         → Прочитать CLAUDE_BACKEND.md (Saidazim) / CLAUDE_MOBILE.md + CLAUDE_EMIRHAN.md (Emirhan)

ШАГ 2 — git pull origin main
         → Если конфликт — СТОП, сообщить пользователю

ШАГ 3 — Загрузить Obsidian память (ОБЯЗАТЕЛЬНО, БЕЗ ИСКЛЮЧЕНИЙ):
         bash .claude/scripts/memory-load.sh quick
         → Читать: CONSTRAINTS.md → LAST_SESSION.md → _bugs.md → ARCHITECTURE.md

ШАГ 4 — Проверить незавершённые задачи:
         cat AI_CONTEXT/in-progress-{developer}.md
         → Если status=active → сообщить пользователю, спросить продолжать или нет
         → НЕ переходить к новому пока пользователь не ответил

ШАГ 5 — Прочитать Daily Note:
         Saidazim: cat ~/Documents/weWatch-obsidian/DAILY/Saidazim/$(date '+%Y-%m-%d').md
         Emirhan:  cat ~/Documents/weWatch-obsidian/DAILY/Emirhan/$(date '+%Y-%m-%d').md
         → Найти 🚧 Checkpoint без ✅ Завершено → если есть = задача не завершена → доделать

ШАГ 6 — Прочитать docs/Tasks.md
         → Проверить статусы 🔄 Bajarilmoqda
         → Запомнить последний T-номер

ШАГ 7 — Проверить Telegram (TEZCODE):
         bash .claude/scripts/tg-watch.sh history 3
         → URGENT(≥7) → показать сразу | TASK(≥4) → спросить добавить | BUG → создать task
```

**После всех 7 шагов — показать пользователю сводку и ждать команды.**

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

### ⛔ ЗАПРЕЩЕНО начинать любую задачу без загрузки памяти:
```bash
bash .claude/scripts/memory-load.sh quick   # ОБЯЗАТЕЛЬНО при каждом старте сессии
bash .claude/scripts/memory-load.sh full    # перед сложными задачами (opus-уровень)
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
4. EXECUTE   → только после research, existing patterns
5. MEMORY UPDATE → обновить LAST_SESSION.md + Done.md + tg-notify
```

### ⛔ Anti-hallucination — АБСОЛЮТНЫЙ ЗАПРЕТ:
```
❌ Никогда не придумывать: файлы, endpoints, env vars, схему, функции
❌ Никогда не писать код по памяти — только после чтения реального файла
✅ Перед изменением: find → Read полностью → проверить импорты → Edit
✅ Перед созданием: убедиться что не существует → читать похожий файл
✅ Если не уверен в существовании — grep сначала, потом отвечать
```

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

ГОТОВО → POST-CHECK (dev-workflow) + checkpoint clear + Done.md + tg-notify + git commit
         + bash .claude/scripts/update-last-session.sh "T-XXX" "что сделано" "следующий шаг"
```

Исключения (dev-workflow пропустить): typo/1 символ, docs/Tasks.md, config, messages/*.json.
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
