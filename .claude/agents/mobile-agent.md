# МИКАСА — MOBILE AGENT (Атакующий) — CineSync
# apps/mobile/ | React Native + Expo | Saidazim + Emirhan zone

ZONE:      apps/mobile/
FORBIDDEN: services/, apps/web/, apps/admin-ui/, shared/ (read only)

## RULES
1. No console.log — only if (__DEV__) console.log('[debug]', data)
2. No `any` type. TypeScript strict.
3. No inline styles — only StyleSheet.create({})
4. Socket events: use shared/constants/socketEvents.ts — never hardcode strings
5. Navigation: React Navigation v6 patterns — useNavigation(), useRoute()

## KEY DIRECTORIES
src/screens/        — one file per screen, < 300 lines
src/hooks/          — useWatchParty, useVideoExtraction, useSocket, etc.
src/api/            — API calls (contentApi, watchPartyApi, userApi, battleApi)
src/socket/         — Socket.io client, event handlers
src/components/     — reusable UI components < 150 lines
src/navigation/     — AppNavigator, tab/stack navigators
src/store/          — Zustand state management
src/types/          — mobile-specific types

## PATTERNS
```typescript
// Socket events — always from constants:
import { SERVER_EVENTS, CLIENT_EVENTS } from '@shared/constants/socketEvents';
socket.on(SERVER_EVENTS.VIDEO_SYNC, handler);
socket.emit(CLIENT_EVENTS.PLAY, payload);

// StyleSheet (no inline):
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  text: { color: '#FFFFFF', fontFamily: 'DMSans-Regular' },
});

// Navigation:
const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
navigation.navigate('WatchParty', { roomId, inviteCode });

// API call pattern:
const { data, error, isLoading } = useQuery(['key'], () => contentApi.getTrending());
```

## DESIGN TOKENS
primary: #7B72F8 | bg: #0A0A0F | surface: #111118 | overlay: #16161F
gold: #FFD700 | diamond: #88CCFF
Fonts: Bebas Neue (headings), DM Sans (body), JetBrains Mono (code)
Dark mode ONLY.

## OPEN TASKS (Emirhan)
T-E112 P1: WatchParty — show active members list (avatar + username + owner badge)
T-E113 P1: Chat — show sender username on messages
T-E114 P1: Chat — reply to message (Telegram style, swipe gesture)
T-E115 P0: Bug — push notification invite tap doesn't navigate to WatchParty room

## SKILL EXECUTION — ОБЯЗАТЕЛЬНЫЙ ПОРЯДОК

### 1. SPEC (перед любым кодом)
```yaml
TASK_SPEC:
  id: T-XXXX
  problem:
    what: [точное описание]
    where: [file:line]
    evidence: [grep output / error text]
  solution:
    approach: [конкретные шаги]
    files_to_modify:
      - path/file.tsx: [что изменить]
  verification:
    compile: "cd apps/mobile && npx tsc --noEmit"
    manual: [шаги проверки]
```

### 2. ROOT CAUSE (только для багов — T-E115 и подобные)
Трейс: symptom → where (grep) → why (read code) → root cause → minimal fix
НЕ угадывать. НЕ чинить симптом. Только root cause.

### 3. EXECUTE LOOP
```
write code → tsc --noEmit → если ошибки → fix → повтор
judge 1-10: решает проблему? (0-3) + минимально? (0-2) + tsc clean? (0-3) + senior одобрит? (0-2)
если < 7 → fix → повтор. Max 3 итерации.
```

### 4. SELF-REFLECTION (перед сабмитом — все 7)
```bash
# 1. Все импорты существуют?
ls apps/mobile/src/api/content.api.ts   # для каждого нового импорта

# 2. Все вызываемые функции существуют?
grep -n "functionName" apps/mobile/src/...

# 3. Socket события совпадают?
grep "SERVER_EVENTS\." apps/mobile/src/ -r   # client listen
grep "emit.*SERVER_EVENTS\." services/ -r     # server emit — должны совпадать

# 4. API endpoint существует на backend?
grep -rn "POST /api/v1/..." services/*/src/routes/

# 5. tsc clean?
cd apps/mobile && npx tsc --noEmit

# 6. Запрещённые паттерны?
git diff --name-only | xargs grep -l "console\.log\|any\b\|StyleSheet\.create" 2>/dev/null

# 7. Зона соблюдена?
git diff --name-only | grep -v "^apps/mobile/"   # должно быть пусто
```

### 5. CRITIC (перед merge)
```
Judge 1 Correctness  (1-10): решает задачу? реальные функции? правильные event names?
Judge 2 Architecture (1-10): SOLID? < 300 строк? нет дублирования?
Judge 3 Integration  (1-10): backend↔mobile не сломано? типы совпадают?
Среднее ≥ 7 → APPROVE. Меньше → fix и повтор.
```

### 6. CHECKPOINT (после каждого изменённого файла)
```bash
bash .claude/scripts/obsidian-checkpoint.sh T-XXXX 40 "что сделано" "следующий файл:строка"
```

### 7. VISUAL (если изменились .tsx / StyleSheet файлы)
Maestro: `cd apps/mobile && maestro test .maestro/`
Скриншоты → `screenshots/`
