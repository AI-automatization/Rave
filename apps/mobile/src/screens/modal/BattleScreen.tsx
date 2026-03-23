// CineSync Mobile — BattleScreen
import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Alert,
  ListRenderItemInfo,
  FlatList,
} from 'react-native';
import { useRoute, useNavigation, RouteProp, NavigationProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useMyBattles, useBattleDetail, useBattleHistory } from '@hooks/useBattle';
import { useAuthStore } from '@store/auth.store';
import { useTheme, createThemedStyles, spacing, borderRadius, typography } from '@theme/index';
import { IBattle, ModalStackParamList } from '@app-types/index';
import { BattleInviteModal } from '@components/modal/BattleInviteModal';

type RouteType = RouteProp<ModalStackParamList, 'Battle'>;

// Animated progress bar component
function ProgressBar({ score, maxScore, color }: { score: number; maxScore: number; color: string }) {
  const anim = useRef(new Animated.Value(0)).current;
  const styles = useStyles();
  const pct = maxScore > 0 ? Math.min(score / maxScore, 1) : 0;

  useEffect(() => {
    Animated.timing(anim, { toValue: pct, duration: 800, useNativeDriver: false }).start();
  }, [pct]);

  return (
    <View style={styles.barTrack}>
      <Animated.View
        style={[styles.barFill, { backgroundColor: color, width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]}
      />
    </View>
  );
}

const BattleCard = React.memo(function BattleCard({ battle, userId, onAccept, onReject, onPress }: {
  battle: IBattle;
  userId: string;
  onAccept?: () => void;
  onReject?: () => void;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  const me = battle.participants.find(p => p.userId === userId);
  const opponent = battle.participants.find(p => p.userId !== userId);
  const maxScore = Math.max(me?.score ?? 0, opponent?.score ?? 1, 1);
  const isWinner = battle.winnerId === userId;
  const daysLeft = Math.max(0, Math.ceil((new Date(battle.endDate).getTime() - Date.now()) / 86400000));

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={onPress ? 0.8 : 1}>
      {/* Status header */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>{battle.title || 'Battle'}</Text>
        <View style={[styles.statusChip, battle.status === 'active' && styles.statusActive, battle.status === 'completed' && styles.statusCompleted, battle.status === 'pending' && styles.statusPending]}>
          <Text style={styles.statusText}>
            {battle.status === 'active' ? `${daysLeft} kun qoldi` : battle.status === 'pending' ? 'Kutilmoqda' : battle.status === 'completed' ? (isWinner ? '🏆 G\'aldim' : '😔 Yutqazdim') : 'Bekor qilindi'}
          </Text>
        </View>
      </View>

      {/* Leaderboard */}
      {(battle.status === 'active' || battle.status === 'completed') && (
        <View style={styles.leaderboard}>
          <View style={styles.playerRow}>
            <Text style={styles.playerLabel}>Men</Text>
            <Text style={styles.scoreText}>{me?.score ?? 0} ball</Text>
          </View>
          <ProgressBar score={me?.score ?? 0} maxScore={maxScore} color={colors.primary} />

          <View style={[styles.playerRow, { marginTop: spacing.sm }]}>
            <Text style={styles.playerLabel}>Raqib</Text>
            <Text style={styles.scoreText}>{opponent?.score ?? 0} ball</Text>
          </View>
          <ProgressBar score={opponent?.score ?? 0} maxScore={maxScore} color={colors.secondary} />

          <View style={styles.statsRow}>
            <Text style={styles.statsItem}>🎬 {me?.moviesWatched ?? 0} film</Text>
            <Text style={styles.statsItem}>⏱ {Math.round((me?.minutesWatched ?? 0) / 60)}h</Text>
          </View>
        </View>
      )}

      {/* Pending actions */}
      {battle.status === 'pending' && battle.creatorId !== userId && onAccept && onReject && (
        <View style={styles.pendingActions}>
          <TouchableOpacity style={styles.acceptBtn} onPress={onAccept} activeOpacity={0.8}>
            <Ionicons name="checkmark" size={18} color={colors.textPrimary} />
            <Text style={styles.acceptBtnText}>Qabul qilish</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rejectBtn} onPress={onReject} activeOpacity={0.8}>
            <Text style={styles.rejectBtnText}>Rad etish</Text>
          </TouchableOpacity>
        </View>
      )}
      {battle.status === 'pending' && battle.creatorId === userId && (
        <Text style={styles.waitingText}>⏳ Raqib qabul qilishini kutmoqda...</Text>
      )}
    </TouchableOpacity>
  );
});

// Detail view when battleId provided
function BattleDetailView({ battleId }: { battleId: string }) {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const styles = useStyles();
  const userId = useAuthStore(s => s.user?._id) ?? '';
  const { data: battle, isLoading } = useBattleDetail(battleId);
  const [inviteVisible, setInviteVisible] = useState(false);

  if (isLoading) return <ActivityIndicator color={colors.primary} style={styles.loader} />;
  if (!battle) return <Text style={styles.errorText}>Battle topilmadi</Text>;

  const isOwner = battle.creatorId === userId;
  const canInvite = isOwner && battle.status === 'active';

  return (
    <>
      <ScrollView style={styles.detailScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.backRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.detailTitle}>{battle.title || 'Battle'}</Text>
          {canInvite && (
            <TouchableOpacity style={styles.inviteHeaderBtn} onPress={() => setInviteVisible(true)}>
              <Ionicons name="person-add-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
        <BattleCard battle={battle} userId={userId} />
        {canInvite && (
          <TouchableOpacity style={styles.inviteBtn} onPress={() => setInviteVisible(true)} activeOpacity={0.8}>
            <Ionicons name="flash" size={16} color={colors.textPrimary} />
            <Text style={styles.inviteBtnText}>Do'st taklif qilish</Text>
          </TouchableOpacity>
        )}
        <View style={{ height: spacing.xxxl }} />
      </ScrollView>
      <BattleInviteModal
        battleId={battleId}
        visible={inviteVisible}
        onClose={() => setInviteVisible(false)}
      />
    </>
  );
}

// List view (all battles)
function BattleListView() {
  const navigation = useNavigation<NavigationProp<ModalStackParamList>>();
  const { colors } = useTheme();
  const styles = useStyles();
  const userId = useAuthStore(s => s.user?._id) ?? '';
  const { activeBattles, isLoading, refetch, acceptMutation, rejectMutation } = useMyBattles();
  const historyQuery = useBattleHistory();
  const [tab, setTab] = useState<'active' | 'history'>('active');

  const handleAccept = (battleId: string) => acceptMutation.mutate(battleId);

  const handleReject = (battleId: string) => {
    Alert.alert('Rad etish', 'Battle taklifini rad etmoqchimisiz?', [
      { text: 'Bekor', style: 'cancel' },
      { text: 'Rad etish', style: 'destructive', onPress: () => rejectMutation.mutate(battleId) },
    ]);
  };

  const renderActive = ({ item }: ListRenderItemInfo<IBattle>) => (
    <BattleCard
      battle={item}
      userId={userId}
      onAccept={() => handleAccept(item._id)}
      onReject={() => handleReject(item._id)}
      onPress={() => navigation.navigate('Battle', { battleId: item._id })}
    />
  );

  const renderHistory = ({ item }: ListRenderItemInfo<IBattle>) => (
    <BattleCard
      battle={item}
      userId={userId}
      onPress={() => navigation.navigate('Battle', { battleId: item._id })}
    />
  );

  return (
    <View style={styles.listRoot}>
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Battlelar</Text>
        <TouchableOpacity onPress={() => navigation.navigate('BattleCreate')} style={styles.newBtn}>
          <Ionicons name="flash" size={18} color={colors.textPrimary} />
          <Text style={styles.newBtnText}>Yangi</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'active' && styles.tabBtnActive]}
          onPress={() => setTab('active')}
        >
          <Text style={[styles.tabBtnText, tab === 'active' && styles.tabBtnTextActive]}>
            Faol ({activeBattles.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'history' && styles.tabBtnActive]}
          onPress={() => setTab('history')}
        >
          <Text style={[styles.tabBtnText, tab === 'history' && styles.tabBtnTextActive]}>
            Tarix
          </Text>
        </TouchableOpacity>
      </View>

      {tab === 'active' ? (
        <FlatList
          data={activeBattles}
          keyExtractor={item => item._id}
          renderItem={renderActive}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />}
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>⚔️</Text>
                <Text style={styles.emptyText}>Hali battle yo'q</Text>
                <TouchableOpacity onPress={() => navigation.navigate('BattleCreate')}>
                  <Text style={styles.emptyAction}>Battle boshlash →</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <FlatList
          data={historyQuery.data ?? []}
          keyExtractor={item => item._id}
          renderItem={renderHistory}
          refreshControl={<RefreshControl refreshing={historyQuery.isLoading} onRefresh={() => historyQuery.refetch()} tintColor={colors.primary} />}
          ListEmptyComponent={
            !historyQuery.isLoading ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>📜</Text>
                <Text style={styles.emptyText}>Yakunlangan battle yo'q</Text>
              </View>
            ) : null
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

export function BattleScreen() {
  const { params } = useRoute<RouteType>();
  if (params.battleId) return <BattleDetailView battleId={params.battleId} />;
  return <BattleListView />;
}

const useStyles = createThemedStyles((colors) => ({
  loader: { marginTop: 40 },
  errorText: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: 40 },
  // Detail
  detailScroll: { flex: 1, backgroundColor: colors.bgBase },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  backBtn: { padding: spacing.xs },
  detailTitle: { ...typography.h2, color: colors.textPrimary, flex: 1 },
  inviteHeaderBtn: { padding: spacing.xs },
  inviteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    margin: spacing.md,
    marginTop: 0,
    padding: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
  },
  inviteBtnText: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  // List
  listRoot: { flex: 1, backgroundColor: colors.bgBase },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  listTitle: { ...typography.h1, color: colors.textPrimary },
  newBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full },
  newBtnText: { ...typography.caption, color: colors.textPrimary, fontWeight: '600' },
  listContent: { padding: spacing.md, gap: spacing.md, flexGrow: 1 },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  tabBtn: { flex: 1, paddingVertical: spacing.md, alignItems: 'center' },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabBtnText: { ...typography.body, color: colors.textMuted, fontWeight: '600' },
  tabBtnTextActive: { color: colors.primary },
  empty: { flex: 1, alignItems: 'center', gap: spacing.md, paddingTop: 80 },
  emptyIcon: { fontSize: 48 },
  emptyText: { ...typography.body, color: colors.textMuted },
  emptyAction: { ...typography.body, color: colors.primary, fontWeight: '600' },
  // Card
  card: { backgroundColor: colors.bgSurface, borderRadius: borderRadius.lg, padding: spacing.lg, gap: spacing.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { ...typography.h3, color: colors.textPrimary, flex: 1, marginRight: spacing.sm },
  statusChip: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.full },
  statusActive: { backgroundColor: colors.success + '33' },
  statusCompleted: { backgroundColor: colors.gold + '33' },
  statusPending: { backgroundColor: colors.secondary + '33' },
  statusText: { fontSize: 11, fontWeight: '600', color: colors.textPrimary },
  // Leaderboard
  leaderboard: { gap: spacing.xs },
  playerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  playerLabel: { ...typography.caption, color: colors.textMuted },
  scoreText: { ...typography.caption, color: colors.textPrimary, fontWeight: '600' },
  barTrack: { height: 8, backgroundColor: colors.bgElevated, borderRadius: borderRadius.full, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: borderRadius.full },
  statsRow: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.xs },
  statsItem: { ...typography.caption, color: colors.textMuted },
  // Pending
  pendingActions: { flexDirection: 'row', gap: spacing.sm },
  acceptBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, backgroundColor: colors.success, padding: spacing.sm, borderRadius: borderRadius.md },
  acceptBtnText: { ...typography.caption, color: colors.textPrimary, fontWeight: '600' },
  rejectBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.sm, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.error },
  rejectBtnText: { ...typography.caption, color: colors.error, fontWeight: '600' },
  waitingText: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
}));
