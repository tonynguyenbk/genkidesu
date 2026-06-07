import { View, Text, StyleSheet, SafeAreaView, ScrollView, Platform, ActivityIndicator } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { trpc } from '../../lib/trpc';

function WeekBar({ day, pct, active, cal }: { day: string; pct: number; active: boolean; cal: number }) {
  return (
    <View style={styles.barCol}>
      <Text style={styles.barCalLabel}>{cal > 0 ? cal : ''}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { height: `${Math.max(pct, 2)}%` as any, backgroundColor: active ? '#2ECC71' : '#D1FAE5' }]} />
      </View>
      <Text style={[styles.barDay, active && { color: '#2ECC71', fontWeight: '700' }]}>{day}</Text>
    </View>
  );
}

function StatCard({ label, value, unit, icon, color, change }: {
  label: string; value: string; unit: string; icon: string; color: string; change?: string;
}) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color, borderLeftWidth: 3 }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.statLabel}>{label}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
          <Text style={[styles.statValue, { color }]}>{value}</Text>
          <Text style={styles.statUnit}>{unit}</Text>
        </View>
      </View>
      {change && <Text style={[styles.statChange, { color: change.startsWith('↑') ? '#2ECC71' : '#EF4444' }]}>{change}</Text>}
    </View>
  );
}

const DAY_NAMES = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export default function StatsScreen() {
  const profiles = trpc.profile.list.useQuery(undefined, { retry: false });
  const profile = profiles.data?.[0];

  // Build last 7 days
  const today = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return d;
  });

  // Query weekly summaries
  const weeklySummaries = last7Days.map((date) => {
    const d = new Date(date);
    d.setHours(12, 0, 0, 0);
    return trpc.meal.getDailySummary.useQuery(
      { profileId: profile?.id ?? '', date: d.toISOString() },
      { enabled: !!profile?.id, retry: false },
    );
  });

  const caloriesGoal = (profile?.nutritionTargets as any)?.calories ?? 1920;
  const summaryData = weeklySummaries.map((q) => q.data?.totalCalories ?? 0);
  const maxCal = Math.max(...summaryData, 1);

  // Calc weekly averages
  const activeDays = summaryData.filter((c) => c > 0);
  const avgCalories = activeDays.length ? Math.round(activeDays.reduce((s, c) => s + c, 0) / activeDays.length) : 0;
  const totalCalories = summaryData.reduce((s, c) => s + c, 0);

  // Today's data
  const todayIdx = 6;
  const todayData = weeklySummaries[todayIdx]?.data;
  const streak = (() => {
    let count = 0;
    for (let i = todayIdx; i >= 0; i--) {
      if (summaryData[i]! > 0) count++;
      else break;
    }
    return count;
  })();

  const isLoading = weeklySummaries.some((q) => q.isLoading);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Thống kê</Text>
          <Text style={styles.sub}>7 ngày qua</Text>
        </View>

        {/* Weekly chart */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Calories theo tuần</Text>
          <Text style={styles.cardSub}>
            Trung bình: {avgCalories > 0 ? `${avgCalories.toLocaleString()} kcal/ngày` : 'Chưa có dữ liệu'}
          </Text>
          {isLoading ? (
            <ActivityIndicator color="#2ECC71" style={{ marginVertical: 20 }} />
          ) : (
            <View style={styles.barChart}>
              {last7Days.map((date, i) => {
                const dayOfWeek = date.getDay();
                const dayName = DAY_NAMES[dayOfWeek === 0 ? 6 : dayOfWeek - 1]!;
                const cal = summaryData[i] ?? 0;
                const pct = (cal / Math.max(maxCal, caloriesGoal)) * 100;
                return (
                  <WeekBar
                    key={i}
                    day={dayName}
                    pct={pct}
                    active={i === todayIdx}
                    cal={cal > 0 ? Math.round(cal) : 0}
                  />
                );
              })}
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tuần này</Text>
          <StatCard
            label="Calo hôm nay" icon="🔥" color="#F59E0B"
            value={Math.round(todayData?.totalCalories ?? 0).toLocaleString()} unit="kcal"
            change={caloriesGoal > 0 ? `${Math.round(((todayData?.totalCalories ?? 0) / caloriesGoal) * 100)}% mục tiêu` : undefined}
          />
          <StatCard
            label="Protein hôm nay" icon="💪" color="#3B82F6"
            value={(todayData?.totalProteinG ?? 0).toFixed(0)} unit="g"
          />
          <StatCard
            label="Tổng calo tuần" icon="📊" color="#8B5CF6"
            value={Math.round(totalCalories).toLocaleString()} unit="kcal"
          />
          <StatCard
            label="Số bữa hôm nay" icon="🍽️" color="#2ECC71"
            value={String(todayData?.mealCount ?? 0)} unit="bữa"
          />
        </View>

        {/* Streak */}
        {streak > 0 && (
          <View style={[styles.card, { backgroundColor: '#F0FDF4' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 36 }}>🔥</Text>
              <View>
                <Text style={styles.streakNum}>{streak} ngày</Text>
                <Text style={styles.streakLabel}>chuỗi ghi nhận liên tiếp</Text>
              </View>
              <Ionicons name="trophy" size={28} color="#F59E0B" style={{ marginLeft: 'auto' as any }} />
            </View>
          </View>
        )}

        {/* Empty state */}
        {!isLoading && totalCalories === 0 && (
          <View style={styles.emptyCard}>
            <Text style={{ fontSize: 40, textAlign: 'center' }}>📊</Text>
            <Text style={styles.emptyTitle}>Chưa có dữ liệu</Text>
            <Text style={styles.emptySub}>Hãy ghi nhận bữa ăn đầu tiên để xem thống kê</Text>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FBF9' },
  header: {
    paddingHorizontal: 20, paddingTop: Platform.OS === 'web' ? 20 : 8, paddingBottom: 8,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
  },
  title: { fontSize: 24, fontWeight: '800', color: '#111827' },
  sub: { fontSize: 13, color: '#9CA3AF' },
  card: {
    backgroundColor: '#fff', borderRadius: 20, marginHorizontal: 16, marginBottom: 16,
    padding: 20, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  cardSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2, marginBottom: 16 },
  barChart: { flexDirection: 'row', gap: 4, height: 130, alignItems: 'flex-end' },
  barCol: { flex: 1, alignItems: 'center', gap: 4 },
  barCalLabel: { fontSize: 9, color: '#9CA3AF', textAlign: 'center' },
  barTrack: {
    width: '100%', flex: 1, backgroundColor: '#F3F4F6', borderRadius: 6,
    justifyContent: 'flex-end', overflow: 'hidden',
  },
  barFill: { width: '100%', borderRadius: 6 },
  barDay: { fontSize: 11, color: '#9CA3AF' },
  section: { paddingHorizontal: 16, marginBottom: 16, gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  statCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  statIcon: { fontSize: 24 },
  statLabel: { fontSize: 12, color: '#9CA3AF' },
  statValue: { fontSize: 22, fontWeight: '800' },
  statUnit: { fontSize: 12, color: '#9CA3AF' },
  statChange: { fontSize: 12, fontWeight: '500' },
  streakNum: { fontSize: 22, fontWeight: '800', color: '#2ECC71' },
  streakLabel: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  emptyCard: {
    backgroundColor: '#fff', borderRadius: 20, marginHorizontal: 16,
    padding: 32, alignItems: 'center', gap: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151' },
  emptySub: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },
});
