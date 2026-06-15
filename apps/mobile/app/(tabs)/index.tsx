import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { trpc } from '../../lib/trpc';
import { ProfileSwitcher } from '../../components/ProfileSwitcher';
import { useProfileTheme } from '../../hooks/useProfileTheme';
import { useActiveProfile } from '../../hooks/useActiveProfile';

const TODAY = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric' });
// Computed once at module load — recomputing per render would change the
// tRPC query key every time and trigger an infinite refetch loop.
const TODAY_ISO = new Date().toISOString();

const MEAL_CONFIG = [
  { type: 'breakfast', label: 'Bữa sáng', icon: '🌅' },
  { type: 'lunch',     label: 'Bữa trưa', icon: '☀️'  },
  { type: 'dinner',    label: 'Bữa tối',  icon: '🌙'  },
  { type: 'snack',     label: 'Snack',    icon: '🍎'  },
] as const;

// ─── Sub-components ──────────────────────────────────────────────────────────

function MacroBar({ label, current, goal, color }: {
  label: string; current: number; goal: number; color: string;
}) {
  const pct = Math.min(goal > 0 ? current / goal : 0, 1);
  return (
    <View style={styles.macroItem}>
      <Text style={styles.macroLabel}>{label}</Text>
      <View style={styles.macroTrack}>
        <View style={[styles.macroFill, { width: `${pct * 100}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={styles.macroValue}>
        {Math.round(current)}<Text style={styles.macroGoal}>/{goal}g</Text>
      </Text>
    </View>
  );
}

// Senior: big calorie display, no macro bars
function SeniorCalorieCard({ eaten, goal, remaining }: {
  eaten: number; goal: number; remaining: number;
}) {
  const pct = goal > 0 ? Math.min(Math.round((eaten / goal) * 100), 100) : 0;
  return (
    <View style={[styles.card, styles.seniorCard]}>
      <Text style={styles.seniorCalLabel}>Đã ăn hôm nay</Text>
      <Text style={styles.seniorCalNumber}>{Math.round(eaten)}</Text>
      <Text style={styles.seniorCalUnit}>kcal</Text>
      <View style={styles.seniorProgressTrack}>
        <View style={[styles.seniorProgressFill, { width: `${pct}%` as any }]} />
      </View>
      <Text style={styles.seniorCalSub}>
        Còn lại: <Text style={{ color: '#F59E0B', fontWeight: '700' }}>{Math.round(remaining)} kcal</Text>
        {' '}/ Mục tiêu: {goal} kcal
      </Text>
    </View>
  );
}

// Teen: streak gamification banner
function TeenStreakBanner({ streak, calories, goal }: {
  streak: number; calories: number; goal: number;
}) {
  if (streak === 0 && calories === 0) return null;
  return (
    <View style={styles.streakBanner}>
      <Text style={styles.streakFire}>{streak > 0 ? '🔥' : '⚡'}</Text>
      <View style={{ flex: 1 }}>
        {streak > 0
          ? <>
              <Text style={styles.streakNum}>{streak} ngày liên tiếp!</Text>
              <Text style={styles.streakSub}>Tiếp tục giữ streak nhé</Text>
            </>
          : <>
              <Text style={styles.streakNum}>Bắt đầu streak hôm nay!</Text>
              <Text style={styles.streakSub}>Ghi nhận bữa ăn để khởi động</Text>
            </>
        }
      </View>
      <View style={styles.streakBadge}>
        <Text style={styles.streakBadgeText}>{Math.round((calories / Math.max(goal, 1)) * 100)}%</Text>
        <Text style={styles.streakBadgeLabel}>mục tiêu</Text>
      </View>
    </View>
  );
}

// Baby: feeding summary card
function BabyFeedingCard({ logs, profileId }: { logs: any[]; profileId?: string }) {
  const router = useRouter();
  const feedings = logs ?? [];
  const totalMl = feedings
    .filter((l) => l.mealType === 'formula' || l.mealType === 'baby_meal')
    .reduce((s, l) => s + l.items.reduce((is: number, i: any) => is + i.portionGrams, 0), 0);

  return (
    <View style={[styles.card, styles.babyCard]}>
      <View style={styles.babyCardHeader}>
        <Text style={styles.babyCardTitle}>Bữa ăn hôm nay</Text>
        <Text style={styles.babyCardCount}>{feedings.length} lần</Text>
      </View>
      <View style={styles.babyStats}>
        <View style={styles.babyStatItem}>
          <Text style={styles.babyStatVal}>{feedings.length}</Text>
          <Text style={styles.babyStatLabel}>lần ăn</Text>
        </View>
        <View style={styles.babyStatItem}>
          <Text style={styles.babyStatVal}>{Math.round(totalMl)}</Text>
          <Text style={styles.babyStatLabel}>ml/g hôm nay</Text>
        </View>
        <View style={styles.babyStatItem}>
          <Text style={styles.babyStatVal}>
            {feedings.reduce((s, l) => s + l.items.reduce((is: number, i: any) => is + i.calories, 0), 0).toFixed(0)}
          </Text>
          <Text style={styles.babyStatLabel}>kcal</Text>
        </View>
      </View>
      {profileId && (
        <TouchableOpacity
          style={styles.growthLink}
          onPress={() => router.push({ pathname: '/growth-chart', params: { profileId } })}
        >
          <Ionicons name="trending-up" size={16} color="#EC4899" />
          <Text style={styles.growthLinkText}>Biểu đồ tăng trưởng (chuẩn WHO)</Text>
          <Ionicons name="chevron-forward" size={16} color="#EC4899" />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const { isSenior, isBaby, isTeen, primaryColor, fontScale, simplifiedMode, buttonHeight } = useProfileTheme();

  const { activeProfile: profile, isLoading: profileLoading } = useActiveProfile();

  const summary = trpc.meal.getDailySummary.useQuery(
    { profileId: profile?.id ?? '', date: TODAY_ISO },
    { enabled: !!profile?.id, retry: false },
  );

  const mealLogs = trpc.meal.getDailyLogs.useQuery(
    { profileId: profile?.id ?? '', date: TODAY_ISO },
    { enabled: !!profile?.id, retry: false },
  );

  // Streak calculation (last 7 days data)
  const last7Summaries = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - i); d.setHours(12, 0, 0, 0);
    return trpc.meal.getDailySummary.useQuery(
      { profileId: profile?.id ?? '', date: d.toISOString() },
      { enabled: isTeen && !!profile?.id, retry: false },
    );
  });
  const streak = isTeen ? (() => {
    let count = 0;
    for (const q of last7Summaries) {
      if ((q.data?.totalCalories ?? 0) > 0) count++;
      else break;
    }
    return count;
  })() : 0;

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

  const greetingSize = 20; // fixed — pill already shows profile name prominently
  const quickLogLabel = isBaby ? 'Ghi nhận bữa ăn' : isSenior ? 'Chụp ảnh ngay' : 'Chụp ảnh bữa ăn';
  const quickLogRoute = isBaby ? '/baby-feed' : '/(tabs)/camera';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={[styles.greeting, { fontSize: greetingSize }]} numberOfLines={1}>
              {profileLoading ? 'Xin chào! 👋' : `Chào, ${profile?.name ?? 'bạn'}! 👋`}
            </Text>
            <Text style={styles.date}>{TODAY}</Text>
          </View>
          <ProfileSwitcher />
        </View>

        {/* Teen streak banner */}
        {isTeen && (
          <TeenStreakBanner streak={streak} calories={eaten} goal={caloriesGoal} />
        )}

        {/* Calorie card — adaptive */}
        {summary.isLoading ? (
          <View style={[styles.card, { paddingVertical: 32 }]}>
            <ActivityIndicator color={primaryColor} />
          </View>
        ) : isBaby ? (
          <BabyFeedingCard logs={mealLogs.data ?? []} profileId={profile?.id} />
        ) : (
          <View style={styles.card}>
            <View style={styles.ringRow}>
              <View style={styles.ringWrapper}>
                {Platform.OS === 'web' ? (
                  // Web: conic-gradient gives a real percentage arc
                  <View
                    style={[
                      styles.ringOuter,
                      // @ts-ignore — react-native-web passes unknown CSS through
                      { background: `conic-gradient(${primaryColor} ${pct * 3.6}deg, #E5E7EB ${pct * 3.6}deg)` },
                    ]}
                  >
                    <View style={styles.ringInner}>
                      <Text style={styles.ringNumber}>{Math.round(eaten)}</Text>
                      <Text style={styles.ringLabel}>kcal</Text>
                      <Text style={styles.ringSub}>đã ăn</Text>
                    </View>
                  </View>
                ) : (
                  <View style={[styles.ring, { borderColor: '#E5E7EB' }]}>
                    <View style={[styles.ringProgress, { borderColor: primaryColor }]} />
                    <View style={styles.ringCenter}>
                      <Text style={styles.ringNumber}>{Math.round(eaten)}</Text>
                      <Text style={styles.ringLabel}>kcal</Text>
                      <Text style={styles.ringSub}>đã ăn</Text>
                    </View>
                  </View>
                )}
              </View>
              <View style={styles.calStats}>
                {[
                  { label: 'Mục tiêu', val: caloriesGoal, color: primaryColor },
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
            {!simplifiedMode && (
              <View style={styles.macroSection}>
                <MacroBar label="Protein" current={proteinIn} goal={proteinGoal} color="#3B82F6" />
                <MacroBar label="Carbs"   current={carbsIn}   goal={carbsGoal}   color="#F59E0B" />
                <MacroBar label="Fat"     current={fatIn}     goal={fatGoal}     color="#EF4444" />
              </View>
            )}
          </View>
        )}

        {/* Meal log section — hidden for baby (use baby-specific) */}
        {!isBaby && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, isSenior && { fontSize: 18 }]}>Bữa ăn hôm nay</Text>
              <TouchableOpacity onPress={() => router.push('/meal/history')}>
                <Text style={styles.sectionSub}>{pct}% · Xem lịch sử →</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.mealList}>
              {MEAL_CONFIG.map(({ type, label, icon }) => {
                const log = mealLogs.data?.find((m) => m.mealType === type);
                const logCals = log?.items.reduce((s, i) => s + i.calories, 0) ?? 0;
                const itemNames = log?.items.map((i) => i.foodNameOverride ?? (i.food as any)?.nameVi ?? '').join(', ');
                const rowH = isSenior ? 72 : 54;

                return (
                  <TouchableOpacity
                    key={type}
                    style={[styles.mealRow, !log && styles.mealRowEmpty, { minHeight: rowH }]}
                    onPress={() => router.push('/(tabs)/camera')}
                  >
                    <Text style={[styles.mealIcon, isSenior && { fontSize: 28 }]}>{icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.mealType, isSenior && { fontSize: 17 }]}>{label}</Text>
                      <Text style={styles.mealTime} numberOfLines={1}>
                        {log ? itemNames : 'Chưa ghi nhận'}
                      </Text>
                    </View>
                    {log
                      ? <Text style={[styles.mealCal, isSenior && { fontSize: 16 }, { color: primaryColor }]}>
                          {Math.round(logCals)} kcal
                        </Text>
                      : <Ionicons name="add-circle-outline" size={isSenior ? 28 : 22} color={primaryColor} />
                    }
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Baby feeding list */}
        {isBaby && (mealLogs.data?.length ?? 0) > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lịch ăn hôm nay</Text>
            <View style={styles.mealList}>
              {mealLogs.data?.map((log) => {
                const time = new Date(log.loggedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                const item = log.items[0];
                const label = log.mealType === 'formula' ? '🍼' : '🥣';
                return (
                  <View key={log.id} style={styles.mealRow}>
                    <Text style={{ fontSize: 22, marginRight: 12 }}>{label}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.mealType}>{item?.foodNameOverride ?? 'Bữa ăn'}</Text>
                      <Text style={styles.mealTime}>{time} · {Math.round(item?.portionGrams ?? 0)}g/ml</Text>
                    </View>
                    <Text style={[styles.mealCal, { color: '#EC4899' }]}>
                      {Math.round(item?.calories ?? 0)} kcal
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* CTA */}
        <TouchableOpacity
          style={[
            styles.quickLog,
            { backgroundColor: primaryColor, minHeight: buttonHeight },
            isSenior && styles.quickLogSenior,
          ]}
          onPress={() => router.push(quickLogRoute as any)}
        >
          <Ionicons name={isBaby ? 'restaurant' : 'camera'} size={isSenior ? 26 : 20} color="#fff" />
          <Text style={[styles.quickLogText, isSenior && styles.quickLogTextSenior]}>{quickLogLabel}</Text>
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

  // Teen streak banner
  streakBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F5F3FF', borderRadius: 16, marginHorizontal: 16, marginBottom: 12,
    padding: 14, borderWidth: 1, borderColor: '#DDD6FE', gap: 10,
  },
  streakFire: { fontSize: 32 },
  streakNum: { fontSize: 15, fontWeight: '700', color: '#5B21B6' },
  streakSub: { fontSize: 12, color: '#7C3AED', marginTop: 1 },
  streakBadge: { alignItems: 'center', backgroundColor: '#EDE9FE', borderRadius: 12, padding: 8 },
  streakBadgeText: { fontSize: 18, fontWeight: '800', color: '#5B21B6' },
  streakBadgeLabel: { fontSize: 10, color: '#7C3AED' },

  // Cards
  card: {
    backgroundColor: '#fff', borderRadius: 20, marginHorizontal: 16, marginBottom: 16,
    padding: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },

  // Senior card
  seniorCard: { alignItems: 'center', paddingVertical: 28 },
  seniorCalLabel: { fontSize: 16, color: '#6B7280', marginBottom: 6 },
  seniorCalNumber: { fontSize: 56, fontWeight: '900', color: '#F59E0B' },
  seniorCalUnit: { fontSize: 16, color: '#9CA3AF', marginTop: -4, marginBottom: 16 },
  seniorProgressTrack: {
    width: '100%', height: 10, backgroundColor: '#F3F4F6', borderRadius: 5, overflow: 'hidden', marginBottom: 10,
  },
  seniorProgressFill: { height: 10, backgroundColor: '#F59E0B', borderRadius: 5 },
  seniorCalSub: { fontSize: 15, color: '#6B7280', textAlign: 'center' },

  // Baby card
  babyCard: { backgroundColor: '#FFF5F9' },
  babyCardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  babyCardTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  babyCardCount: { fontSize: 13, color: '#EC4899', fontWeight: '600' },
  babyStats: { flexDirection: 'row' },
  babyStatItem: { flex: 1, alignItems: 'center' },
  babyStatVal: { fontSize: 24, fontWeight: '800', color: '#EC4899' },
  babyStatLabel: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  growthLink: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#FCE7F3',
  },
  growthLinkText: { fontSize: 13, fontWeight: '600', color: '#EC4899' },

  // Standard calorie ring card
  ringRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  ringWrapper: { marginRight: 24 },
  // Web ring: outer circle uses conic-gradient background (set via inline style)
  ringOuter: {
    width: 110, height: 110, borderRadius: 55,
    justifyContent: 'center', alignItems: 'center',
  },
  // Inner white circle cuts out the center to make it look like a ring
  ringInner: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
  },
  // Native ring (border trick)
  ring: {
    width: 110, height: 110, borderRadius: 55,
    borderWidth: 10, justifyContent: 'center', alignItems: 'center',
  },
  ringProgress: {
    position: 'absolute', width: 110, height: 110, borderRadius: 55,
    borderWidth: 10,
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

  // Meal section
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

  // Quick log CTA
  quickLog: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginHorizontal: 16, padding: 16, borderRadius: 16,
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  quickLogText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  quickLogSenior: { padding: 18, borderRadius: 18 },
  quickLogTextSenior: { fontSize: 19 },
});
