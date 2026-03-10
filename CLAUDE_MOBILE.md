# CLAUDE_MOBILE.md — Expo Mobile Engineer Guide
# Expo SDK 54 · React Native · TypeScript · Zustand · TanStack Query · Socket.io · expo-av
# Claude CLI bu faylni Emirhan tanlanganda o'qiydi

---

## 👋 ZONA

```
apps/mobile/
├── assets/                # fonts, icons, splash images
├── src/
│   ├── screens/           # Screen-level pages (300 qator MAX)
│   │   ├── auth/          # SplashScreen, LoginScreen, RegisterScreen, VerifyEmailScreen, ForgotPasswordScreen
│   │   ├── home/          # HomeScreen, MovieDetailScreen, VideoPlayerScreen
│   │   ├── search/        # SearchScreen, SearchResultsScreen
│   │   ├── friends/       # FriendsScreen, FriendSearchScreen, FriendProfileScreen
│   │   ├── profile/       # ProfileScreen, StatsScreen, AchievementsScreen, SettingsScreen
│   │   └── modal/         # WatchPartyCreateScreen, WatchPartyScreen, BattleCreateScreen,
│   │                      # BattleScreen, NotificationsScreen
│   ├── components/        # Reusable UI blocks (150 qator MAX)
│   │   ├── common/
│   │   ├── movie/
│   │   ├── home/
│   │   └── search/
│   ├── navigation/        # React Navigation stacks / tabs
│   ├── hooks/             # Custom hooks (useHomeData, useSearch, useSocket, ...)
│   ├── api/               # Axios API layer
│   │   ├── client.ts
│   │   ├── authApi.ts
│   │   ├── moviesApi.ts
│   │   └── usersApi.ts
│   ├── store/             # Zustand global stores
│   │   ├── authStore.ts
│   │   ├── userStore.ts
│   │   ├── moviesStore.ts
│   │   ├── friendsStore.ts
│   │   ├── watchPartyStore.ts
│   │   └── notificationStore.ts
│   ├── socket/            # Socket.io client
│   │   └── client.ts
│   ├── services/          # Expo integrations
│   │   ├── notifications/
│   │   ├── storage/
│   │   └── media/
│   ├── theme/             # Design system
│   │   ├── colors.ts
│   │   ├── spacing.ts
│   │   ├── typography.ts
│   │   └── index.ts
│   ├── types/             # TypeScript types
│   └── utils/             # Helpers
├── app.json               # Expo configuration
├── App.tsx
├── index.ts
├── babel.config.js
├── package.json
└── tsconfig.json
```

**🚫 TEGINMA:** `services/` (Saidazim), `apps/web/` (Jafar), `apps/admin-ui/` (Saidazim)

---

## 🏗️ ARXITEKTURA

### Navigation Structure

```
AppNavigator

AuthStack
 ├ SplashScreen
 ├ LoginScreen
 ├ RegisterScreen
 ├ VerifyEmailScreen
 └ ForgotPasswordScreen

MainTabs

HomeStack
 ├ HomeScreen
 ├ MovieDetailScreen
 └ VideoPlayerScreen

SearchStack
 ├ SearchScreen
 └ SearchResultsScreen

FriendsStack
 ├ FriendsScreen
 ├ FriendProfileScreen
 └ FriendSearchScreen

ProfileStack
 ├ ProfileScreen
 ├ StatsScreen
 ├ AchievementsScreen
 └ SettingsScreen
```

### Zustand Stores

```typescript
// authStore — token, user, isAuthenticated
// userStore — profile, settings, stats
// moviesStore — trending, topRated, watchHistory
// friendsStore — friends, requests, onlineStatus
// watchPartyStore — room, members, syncState
// notificationStore — items, unreadCount
```

---

## 📱 SCREEN PATTERN — 300 QATOR MAX

```typescript
// ❌ NOTO'G'RI — fetch logika screen ichida
export function HomeScreen() {
  const [movies, setMovies] = useState([]);
  useEffect(() => {
    fetch('/movies').then(r => r.json()).then(setMovies); // NO!
  }, []);
  return <FlatList data={movies} />;
}

// ✅ TO'G'RI — hook orqali ajratish
// hooks/useHomeData.ts
export function useHomeData() {
  const { data, isLoading } = useQuery({
    queryKey: ['trending'],
    queryFn: () => moviesApi.getTrending(),
    staleTime: 10 * 60 * 1000,
  });
  return { trending: data, isLoading };
}

// screens/home/HomeScreen.tsx
export function HomeScreen() {
  const { trending, isLoading } = useHomeData();
  if (isLoading) return <Loading />;
  return (
    <ScrollView>
      <MovieRow movies={trending} />
    </ScrollView>
  );
}
```

---

## 🎨 DESIGN SYSTEM

```typescript
// theme/colors.ts
export const colors = {
  primary:        '#E50914',
  bgVoid:         '#060608',
  bgBase:         '#0A0A0F',
  bgSurface:      '#1C1C28',
  textPrimary:    '#FFFFFF',
  textSecondary:  'rgba(255,255,255,0.7)',
  gold:           '#FFD700',
  diamond:        '#88CCFF',
  success:        '#22C55E',
  error:          '#EF4444',
  warning:        '#F59E0B',
} as const;

// theme/spacing.ts
export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32,
} as const;

// theme/typography.ts — Bebas Neue (Display), DM Sans (Body), JetBrains Mono (Mono)

// ❌ StyleSheet ichida hardcoded hex TAQIQLANGAN
// ❌ backgroundColor: '#E50914'
// ✅ backgroundColor: colors.primary
```

### Rank Tizimi

```
Bronze:   0 - 499 ball
Silver:   500 - 1999
Gold:     2000 - 4999
Platinum: 5000 - 9999
Diamond:  10000+
```

### Achievement Rarity Colors

```typescript
const RARITY_COLORS = {
  common:    '#9CA3AF',
  rare:      '#3B82F6',
  epic:      '#8B5CF6',
  legendary: '#FFD700',
} as const;
```

---

## 🎬 VIDEO PLAYER — expo-av

```typescript
// screens/home/VideoPlayerScreen.tsx
import { Video, ResizeMode } from 'expo-av';

export function VideoPlayerScreen() {
  const videoRef = useRef<Video>(null);

  // Progress save (debounced 30s):
  const saveProgress = useDebouncedCallback(async (positionMs: number) => {
    await watchHistoryApi.saveProgress(movieId, positionMs);
  }, 30_000);

  // 90% tamamlansa → markComplete:
  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    saveProgress(status.positionMillis);
    const pct = status.positionMillis / (status.durationMillis ?? 1);
    if (pct >= 0.9) watchHistoryApi.markComplete(movieId);
  };

  return (
    <Video
      ref={videoRef}
      source={{ uri: hlsUrl }}           // HLS m3u8 URL
      resizeMode={ResizeMode.CONTAIN}
      useNativeControls
      onPlaybackStatusUpdate={onPlaybackStatusUpdate}
    />
  );
}

// ❌ react-native-video TAQIQLANGAN — expo-av ishlatish
// ❌ expo-video TAQIQLANGAN — expo-av ishlatish
```

---

## 🔌 SOCKET.IO CLIENT

```typescript
// socket/client.ts
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '@/utils/constants';

let socket: Socket | null = null;

export function connectSocket(token: string): Socket {
  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
  });
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

// hooks/useSocket.ts
export function useSocket(): void {
  const token = useAuthStore(s => s.token);

  useEffect(() => {
    if (!token) return;
    const s = connectSocket(token);
    return () => s.disconnect();
  }, [token]);
}
```

### Socket Event Nomlari (shared/constants/socket-events.ts)

```typescript
// ⚠️ BU NOMLARNI O'ZGARTIRISH 3 TA PLATFORMANI BUZADI!
const SOCKET_EVENTS = {
  // Server → Client:
  ROOM_JOINED:    'room:joined',
  ROOM_LEFT:      'room:left',
  VIDEO_PLAY:     'video:play',
  VIDEO_PAUSE:    'video:pause',
  VIDEO_SEEK:     'video:seek',
  VIDEO_SYNC:     'video:sync',
  ROOM_MESSAGE:   'room:message',
  ROOM_EMOJI:     'room:emoji',
  ROOM_CLOSED:    'room:closed',
  // Client → Server:
  JOIN_ROOM:      'room:join',
  LEAVE_ROOM:     'room:leave',
  SEND_MESSAGE:   'room:message',
  SEND_EMOJI:     'room:emoji',
} as const;
```

---

## 🔒 AUTH — expo-auth-session (Google OAuth)

```typescript
// screens/auth/LoginScreen.tsx
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export function LoginScreen() {
  const [, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      // idToken → T-S016 backend endpointiga yuborish:
      authApi.googleToken(id_token).then(handleLogin);
    }
  }, [response]);

  return (
    <TouchableOpacity onPress={() => promptAsync()}>
      <Text>Google bilan kirish</Text>
    </TouchableOpacity>
  );
}

// api/authApi.ts
googleToken: (idToken: string) =>
  client.post<LoginResponse>('/api/v1/auth/google/token', { idToken }),

// ❌ @react-native-google-signin TAQIQLANGAN — expo-auth-session ishlatish
```

---

## 📱 PUSH NOTIFICATIONS — expo-notifications

```typescript
// services/notifications/index.ts
import * as Notifications from 'expo-notifications';

export async function registerForPushNotifications(): Promise<string | null> {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return null;

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  await userApi.updateFcmToken(token); // backendga yuborish
  return token;
}

// Foreground handler:
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Navigate on tap:
// friend_request         → FriendsScreen
// watch_party_invite     → WatchPartyScreen
// battle_invite          → BattleScreen
// achievement_unlocked   → AchievementsScreen
```

---

## ⚡ PERFORMANCE

```typescript
// FlatList optimizatsiyasi:
<FlatList
  data={movies}
  keyExtractor={(item) => item._id}
  windowSize={5}
  maxToRenderPerBatch={10}
  removeClippedSubviews
  getItemLayout={(_, index) => ({
    length: CARD_HEIGHT,
    offset: CARD_HEIGHT * index,
    index,
  })}
/>

// React.memo — re-render oldini olish:
const MovieCard = React.memo(MovieCardComponent);

// Image caching:
import { Image } from 'expo-image';
<Image source={{ uri: posterUrl }} contentFit="cover" transition={200} />
```

---

## 🎮 GAMIFICATION

```typescript
// Backend ball tizimi (reference):
const POINTS = {
  MOVIE_WATCHED: 10,
  WATCH_PARTY:   15,
  BATTLE_WIN:    50,
  ACHIEVEMENT:   20, // 20-100 arasi
  DAILY_STREAK:  5,
} as const;

// AchievementsScreen — locked secret:
// unlocked → badge + rarity color
// locked   → "???" + dim overlay
```

---

## 📝 LOGGING

```typescript
// ✅ TO'G'RI — faqat development:
if (__DEV__) console.log('[HomeScreen]', data);

// ✅ Production xatoliklar — Sentry:
import * as Sentry from '@sentry/react-native';
Sentry.captureException(error);

// ❌ TAQIQLANGAN — production build da console.log
```

---

## 🔑 TOKEN SAQLASH

```typescript
// services/storage/tokenStorage.ts
import * as SecureStore from 'expo-secure-store';

export const tokenStorage = {
  save:   (key: string, value: string) => SecureStore.setItemAsync(key, value),
  get:    (key: string)                => SecureStore.getItemAsync(key),
  delete: (key: string)                => SecureStore.deleteItemAsync(key),
};

// ❌ AsyncStorage da token saqlash TAQIQLANGAN
// ✅ expo-secure-store — encrypted keychain
```

---

## 🧪 TEST

```bash
# Unit test:
cd apps/mobile && npm test

# E2E (Detox):
detox build --configuration android.emu.debug
detox test --configuration android.emu.debug

# Type check:
cd apps/mobile && npm run typecheck
```

---

## 📦 EXPO WORKFLOW

```bash
# Ishga tushirish:
cd apps/mobile && npx expo start

# Telefonda test (Expo Go → QR scan):
npx expo start --tunnel

# Native module kerak bo'lsa:
npx expo prebuild

# EAS Build:
eas build --platform android --profile preview
eas build --platform ios --profile preview
```

---

## 🌿 GIT QOIDALARI

```bash
# Branch format:
emirhan/feat-[feature-name]
emirhan/fix-[bug-name]

# Commit format:
feat(mobile): add MovieDetailScreen with parallax header
fix(mobile): correct video progress save debounce
refactor(mobile): split HomeScreen into useHomeData hook
test(mobile): add ErrorBoundary unit test

# Har kuni boshida:
git pull origin main
```

### Task Locking Protokoli

```bash
# Task boshlanishida:
1. git pull origin main
2. docs/Tasks.md ni o'qi — pending[boshqa] bormi?
3. Task ochiq → pending[Emirhan] yoz
4. git add docs/Tasks.md
5. git commit -m "task: claim T-E0XX [Emirhan]"
6. git push origin main
7. ENDI ishni boshlash mumkin

# Task tugaganda:
1. Tasks.md dan o'chirish → Done.md ga ko'chirish
2. git add docs/Tasks.md docs/Done.md
3. git commit -m "feat(mobile): T-E0XX yechildi [Emirhan]"
4. git push origin main
```

---

## 🤖 MULTI-AGENT ZONE QOIDALARI

```
EMIRHAN ZONASI:   apps/mobile/  ← FAQAT shu yerda ishlash
SHARED ZONASI:    shared/types/, shared/utils/, shared/constants/ ← LOCK protocol
TAQIQLANGAN:      services/*, apps/web/*, apps/admin-ui/*

Lock fayl:        .claude/locks/shared-mobile.lock
TTL:              30 daqiqa
```

---

## 🚫 TAQIQLANGAN

```
❌ services/ papkasiga TEGINMA (Saidazim)
❌ apps/web/ papkasiga TEGINMA (Jafar)
❌ any type — TypeScript strict mode
❌ console.log production da — __DEV__ yoki Sentry
❌ expo-video — expo-av ishlatish
❌ @react-native-google-signin — expo-auth-session ishlatish
❌ AsyncStorage da token — expo-secure-store
❌ react-native-video — expo-av
❌ inline StyleSheet ko'p ishlatish — theme/colors.ts
❌ hardcoded hex ranglar — colors.* token
❌ 300+ qatorli screen — hookga ajratish
❌ 150+ qatorli component — kichikroq qismlarga bo'lish
❌ socket event nomlarini o'zgartirish — 3 platformani buzadi
❌ API response formatini o'zgartirish — shared/types orqali kelishish
❌ client sync logic — server authoritative
❌ Expo Go da ishlamaydigan native library qo'shish
❌ shared/* kelishmasdan o'zgartirish — LOCK protocol
❌ main branch ga to'g'ridan push — PR orqali
```

---

*CLAUDE_MOBILE.md | CineSync | Emirhan | Expo SDK 54 | v2.0 | 2026-03-10*
