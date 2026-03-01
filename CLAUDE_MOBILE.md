# CLAUDE_MOBILE.md — React Native Mobile Engineer Guide
# React Native · TypeScript · Zustand · React Query · Socket.io · Firebase
# Claude CLI bu faylni Emirhan tanlanganda o'qiydi

---

## 👋 ZONA

```
apps/mobile/
├── src/
│   ├── screens/        → Ekranlar (Auth, Home, Movie, Party, Battle, Profile)
│   ├── components/     → Qayta ishlatiluvchi UI
│   ├── navigation/     → React Navigation stacks
│   ├── hooks/          → Custom hooks
│   ├── api/            → Axios + API functions
│   ├── store/          → Zustand stores
│   ├── socket/         → Socket.io client
│   ├── theme/          → Design tokens, colors, typography
│   ├── utils/          → Helpers
│   └── types/          → Mobile-specific types
├── android/
├── ios/
└── package.json
```

**🚫 TEGINMA:** `services/` (Saidazim), `apps/web/` (Jafar), `apps/admin-ui/` (Saidazim)

---

## 🏗️ ARXITEKTURA

### Navigation Structure
```
AppNavigator
├── AuthStack
│   ├── SplashScreen
│   ├── OnboardingScreen
│   ├── LoginScreen
│   ├── RegisterScreen
│   ├── VerifyEmailScreen
│   ├── ForgotPasswordScreen
│   └── ProfileSetupScreen
├── MainTabs
│   ├── HomeTab → HomeStack
│   │   ├── HomeScreen
│   │   ├── MovieDetailScreen
│   │   └── VideoPlayerScreen
│   ├── SearchTab → SearchStack
│   │   ├── SearchScreen
│   │   └── SearchResultsScreen
│   ├── FriendsTab → FriendsStack
│   │   ├── FriendsScreen
│   │   ├── FriendProfileScreen
│   │   └── FriendSearchScreen
│   └── ProfileTab → ProfileStack
│       ├── ProfileScreen
│       ├── StatsScreen
│       ├── AchievementsScreen
│       └── SettingsScreen
└── ModalStack
    ├── WatchPartyScreen
    ├── WatchPartyCreateScreen
    ├── BattleScreen
    ├── BattleCreateScreen
    └── NotificationsScreen
```

### Zustand Stores
```typescript
// authStore — token, user, isAuthenticated
// userStore — profile, settings, stats
// moviesStore — trending, topRated, watchHistory
// friendsStore — friends, requests, onlineStatus
// watchPartyStore — room, members, syncState
// battleStore — activeBattles, leaderboard
// notificationStore — items, unreadCount
```

### Screen Pattern — 300 qator MAX

```typescript
// ❌ NOTO'G'RI — 500 qator, barcha logika screen ichida
export function HomeScreen() {
  const [movies, setMovies] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  // ... 80 qator state + fetch + handlers
  return <View>...</View>;
}

// ✅ TO'G'RI — hook ajratilgan, screen faqat render
// hooks/useHomeData.ts
export function useHomeData() {
  const { data: trending, isLoading: trendingLoading } = useQuery({
    queryKey: ['trending'],
    queryFn: () => moviesApi.getTrending(),
    staleTime: 10 * 60 * 1000, // 10 min
  });
  // ...
  return { trending, topRated, continueWatching, isLoading };
}

// screens/HomeScreen.tsx — toza
export function HomeScreen() {
  const { trending, topRated, isLoading } = useHomeData();
  if (isLoading) return <HomeSkeleton />;
  return (
    <ScrollView>
      <HeroBanner movies={trending?.slice(0, 5)} />
      <MovieRow title="Trending" movies={trending} />
      <MovieRow title="Top Rated" movies={topRated} />
    </ScrollView>
  );
}
```

---

## 🔌 SOCKET.IO CLIENT

```typescript
// socket/client.ts
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function connectSocket(token: string) {
  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
  });
  return socket;
}

// hooks/useSocket.ts
export function useSocket() {
  const token = useAuthStore(s => s.token);
  useEffect(() => {
    if (!token) return;
    const s = connectSocket(token);
    return () => { s.disconnect(); };
  }, [token]);
}

// ⚠️ Event nomlari shared/constants/socket-events.ts dan import!
// O'zingcha event nom YARATMA — 3 platforma buziladi!
```

---

## 🎬 VIDEO PLAYER

```typescript
// react-native-video — HLS support
import Video from 'react-native-video';

// Muhim sozlamalar:
<Video
  source={{ uri: hlsUrl, type: 'm3u8' }}
  controls={false}          // custom controls
  resizeMode="contain"
  onProgress={handleProgress}  // har 250ms
  onEnd={handleComplete}
  progressUpdateInterval={250}
/>

// Progress saqlash — debounced, har 30 sec:
const saveProgress = useDebouncedCallback(async (progress) => {
  await watchHistoryApi.updateProgress(movieId, progress);
}, 30000);

// 90% ko'rilsa → complete:
function handleProgress({ currentTime, seekableDuration }) {
  const percent = (currentTime / seekableDuration) * 100;
  if (percent >= 90 && !isMarkedComplete) {
    watchHistoryApi.markComplete(movieId);
    checkAchievements(); // gamification trigger
  }
}
```

---

## 📱 FIREBASE (Push Notifications)

```typescript
// FCM token olish va backend ga yuborish:
const fcmToken = await messaging().getToken();
await userApi.updateFcmToken(fcmToken);

// Foreground handler:
messaging().onMessage(async remoteMessage => {
  showLocalNotification(remoteMessage);
});

// Background handler (index.js da):
messaging().setBackgroundMessageHandler(async remoteMessage => {
  // notification tap → to'g'ri ekranga navigate
});

// Notification tap routing:
const NOTIFICATION_ROUTES = {
  friend_request:      'FriendsScreen',
  watch_party_invite:  'WatchPartyScreen',
  battle_invite:       'BattleScreen',
  achievement_unlocked:'AchievementsScreen',
  battle_result:       'BattleScreen',
};
```

---

## 🎨 DESIGN SYSTEM

```typescript
// theme/index.ts
export const colors = {
  primary: '#E50914',
  primaryHover: '#FF1A24',
  bgVoid: '#060608',
  bgBase: '#0A0A0F',
  bgElevated: '#111118',
  bgOverlay: '#16161F',
  bgSurface: '#1C1C28',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.7)',
  textMuted: 'rgba(255,255,255,0.4)',
  gold: '#FFD700',
  silver: '#C0C0C0',
  diamond: '#88CCFF',
  success: '#22C55E',
  error: '#EF4444',
  warning: '#F59E0B',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };
export const borderRadius = { sm: 4, md: 8, lg: 12, xl: 16, full: 9999 };
```

---

## ⚡ PERFORMANCE

```typescript
// FlatList optimization:
<FlatList
  data={movies}
  renderItem={renderMovie}
  keyExtractor={(item) => item._id}
  getItemLayout={(_, index) => ({ length: 200, offset: 200 * index, index })}
  windowSize={5}
  maxToRenderPerBatch={10}
  removeClippedSubviews
/>

// Component optimization:
const MovieCard = React.memo(({ movie }: Props) => { ... });

// Image caching:
import FastImage from 'react-native-fast-image';
<FastImage source={{ uri: posterUrl, priority: FastImage.priority.high }} />
```

---

## 🧪 TEST

```bash
# Unit:
cd apps/mobile && npm test

# E2E (Detox):
cd apps/mobile && npx detox test --configuration ios.sim.release
```

---

## 🚫 TAQIQLANGAN

```
❌ services/ papkasiga TEGINMA (Saidazim)
❌ apps/web/ papkasiga TEGINMA (Jafar)
❌ any type
❌ console.log production da — __DEV__ tekshirish
❌ Inline styles — StyleSheet.create ishlatish
❌ Socket event nomlarini o'zgartirish
❌ 300+ qatorli Screen — hook ga ajratish
❌ Sync logic client da — server authoritative
```

---

*CLAUDE_MOBILE.md | CineSync | Emirhan | v1.0*