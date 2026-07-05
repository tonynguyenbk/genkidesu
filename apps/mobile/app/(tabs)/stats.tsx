import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { Theme } from '@genki/ui';
import { trpc } from '../../lib/trpc';
import { ProfileSwitcher } from '../../components/ProfileSwitcher';
import { useActiveProfile } from '../../hooks/useActiveProfile';
import { useAppTheme, useThemedStyles } from '../../contexts/ThemeContext';

const CHART_HEIGHT = 120; // px — fixed so bar heights compute reliably on web

function WeekBar({ day, cal, scaleMax, active, onPress }: {
  day: string; cal: number; scaleMax: number; active: boolean; onPress: () => void;
}) {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const barH = cal > 0 ? Math.max((cal / scaleMax) * CHART_HEIGHT, 4) : 0;
  return (
    <TouchableOpacity style={styles.barCol} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.barCalLabel}>{cal > 0 ? Math.round(cal) : ''}</Text>
      <View style={[styles.barTrack, { height: CHART_HEIGHT }]}>
        <View style={[styles.barFill, { height: barH, backgroundColor: active ? theme.colors.primary : theme.colors.successBg }]} />
      </View>
      <Text style={[styles.barDay, active && { color: theme.colors.primary, fontWeight: '700' }]}>{day}</Text>
    </TouchableOpacity>
  );
}

function StatCard({ label, value, unit, icon, color, change }: {
  label: string; value: string; unit: string;
  icon: React.ComponentProps<typeof Ionicons>['name']; color: string; change?: string;
}) {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={[styles.statCard, { borderLeftColor: color, borderLeftWidth: 3 }]}>
      <View style={[styles.statGlyph, { backgroundColor: color + '1A' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.statLabel}>{label}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
          <Text style={[styles.statValue, { color }]}>{value}</Text>
          <Text style={styles.statUnit}>{unit}</Text>
        </View>
      </View>
      {change && <Text style={[styles.statChange, { color: change.startsWith('↑') ? theme.colors.primary : theme.colors.error }]}>{change}</Text>}
    </View>
  );
}

const DAY_NAMES = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export default function StatsScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { activeProfile: profile } = useActiveProfile();

  // Build last 7 days
  const today = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return d;
  });

  // Compute totals from the meal logs themselves (not the daily_summaries table,
  // whose summary_date can drift a day under server-timezone rounding). Keeps
  // stats consistent with the home screen, which also derives from logs.
  const weeklyLogs = last7Days.map((date) => {
    const d = new Date(date);
    d.setHours(12, 0, 0, 0);
    return trpc.meal.getDailyLogs.useQuery(
      { profileId: profile?.id ?? '', date: d.toISOString() },
      { enabled: !!profile?.id, retry: false },
    );
  });

  const caloriesGoal = (profile?.nutritionTargets as any)?.calories ?? 1920;
  const dayTotals = weeklyLogs.map((q) => {
    const items = (q.data ?? []).flatMap((l) => l.items);
    return {
      totalCalories: items.reduce((s, i) => s + i.calories, 0),
      totalProteinG: items.reduce((s, i) => s + i.proteinG, 0),
      mealCount: (q.data ?? []).length,
    };
  });
  const summaryData = dayTotals.map((t) => t.totalCalories);
  const maxCal = Math.max(...summaryData, 1);

  // Calc weekly averages
  const activeDays = summaryData.filter((c) => c > 0);
  const avgCalories = activeDays.length ? Math.round(activeDays.reduce((s, c) => s + c, 0) / activeDays.length) : 0;
  const totalCalories = summaryData.reduce((s, c) => s + c, 0);

  // Today's data
  const todayIdx = 6;
  const todayData = dayTotals[todayIdx];
  const streak = (() => {
    let count = 0;
    for (let i = todayIdx; i >= 0; i--) {
      if (summaryData[i]! > 0) count++;
      else break;
    }
    return count;
  })();

  const isLoading = weeklyLogs.some((q) => q.isLoading);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={styles.title}>Thống kê</Text>
            <Text style={styles.sub}>7 ngày qua</Text>
          </View>
          <ProfileSwitcher />
        </View>

        {/* Weekly chart */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Calories theo tuần</Text>
          <Text style={styles.cardSub}>
            Trung bình: {avgCalories > 0 ? `${avgCalories.toLocaleString()} kcal/ngày` : 'Chưa có dữ liệu'}
          </Text>
          {isLoading ? (
            <ActivityIndicator color={theme.colors.primary} style={{ marginVertical: 20 }} />
          ) : (
            <View style={styles.barChart}>
              {last7Days.map((date, i) => {
                const dayOfWeek = date.getDay();
                const dayName = DAY_NAMES[dayOfWeek === 0 ? 6 : dayOfWeek - 1]!;
                const cal = summaryData[i] ?? 0;
                return (
                  <WeekBar
                    key={i}
                    day={dayName}
                    cal={cal}
                    scaleMax={Math.max(maxCal, caloriesGoal)}
                    active={i === todayIdx}
                    onPress={() => {
                      if (!profile?.id) return;
                      const d = new Date(date); d.setHours(12, 0, 0, 0);
                      router.push({ pathname: '/day-detail', params: { date: d.toISOString(), profileId: profile.id } });
                    }}
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
            label="Calo hôm nay" icon="flame-outline" color={theme.colors.warning}
            value={Math.round(todayData?.totalCalories ?? 0).toLocaleString()} unit="kcal"
            change={caloriesGoal > 0 ? `${Math.round(((todayData?.totalCalories ?? 0) / caloriesGoal) * 100)}% mục tiêu` : undefined}
          />
          <StatCard
            label="Protein hôm nay" icon="barbell-outline" color={theme.colors.info}
            value={(todayData?.totalProteinG ?? 0).toFixed(0)} unit="g"
          />
          <StatCard
            label="Tổng calo tuần" icon="stats-chart-outline" color={theme.colors.secondary}
            value={Math.round(totalCalories).toLocaleString()} unit="kcal"
          />
          <StatCard
            label="Số bữa hôm nay" icon="restaurant-outline" color={theme.colors.primary}
            value={String(todayData?.mealCount ?? 0)} unit="bữa"
          />
        </View>

        {/* Streak */}
        {streak > 0 && (
          <View style={[styles.card, { backgroundColor: theme.colors.surfaceAlt }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Ionicons name="flame" size={34} color={theme.colors.warning} />
              <View>
                <Text style={styles.streakNum}>{streak} ngày</Text>
                <Text style={styles.streakLabel}>chuỗi ghi nhận liên tiếp</Text>
              </View>
              <Ionicons name="trophy" size={28} color={theme.colors.warning} style={{ marginLeft: 'auto' as any }} />
            </View>
          </View>
        )}

        {/* Empty state */}
        {!isLoading && totalCalories === 0 && (
          <View style={styles.emptyCard}>
            <Ionicons name="stats-chart-outline" size={36} color={theme.colors.textTertiary} style={{ alignSelf: 'center' }} />
            <Text style={styles.emptyTitle}>Chưa có dữ liệu</Text>
            <Text style={styles.emptySub}>Hãy ghi nhận bữa ăn đầu tiên để xem thống kê</Text>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: {
      paddingHorizontal: 20, paddingTop: Platform.OS === 'web' ? 20 : 8, paddingBottom: 8,
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
    },
    title: { fontSize: 24, fontWeight: '800', color: theme.colors.text },
    sub: { fontSize: 13, color: theme.colors.textTertiary },
    card: {
      backgroundColor: theme.colors.surface, borderRadius: 20, marginHorizontal: 16, marginBottom: 16,
      padding: 20, shadowColor: theme.colors.shadow, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    },
    cardTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
    cardSub: { fontSize: 12, color: theme.colors.textTertiary, marginTop: 2, marginBottom: 16 },
    barChart: { flexDirection: 'row', gap: 4, alignItems: 'flex-end' },
    barCol: { flex: 1, alignItems: 'center', gap: 4 },
    barCalLabel: { fontSize: 9, color: theme.colors.textTertiary, textAlign: 'center', minHeight: 12 },
    barTrack: {
      width: '100%', backgroundColor: theme.colors.divider, borderRadius: 6,
      justifyContent: 'flex-end', overflow: 'hidden',
    },
    barFill: { width: '100%', borderRadius: 6 },
    barDay: { fontSize: 11, color: theme.colors.textTertiary },
    section: { paddingHorizontal: 16, marginBottom: 16, gap: 10 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text, marginBottom: 4 },
    statCard: {
      backgroundColor: theme.colors.surface, borderRadius: 14, padding: 14,
      flexDirection: 'row', alignItems: 'center', gap: 12,
      shadowColor: theme.colors.shadow, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
    },
    statGlyph: {
      width: 34, height: 34, borderRadius: 10,
      alignItems: 'center', justifyContent: 'center',
    },
    statLabel: { fontSize: 12, color: theme.colors.textTertiary },
    statValue: { fontSize: 22, fontWeight: '800' },
    statUnit: { fontSize: 12, color: theme.colors.textTertiary },
    statChange: { fontSize: 12, fontWeight: '500' },
    streakNum: { fontSize: 22, fontWeight: '800', color: theme.colors.primary },
    streakLabel: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },
    emptyCard: {
      backgroundColor: theme.colors.surface, borderRadius: 20, marginHorizontal: 16,
      padding: 32, alignItems: 'center', gap: 8,
    },
    emptyTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
    emptySub: { fontSize: 13, color: theme.colors.textTertiary, textAlign: 'center' },
  });
}
