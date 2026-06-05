import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { trpc } from '../../lib/trpc';
import { ProfileSwitcher } from '../../components/ProfileSwitcher';

const TODAY = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric' });

const MEAL_CONFIG = [
  { type: 'breakfast', label: 'Bữa sáng', icon: '🌅' },
  { type: 'lunch',     label: 'Bữa trưa', icon: '☀️'  },
  { type: 'dinner',    label: 'Bữa tối',  icon: '🌙'  },
  { type: 'snack',     label: 'Snack',    icon: '🍎'  },
] as const;

function MacroBar({ label, current, goal, color }: { label: string; current: number; goal: number; color: string }) {
  const pct = Math.min(goal > 0 ? current / goal : 0, 1);
  return (
    <View style={styles.macroItem}>
      <Text style={styles.macroLabel}>{label}</Text>
      <View style={styles.macroTrack}>
        <View style={[styles.macroFill, { width: `${pct * 100}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={styles.macroValue}>{Math.round(current)}<Text style={styles.macroGoal}>/{goal}g</Text></Text>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();

  const profiles = trpc.profile.list.useQuery(undefined, { retry: false });
  const profile = profiles.data?.[0];

  const summary = trpc.meal.getDailySummary.useQuery(
    { profileId: profile?.id ?? '', date: new Date().toISOString() },
    { enabled: !!profile?.id, retry: false },
  );

  const mealLogs = trpc.meal.getDailyLogs.useQuery(
    { profileId: profile?.id ?? '', date: new Date().toISOString() },
    { enabled: !!profile?.id, retry: false },
  );

  const caloriesGoal = (profile?.nutritionTargets as any)?.calories ?? 1920;
  const proteinGoal  = (profile?.nutritionTargets as any)?.protein_g ?? 80;
  const carbsGoal    = (profile?.nutritionTargets as any)?.carbs_g ?? 250;
  const fatGoal      = (profile?.nutritionTargets as any)?.fat_g ?? 65;

  const eaten     = summary.data?.totalCalories ?? 0;
  const proteinIn = summary.data?.totalProteinG ?? 0;
  const carbsIn   = summary.data?.totalCarbsG ?? 0;
  const fatIn     = summary.data?.totalFatG ?? 0;
  const pct       = caloriesGoal > 0 ? Math.round((eaten / caloriesGoal) * 100) : 0;
  const remaining = Math.max(caloriesGoal - eaten, 0);

  const loggedTypes = new Set(mealLogs.data?.map((m) => m.mealType) ?? []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {profiles.isLoading ? 'Xin chào! 👋' : `Xin chào, ${profile?.name ?? 'bạn'}! 👋`}
            </Text>
            <Text style={styles.date}>{TODAY}</Text>
          </View>
          <ProfileSwitcher activeProfile={profile ?? null} />
        </View>

        {/* Calorie card */}
        <View style={styles.card}>
          {summary.isLoading ? (
            <ActivityIndicator color="#2ECC71" style={{ marginVertical: 20 }} />
          ) : (
            <>
              <View style={styles.ringRow}>
                <View style={styles.ringWrapper}>
                  <View style={styles.ring}>
                    <View style={styles.ringProgress} />
                    <View style={styles.ringCenter}>
                      <Text style={styles.ringNumber}>{Math.round(eaten)}</Text>
                      <Text style={styles.ringLabel}>kcal</Text>
                      <Text style={styles.ringSub}>đã ăn</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.calStats}>
                  {[
                    { label: 'Mục tiêu', val: caloriesGoal, color: '#2ECC71' },
                    { label: 'Đã ăn',    val: Math.round(eaten), color: '#F59E0B' },
                    { label: 'Còn lại',  val: remaining,  color: '#E5E7EB' },
                  ].map((r) => (
                    <View key={r.label} style={styles.calStatRow}>
                      <View style={[styles.dot, { backgroundColor: r.color }]} />
                      <Text style={styles.calStatLabel}>{r.label}</Text>
                      <Text style={styles.calStatVal}>{r.val}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.macroSection}>
                <MacroBar label="Protein" current={proteinIn} goal={proteinGoal} color="#3B82F6" />
                <MacroBar label="Carbs"   current={carbsIn}   goal={carbsGoal}   color="#F59E0B" />
                <MacroBar label="Fat"     current={fatIn}     goal={fatGoal}     color="#EF4444" />
              </View>
            </>
          )}
        </View>

        {/* Meal log section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Bữa ăn hôm nay</Text>
            <TouchableOpacity onPress={() => router.push('/meal/history')}>
              <Text style={styles.sectionSub}>{pct}% · Xem lịch sử →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.mealList}>
            {MEAL_CONFIG.map(({ type, label, icon }) => {
              const log = mealLogs.data?.find((m) => m.mealType === type);
              const logCals = log?.items.reduce((s, i) => s + i.calories, 0) ?? 0;
              const itemNames = log?.items.map((i) => i.foodNameOverride ?? i.food?.nameVi ?? '').join(', ');

              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.mealRow, !log && styles.mealRowEmpty]}
                  onPress={() => router.push('/(tabs)/camera')}
                >
                  <Text style={styles.mealIcon}>{icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.mealType}>{label}</Text>
                    <Text style={styles.mealTime} numberOfLines={1}>
                      {log ? itemNames : 'Chưa ghi nhận'}
                    </Text>
                  </View>
                  {log
                    ? <Text style={styles.mealCal}>{Math.round(logCals)} kcal</Text>
                    : <Ionicons name="add-circle-outline" size={22} color="#2ECC71" />
                  }
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity style={styles.quickLog} onPress={() => router.push('/(tabs)/camera')}>
          <Ionicons name="camera" size={20} color="#fff" />
          <Text style={styles.quickLogText}>Chụp ảnh bữa ăn</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FBF9' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: Platform.OS === 'web' ? 20 : 8, paddingBottom: 12,
  },
  greeting: { fontSize: 22, fontWeight: '700', color: '#111827' },
  date: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#2ECC71', justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  card: {
    backgroundColor: '#fff', borderRadius: 20, marginHorizontal: 16, marginBottom: 16,
    padding: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  ringRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  ringWrapper: { marginRight: 24 },
  ring: {
    width: 110, height: 110, borderRadius: 55,
    borderWidth: 10, borderColor: '#E5E7EB',
    justifyContent: 'center', alignItems: 'center',
  },
  ringProgress: {
    position: 'absolute', width: 110, height: 110, borderRadius: 55,
    borderWidth: 10, borderColor: '#2ECC71',
    borderLeftColor: 'transparent', borderBottomColor: 'transparent',
    transform: [{ rotate: '-45deg' }],
  },
  ringCenter: { alignItems: 'center' },
  ringNumber: { fontSize: 24, fontWeight: '800', color: '#111827' },
  ringLabel: { fontSize: 11, color: '#6B7280' },
  ringSub: { fontSize: 10, color: '#9CA3AF' },
  calStats: { flex: 1, gap: 10 },
  calStatRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  calStatLabel: { flex: 1, fontSize: 13, color: '#6B7280' },
  calStatVal: { fontSize: 13, fontWeight: '600', color: '#111827' },
  macroSection: { gap: 8 },
  macroItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  macroLabel: { width: 50, fontSize: 12, color: '#6B7280' },
  macroTrack: { flex: 1, height: 6, backgroundColor: '#F3F4F6', borderRadius: 3, overflow: 'hidden' },
  macroFill: { height: 6, borderRadius: 3 },
  macroValue: { fontSize: 12, fontWeight: '600', color: '#111827', width: 55, textAlign: 'right' },
  macroGoal: { fontSize: 10, color: '#9CA3AF', fontWeight: '400' },
  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  sectionSub: { fontSize: 12, color: '#2ECC71', fontWeight: '600' },
  mealList: {
    backgroundColor: '#fff', borderRadius: 16,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  mealRow: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderBottomWidth: 1, borderBottomColor: '#F9FAFB',
  },
  mealRowEmpty: { opacity: 0.65 },
  mealIcon: { fontSize: 24, marginRight: 12 },
  mealType: { fontSize: 14, fontWeight: '600', color: '#111827' },
  mealTime: { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
  mealCal: { fontSize: 13, fontWeight: '600', color: '#2ECC71' },
  quickLog: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#2ECC71', marginHorizontal: 16,
    padding: 16, borderRadius: 16,
    shadowColor: '#2ECC71', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  quickLogText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
