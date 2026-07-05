import { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { Theme } from '@genki/ui';
import { trpc } from '../lib/trpc';
import { useActiveProfile } from '../hooks/useActiveProfile';
import { useAppTheme, useThemedStyles } from '../contexts/ThemeContext';
import { isSnackType } from '../lib/mealTypes';
import { formatMicros, sumMicros, formatMicroValue } from '../lib/micronutrients';

const MEAL_ROWS = [
  { type: 'breakfast', label: 'Bữa sáng', icon: 'partly-sunny-outline', group: false },
  { type: 'lunch',     label: 'Bữa trưa', icon: 'sunny-outline',        group: false },
  { type: 'dinner',    label: 'Bữa tối',  icon: 'moon-outline',         group: false },
  { type: 'snack',     label: 'Bữa phụ',  icon: 'nutrition-outline',    group: true  },
] as const;

function MacroBar({ label, current, goal, color }: { label: string; current: number; goal: number; color: string }) {
  const styles = useThemedStyles(createStyles);
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

export default function DayDetailScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { activeProfile } = useActiveProfile();
  const params = useLocalSearchParams<{ date: string; profileId: string }>();
  const profileId = params.profileId ?? activeProfile?.id ?? '';
  const dateIso = params.date ?? new Date().toISOString();

  const [showMicros, setShowMicros] = useState(false);

  const logs = trpc.meal.getDailyLogs.useQuery(
    { profileId, date: dateIso },
    { enabled: !!profileId, retry: false },
  );

  const items = (logs.data ?? []).flatMap((l) => l.items);
  const eaten     = items.reduce((s, i) => s + i.calories, 0);
  const proteinIn = items.reduce((s, i) => s + i.proteinG, 0);
  const carbsIn   = items.reduce((s, i) => s + i.carbsG, 0);
  const fatIn     = items.reduce((s, i) => s + i.fatG, 0);

  const caloriesGoal = (activeProfile?.nutritionTargets as any)?.calories ?? 2000;
  const proteinGoal  = (activeProfile?.nutritionTargets as any)?.protein_g ?? 75;
  const carbsGoal    = (activeProfile?.nutritionTargets as any)?.carbs_g ?? 275;
  const fatGoal      = (activeProfile?.nutritionTargets as any)?.fat_g ?? 67;
  const pct          = caloriesGoal > 0 ? Math.min(Math.round((eaten / caloriesGoal) * 100), 100) : 0;
  const remaining    = Math.max(caloriesGoal - eaten, 0);

  const microRows = formatMicros(sumMicros(items.map((i) => i.micronutrients as Record<string, number> | null)));
  const microSources = items.filter((i) => i.micronutrients && Object.keys(i.micronutrients).length);
  const microVerified = microSources.length > 0 &&
    microSources.every((i) => (i as { microVerified?: boolean }).microVerified);

  const dateLabel = new Date(dateIso).toLocaleDateString('vi-VN', {
    weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric',
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>{dateLabel}</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Calorie ring + macros */}
        <View style={styles.card}>
          <View style={styles.ringRow}>
            {Platform.OS === 'web' ? (
              <View style={[styles.ringOuter, { background: `conic-gradient(${theme.colors.primary} ${pct * 3.6}deg, ${theme.colors.border} ${pct * 3.6}deg)` } as any]}>
                <View style={styles.ringInner}>
                  <Text style={styles.ringNumber}>{Math.round(eaten)}</Text>
                  <Text style={styles.ringLabel}>kcal</Text>
                </View>
              </View>
            ) : (
              <View style={[styles.ring, { borderColor: theme.colors.border }]}>
                <Text style={styles.ringNumber}>{Math.round(eaten)}</Text>
                <Text style={styles.ringLabel}>kcal</Text>
              </View>
            )}
            <View style={styles.calStats}>
              {[
                { label: 'Mục tiêu', val: caloriesGoal, color: theme.colors.primary },
                { label: 'Đã ăn', val: Math.round(eaten), color: theme.colors.warning },
                { label: 'Còn lại', val: remaining, color: theme.colors.border },
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
            <MacroBar label="Tinh bột" current={carbsIn}   goal={carbsGoal}   color={theme.colors.warning} />
            <MacroBar label="Chất đạm" current={proteinIn} goal={proteinGoal} color={theme.colors.info} />
            <MacroBar label="Chất béo" current={fatIn}     goal={fatGoal}     color={theme.colors.error} />
          </View>

          {/* Micronutrients */}
          {microRows.length > 0 && (
            <View style={styles.microWrap}>
              <TouchableOpacity style={styles.microToggle} onPress={() => setShowMicros((s) => !s)}>
                <Ionicons name="leaf-outline" size={16} color={theme.colors.primary} />
                <Text style={[styles.microToggleText, { color: theme.colors.primary }]}>
                  {showMicros ? 'Ẩn vi chất' : `Xem thêm vi chất (${microRows.length})`}
                </Text>
                <Ionicons name={showMicros ? 'chevron-up' : 'chevron-down'} size={16} color={theme.colors.primary} />
              </TouchableOpacity>
              {showMicros && (
                <View style={styles.microGrid}>
                  {microRows.map((r) => (
                    <View key={r.key} style={styles.microItem}>
                      <Text style={styles.microLabel}>{r.label}</Text>
                      <Text style={styles.microValue}>{formatMicroValue(r.value)} {r.unit}</Text>
                    </View>
                  ))}
                  <Text style={styles.microNote}>
                    {microVerified ? 'Dữ liệu đã xác minh' : 'Ước tính — chỉ mang tính tham khảo'}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Meal list */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bữa ăn trong ngày</Text>
          <View style={styles.mealList}>
            {MEAL_ROWS.map(({ type, label, icon, group }) => {
              const rowLogs = (logs.data ?? []).filter((m) =>
                group ? isSnackType(m.mealType) : m.mealType === type);
              const hasLog = rowLogs.length > 0;
              const cals = rowLogs.reduce((s, l) => s + l.items.reduce((is, i) => is + i.calories, 0), 0);
              const names = rowLogs.flatMap((l) => l.items.map((i) => i.foodNameOverride ?? (i.food as any)?.nameVi ?? '')).join(', ');

              const onPress = () => {
                if (!profileId) return;
                if (group) {
                  router.push({ pathname: '/meal/snacks', params: { profileId, date: dateIso } });
                } else if (hasLog) {
                  router.push({ pathname: '/meal/[type]', params: { type, profileId, date: dateIso } });
                } else {
                  router.push({ pathname: '/(tabs)/camera', params: { mealType: type, date: dateIso } });
                }
              };

              return (
                <TouchableOpacity key={type} style={[styles.mealRow, !hasLog && { opacity: 0.6 }]} onPress={onPress}>
                  <Ionicons name={icon} size={22} color={theme.colors.primary} style={{ marginRight: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.mealType}>{label}</Text>
                    <Text style={styles.mealSub} numberOfLines={1}>{hasLog ? names : 'Chưa ghi nhận'}</Text>
                  </View>
                  {hasLog
                    ? <Text style={styles.mealCal}>{Math.round(cals)} kcal</Text>
                    : <Ionicons name="add-circle-outline" size={22} color={theme.colors.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* CTA — log a meal into this day */}
        <TouchableOpacity
          style={styles.cta}
          onPress={() => profileId && router.push({ pathname: '/(tabs)/camera', params: { date: dateIso } })}
        >
          <Ionicons name="camera" size={20} color="#fff" />
          <Text style={styles.ctaText}>Chụp ảnh bữa ăn</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    topBar: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 12, backgroundColor: theme.colors.surface,
      borderBottomWidth: 1, borderBottomColor: theme.colors.divider,
    },
    backBtn: { width: 38, height: 38, justifyContent: 'center', alignItems: 'center' },
    topTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.text, flex: 1, textAlign: 'center' },
    card: {
      backgroundColor: theme.colors.surface, borderRadius: 20, margin: 16,
      padding: 20, shadowColor: theme.colors.shadow, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    },
    ringRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    ringOuter: { width: 110, height: 110, borderRadius: 55, justifyContent: 'center', alignItems: 'center', marginRight: 24 },
    ringInner: { width: 84, height: 84, borderRadius: 42, backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center' },
    ring: { width: 110, height: 110, borderRadius: 55, borderWidth: 10, justifyContent: 'center', alignItems: 'center', marginRight: 24 },
    ringNumber: { fontSize: 24, fontWeight: '800', color: theme.colors.text },
    ringLabel: { fontSize: 11, color: theme.colors.textSecondary },
    calStats: { flex: 1, gap: 10 },
    calStatRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    calStatLabel: { flex: 1, fontSize: 13, color: theme.colors.textSecondary },
    calStatVal: { fontSize: 13, fontWeight: '600', color: theme.colors.text },
    macroSection: { gap: 8 },
    macroItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    macroLabel: { width: 62, fontSize: 12, color: theme.colors.textSecondary },
    macroTrack: { flex: 1, height: 6, backgroundColor: theme.colors.divider, borderRadius: 3, overflow: 'hidden' },
    macroFill: { height: 6, borderRadius: 3 },
    macroValue: { fontSize: 12, fontWeight: '600', color: theme.colors.text, width: 55, textAlign: 'right' },
    macroGoal: { fontSize: 10, color: theme.colors.textTertiary, fontWeight: '400' },
    microWrap: { marginTop: 14, borderTopWidth: 1, borderTopColor: theme.colors.divider, paddingTop: 10 },
    microToggle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    microToggleText: { flex: 1, fontSize: 13, fontWeight: '600' },
    microGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
    microItem: { width: '50%', flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, paddingRight: 12 },
    microLabel: { fontSize: 12, color: theme.colors.textSecondary },
    microValue: { fontSize: 12, fontWeight: '700', color: theme.colors.text },
    microNote: { width: '100%', fontSize: 11, color: theme.colors.textTertiary, marginTop: 6, fontStyle: 'italic' },
    section: { paddingHorizontal: 16 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text, marginBottom: 12 },
    mealList: { backgroundColor: theme.colors.surface, borderRadius: 16 },
    mealRow: {
      flexDirection: 'row', alignItems: 'center', padding: 14,
      borderBottomWidth: 1, borderBottomColor: theme.colors.divider,
    },
    mealIcon: { fontSize: 24, marginRight: 12 },
    mealType: { fontSize: 14, fontWeight: '600', color: theme.colors.text },
    mealSub: { fontSize: 12, color: theme.colors.textTertiary, marginTop: 1 },
    mealCal: { fontSize: 13, fontWeight: '600', color: theme.colors.primary },
    cta: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: theme.colors.primary, marginHorizontal: 16, marginTop: 16,
      padding: 16, borderRadius: 16,
      shadowColor: theme.colors.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    ctaText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  });
}
