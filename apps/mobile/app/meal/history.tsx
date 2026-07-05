import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { Theme } from '@genki/ui';
import { trpc } from '../../lib/trpc';
import { useActiveProfile } from '../../hooks/useActiveProfile';
import { useAppTheme, useThemedStyles } from '../../contexts/ThemeContext';
import { mealIcon, mealLabel, mealOrder } from '../../lib/mealTypes';

function formatDate(d: Date): string {
  return d.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric' });
}

export default function MealHistoryScreen() {
  const router = useRouter();
  const [dateOffset, setDateOffset] = useState(0); // 0=today, 1=yesterday, etc.
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const { activeProfile: profile } = useActiveProfile();

  const targetDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - dateOffset);
    return d;
  }, [dateOffset]);

  const logs = trpc.meal.getDailyLogs.useQuery(
    { profileId: profile?.id ?? '', date: targetDate.toISOString() },
    { enabled: !!profile?.id },
  );

  const summary = trpc.meal.getDailySummary.useQuery(
    { profileId: profile?.id ?? '', date: targetDate.toISOString() },
    { enabled: !!profile?.id },
  );

  const isToday = dateOffset === 0;
  const isYesterday = dateOffset === 1;
  const dateLabel = isToday ? 'Hôm nay' : isYesterday ? 'Hôm qua' : formatDate(targetDate);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Lịch sử bữa ăn</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Date navigation */}
      <View style={styles.dateNav}>
        <TouchableOpacity onPress={() => setDateOffset(d => d + 1)} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.dateCenter}>
          <Text style={styles.dateLabel}>{dateLabel}</Text>
          <Text style={styles.dateSub}>{targetDate.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric', year: 'numeric' })}</Text>
        </View>
        <TouchableOpacity
          onPress={() => setDateOffset(d => Math.max(0, d - 1))}
          style={[styles.navBtn, dateOffset === 0 && styles.navBtnDisabled]}
          disabled={dateOffset === 0}
        >
          <Ionicons name="chevron-forward" size={20} color={dateOffset === 0 ? theme.colors.textTertiary : theme.colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Daily summary */}
        {summary.data && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              {[
                { label: 'Calories', val: Math.round(summary.data.totalCalories), unit: 'kcal', color: theme.colors.primary },
                { label: 'Protein', val: Math.round(summary.data.totalProteinG), unit: 'g', color: theme.colors.info },
                { label: 'Carbs', val: Math.round(summary.data.totalCarbsG), unit: 'g', color: theme.colors.warning },
                { label: 'Fat', val: Math.round(summary.data.totalFatG), unit: 'g', color: theme.colors.error },
              ].map((m) => (
                <View key={m.label} style={styles.summaryItem}>
                  <Text style={[styles.summaryVal, { color: m.color }]}>{m.val}</Text>
                  <Text style={styles.summaryUnit}>{m.unit}</Text>
                  <Text style={styles.summaryLabel}>{m.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Meal logs */}
        {logs.isLoading ? (
          <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 40 }} />
        ) : logs.data?.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="restaurant-outline" size={36} color={theme.colors.textTertiary} />
            <Text style={styles.emptyTitle}>Chưa ghi nhận bữa ăn nào</Text>
            {isToday && (
              <TouchableOpacity style={styles.logBtn} onPress={() => router.push('/(tabs)/camera')}>
                <Text style={styles.logBtnText}>+ Ghi nhận bữa ăn</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.logList}>
            {[...(logs.data ?? [])]
              .sort((a, b) => mealOrder(a.mealType) - mealOrder(b.mealType) ||
                +new Date(a.loggedAt) - +new Date(b.loggedAt))
              .map((log) => {
              const totalCal = log.items.reduce((s, i) => s + i.calories, 0);
              const time = new Date(log.loggedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
              return (
                <View key={log.id} style={styles.logCard}>
                  <View style={styles.logHeader}>
                    <Text style={styles.logMealType}>{mealLabel(log.mealType)}</Text>
                    <Text style={styles.logTime}>{time}</Text>
                    <Text style={styles.logCal}>{Math.round(totalCal)} kcal</Text>
                  </View>
                  {log.items.map((item) => (
                    <View key={item.id} style={styles.itemRow}>
                      <Text style={styles.itemName}>{item.foodNameOverride ?? item.food?.nameVi ?? 'Món ăn'}</Text>
                      <Text style={styles.itemPortion}>{Math.round(item.portionGrams)}g</Text>
                      <Text style={styles.itemCal}>{Math.round(item.calories)} kcal</Text>
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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
    backBtn: { width: 38, height: 38, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 17, fontWeight: '700', color: theme.colors.text },
    dateNav: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 12, backgroundColor: theme.colors.surface,
      borderBottomWidth: 1, borderBottomColor: theme.colors.divider,
    },
    navBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center', borderRadius: 18, backgroundColor: theme.colors.divider },
    navBtnDisabled: { backgroundColor: theme.colors.background },
    dateCenter: { alignItems: 'center' },
    dateLabel: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
    dateSub: { fontSize: 12, color: theme.colors.textTertiary, marginTop: 1 },
    summaryCard: {
      backgroundColor: theme.colors.surface, margin: 16, borderRadius: 16, padding: 16,
      shadowColor: theme.colors.shadow, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    },
    summaryRow: { flexDirection: 'row' },
    summaryItem: { flex: 1, alignItems: 'center' },
    summaryVal: { fontSize: 20, fontWeight: '800' },
    summaryUnit: { fontSize: 10, color: theme.colors.textTertiary },
    summaryLabel: { fontSize: 11, color: theme.colors.textTertiary, marginTop: 2 },
    logList: { paddingHorizontal: 16, gap: 12 },
    logCard: {
      backgroundColor: theme.colors.surface, borderRadius: 16, overflow: 'hidden',
      shadowColor: theme.colors.shadow, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
    },
    logHeader: {
      flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12,
      borderBottomWidth: 1, borderBottomColor: theme.colors.divider, gap: 8,
    },
    logMealType: { flex: 1, fontSize: 14, fontWeight: '700', color: theme.colors.text },
    logTime: { fontSize: 12, color: theme.colors.textTertiary },
    logCal: { fontSize: 14, fontWeight: '700', color: theme.colors.primary },
    itemRow: {
      flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10,
      borderBottomWidth: 1, borderBottomColor: theme.colors.divider,
    },
    itemName: { flex: 1, fontSize: 13, color: theme.colors.text },
    itemPortion: { fontSize: 12, color: theme.colors.textTertiary, marginHorizontal: 8 },
    itemCal: { fontSize: 13, fontWeight: '600', color: theme.colors.textSecondary },
    empty: { alignItems: 'center', paddingTop: 48, gap: 12 },
    emptyTitle: { fontSize: 15, color: theme.colors.textTertiary },
    logBtn: {
      backgroundColor: theme.colors.primary, paddingHorizontal: 24, paddingVertical: 12,
      borderRadius: 12, marginTop: 4,
    },
    logBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  });
}
