import { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { trpc } from '../lib/trpc';

type PlanId = 'free' | 'pro' | 'family';

const PLAN_COLORS: Record<PlanId, string> = {
  free: '#6B7280',
  pro: '#2ECC71',
  family: '#8B5CF6',
};

const PLAN_BG: Record<PlanId, string> = {
  free: '#F9FAFB',
  pro: '#F0FDF4',
  family: '#F5F3FF',
};

function CheckItem({ text, color }: { text: string; color: string }) {
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
  if (!plan) return null;
  const color = PLAN_COLORS[plan.id as PlanId] ?? '#6B7280';
  const bg = PLAN_BG[plan.id as PlanId] ?? '#F9FAFB';

  return (
    <TouchableOpacity
      style={[
        styles.planCard,
        { borderColor: selected ? color : '#E5E7EB', backgroundColor: selected ? bg : '#fff' },
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
          <CheckItem key={f} text={f} color={selected ? color : '#9CA3AF'} />
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
          <Ionicons name="close" size={22} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nâng cấp Genki</Text>
        <View style={{ width: 38 }} />
      </View>

      {plansLoading && (
        <ActivityIndicator color="#2ECC71" style={{ marginTop: 80 }} />
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>✨</Text>
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
            {selectedPlan === 'free' && <Ionicons name="checkmark" size={16} color="#6B7280" />}
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
            { feature: 'Dashboard gia đình', free: '–', pro: '–', family: '✓' },
          ].map((row, i) => (
            <View key={row.feature} style={[styles.compareRow, i % 2 === 0 && styles.compareRowEven]}>
              <Text style={styles.compareFeature}>{row.feature}</Text>
              <Text style={styles.compareFree}>{row.free}</Text>
              <Text style={[styles.comparePro, { color: '#2ECC71' }]}>{row.pro}</Text>
              <Text style={[styles.compareFamily, { color: '#8B5CF6' }]}>{row.family}</Text>
            </View>
          ))}
          {/* Header */}
          <View style={[styles.compareRow, styles.compareHeader]}>
            <Text style={styles.compareFeature} />
            <Text style={[styles.compareFree, { color: '#6B7280', fontWeight: '700' }]}>Free</Text>
            <Text style={[styles.comparePro, { color: '#2ECC71', fontWeight: '700' }]}>Pro</Text>
            <Text style={[styles.compareFamily, { color: '#8B5CF6', fontWeight: '700' }]}>Gia đình</Text>
          </View>
        </View>

        {/* Trust signals */}
        <View style={styles.trustRow}>
          {[
            { icon: '🔒', text: 'Bảo mật tuyệt đối' },
            { icon: '↩️', text: 'Hoàn tiền 7 ngày' },
            { icon: '❌', text: 'Hủy bất cứ lúc nào' },
          ].map((t) => (
            <View key={t.text} style={styles.trustItem}>
              <Text style={{ fontSize: 18 }}>{t.icon}</Text>
              <Text style={styles.trustText}>{t.text}</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FBF9' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  closeBtn: { width: 38, height: 38, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  content: { paddingHorizontal: 16, paddingTop: 8 },

  hero: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  heroEmoji: { fontSize: 48 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#111827', textAlign: 'center' },
  heroSub: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 22 },

  plansSection: { gap: 12, marginBottom: 20 },
  planCard: {
    borderRadius: 18, borderWidth: 2, padding: 16,
    position: 'relative', overflow: 'hidden',
  },
  planCardSelected: {
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
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
  planPeriod: { fontSize: 12, color: '#9CA3AF' },
  radio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    justifyContent: 'center', alignItems: 'center',
  },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },
  featureList: { gap: 8 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkText: { fontSize: 13, color: '#374151', flex: 1 },
  currentBadge: {
    marginTop: 12, paddingVertical: 6, borderRadius: 8, alignItems: 'center',
  },
  currentBadgeText: { fontSize: 12, fontWeight: '600' },
  freePlan: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#F9FAFB', borderRadius: 14, padding: 14,
    borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  freePlanSelected: { borderColor: '#9CA3AF' },
  freePlanText: { fontSize: 13, color: '#9CA3AF' },

  compareCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  compareTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 12 },
  compareHeader: { borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 10, marginTop: 4 },
  compareRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 8,
  },
  compareRowEven: { backgroundColor: '#F9FAFB', borderRadius: 6 },
  compareFeature: { flex: 2, fontSize: 12, color: '#374151', paddingLeft: 4 },
  compareFree: { flex: 1, fontSize: 11, color: '#9CA3AF', textAlign: 'center' },
  comparePro: { flex: 1, fontSize: 11, textAlign: 'center', fontWeight: '500' },
  compareFamily: { flex: 1, fontSize: 11, textAlign: 'center', fontWeight: '500' },

  trustRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16,
  },
  trustItem: { alignItems: 'center', gap: 4 },
  trustText: { fontSize: 11, color: '#6B7280', textAlign: 'center', maxWidth: 80 },

  ctaBar: {
    position: Platform.OS === 'web' ? 'relative' : 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 8,
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
    borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB',
  },
  ctaSecondaryText: { fontSize: 15, color: '#6B7280', fontWeight: '600' },
  ctaNote: { fontSize: 11, color: '#9CA3AF', textAlign: 'center' },
});
