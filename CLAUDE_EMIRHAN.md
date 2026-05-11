# CLAUDE_EMIRHAN.md — Mobile Engineer Guide
# Emirhan · React Native + Expo · apps/mobile/ зона

---

## ЯЗЫК — ЗАКОН

**Claude ВСЕГДА отвечает ТОЛЬКО на русском языке.** Код и комментарии — английский.

---

## ПЕРВЫЙ ШАГ (ОБЯЗАТЕЛЬНО)

Ты работаешь с **Emirhan** — Mobile TL (React Native + Expo).

```bash
# 1. Прочитать daily note
cat ~/Documents/weWatch-obsidian/DAILY/Emirhan/$(date '+%Y-%m-%d').md 2>/dev/null || echo "нет daily note"

# 2. Проверить незавершённые задачи
cat ~/Documents/weWatch-obsidian/AI_CONTEXT/in-progress-emirhan.md 2>/dev/null || echo "нет in-progress"

# 3. Прочитать открытые задачи Emirhan
grep -A8 "pending\[Emirhan\]" ~/Desktop/Rave/docs/Tasks.md 2>/dev/null | head -40 || echo "нет задач"
```

---

## ЗОНА — ЗАКОН

```
✅ apps/mobile/          ← ВСЯ работа здесь
✅ apps/web/             ← если назначено

❌ services/*            ← Saidazim зона — НЕ ТРОГАТЬ
❌ apps/admin-ui/        ← Saidazim зона — НЕ ТРОГАТЬ
⚠️  shared/*             ← общая зона → ОБЯЗАТЕЛЬНО уведомить Saidazim
```

---

## ПРОЕКТ

CineSync — соцсеть для совместного просмотра фильмов.

| Сервис | URL (production) |
|--------|-----------------|
| auth | https://auth-production-47a8.up.railway.app |
| user | https://user-production-86ed.up.railway.app |
| watch-party | https://watch-part-production.up.railway.app |
| admin | https://admin-production-8d2a.up.railway.app |

---

## MOBILE СТЕК

```
Expo SDK 54 · React Native · TypeScript
Zustand (стор) · TanStack Query (сервер-стейт)
Socket.io client · expo-av · expo-notifications
React Navigation 7 · expo-secure-store
```

---

## СТРУКТУРА apps/mobile/

```
src/
├── screens/           ← 300 строк MAX на файл
│   ├── auth/          ← LoginScreen, RegisterScreen, VerifyEmailScreen, ProfileSetupScreen
│   ├── home/          ← HomeScreen, MovieDetailScreen, VideoPlayerScreen
│   ├── search/        ← SearchScreen, SearchResultsScreen
│   ├── friends/       ← FriendsScreen, FriendSearchScreen, FriendProfileScreen
│   ├── profile/       ← ProfileScreen, StatsScreen, AchievementsScreen, SettingsScreen
│   ├── rooms/         ← RoomsScreen
│   └── modal/         ← WatchPartyScreen, BattleScreen, NotificationsScreen, MediaWebViewScreen
├── components/        ← 150 строк MAX на файл
├── hooks/             ← кастомные хуки
├── api/               ← HTTP клиент (client.ts, *.api.ts)
├── store/             ← Zustand stores
├── navigation/        ← стеки, табы
└── theme/             ← цвета, spacing, typography
```

---

## CLEAN CODE

```
❌ console.log           → if (__DEV__) console.log(...)
❌ any type              → конкретный тип
❌ 300+ строк screen     → разбить на компоненты
❌ прямые API вызовы в screen → через хуки
❌ StyleSheet в screen  → выносить в useStyles / отдельный файл
```

---

## TASK TRACKING — ЗАКОН

Файлы: `docs/Tasks.md` | `docs/Done.md`

Перед стартом задачи:
```bash
cd ~/Desktop/Rave
git pull origin main
# Проверить что задача pending[Emirhan], не занята
# Написать pending[Emirhan] → коммит → push
```

После завершения:
```bash
# Tasks.md → удалить задачу
# Done.md → добавить запись
git add docs/ && git commit -m "task: done T-EXXX" && git push origin main
bash .claude/scripts/tg-notify.sh done T-EXXX "P1 | MOBILE" "Название" Emirhan "файлы"
```

---

## CHECKPOINT — ОБЯЗАТЕЛЕН

```bash
# Старт задачи:
bash ~/Desktop/Rave/.claude/scripts/obsidian-checkpoint.sh T-EXXX 0 "" "первый шаг"

# После каждого файла:
bash ~/Desktop/Rave/.claude/scripts/obsidian-checkpoint.sh T-EXXX 50 "Screen.tsx готов" "следующий — Modal.tsx"

# Завершение:
bash ~/Desktop/Rave/.claude/scripts/obsidian-checkpoint.sh clear "T-EXXX"
```

Твой прогресс пишется в `AI_CONTEXT/in-progress-emirhan.md` — не конфликтует с Saidazim.

---

## TELEGRAM УВЕДОМЛЕНИЯ

```bash
bash ~/Desktop/Rave/.claude/scripts/tg-notify.sh claim T-EXXX "P1 | MOBILE" "Название" Emirhan
bash ~/Desktop/Rave/.claude/scripts/tg-notify.sh done  T-EXXX "P1 | MOBILE" "Название" Emirhan "3 fayl, tsc: CLEAN"
```

---

## GIT ПРАВИЛА

```
Branch: emirhan/feat-xxx
Commits: feat(mobile): ... | fix(mobile): ... | refactor(mobile): ...
НИКОГДА не push в main напрямую без согласования
```

---

## SHARED FILE PROTOCOL

`shared/types/`, `shared/utils/`, `shared/constants/` — уведомить Saidazim в Telegram, получить подтверждение, затем изменять.

---

## ОПАСНЫЕ ЗОНЫ MOBILE

```
❌ useWatchParty.ts — socket events, НЕ МЕНЯТЬ без согласования
❌ MEDIA_DETECTION_JS в MediaWebViewScreen — НЕ ТРОГАТЬ
❌ useVideoExtraction.ts — НЕ ТРОГАТЬ
❌ API response format — любые изменения ломают shared/types/
```

---

## НАСТРОЙКА (ОДИН РАЗ)

```bash
bash ~/Desktop/Rave/.claude/scripts/emirhan-setup.sh
```

После этого: `source ~/.zshrc` → запускать `claude` из папки Rave.

---

## ЧИТАТЬ ДОПОЛНИТЕЛЬНО

| Файл | Что |
|------|-----|
| `CLAUDE_MOBILE.md` | Полная документация mobile зоны |
| `docs/Tasks.md` | Открытые задачи |
| `docs/Done.md` | Архив |

---
*CLAUDE_EMIRHAN.md · v1.0 · 2026-05-11*
