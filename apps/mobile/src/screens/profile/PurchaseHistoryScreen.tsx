// WeWatch Mobile — Purchase History Screen
// Read-only: current plan + subscription lifecycle history. No checkout/price/CTA here —
// Google Play policy forbids an in-app buy button for our region until 2027-09-30 (see
// services/payment/README.md). Data comes from services/payment (GET /payment/plan,
// GET /payment/history) — WeWatch's own record, not a live mirror of tezcode-billing.
import React from 'react';
import { View, Text, FlatList, ActivityIndicator, ListRenderItemInfo } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { TrackedTouchable } from '@components/common/TrackedTouchable';
import { useTheme, createThemedStyles, spacing, borderRadius, typography } from '@theme/index';
import { useT } from '@i18n/index';
import { paymentApi, PaymentHistoryEntry } from '@api/payment.api';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function PurchaseHistoryScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useStyles();
  const { t } = useT();

  const planQuery = useQuery({ queryKey: ['payment', 'plan'], queryFn: paymentApi.getPlan });
  const historyQuery = useQuery({ queryKey: ['payment', 'history'], queryFn: paymentApi.getHistory });

  const statusLabel = (status: string): string => {
    switch (status) {
      case 'active': return t('profile', 'purchasesStatusActive');
      case 'pending': return t('profile', 'purchasesStatusPending');
      case 'refunded': return t('profile', 'purchasesStatusRefunded');
      case 'expired': return t('profile', 'purchasesStatusExpired');
      default: return t('profile', 'purchasesStatusNone');
    }
  };

  const providerLabel = (provider: string | null): string | null => {
    if (provider === 'PAYME') return t('profile', 'purchasesProviderPayme');
    if (provider === 'CLICK') return t('profile', 'purchasesProviderClick');
    return null;
  };

  const eventLabel = (event: string): string =>
    event === 'subscription.refunded'
      ? t('profile', 'purchasesEventRefunded')
      : t('profile', 'purchasesEventActivated');

  const renderItem = ({ item }: ListRenderItemInfo<PaymentHistoryEntry>) => {
    const isRefund = item.event === 'subscription.refunded';
    const provider = providerLabel(item.provider);
    return (
      <View style={styles.item}>
        <View style={[styles.iconWrap, { backgroundColor: (isRefund ? colors.error : colors.success) + '22' }]}>
          <Ionicons name={isRefund ? 'arrow-undo-outline' : 'checkmark-circle-outline'} size={18} color={isRefund ? colors.error : colors.success} />
        </View>
        <View style={styles.itemContent}>
          <Text style={styles.itemTitle}>{eventLabel(item.event)}</Text>
          <Text style={styles.itemMeta}>
            {formatDate(item.createdAt)}{provider ? ` · ${provider}` : ''}
          </Text>
        </View>
        <Text style={styles.itemStatus}>{statusLabel(item.status)}</Text>
      </View>
    );
  };

  const plan = planQuery.data;
  const isPro = plan?.plan === 'pro';

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TrackedTouchable trackId="purchase_history:back" onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TrackedTouchable>
        <Text style={styles.title}>{t('profile', 'purchaseHistory')}</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.planCard}>
        {planQuery.isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <>
            <View style={styles.planRow}>
              <View style={[styles.planBadge, { backgroundColor: (isPro ? colors.primary : colors.textMuted) + '22' }]}>
                <Ionicons name={isPro ? 'star' : 'star-outline'} size={16} color={isPro ? colors.primary : colors.textMuted} />
                <Text style={[styles.planBadgeText, { color: isPro ? colors.primary : colors.textMuted }]}>
                  {isPro ? t('profile', 'purchasesPlanPro') : t('profile', 'purchasesPlanFree')}
                </Text>
              </View>
              <Text style={styles.planStatus}>{statusLabel(plan?.status ?? 'none')}</Text>
            </View>
            {plan?.currentPeriodEnd && (
              <Text style={styles.planExpiry}>
                {t('profile', 'purchasesExpiresOn')}: {formatDate(plan.currentPeriodEnd)}
              </Text>
            )}
          </>
        )}
      </View>

      {historyQuery.isLoading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={historyQuery.data ?? []}
          keyExtractor={(item, i) => `${item.createdAt}-${i}`}
          renderItem={renderItem}
          onRefresh={() => { void planQuery.refetch(); void historyQuery.refetch(); }}
          refreshing={historyQuery.isFetching}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyText}>{t('profile', 'purchasesEmpty')}</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.bgBase },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: spacing.xs },
  title: { ...typography.h2, color: colors.textPrimary },
  planCard: {
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.bgSurface,
    gap: spacing.sm,
  },
  planRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  planBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.full },
  planBadgeText: { ...typography.body, fontWeight: '700' },
  planStatus: { ...typography.caption, color: colors.textSecondary },
  planExpiry: { ...typography.caption, color: colors.textMuted },
  loader: { marginTop: 40 },
  list: { paddingHorizontal: spacing.lg, gap: spacing.xs, flexGrow: 1 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  iconWrap: { width: 36, height: 36, borderRadius: borderRadius.full, alignItems: 'center', justifyContent: 'center' },
  itemContent: { flex: 1, gap: 2 },
  itemTitle: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  itemMeta: { ...typography.caption, color: colors.textMuted },
  itemStatus: { ...typography.caption, color: colors.textSecondary },
  empty: { flex: 1, alignItems: 'center', gap: spacing.md, paddingTop: 80 },
  emptyText: { ...typography.body, color: colors.textMuted },
}));
