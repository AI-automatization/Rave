# MOBILE AGENT — CineSync
# apps/mobile/ | React Native + Expo | Emirhan zone

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

## SKILLS ORDER
1. spec-driven-implement → SPEC before code
2. root-cause-tracing   → bugs only (T-E115 is a bug)
3. execute-judge-loop   → write → tsc → check → fix
4. self-reflection      → step 3 critical (socket event consistency)
5. visual-testing       → Maestro flows for UI changes

## SELF-CHECK
- tsc: cd apps/mobile && npx tsc --noEmit
- No console.log (only __DEV__ blocks)
- No inline styles
- Socket events from shared/constants only
- Zone: only apps/mobile/ files
