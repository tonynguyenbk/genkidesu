import { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { Theme } from '@genki/ui';
import { trpc } from '../lib/trpc';
import { useAppTheme, useThemedStyles } from '../contexts/ThemeContext';

type PlanId = 'free' | 'pro' | 'family';

const PLAN_COLORS: Record<PlanId, string> = {
  free: '#8E8E93',   // iOS systemGray
  pro: '#34C759',    // iOS systemGreen
  family: '#AF52DE', // iOS systemPurple
};

const PLAN_BG: Record<PlanId, string> = {
  free: '#F2F2F7',
  pro: '#E9F8EE',
  family: '#F5EAFB',
};

function CheckItem({ text, color }: { text: string; color: string }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.checkRow}>
      <Ionicons name="checkmark-circle" size={16} color={color} />
      <Text style={styles.checkText}>{text}</Text>
    </View>
  );
}

function PlanCard({
  plan,
  selected,
  current,
  onSelect,
}: {
  plan: ReturnType<typeof usePlans>['plans'][0];
  selected: boolean;
  current: boolean;
  onSelect: () => void;
}) {
  const styles = useThemedStyles(createStyles);
  const { theme } = useAppTheme();
  if (!plan) return null;
  const color = PLAN_COLORS[plan.id as PlanId] ?? theme.colors.textSecondary;
  const bg = PLAN_BG[plan.id as PlanId] ?? theme.colors.divider;

  return (
    <TouchableOpacity
      style={[
        styles.planCard,
        { borderColor: selected ? color : theme.colors.border, backgroundColor: selected ? bg : theme.colors.surface },
        selected && styles.planCardSelected,
      ]}
      onPress={onSelect}
      activeOpacity={0.8}
    >
      {(plan as any).badge && (
        <View style={[styles.badge, { backgroundColor: color }]}>
          <Text style={styles.badgeText}>{(plan as any).badge}</Text>
        </View>
      )}

      <View style={styles.planHeader}>
        <View>
          <Text style={[styles.planName, { color }]}>{plan.name}</Text>
          <View style={styles.priceRow}>
            <Text style={[styles.planPrice, { color }]}>{plan.priceLabel}</Text>
            {plan.price > 0 && <Text style={styles.planPeriod}>{plan.period}</Text>}
          </View>
        </View>
        <View style={[styles.radio, { borderColor: color }, selected && { backgroundColor: color }]}>
          {selected && <View style={styles.radioDot} />}
        </View>
      </View>

      <View style={styles.featureList}>
        {plan.features.map((f: string) => (
          <CheckItem key={f} text={f} color={selected ? color : theme.colors.textTertiary} />
        ))}
      </View>

      {current && (
        <View style={[styles.currentBadge, { backgroundColor: color + '15' }]}>
          <Text style={[styles.currentBadgeText, { color }]}>Gói hiện tại</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function usePlans() {
  const query = trpc.subscription.getPlans.useQuery();
  return { plans: query.data ?? [], isLoading: query.isLoading };
}

export default function PaywallScreen() {
  const router = useRouter();
  const styles = useThemedStyles(createStyles);
  const { theme } = useAppTheme();
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('pro');

  const { plans, isLoading: plansLoading } = usePlans();
  const status = trpc.subscription.getStatus.useQuery(undefined, { retry: false });
  const currentPlan = (status.data?.plan ?? 'free') as PlanId;

  const purchase = trpc.subscription.purchase.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        Alert.alert('Thành công', 'Đã nâng cấp tài khoản!');
        router.back();
      } else {
        Alert.alert('Thông báo', data.message);
      }
    },
    onError: (e) => Alert.alert('Lỗi', e.message),
  });

  const handleUpgrade = () => {
    if (selectedPlan === 'free') return;
    purchase.mutate({ planId: selectedPlan });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nâng cấp Genki</Text>
        <View style={{ width: 38 }} />
      </View>

      {plansLoading && (
        <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 80 }} />
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroGlyph}>
            <Ionicons name="sparkles" size={30} color={PLAN_COLORS.pro} />
          </View>
          <Text style={styles.heroTitle}>Mở khóa toàn bộ tính năng</Text>
          <Text style={styles.heroSub}>
            Theo dõi dinh dưỡng không giới hạn, AI tư vấn cá nhân,{'\n'}đồng bộ wearable và nhiều hơn nữa
          </Text>
        </View>

        {/* Plan cards */}
        <View style={styles.plansSection}>
          {plans.filter((p: any) => p.id !== 'free').map((plan: any) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              selected={selectedPlan === plan.id}
              current={currentPlan === plan.id}
              onSelect={() => setSelectedPlan(plan.id as PlanId)}
            />
          ))}

          {/* Free plan collapsed */}
          <TouchableOpacity
            style={[styles.freePlan, selectedPlan === 'free' && styles.freePlanSelected]}
            onPress={() => setSelectedPlan('free')}
          >
            <Text style={styles.freePlanText}>Tiếp tục dùng miễn phí (3 ảnh/ngày)</Text>
            {selectedPlan === 'free' && <Ionicons name="checkmark" size={16} color={theme.colors.textSecondary} />}
          </TouchableOpacity>
        </View>

        {/* Comparison table */}
        <View style={styles.compareCard}>
          <Text style={styles.compareTitle}>So sánh gói</Text>
          {[
            { feature: 'Ảnh phân tích/ngày', free: '3 ảnh', pro: 'Không giới hạn', family: 'Không giới hạn' },
            { feature: 'Số hồ sơ', free: '1', pro: '2', family: '4' },
            { feature: 'Vi chất dinh dưỡng', free: '3 loại', pro: '15+ loại', family: '15+ loại' },
            { feature: 'AI tư vấn', free: '–', pro: '✓', family: '✓' },
            { feature: 'Wearable sync', free: '–', pro: '✓', family: '✓' },
            { feature: 'Dashboard nhóm', free: '–', pro: '–', family: '✓' },
          ].map((row, i) => (
            <View key={row.feature} style={[styles.compareRow, i % 2 === 0 && styles.compareRowEven]}>
              <Text style={styles.compareFeature}>{row.feature}</Text>
              <Text style={styles.compareFree}>{row.free}</Text>
              <Text style={[styles.comparePro, { color: PLAN_COLORS.pro }]}>{row.pro}</Text>
              <Text style={[styles.compareFamily, { color: PLAN_COLORS.family }]}>{row.family}</Text>
            </View>
          ))}
          {/* Header */}
          <View style={[styles.compareRow, styles.compareHeader]}>
            <Text style={styles.compareFeature} />
            <Text style={[styles.compareFree, { color: PLAN_COLORS.free, fontWeight: '700' }]}>Free</Text>
            <Text style={[styles.comparePro, { color: PLAN_COLORS.pro, fontWeight: '700' }]}>Pro</Text>
            <Text style={[styles.compareFamily, { color: PLAN_COLORS.family, fontWeight: '700' }]}>Gia đình</Text>
          </View>
        </View>

        {/* Trust signals */}
        <View style={styles.trustRow}>
          {([
            ['lock-closed-outline', 'Bảo mật tuyệt đối'],
            ['refresh-outline', 'Hoàn tiền 7 ngày'],
            ['close-circle-outline', 'Hủy bất cứ lúc nào'],
          ] as const).map(([icon, text]) => (
            <View key={text} style={styles.trustItem}>
              <Ionicons name={icon} size={18} color={theme.colors.textSecondary} />
              <Text style={styles.trustText}>{text}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* CTA fixed bottom */}
      <View style={styles.ctaBar}>
        {selectedPlan === 'free' ? (
          <TouchableOpacity style={styles.ctaSecondary} onPress={() => router.back()}>
            <Text style={styles.ctaSecondaryText}>Tiếp tục miễn phí</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.cta, { backgroundColor: PLAN_COLORS[selectedPlan] }]}
            onPress={handleUpgrade}
            disabled={purchase.isPending}
          >
            {purchase.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="flash" size={20} color="#fff" />
                <Text style={styles.ctaText}>
                  Nâng cấp {plans.find((p: any) => p.id === selectedPlan)?.name} —{' '}
                  {plans.find((p: any) => p.id === selectedPlan)?.priceLabel}
                  {plans.find((p: any) => p.id === selectedPlan)?.period}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
        <Text style={styles.ctaNote}>Thanh toán qua VNPay, MoMo, hoặc thẻ tín dụng</Text>
      </View>
    </SafeAreaView>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 12, backgroundColor: theme.colors.surface,
      borderBottomWidth: 1, borderBottomColor: theme.colors.divider,
    },
    closeBtn: { width: 38, height: 38, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 17, fontWeight: '700', color: theme.colors.text },
    content: { paddingHorizontal: 16, paddingTop: 8 },

    hero: { alignItems: 'center', paddingVertical: 24, gap: 8 },
    heroGlyph: {
      width: 64, height: 64, borderRadius: 20, backgroundColor: PLAN_BG.pro,
      alignItems: 'center', justifyContent: 'center',
    },
    heroTitle: { fontSize: 22, fontWeight: '800', color: theme.colors.text, textAlign: 'center' },
    heroSub: { fontSize: 14, color: theme.colors.textTertiary, textAlign: 'center', lineHeight: 22 },

    plansSection: { gap: 12, marginBottom: 20 },
    planCard: {
      borderRadius: 18, borderWidth: 2, padding: 16,
      position: 'relative', overflow: 'hidden',
    },
    planCardSelected: {
      shadowColor: theme.colors.shadow, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
    },
    badge: {
      position: 'absolute', top: 12, right: 12,
      paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    },
    badgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
    planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
    planName: { fontSize: 18, fontWeight: '800' },
    priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2, marginTop: 2 },
    planPrice: { fontSize: 22, fontWeight: '800' },
    planPeriod: { fontSize: 12, color: theme.colors.textTertiary },
    radio: {
      width: 22, height: 22, borderRadius: 11, borderWidth: 2,
      justifyContent: 'center', alignItems: 'center',
    },
    radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },
    featureList: { gap: 8 },
    checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    checkText: { fontSize: 13, color: theme.colors.text, flex: 1 },
    currentBadge: {
      marginTop: 12, paddingVertical: 6, borderRadius: 8, alignItems: 'center',
    },
    currentBadgeText: { fontSize: 12, fontWeight: '600' },
    freePlan: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: theme.colors.divider, borderRadius: 14, padding: 14,
      borderWidth: 1.5, borderColor: theme.colors.border,
    },
    freePlanSelected: { borderColor: theme.colors.textTertiary },
    freePlanText: { fontSize: 13, color: theme.colors.textTertiary },

    compareCard: {
      backgroundColor: theme.colors.surface, borderRadius: 16, padding: 16, marginBottom: 16,
      shadowColor: theme.colors.shadow, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    },
    compareTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.text, marginBottom: 12 },
    compareHeader: { borderTopWidth: 1, borderTopColor: theme.colors.divider, paddingTop: 10, marginTop: 4 },
    compareRow: {
      flexDirection: 'row', alignItems: 'center', paddingVertical: 8,
    },
    compareRowEven: { backgroundColor: theme.colors.divider, borderRadius: 6 },
    compareFeature: { flex: 2, fontSize: 12, color: theme.colors.text, paddingLeft: 4 },
    compareFree: { flex: 1, fontSize: 11, color: theme.colors.textTertiary, textAlign: 'center' },
    comparePro: { flex: 1, fontSize: 11, textAlign: 'center', fontWeight: '500' },
    compareFamily: { flex: 1, fontSize: 11, textAlign: 'center', fontWeight: '500' },

    trustRow: {
      flexDirection: 'row', justifyContent: 'space-around',
      backgroundColor: theme.colors.surface, borderRadius: 16, padding: 16, marginBottom: 16,
    },
    trustItem: { alignItems: 'center', gap: 4 },
    trustText: { fontSize: 11, color: theme.colors.textSecondary, textAlign: 'center', maxWidth: 80 },

    ctaBar: {
      position: Platform.OS === 'web' ? 'relative' : 'absolute',
      bottom: 0, left: 0, right: 0,
      backgroundColor: theme.colors.surface, paddingHorizontal: 16, paddingTop: 12,
      paddingBottom: Platform.OS === 'ios' ? 32 : 16,
      borderTopWidth: 1, borderTopColor: theme.colors.divider,
      shadowColor: theme.colors.shadow, shadowOpacity: 0.08, shadowRadius: 8, elevation: 8,
      gap: 8,
    },
    cta: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 8, padding: 16, borderRadius: 16,
      shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    ctaText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    ctaSecondary: {
      padding: 16, borderRadius: 16, alignItems: 'center',
      borderWidth: 1.5, borderColor: theme.colors.border, backgroundColor: theme.colors.divider,
    },
    ctaSecondaryText: { fontSize: 15, color: theme.colors.textSecondary, fontWeight: '600' },
    ctaNote: { fontSize: 11, color: theme.colors.textTertiary, textAlign: 'center' },
  });
}
