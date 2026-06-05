import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { trpc } from '../../../lib/trpc';

const TYPE_COLORS: Record<string, string> = {
  adult: '#2ECC71', senior: '#F59E0B', teen: '#8B5CF6', baby: '#EC4899',
};
const TYPE_LABELS: Record<string, string> = {
  adult: 'Người lớn', baby: 'Em bé', teen: 'Thiếu niên', senior: 'Người cao tuổi',
};
const MEAL_LABELS: Record<string, string> = {
  breakfast: '🌅 Sáng', lunch: '☀️ Trưa', dinner: '🌙 Tối',
  snack: '🍎 Snack', baby_meal: '🍼 Ăn dặm', formula: '🍼 Sữa',
};

function CalorieBar({ eaten, goal, color }: { eaten: number; goal: number; color: string }) {
  const pct = goal > 0 ? Math.min((eaten / goal) * 100, 100) : 0;
  const remaining = Math.max(goal - eaten, 0);

  return (
    <View style={styles.calBarCard}>
      <View style={styles.calBarRow}>
        <View>
          <Text style={[styles.calBarMain, { color }]}>{Math.round(eaten).toLocaleString()}</Text>
          <Text style={styles.calBarSub}>kcal đã ăn</Text>
        </View>
        <View style={[styles.calRing, { borderColor: color + '30' }]}>
          <Text style={[styles.calRingPct, { color }]}>{Math.round(pct)}%</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.calBarMain}>{Math.round(remaining).toLocaleString()}</Text>
          <Text style={styles.calBarSub}>còn lại</Text>
        </View>
      </View>
      <View style={styles.calBarBg}>
        <View style={[styles.calBarFill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={styles.calBarGoal}>Mục tiêu: {Math.round(goal).toLocaleString()} kcal</Text>
    </View>
  );
}

function MacroCard({
  protein, carbs, fat, proteinGoal, carbsGoal, fatGoal,
}: {
  protein: number; carbs: number; fat: number;
  proteinGoal: number; carbsGoal: number; fatGoal: number;
}) {
  const macros = [
    { label: 'Protein', value: protein, goal: proteinGoal, color: '#3B82F6' },
    { label: 'Carbs', value: carbs, goal: carbsGoal, color: '#F59E0B' },
    { label: 'Fat', value: fat, goal: fatGoal, color: '#EF4444' },
  ];

  return (
    <View style={styles.macroCard}>
      <Text style={styles.cardTitle}>Macro hôm nay</Text>
      <View style={styles.macroGrid}>
        {macros.map((m) => {
          const pct = m.goal > 0 ? Math.min((m.value / m.goal) * 100, 100) : 0;
          return (
            <View key={m.label} style={styles.macroItem}>
              <View style={styles.macroCircleBg}>
                <View
                  style={[
                    styles.macroCircleFill,
                    {
                      height: `${pct}%` as any,
                      backgroundColor: m.color,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.macroItemVal, { color: m.color }]}>
                {Math.round(m.value)}g
              </Text>
              <Text style={styles.macroItemLabel}>{m.label}</Text>
              <Text style={styles.macroItemGoal}>/{Math.round(m.goal)}g</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function WeekChart({ summaries }: { summaries: any[] }) {
  if (summaries.length === 0) return null;

  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const sorted = [...summaries].sort(
    (a, b) => new Date(a.summaryDate).getTime() - new Date(b.summaryDate).getTime(),
  );
  const maxCal = Math.max(...sorted.map((s) => s.totalCalories as number), 1);

  return (
    <View style={styles.weekCard}>
      <Text style={styles.cardTitle}>7 ngày gần nhất</Text>
      <View style={styles.chartRow}>
        {sorted.map((s, i) => {
          const pct = (s.totalCalories as number) / maxCal;
          const d = new Date(s.summaryDate);
          return (
            <View key={i} style={styles.chartBar}>
              <Text style={styles.chartVal}>
                {s.totalCalories > 0 ? Math.round((s.totalCalories as number) / 100) * 100 / 1000 < 1
                  ? `${Math.round(s.totalCalories as number)}`
                  : `${((s.totalCalories as number) / 1000).toFixed(1)}k`
                  : ''}
              </Text>
              <View style={styles.chartBarBg}>
                <View
                  style={[
                    styles.chartBarFill,
                    { height: `${Math.max(pct * 100, 4)}%` as any },
                  ]}
                />
              </View>
              <Text style={styles.chartDay}>{days[d.getDay()]}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function MemberDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const profile = trpc.profile.getById.useQuery(
    { id: id ?? '' },
    { enabled: !!id, retry: false },
  );

  const today = new Date();
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  const dailyLogs = trpc.meal.getDailyLogs.useQuery(
    { profileId: id ?? '', date: today.toISOString() },
    { enabled: !!id, retry: false },
  );

  const summaries = trpc.meal.getWeeklySummaries.useQuery(
    { profileId: id ?? '', from: sevenDaysAgo.toISOString(), to: today.toISOString() },
    { enabled: !!id, retry: false },
  );

  const p = profile.data as any;
  const color = TYPE_COLORS[p?.type ?? 'adult'] ?? '#2ECC71';
  const initial = p?.name?.[0]?.toUpperCase() ?? '?';

  const todaySummary = (summaries.data as any[])?.find((s: any) => {
    const d = new Date(s.summaryDate);
    return d.toDateString() === today.toDateString();
  });

  const caloriesEaten = todaySummary?.totalCalories ?? 0;
  const caloriesGoal = (p?.nutritionTargets as any)?.calories ?? p?.tdeeKcal ?? 1800;
  const proteinG = todaySummary?.totalProteinG ?? 0;
  const carbsG = todaySummary?.totalCarbsG ?? 0;
  const fatG = todaySummary?.totalFatG ?? 0;
  const proteinGoal = (p?.nutritionTargets as any)?.protein_g ?? 60;
  const carbsGoal = (p?.nutritionTargets as any)?.carbs_g ?? 200;
  const fatGoal = (p?.nutritionTargets as any)?.fat_g ?? 55;

  const meals = (dailyLogs.data as any[]) ?? [];

  if (profile.isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color="#2ECC71" style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{p?.name ?? 'Thành viên'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Profile hero */}
        <View style={styles.hero}>
          <View style={[styles.heroAvatar, { backgroundColor: color + '20' }]}>
            <Text style={[styles.heroAvatarText, { color }]}>{initial}</Text>
          </View>
          <Text style={styles.heroName}>{p?.name}</Text>
          <View style={[styles.typeBadge, { backgroundColor: color + '15' }]}>
            <Text style={[styles.typeBadgeText, { color }]}>
              {TYPE_LABELS[p?.type ?? 'adult'] ?? p?.type}
            </Text>
          </View>
        </View>

        {/* Calorie bar */}
        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <CalorieBar eaten={caloriesEaten} goal={caloriesGoal} color={color} />
        </View>

        {/* Macros */}
        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <MacroCard
            protein={proteinG} carbs={carbsG} fat={fatG}
            proteinGoal={proteinGoal} carbsGoal={carbsGoal} fatGoal={fatGoal}
          />
        </View>

        {/* Today's meals */}
        <View style={styles.mealsSection}>
          <Text style={styles.cardTitle}>Bữa ăn hôm nay</Text>
          {meals.length === 0 ? (
            <Text style={styles.noMeals}>Chưa ghi nhận bữa ăn nào</Text>
          ) : (
            meals.map((meal: any) => (
              <View key={meal.id} style={styles.mealRow}>
                <Text style={styles.mealType}>
                  {MEAL_LABELS[meal.mealType as string] ?? meal.mealType}
                </Text>
                <Text style={styles.mealCal}>
                {Math.round((meal.items ?? []).reduce((s: number, i: any) => s + (i.calories ?? 0), 0))} kcal
              </Text>
              </View>
            ))
          )}
        </View>

        {/* Weekly chart */}
        <View style={{ paddingHorizontal: 16 }}>
          <WeekChart summaries={(summaries.data as any[]) ?? []} />
        </View>
      </ScrollView>
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
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },

  hero: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  heroAvatar: {
    width: 72, height: 72, borderRadius: 36,
    justifyContent: 'center', alignItems: 'center',
  },
  heroAvatarText: { fontSize: 28, fontWeight: '800' },
  heroName: { fontSize: 20, fontWeight: '800', color: '#111827' },
  typeBadge: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 20 },
  typeBadgeText: { fontSize: 12, fontWeight: '600' },

  calBarCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  calBarRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
  },
  calBarMain: { fontSize: 22, fontWeight: '800', color: '#111827' },
  calBarSub: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  calRing: {
    width: 64, height: 64, borderRadius: 32, borderWidth: 4,
    justifyContent: 'center', alignItems: 'center',
  },
  calRingPct: { fontSize: 16, fontWeight: '800' },
  calBarBg: { height: 8, backgroundColor: '#F3F4F6', borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  calBarFill: { height: 8, borderRadius: 4 },
  calBarGoal: { fontSize: 11, color: '#9CA3AF', textAlign: 'center' },

  macroCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  macroGrid: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 },
  macroItem: { alignItems: 'center', gap: 4 },
  macroCircleBg: {
    width: 48, height: 64, backgroundColor: '#F3F4F6', borderRadius: 8,
    overflow: 'hidden', justifyContent: 'flex-end',
  },
  macroCircleFill: { width: '100%', borderRadius: 8 },
  macroItemVal: { fontSize: 14, fontWeight: '700' },
  macroItemLabel: { fontSize: 11, color: '#374151', fontWeight: '600' },
  macroItemGoal: { fontSize: 10, color: '#9CA3AF' },

  mealsSection: {
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: '#fff', borderRadius: 20, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  noMeals: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', paddingVertical: 12 },
  mealRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F9FAFB',
  },
  mealType: { fontSize: 13, color: '#374151', fontWeight: '500' },
  mealCal: { fontSize: 13, fontWeight: '700', color: '#111827' },

  weekCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 100, marginTop: 12 },
  chartBar: { flex: 1, alignItems: 'center', height: '100%' },
  chartVal: { fontSize: 8, color: '#9CA3AF', marginBottom: 2 },
  chartBarBg: {
    flex: 1, width: '80%', backgroundColor: '#F3F4F6', borderRadius: 4,
    overflow: 'hidden', justifyContent: 'flex-end',
  },
  chartBarFill: { width: '100%', backgroundColor: '#2ECC71', borderRadius: 4 },
  chartDay: { fontSize: 10, color: '#9CA3AF', marginTop: 4 },

  cardTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 4 },
});
