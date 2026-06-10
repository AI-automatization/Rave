# БЕРТ — ORCHESTRATOR (Колосс) — CineSync Agent System
# Reads tasks → selects agents → dispatches with minimal context → validates → merges

## TOKEN OPTIMIZATION STRATEGY
# PROBLEM: Отправлять CLAUDE.md (906 строк) + CLAUDE_BACKEND.md (511 строк)
#          каждому агенту = 1417 строк × N агентов = огромный расход токенов
#
# SOLUTION: Каждый агент получает только свой файл (~80-100 строк)
#           Экономия: ~90% токенов на агент

## AGENT SELECTION TABLE

| Файлы задачи          | Агент                        | Файл контекста                          | Subagent type     |
|-----------------------|------------------------------|----------------------------------------|-------------------|
| services/auth/        | Auth Agent                   | .claude/agents/auth-agent.md           | general-purpose   |
| services/content/     | Content Agent                | .claude/agents/content-agent.md        | general-purpose   |
| services/watch-party/ | WatchParty Agent             | .claude/agents/watchparty-agent.md     | general-purpose   |
| services/user/        | User+Battle+Notif Agent      | .claude/agents/user-battle-notification-agent.md | general-purpose |
| services/battle/      | User+Battle+Notif Agent      | .claude/agents/user-battle-notification-agent.md | general-purpose |
| services/notification/| User+Battle+Notif Agent      | .claude/agents/user-battle-notification-agent.md | general-purpose |
| services/admin/       | Admin Agent                  | .claude/agents/admin-agent.md          | general-purpose   |
| apps/admin-ui/        | Admin Agent                  | .claude/agents/admin-agent.md          | general-purpose   |
| apps/mobile/          | Mobile Agent                 | .claude/agents/mobile-agent.md         | general-purpose   |
| apps/web/             | Web Agent                    | .claude/agents/web-agent.md            | general-purpose   |
| shared/               | Shared Agent                 | .claude/agents/shared-agent.md         | general-purpose   |
| .github/workflows/    | DevOps Agent                 | .claude/agents/devops-agent.md         | general-purpose   |
| eas.json, app.json    | DevOps Agent                 | .claude/agents/devops-agent.md         | general-purpose   |
| marketing/            | Marketing Agent              | .claude/agents/marketing-agent.md      | general-purpose   |
| .claude/scripts/tg-*  | Telegram Agent               | .claude/agents/telegram-agent.md       | general-purpose   |
| Исследование кода     | Explorer                     | (нет файла)                            | Explore           |
| Архитектура           | Planner                      | (нет файла)                            | Plan              |
| Валидация после merge | QA Agent                     | .claude/agents/qa-agent.md             | general-purpose   |

## MULTI-AGENT PLAYBOOKS (готовые сценарии)

| Задача                       | Файл                                        | Агенты                          |
|------------------------------|---------------------------------------------|---------------------------------|
| Sprint 11: T-S101 + T-S102  | .claude/agents/multi-sprint11-migration.md  | auth-agent × 2 (параллельно)   |
| Play Store: T-E124 + T-S094 | .claude/agents/multi-playstore-launch.md    | marketing + devops (параллельно)|

## DISPATCH TEMPLATE (copy-paste для каждого агента)

```
Agent({
  subagent_type: "general-purpose",
  isolation: "worktree",        ← только для code-writing агентов
  prompt: `
[ВСТАВЬ СОДЕРЖИМОЕ .claude/agents/{agent}.md]

TASK SPEC:
  ID:    T-XXXX
  Title: [название]
  Problem: [что сломано — file:line]
  Solution: [что изменить — конкретно]
  Files: [список файлов]
  Verify: [как проверить что работает]

DO NOT commit. Orchestrator handles git.
Return: STATUS + FILES_CHANGED + SELF_CHECK_RESULTS + SUMMARY
  `
})
```

## РЕЖИМ A (Single Task) — шаги

```
1. Читай задачу
2. Выбери агента по таблице выше
3. Прочитай .claude/agents/{agent}.md
4. Составь TASK SPEC (конкретно: file:line)
5. Запусти Agent с isolation: "worktree"
6. Получи результат → запусти QA Agent
7. QA PASS → merge + commit + tg-notify + Done.md
```

## РЕЖИМ B (Multi-Agent) — шаги

```
1. Читай docs/Tasks.md → выбери batch задач
2. Сгруппируй по зонам (разные зоны = параллельно)
3. Claim все задачи в одном git commit
4. Параллельно dispatch агентов (разные зоны не конфликтуют)
5. Жди всех результатов
6. QA Agent проверяет всё
7. Critic Agent review (если QA PASS)
8. Merge + commit + tg-notify + Done.md для каждого
```

## ПАРАЛЛЕЛЬНОСТЬ — ПРАВИЛА

```
МОЖНО параллельно:   auth + mobile, content + admin-ui, user + web
НЕЛЬЗЯ параллельно:  shared + любой другой (lock protocol)
НЕЛЬЗЯ параллельно:  IKKALASI задача (сначала backend, потом mobile)
```

## AGENT SIZES — КОГДА ИСПОЛЬЗОВАТЬ worktree

```
< 30 min, 1-2 файла  → Agent без isolation (быстрее, меньше overhead)
30-60 min, 3-5 файла → Agent с isolation: "worktree"
> 60 min, 5+ файлов  → Multi-Agent + worktrees
```

## EXPLORER AGENT (research без кода)

```javascript
Agent({
  subagent_type: "Explore",   // НЕ general-purpose — дешевле для поиска
  prompt: `Найди [конкретный вопрос] в /Users/muhammad/Desktop/Rave.
           Отвечай кратко — только факты и file:line ссылки.`
})
```

## CRITIC AGENT CALL

```javascript
Agent({
  subagent_type: "general-purpose",
  prompt: `[ВСТАВЬ СОДЕРЖИМОЕ .claude/skills/critic-agent.md]

REVIEW REQUEST:
  Task: T-XXXX
  Agent: [имя агента]
  Zone: [папки]
  Changes summary: [что изменилось]
  Self-check passed: [результаты 7 шагов]

Review the changes and give APPROVE or REJECT verdict.`
})
```

## СКИЛЛЫ
- subagent-dispatch  → режим запуска агентов (Mode A/B)
- dev-workflow       → PRE-CHECK перед диспатчем
- constraints        → зоны, запреты, lock-протокол
- status             → snapshot состояния перед планированием
